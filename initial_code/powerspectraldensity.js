// PowerSpectralDensity.js - Calculates PSD for heave, pitch and cross terms
class PowerSpectralDensity {
    constructor() {
        this.freqRAO = []; // Frequency array for RAO data
        this.charts = {
            combinedPSD: null,
            verticalMotionPSD: null,
            msdv: null
        };
        // Ship positions for MSDV calculation (meters from midships)
        this.shipPositions = [-50, -30, -10, 0, 10, 30, 50];
        // Ship positions to display in charts (excluding extreme positions)
        this.displayPositions = [-30, -10, 0, 10, 30];
        this.T_exp = 1800; // Exposure time in seconds (30 minutes)
    }

    /**
     * Interpolates wave spectrum to match RAO frequencies
     * @param {Array} waveFreq - Wave spectrum frequencies
     * @param {Array} waveSpec - Wave spectrum values
     * @param {Array} raoFreq - RAO frequencies to interpolate to
     * @returns {Array} Interpolated wave spectrum
     */
    interpolateWaveSpectrum(waveFreq, waveSpec, raoFreq) {
        return raoFreq.map(freq => {
            // Find the closest indices in waveFreq
            const index = waveFreq.findIndex(f => f >= freq);
            if (index === 0) return waveSpec[0];
            if (index === -1) return waveSpec[waveSpec.length - 1];

            // Linear interpolation
            const x0 = waveFreq[index - 1];
            const x1 = waveFreq[index];
            const y0 = waveSpec[index - 1];
            const y1 = waveSpec[index];
            
            return y0 + (freq - x0) * (y1 - y0) / (x1 - x0);
        });
    }

    /**
     * Calculates displacement PSDs
     */
    calculateDisplacementPSDs(heaveAmp, pitchAmp, heavePhase, pitchPhase, waveSpecInterp) {
        // Convert phases from degrees to radians
        const heavePhaseRad = heavePhase.map(phase => phase * Math.PI / 180);
        const pitchPhaseRad = pitchPhase.map(phase => phase * Math.PI / 180);
        
        // Calculate PSDs according to formulas (matching MATLAB)
        const heavePSD_unw = heaveAmp.map((amp, i) => Math.pow(amp, 2) * waveSpecInterp[i]);
        const pitchPSD_unw = pitchAmp.map((amp, i) => Math.pow(amp, 2) * waveSpecInterp[i]);
        
        // Calculate cross PSD using phase difference in radians
        const crossPSD_unw = heaveAmp.map((hAmp, i) => {
            const phaseDiff = heavePhaseRad[i] - pitchPhaseRad[i];
            return hAmp * pitchAmp[i] * Math.cos(phaseDiff) * waveSpecInterp[i];
        });

        return { heavePSD_unw, pitchPSD_unw, crossPSD_unw };
    }

    /**
     * Converts displacement PSDs to acceleration PSDs
     */
    convertToAccelerationPSDs(freqRAO, { heavePSD_unw, pitchPSD_unw, crossPSD_unw }) {
        // MATLAB uses different ω^4 scaling for heave vs pitch/cross
        // Heave: (2π*f)^4 where f is in Hz equivalent
        // Pitch/Cross: ω^4 where ω is in rad/s
        
        return {
            accHeavePSD: heavePSD_unw.map((psd, i) => {
                // For heave: (2π*freqRAO)^4 - MATLAB convention
                return psd * Math.pow(2 * Math.PI * freqRAO[i], 4);
            }),
            accPitchPSD: pitchPSD_unw.map((psd, i) => {
                // For pitch: ω^4 - standard convention
                return psd * Math.pow(freqRAO[i], 4);
            }),
            accCrossPSD: crossPSD_unw.map((psd, i) => {
                // For cross: ω^4 - standard convention
                return psd * Math.pow(freqRAO[i], 4);
            })
        };
    }

