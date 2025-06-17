class JonswapSpectrum {
    constructor() {
        this.data = [];
        this.chart = null;
        this.latestSpectrum = null;  // Store latest spectrum data
        // Add EventTarget functionality
        this.eventTarget = new EventTarget();
    }

    // Add event listener method
    addEventListener(type, listener) {
        this.eventTarget.addEventListener(type, listener);
    }

    // Remove event listener method
    removeEventListener(type, listener) {
        this.eventTarget.removeEventListener(type, listener);
    }

    // Dispatch event method
    dispatchEvent(event) {
        return this.eventTarget.dispatchEvent(event);
    }

    // Calculate JONSWAP spectrum using wave parameters with iterative alpha
    calculateSpectrum(Hs, Tp) {
        const g = 9.81;  // gravitational acceleration
        const gamma = 3.3;  // peak enhancement factor
        
        // Generate angular frequency range (rad/s)
        const omega = [];
        for(let w = 0.01; w <= 6.0; w += 0.01) {
            omega.push(w);
        }
        
        // Calculate alpha iteratively to match desired Hs
        const alpha = this.calculateAlphaIterative(omega, Hs, Tp, gamma, g);
        
        const spectrum = [];
        const omega_p = 2 * Math.PI / Tp;  // peak angular frequency
        
        for(let i = 0; i < omega.length; i++) {
            const w = omega[i];
            
            // Calculate sigma (spectral width parameter)
            const sigma = (w <= omega_p) ? 0.07 : 0.09;
            
            // JONSWAP formula components
            const exp1 = Math.exp(-1.25 * Math.pow(omega_p/w, 4));
            const exp2 = Math.exp(-Math.pow(w - omega_p, 2) / 
                                (2 * Math.pow(sigma * omega_p, 2)));
            
            // Calculate spectrum value with iteratively determined alpha
            const S = alpha * Math.pow(g, 2) * Math.pow(w, -5) * 
                     exp1 * Math.pow(gamma, exp2);
            
            spectrum.push({
                x: w,
                y: S
            });
        }
        
        return spectrum;
    }

    // New method: Calculate alpha iteratively to match target Hs
    calculateAlphaIterative(omega, targetHs, Tp, gamma, g) {
        let alpha = 0.0081;  // initial guess
        const maxIter = 50;
        const tolerance = 1e-3;  // 0.1% tolerance
        
        for(let iter = 0; iter < maxIter; iter++) {
            // Calculate spectrum with current alpha
            const spectrum = this.computeSpectrumWithAlpha(omega, alpha, Tp, gamma, g);
            
            // Integrate spectrum to get m0 (zeroth moment)
            const m0 = this.trapezoidalIntegration(omega, spectrum);
            
            // Calculate estimated Hs from m0
            const estimatedHs = 4 * Math.sqrt(m0);
            
            // Calculate ratio for alpha adjustment
            const ratio = targetHs / estimatedHs;
            
            // Check convergence
            if(Math.abs(ratio - 1) < tolerance) {
                break;
            }
            
            // Update alpha
            alpha = alpha * ratio;
        }
        
        return alpha;
    }

    // Helper method: Compute spectrum for given alpha
    computeSpectrumWithAlpha(omega, alpha, Tp, gamma, g) {
        const omega_p = 2 * Math.PI / Tp;
        const spectrum = [];
        
        for(let i = 0; i < omega.length; i++) {
            const w = omega[i];
            const sigma = (w <= omega_p) ? 0.07 : 0.09;
            
            const exp1 = Math.exp(-1.25 * Math.pow(omega_p/w, 4));
            const exp2 = Math.exp(-Math.pow(w - omega_p, 2) / 
                                (2 * Math.pow(sigma * omega_p, 2)));
            
            const S = alpha * Math.pow(g, 2) * Math.pow(w, -5) * 
                     exp1 * Math.pow(gamma, exp2);
            
            spectrum.push(S);
        }
        
        return spectrum;
    }

    // Helper method: Trapezoidal integration
    trapezoidalIntegration(x, y) {
        let integral = 0;
        for(let i = 1; i < x.length; i++) {
            const dx = x[i] - x[i-1];
            integral += 0.5 * (y[i-1] + y[i]) * dx;
        }
        return integral;
    }

    // Initialize chart
    initChart() {
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }
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
                maintainAspectRatio: false,
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

    // Add method to get spectrum data
    getSpectrum() {
        return {
            frequencies: this.latestSpectrum ? this.latestSpectrum.map(point => point.x) : [],
            spectralDensities: this.latestSpectrum ? this.latestSpectrum.map(point => point.y) : []
        };
    }

    // Update spectrum with new sensor data
    update(sensorReading) {
        const Hs = sensorReading.waveHeight;
        const Tp = sensorReading.wavePeriod;
        
        // Calculate spectrum and store it
        this.latestSpectrum = this.calculateSpectrum(Hs, Tp);
        
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
            this.chart.data.datasets[0].data = this.latestSpectrum;
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

        // Dispatch the spectrumUpdated event
        this.dispatchEvent(new CustomEvent('spectrumUpdated'));
    }
}  // End of JonswapSpectrum class

// Create global instance
window.jonswapSpectrum = new JonswapSpectrum();

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.jonswapSpectrum.initChart();
});