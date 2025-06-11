class JonswapSpectrum {
    constructor() {
        this.data = [];
        this.chart = null;
    }

    // Calculate JONSWAP spectrum using wave parameters
    calculateSpectrum(Hs, Tp) {
        const g = 9.81;  // gravitational acceleration
        const gamma = 3.3;  // peak enhancement factor
        const spectrum = [];
        
        // Generate angular frequency range (rad/s)
        for(let omega = 0.01; omega <= 6.0; omega += 0.01) {
            const omega_p = 2 * Math.PI / Tp;  // peak angular frequency
            
            // Calculate sigma
            const sigma = (omega <= omega_p) ? 0.07 : 0.09;
            
            // Calculate alpha
            const alpha = 0.0081;
            
            // JONSWAP formula components
            const exp1 = Math.exp(-1.25 * Math.pow(omega_p/omega, 4));
            const exp2 = Math.exp(-Math.pow(omega - omega_p, 2) / 
                                (2 * Math.pow(sigma * omega_p, 2)));
            
            // Calculate spectrum value
            const S = alpha * Math.pow(g, 2) * Math.pow(omega, -5) * 
                     exp1 * Math.pow(gamma, exp2);
            
            spectrum.push({
                x: omega,
                y: S
            });
        }
        
        return spectrum;
    }

    // Initialize chart
    initChart() {
        const ctx = document.getElementById('jonswapChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'JONSWAP Spectrum',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: ['JONSWAP Wave Spectrum', ''],
                        color: 'rgb(45, 185, 164)',
                        font: { size: 18 }
                    },
                    annotation: {
                        annotations: {
                            peakLine: {
                                type: 'line',
                                xMin: 0,
                                xMax: 0,
                                borderColor: 'black',
                                borderWidth: 1,
                                borderDash: [5, 5],
                                label: {
                                    display: true,
                                    content: '',
                                    position: 'end'
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Angular Frequency ω [rad/s]',
                            font: { size: 14 }
                        }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Spectral Density S(ω) [m²/(rad/s)]',
                            font: { size: 14 }
                        }
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });
    }

    // Update spectrum with new sensor data
    update(sensorReading) {
        const Hs = sensorReading.waveHeight;
        const Tp = sensorReading.wavePeriod;
        
        // Robust timestamp formatting
        let timestamp = '';
        let dateObj = null;
        if (sensorReading.timestamp instanceof Date && !isNaN(sensorReading.timestamp.getTime())) {
            dateObj = sensorReading.timestamp;
        } else if (typeof sensorReading.timestamp === 'string' || typeof sensorReading.timestamp === 'number') {
            const d = new Date(sensorReading.timestamp);
            if (!isNaN(d.getTime())) dateObj = d;
        }
        if (dateObj) {
            timestamp = dateObj.getFullYear() + '/' +
                String(dateObj.getMonth() + 1).padStart(2, '0') + '/' +
                String(dateObj.getDate()).padStart(2, '0') + ' ' +
                String(dateObj.getHours()).padStart(2, '0') + ':' +
                String(dateObj.getMinutes()).padStart(2, '0');
        } else {
            timestamp = String(sensorReading.timestamp || '');
        }
        
        // Calculate peak frequency
        const peakOmega = (2 * Math.PI) / Tp;
        const spectrum = this.calculateSpectrum(Hs, Tp);
        if (this.chart) {
            this.chart.data.datasets[0].data = spectrum;
            this.chart.options.plugins.title.text = [
                'JONSWAP Wave Spectrum',
                `Hₛ = ${Hs.toFixed(2)} m, Tₚ = ${Tp.toFixed(2)} s, DateTime = ${timestamp}`
            ];
            this.chart.options.plugins.annotation.annotations.peakLine.xMin = peakOmega;
            this.chart.options.plugins.annotation.annotations.peakLine.xMax = peakOmega;
            this.chart.options.plugins.annotation.annotations.peakLine.label.content = 
                `ωₚ = ${peakOmega.toFixed(2)} rad/s`;
            this.chart.update('none');
        }
    }
}