    /**
     * Applies ISO-2631 Wf weighting to acceleration PSDs
     */
    applyWfWeighting(omega, PSD) {
        const pi2 = 2 * Math.PI;
        const omega1 = pi2 * 0.08;  const zeta1 = 1 / Math.sqrt(2);
        const omega2 = pi2 * 0.63;  const zeta2 = 1 / Math.sqrt(2);
        const omega3 = pi2 * 3.5;
        const omega4 = pi2 * 0.25;  const zeta4 = 0.86;
        const omega5 = pi2 * 0.06;  const zeta5 = 0.80;
        const omega6 = pi2 * 0.10;  const zeta6 = 0.80;

        return omega.map((w, i) => {
            // Create complex number s = iω
            const s = { real: 0, imag: w };
            
            // Calculate transfer functions
            const Hh = this.complexDivide(
                this.complexMultiply(s, s),
                this.complexAdd(
                    this.complexAdd(
                        this.complexMultiply(s, s),
                        this.complexMultiply({ real: 2 * zeta1 * omega1, imag: 0 }, s)
                    ),
                    { real: Math.pow(omega1, 2), imag: 0 }
                )
            );

            const Hl = this.complexDivide(
                { real: Math.pow(omega2, 2), imag: 0 },
                this.complexAdd(
                    this.complexAdd(
                        this.complexMultiply(s, s),
                        this.complexMultiply({ real: 2 * zeta2 * omega2, imag: 0 }, s)
                    ),
                    { real: Math.pow(omega2, 2), imag: 0 }
                )
            );

            const Ht = this.complexDivide(
                this.complexAdd(
                    this.complexMultiply({ real: Math.pow(omega4, 2) / omega3, imag: 0 }, s),
                    { real: Math.pow(omega4, 2), imag: 0 }
                ),
                this.complexAdd(
                    this.complexAdd(
                        this.complexMultiply(s, s),
                        this.complexMultiply({ real: 2 * zeta4 * omega4, imag: 0 }, s)
                    ),
                    { real: Math.pow(omega4, 2), imag: 0 }
                )
            );

            const Hs = this.complexDivide(
                this.complexAdd(
                    this.complexAdd(
                        this.complexMultiply(s, s),
                        this.complexMultiply({ real: 2 * zeta5 * omega5, imag: 0 }, s)
                    ),
                    { real: Math.pow(omega5, 2), imag: 0 }
                ),
                this.complexAdd(
                    this.complexAdd(
                        this.complexMultiply(s, s),
                        this.complexMultiply({ real: 2 * zeta6 * omega6, imag: 0 }, s)
                    ),
                    { real: Math.pow(omega6, 2), imag: 0 }
                )
            );

            // Calculate final weighting
            const Wf = this.complexMultiply(
                this.complexMultiply(Hh, Hl),
                this.complexMultiply(Ht, Hs)
            );

            return Math.pow(this.complexAbs(Wf), 2) * PSD[i];
        });
    }

    // Complex number operations
    complexAdd(a, b) {
        return { real: a.real + b.real, imag: a.imag + b.imag };
    }

    complexMultiply(a, b) {
        return {
            real: a.real * b.real - a.imag * b.imag,
            imag: a.real * b.imag + a.imag * b.real
        };
    }

    complexDivide(a, b) {
        const denominator = b.real * b.real + b.imag * b.imag;
        return {
            real: (a.real * b.real + a.imag * b.imag) / denominator,
            imag: (a.imag * b.real - a.real * b.imag) / denominator
        };
    }

    complexAbs(z) {
        return Math.sqrt(z.real * z.real + z.imag * z.imag);
    }

    /**
     * Calculate total vertical motion PSD at different ship positions
     * @param {Array} L_positions - Ship positions from midships (meters)
     * @param {Array} wHeavePSD - Weighted heave PSD
     * @param {Array} wPitchPSD - Weighted pitch PSD  
     * @param {Array} wCrossPSD - Weighted cross PSD
     * @returns {Object} Object with positions and corresponding PSDs
     */
    calculateVerticalMotionPSD(L_positions, wHeavePSD, wPitchPSD, wCrossPSD) {
        const verticalPSDs = {};
        
        L_positions.forEach(L => {
            // S_yy = S_aa_heave + L^2 * S_aa_pitch + 2*L * S_aa_cross
            const S_yy = wHeavePSD.map((heave, i) => {
                return heave + Math.pow(L, 2) * wPitchPSD[i] + 2 * L * wCrossPSD[i];
            });
            verticalPSDs[L] = S_yy;
        });
        
        return verticalPSDs;
    }

