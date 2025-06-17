class RAOVisualizer {
    constructor() {
        this.speedFolders = ['0 knots', '4 knots', '8 knots', '10 knots', '12 knots', '14 knots', '16 knots'];
        this.currentSpeed = null;
        this.currentHeading = null;
        this.charts = {
            heaveAmplitude: null,
            heavePhase: null,
            pitchAmplitude: null,
            pitchPhase: null
        };
        this.RAO_BASE_PATH = '.';
        // Add storage for latest RAO data
        this.latestHeaveData = null;
        this.latestPitchData = null;
    }

    init() {
        this.initCharts();
    }

    initCharts() {
        // Initialize Plotly charts
        const commonLayout = {
            xaxis: { 
                title: 'Circular frequency [rad/s]',
                range: [0, 1.5],  // Match MATLAB graph range
                dtick: 0.5,       // Tick marks every 0.5 like MATLAB
                showgrid: true,
                gridcolor: 'rgba(128, 128, 128, 0.2)',
            },
            margin: { l: 50, r: 20, t: 30, b: 40 },
            height: 300
        };

        this.charts.heaveAmplitude = this.createChart(
            'heaveAmplitudeChart',
            { 
                ...commonLayout, 
                title: 'Heave RAO Amplitude',
                yaxis: { 
                    title: 'Magnitude [m/m]',
                    rangemode: 'tozero',
                    range: [0, 2.0],  // Further extended range
                    dtick: 0.5
                } 
            }
        );

        this.charts.heavePhase = this.createChart(
            'heavePhaseChart',
            { 
                ...commonLayout,
                title: 'Heave RAO Phase',
                yaxis: { 
                    title: 'Phase [°]',
                    range: [-500, 1000],  // Extended range to match MATLAB unwrapped phases
                    dtick: 500,           // Major tick marks every 500 degrees
                }
            }
        );

        this.charts.pitchAmplitude = this.createChart(
            'pitchAmplitudeChart',
            { 
                ...commonLayout,
                title: 'Pitch RAO Amplitude',
                yaxis: { 
                    title: 'Magnitude [rad/m]',
                    rangemode: 'tozero',
                    range: [0, 2.0], // Further extended range
                    dtick: 0.5
                }
            }
        );

        this.charts.pitchPhase = this.createChart(
            'pitchPhaseChart',
            { 
                ...commonLayout,
                title: 'Pitch RAO Phase',
                yaxis: { 
                    title: 'Phase [°]',
                    range: [-500, 1000],  // Extended range to match MATLAB unwrapped phases
                    dtick: 500            // Major tick marks every 500 degrees
                }
            }
        );
    }

    createChart(elementId, layout) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with id ${elementId} not found. Make sure the HTML contains a div with id="${elementId}"`);
            return null;
        }

        try {
            const enhancedLayout = {
                ...layout,
                showlegend: false,
                xaxis: {
                    ...layout.xaxis,
                    showgrid: true,
                    gridcolor: 'rgba(128, 128, 128, 0.2)',
                    zeroline: true,
                    zerolinecolor: 'rgba(128, 128, 128, 0.4)'
                },
                yaxis: {
                    ...layout.yaxis,
                    showgrid: true,
                    gridcolor: 'rgba(128, 128, 128, 0.2)',
                    zeroline: true,
                    zerolinecolor: 'rgba(128, 128, 128, 0.4)'
                }
            };

            return Plotly.newPlot(elementId, [{ 
                x: [], 
                y: [], 
                type: 'scatter',
                name: layout.title,
                line: {
                    width: 2,
                    color: 'rgb(31, 119, 180)'
                }
            }], enhancedLayout);
        } catch (error) {
            console.error(`Error creating chart ${elementId}:`, error);
            return null;
        }
    }

    findNearestSpeedFolder(speed) {
        const speedValues = this.speedFolders.map(folder => parseInt(folder));
        const nearestSpeed = speedValues.reduce((prev, curr) => {
            return Math.abs(curr - speed) < Math.abs(prev - speed) ? curr : prev;
        });
        return `${nearestSpeed} knots`;
    }

    async loadRAOFile(type, speed, heading) {
        // speed is a number or string, but filename should be e.g. heave_12.rao
        const speedFolder = this.findNearestSpeedFolder(speed);
        // Extract just the number for the filename
        const speedInt = parseInt(speedFolder);
        const filename = `${type}_${speedInt}.rao`;
        const filepath = `${this.RAO_BASE_PATH}/${filename}`;
        console.log(`Attempting to load RAO file: ${filepath}`);
        try {
            const response = await fetch(filepath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            return this.parseRAOFile(text, heading);
        } catch (error) {
            console.error(`Error loading RAO file ${filepath}:`, error);
            return null;
        }
    }

    parseRAOFile(content, targetHeading) {
        const lines = content.split('\n');
        let headingLineIdx = -1;
        let headings = [];
        let dataStartIdx = -1;
        // Find the #HEADING line and extract headings
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('#HEADING')) {
                headingLineIdx = i;
                headings = lines[i].replace('#HEADING', '').trim().split(/\s+/).map(Number);
            }
            // Accept any line containing 'w(r/s)' for robustness
            if (lines[i].includes('w(r/s)')) {
                dataStartIdx = i + 1;
            }
        }
        if (headingLineIdx === -1 || dataStartIdx === -1) {
            console.error('Could not find heading or data start in RAO file');
            return null;
        }
        // Find the nearest heading column
        const nearestHeading = headings.reduce((prev, curr) => Math.abs(curr - targetHeading) < Math.abs(prev - targetHeading) ? curr : prev);
        const headingIdx = headings.indexOf(nearestHeading);
        // Parse data rows
        const periods = [];
        const amplitudes = [];
        const phases = [];
        let prevPhase = null;
        let phaseOffset = 0;  // Track cumulative phase unwrapping

        for (let i = dataStartIdx; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#')) continue;
            const vals = line.split(/\s+/);
            if (vals.length < 1 + 2 * headings.length) continue;
            
            const w = parseFloat(vals[0]); // w is already in rad/s
            if (isNaN(w)) continue;
            
            // Use frequency (rad/s) directly for x-axis
            const freq = w;
            const amp = parseFloat(vals[1 + headingIdx]);
            let phase = parseFloat(vals[1 + headings.length + headingIdx]);
            
            if (!isNaN(amp) && !isNaN(phase)) {
                // Normalize phase to -180 to +180 range
                phase = ((phase + 180) % 360) - 180;
                if (prevPhase !== null) {
                    const diff = phase - prevPhase;
                    if (diff > 180) {
                        phaseOffset -= 360;
                    } else if (diff < -180) {
                        phaseOffset += 360;
                    }
                }
                phase = phase + phaseOffset;
                prevPhase = phase - phaseOffset;
                periods.push(freq); // Now stores frequency (rad/s)
                amplitudes.push(amp);
                phases.push(phase);
            }
        }

        // Sort by period to ensure smooth plotting
        const indices = periods.map((_, i) => i).sort((a, b) => periods[a] - periods[b]);
        return {
            periods: indices.map(i => periods[i]),
            amplitudes: indices.map(i => amplitudes[i]),
            phases: indices.map(i => phases[i])
        };
    }

    unwrapHeading(heading) {
        // First normalize to 0-360
        heading = ((heading % 360) + 360) % 360;
        
        // If heading is > 180, convert to equivalent angle in 0-180 range
        if (heading > 180) {
            heading = Math.abs(360 - heading);
        }
        
        return heading;
    }

    findNearestHeading(heading) {
        // Unwrap the heading to 0-180 range
        heading = this.unwrapHeading(heading);
        
        // Available headings in SAAII_RAOs: 0, 30, 60, 90, 120, 150, 180
        const availableHeadings = [0, 30, 60, 90, 120, 150, 180];
        
        return availableHeadings.reduce((prev, curr) => {
            return Math.abs(curr - heading) < Math.abs(prev - heading) ? curr : prev;
        });
    }

    // Add getter methods for the latest data
    getLatestHeaveData() {
        return this.latestHeaveData;
    }

    getLatestPitchData() {
        return this.latestPitchData;
    }

    async updateCharts(speed, heading) {
        if (speed === this.currentSpeed && heading === this.currentHeading) return;
        
        this.currentSpeed = speed;
        this.currentHeading = this.findNearestHeading(heading);

        // Use integer speed for filename
        const speedInt = this.findNearestSpeedFolder(speed).split(' ')[0];
        const heaveData = await this.loadRAOFile('heave', speedInt, this.currentHeading);
        const pitchData = await this.loadRAOFile('pitch', speedInt, this.currentHeading);

        if (heaveData) {
            this.latestHeaveData = heaveData; // Store latest heave data
            this.updateChart('heaveAmplitudeChart', heaveData.periods, heaveData.amplitudes);
            this.updateChart('heavePhaseChart', heaveData.periods, heaveData.phases);
        }

        if (pitchData) {
            this.latestPitchData = pitchData; // Store latest pitch data
            this.updateChart('pitchAmplitudeChart', pitchData.periods, pitchData.amplitudes);
            this.updateChart('pitchPhaseChart', pitchData.periods, pitchData.phases);
        }
    }

    updateChart(chartName, xData, yData) {
        try {
            const element = document.getElementById(chartName);
            if (!element) {
                console.error(`Element with id ${chartName} not found`);
                return;
            }

            console.log(`Updating chart ${chartName} with data:`, { 
                points: xData.length,
                xRange: [Math.min(...xData), Math.max(...xData)],
                yRange: [Math.min(...yData), Math.max(...yData)]
            });

            const update = {
                'x': [xData],
                'y': [yData]
            };
            
            Plotly.update(chartName, update).catch(err => {
                console.error(`Plotly update failed for ${chartName}:`, err);
            });
        } catch (error) {
            console.error(`Error updating chart ${chartName}:`, error);
        }
    }
}

// Create global instance and initialize after DOM loads
window.raoVisualizer = new RAOVisualizer();
document.addEventListener('DOMContentLoaded', () => {
    window.raoVisualizer.init();
});