    /**
     * Calculate MSDV (Motion Sickness Dose Value) for different ship positions
     * @param {Object} verticalPSDs - Vertical motion PSDs for different positions
     * @param {Array} frequencies - Frequency array in rad/s
     * @returns {Object} MSDV values for each position
     */
    calculateMSDV(verticalPSDs, frequencies) {
        const msdvValues = {};
        
        Object.keys(verticalPSDs).forEach(position => {
            const S_yy = verticalPSDs[position];
            
            // Calculate MSDV by integrating the weighted PSD directly
            // MSDV = sqrt(∫ S_weighted(ω) dω) over the exposure time
            // Note: S_yy is already weighted, so we integrate directly
            
            let integral = 0;
            for (let i = 1; i < frequencies.length; i++) {
                const dω = frequencies[i] - frequencies[i-1];
                const avgPSD = (S_yy[i] + S_yy[i-1]) / 2;
                integral += avgPSD * dω;
            }
            
            // MSDV = sqrt(integral) - units: m/s^1.5
            // Note: No T_exp multiplication needed as MATLAB shows MSDV = sqrt(∫S_weighted dω)
            const msdv = Math.sqrt(integral);
            msdvValues[position] = msdv;
        });
        
        return msdvValues;
    }

    /**
     * Main function to update PSDs
     */
    async updatePSDs() {
        try {
            console.log('Starting updatePSDs...');
            
            // 1. Get JONSWAP spectrum
            let waveSpectrum = await window.jonswapSpectrum.getSpectrum();
            console.log('JONSWAP spectrum (window):', waveSpectrum);
            
            // If window JONSWAP is empty, try sensor1's JONSWAP
            if (!waveSpectrum || !waveSpectrum.frequencies || waveSpectrum.frequencies.length === 0) {
                console.log('Trying sensor1 JONSWAP spectrum...');
                if (window.sensor1 && window.sensor1.jonswapSpectrum) {
                    waveSpectrum = window.sensor1.jonswapSpectrum.getSpectrum();
                    console.log('JONSWAP spectrum (sensor1):', waveSpectrum);
                }
            }
            
            console.log('waveSpectrum.frequencies:', waveSpectrum.frequencies);
            console.log('waveSpectrum.spectralDensities:', waveSpectrum.spectralDensities);
            console.log('frequencies length:', waveSpectrum.frequencies ? waveSpectrum.frequencies.length : 'undefined');
            console.log('spectralDensities length:', waveSpectrum.spectralDensities ? waveSpectrum.spectralDensities.length : 'undefined');
            
            // Check if JONSWAP has latestSpectrum data
            console.log('JONSWAP latestSpectrum:', window.jonswapSpectrum.latestSpectrum);
            
            if (!waveSpectrum || !waveSpectrum.frequencies || !waveSpectrum.spectralDensities || 
                waveSpectrum.frequencies.length === 0 || waveSpectrum.spectralDensities.length === 0) {
                console.warn('JONSWAP spectrum not ready yet - skipping PSD calculation');
                return null;
            }

            // 2. Get RAO data
            console.log('Fetching RAO data...');
            const heaveData = await window.raoVisualizer.loadRAOFile('heave', 0, 0);
            const pitchData = await window.raoVisualizer.loadRAOFile('pitch', 0, 0);
            console.log('Heave Data:', heaveData);
            console.log('Pitch Data:', pitchData);
            
            if (!heaveData || !pitchData) {
                throw new Error('Failed to get RAO data');
            }

            // Store RAO frequencies
            this.freqRAO = heaveData.periods;
            console.log('RAO Frequencies:', this.freqRAO);

            // 3. Interpolate wave spectrum to RAO frequencies
            const waveSpecInterp = this.interpolateWaveSpectrum(
                waveSpectrum.frequencies,
                waveSpectrum.spectralDensities,
                this.freqRAO
            );
            console.log('Interpolated Wave Spectrum:', waveSpecInterp);

            // 4. Calculate displacement PSDs
            const displacementPSDs = this.calculateDisplacementPSDs(
                heaveData.amplitudes,
                pitchData.amplitudes,
                heaveData.phases,
                pitchData.phases,
                waveSpecInterp
            );
            console.log('Displacement PSDs:', displacementPSDs);

            // 5. Convert to acceleration PSDs
            const accelerationPSDs = this.convertToAccelerationPSDs(this.freqRAO, displacementPSDs);
            console.log('Acceleration PSDs:', accelerationPSDs);

            // 6. Apply ISO-2631 Wf weighting
            const weightedPSDs = {
                wHeavePSD: this.applyWfWeighting(this.freqRAO, accelerationPSDs.accHeavePSD),
                wPitchPSD: this.applyWfWeighting(this.freqRAO, accelerationPSDs.accPitchPSD),
                wCrossPSD: this.applyWfWeighting(this.freqRAO, accelerationPSDs.accCrossPSD)
            };
            console.log('Final Weighted PSDs:', weightedPSDs);

            // 7. Calculate vertical motion PSD at different ship positions
            const verticalMotionPSDs = this.calculateVerticalMotionPSD(
                this.shipPositions,
                weightedPSDs.wHeavePSD,
                weightedPSDs.wPitchPSD,
                weightedPSDs.wCrossPSD
            );
            console.log('Vertical Motion PSDs:', verticalMotionPSDs);

            // 8. Calculate MSDV values
            const msdvValues = this.calculateMSDV(verticalMotionPSDs, this.freqRAO);
            console.log('MSDV Values:', msdvValues);

            const results = {
                ...weightedPSDs,
                verticalMotionPSDs,
                msdvValues
            };

            // Update charts with new data
            console.log('Updating charts with frequencies:', this.freqRAO);
            console.log('And results:', results);
            this.updateCharts(this.freqRAO, results);

            this.lastUpdate = Date.now();
            return results;

        } catch (error) {
            console.error('Error in updatePSDs:', error);
            return null;
        }
    }

    initCharts() {
        // Clean up existing charts if they exist
        if (this.charts.combinedPSD) {
            Plotly.purge('combinedPSDChart');
        }
        if (this.charts.verticalMotionPSD) {
            Plotly.purge('verticalMotionPSDChart');
        }
        if (this.charts.msdv) {
            Plotly.purge('msdvChart');
        }
        
        // Initialize Combined PSD Chart
        const combinedLayout = {
            xaxis: { 
                title: 'Circular frequency [rad/s]',
                range: [0, 1.5],
                dtick: 0.5,
                showgrid: true,
                gridcolor: 'rgba(128, 128, 128, 0.2)',
            },
            yaxis: { 
                title: 'Power Spectral Density',
                autorange: true,
                showgrid: true,
                gridcolor: 'rgba(128, 128, 128, 0.2)'
            },
            margin: { l: 60, r: 50, t: 20, b: 50 },
            height: 450,
            showlegend: true,
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1
            }
        };

        const combinedElement = document.getElementById('combinedPSDChart');
        if (!combinedElement) {
            console.error('Failed to find combinedPSDChart element in DOM');
            return;
        }

        try {
            console.log('Initializing Combined PSD chart...');
            this.charts.combinedPSD = Plotly.newPlot('combinedPSDChart', [
                { 
                    x: [], 
                    y: [], 
                    type: 'scatter',
                    name: 'Heave PSD [m²/s⁴]',
                    line: {
                        width: 2,
                        color: 'rgb(31, 119, 180)'
                    }
                },
                { 
                    x: [], 
                    y: [], 
                    type: 'scatter',
                    name: 'Pitch PSD [rad²/s⁴]',
                    line: {
                        width: 2,
                        color: 'rgb(255, 127, 14)'
                    }
                },
                { 
                    x: [], 
                    y: [], 
                    type: 'scatter',
                    name: 'Cross PSD [m·rad/s⁴]',
                    line: {
                        width: 2,
                        color: 'rgb(44, 160, 44)'
                    }
                }
            ], combinedLayout);
            console.log('Combined PSD chart initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Combined PSD chart:', error);
        }

        // Initialize Vertical Motion PSD Chart
        const verticalLayout = {
            xaxis: { 
                title: 'Circular frequency [rad/s]',
                range: [0, 1.5],
                dtick: 0.5,
                showgrid: true,
                gridcolor: 'rgba(128, 128, 128, 0.2)',
            },
            yaxis: { 
                title: 'Vertical Motion PSD [m²/s⁴]',
                autorange: true,
                showgrid: true,
                gridcolor: 'rgba(128, 128, 128, 0.2)'
            },
            margin: { l: 60, r: 50, t: 20, b: 50 },
            height: 450,
            showlegend: true,
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1
            }
        };

        const verticalElement = document.getElementById('verticalMotionPSDChart');
        if (verticalElement) {
            try {
                console.log('Initializing Vertical Motion PSD chart...');
                const traces = this.displayPositions.map((pos, index) => ({
                    x: [],
                    y: [],
                    type: 'scatter',
                    name: `L = ${pos}m`,
                    line: {
                        width: 2,
                        color: `hsl(${index * 360 / this.displayPositions.length}, 70%, 50%)`
                    }
                }));
                
                this.charts.verticalMotionPSD = Plotly.newPlot('verticalMotionPSDChart', traces, verticalLayout);
                console.log('Vertical Motion PSD chart initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Vertical Motion PSD chart:', error);
            }
        }

        // Initialize MSDV Chart
        const msdvLayout = {
            xaxis: { 
                title: 'Position from Midships [m]',
                showgrid: true,
                gridcolor: 'rgba(128, 128, 128, 0.2)',
                type: 'category', // This ensures equal spacing between bars
                tickmode: 'array',
                tickvals: this.displayPositions.map((pos, index) => index),
                ticktext: this.displayPositions.map(pos => `${pos}m`)
            },
            yaxis: { 
                title: 'MSDV [m/s^1.5]',
                autorange: true,
                showgrid: true,
                gridcolor: 'rgba(128, 128, 128, 0.2)'
            },
            margin: { l: 60, r: 50, t: 20, b: 50 },
            height: 450,
            showlegend: true,
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1
            }
        };

        const msdvElement = document.getElementById('msdvChart');
        if (msdvElement) {
            try {
                console.log('Initializing MSDV chart...');
                // Create color array matching the vertical motion PSD chart
                const colors = this.displayPositions.map((pos, index) => 
                    `hsl(${index * 360 / this.displayPositions.length}, 70%, 50%)`
                );
                
                // Create individual traces for each bar to show legend
                const traces = this.displayPositions.map((pos, index) => ({
                    x: [index], // Use index for equal spacing
                    y: [0], // Initialize with 0
                    type: 'bar',
                    name: `L = ${pos}m`,
                    marker: {
                        color: colors[index],
                        opacity: 0.8
                    },
                    width: 0.4, // Make bars thinner and more elegant
                    showlegend: true
                }));
                
                this.charts.msdv = Plotly.newPlot('msdvChart', traces, msdvLayout);
                console.log('MSDV chart initialized successfully');
            } catch (error) {
                console.error('Failed to initialize MSDV chart:', error);
            }
        }
    }

    updateCharts(frequencies, results) {
        if (!results) {
            console.error('No results provided to updateCharts');
            return;
        }

        // Update Combined PSD Chart
        if (this.charts.combinedPSD) {
            try {
                console.log('Updating Combined PSD chart with data:', {
                    frequencies: frequencies,
                    wHeavePSD: results.wHeavePSD,
                    wPitchPSD: results.wPitchPSD,
                    wCrossPSD: results.wCrossPSD
                });

                const combinedUpdate = {
                    'x': [frequencies, frequencies, frequencies],
                    'y': [results.wHeavePSD, results.wPitchPSD, results.wCrossPSD]
                };
                
                Plotly.update('combinedPSDChart', combinedUpdate).catch(err => {
                    console.error('Combined PSD Plotly update failed:', err);
                });
            } catch (error) {
                console.error('Error updating Combined PSD chart:', error);
            }
        }

        // Update Vertical Motion PSD Chart
        if (this.charts.verticalMotionPSD && results.verticalMotionPSDs) {
            try {
                console.log('Updating Vertical Motion PSD chart...');
                
                const verticalUpdate = {
                    'x': this.displayPositions.map(() => frequencies),
                    'y': this.displayPositions.map(pos => results.verticalMotionPSDs[pos])
                };
                
                Plotly.update('verticalMotionPSDChart', verticalUpdate).catch(err => {
                    console.error('Vertical Motion PSD Plotly update failed:', err);
                });
            } catch (error) {
                console.error('Error updating Vertical Motion PSD chart:', error);
            }
        }

        // Update MSDV Chart
        if (this.charts.msdv && results.msdvValues) {
            try {
                console.log('Updating MSDV chart...');
                
                // Update each trace individually
                const msdvUpdate = {
                    'y': this.displayPositions.map(pos => [results.msdvValues[pos]])
                };
                
                Plotly.update('msdvChart', msdvUpdate).catch(err => {
                    console.error('MSDV Plotly update failed:', err);
                });
            } catch (error) {
                console.error('Error updating MSDV chart:', error);
            }
        }
    }
}

// Create global instance
window.powerSpectralDensity = new PowerSpectralDensity();

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.powerSpectralDensity.initCharts();
});

// Update whenever JONSWAP spectrum changes
window.jonswapSpectrum.addEventListener('spectrumUpdated', async () => {
    console.log('Spectrum updated event received');
    await window.powerSpectralDensity.updatePSDs();
});
