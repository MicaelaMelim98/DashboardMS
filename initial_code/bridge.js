// Bridge Dashboard - Enhanced Maritime Decision Support System
class BridgeDashboard {
    constructor() {
        this.map = null;
        this.sensor3 = null;
        this.sensor1 = null; // Wave data
        this.sensor2 = null; // Vessel data
        this.powerSpectralDensity = null; // For MSDV data
        this.isLiveDemo = false;
        this.streamInterval = null;
        this.routeCoordinates = [];
        this.routePolyline = null;
        this.currentMarker = null;
        this.startMarker = null;
        this.currentConditions = {
            wave: null,
            vessel: null,
            msdv: null,
            position: null
        };
    }

    // Initialize the bridge dashboard
    async init() {
        console.log('Initializing Enhanced Bridge Dashboard...');
        
        // Create sensor instances
        this.sensor3 = new Sensor3(); // GPS data
        this.sensor1 = new Sensor1(); // Wave data
        this.sensor2 = new Sensor2(); // Vessel data
        
        // Load all data sources
        const gpsLoaded = await this.sensor3.loadData();
        const waveLoaded = await this.sensor1.loadData();
        const vesselLoaded = await this.sensor2.loadData();
        
        if (!gpsLoaded) {
            console.error('Failed to load GPS data');
            return false;
        }
        
        if (!waveLoaded) {
            console.warn('Wave data not available');
        }
        
        if (!vesselLoaded) {
            console.warn('Vessel data not available');
        }
        
        // Access PSD system for MSDV data
        this.powerSpectralDensity = window.powerSpectralDensity;
        
        console.log('Enhanced Bridge Dashboard initialized successfully');
        return true;
    }

    // Initialize the map
    initMap() {
        // Get the first GPS coordinate for initial map center
        const firstReading = this.sensor3.data[0];
        if (!firstReading) {
            console.error('No GPS data available for map initialization');
            return;
        }

        console.log('Initializing map at:', firstReading.latitude, firstReading.longitude);

        // Initialize Leaflet map
        this.map = L.map('shipMap').setView([firstReading.latitude, firstReading.longitude], 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add start marker
        this.startMarker = L.marker([firstReading.latitude, firstReading.longitude], {
            icon: this.createStartIcon()
        }).addTo(this.map).bindPopup('Voyage Start');

        // Initialize route polyline
        this.routePolyline = L.polyline([], {
            color: 'rgb(45, 185, 164)',
            weight: 3,
            opacity: 0.8
        }).addTo(this.map);

        console.log('Map initialized successfully');
    }

    // Create custom start icon
    createStartIcon() {
        return L.divIcon({
            className: 'start-marker',
            html: '<div style="background-color: green; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
    }

    // Create custom ship icon
    createShipIcon() {
        return L.divIcon({
            className: 'ship-marker',
            html: '<div style="background-color: rgb(45, 185, 164); width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(45, 185, 164, 0.6);"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });
    }

    // Start live demo
    startLiveDemo() {
        if (this.isLiveDemo) {
            console.log('Live demo already running');
            return;
        }

        console.log('Starting live demo...');
        this.isLiveDemo = true;
        
        // Reset sensor data to beginning
        this.sensor3.reset();
        
        // Clear existing route
        this.routeCoordinates = [];
        if (this.routePolyline) {
            this.routePolyline.setLatLngs([]);
        }
        
        // Remove current marker if exists
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
            this.currentMarker = null;
        }

        // Initialize map if not already done
        if (!this.map) {
            this.initMap();
        }

        // Start streaming GPS data
        this.streamInterval = this.sensor3.startStream((reading) => {
            this.updateShipPosition(reading);
        }, 2000); // Update every 2 seconds for demo purposes

        // Update button states
        this.updateButtonStates();
    }

    // Stop live demo
    stopLiveDemo() {
        if (!this.isLiveDemo) {
            console.log('Live demo not running');
            return;
        }

        console.log('Stopping live demo...');
        this.isLiveDemo = false;
        
        // Stop streaming
        if (this.streamInterval) {
            this.sensor3.stopStream(this.streamInterval);
            this.streamInterval = null;
        }

        // Update button states
        this.updateButtonStates();
    }

    // Update ship position on map
    updateShipPosition(reading) {
        if (!reading || !this.map) return;

        console.log('Updating ship position:', reading.latitude, reading.longitude, reading.timestamp);

        const latLng = [reading.latitude, reading.longitude];
        this.currentConditions.position = reading;
        
        // Add to route coordinates
        this.routeCoordinates.push(latLng);
        
        // Update route polyline with color coding based on conditions
        this.updateRoutePolyline();
        
        // Update current ship marker
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
        }
        
        this.currentMarker = L.marker(latLng, {
            icon: this.createShipIcon()
        }).addTo(this.map).bindPopup(`
            <strong>Ship Position</strong><br>
            Lat: ${reading.latitude.toFixed(6)}<br>
            Lon: ${reading.longitude.toFixed(6)}<br>
            Time: ${reading.timestamp.toLocaleString()}
        `);
        
        // Pan map to follow ship (optional - can be disabled for better UX)
        // this.map.panTo(latLng);
        
        // Update all maritime data
        this.updateMaritimeConditions();
        
        // Update info displays
        this.updateShipPositionDisplay();
        this.updateRecommendations();
        this.updateInfoDisplay(reading);
    }

    // Update information display
    updateInfoDisplay(reading) {
        const infoElement = document.getElementById('shipInfo');
        if (infoElement) {
            infoElement.innerHTML = `
                <div class="ship-info-item">
                    <strong>Current Position:</strong><br>
                    Latitude: ${reading.latitude.toFixed(6)}<br>
                    Longitude: ${reading.longitude.toFixed(6)}
                </div>
                <div class="ship-info-item">
                    <strong>Time:</strong><br>
                    ${reading.timestamp.toLocaleString()}
                </div>
                <div class="ship-info-item">
                    <strong>Route Points:</strong> ${this.routeCoordinates.length}
                </div>
            `;
        }
    }

    // Update button states
    updateButtonStates() {
        const startBtn = document.getElementById('startLiveDemoBtn');
        const stopBtn = document.getElementById('stopLiveDemoBtn');
        
        if (startBtn && stopBtn) {
            startBtn.disabled = this.isLiveDemo;
            stopBtn.disabled = !this.isLiveDemo;
            
            startBtn.textContent = this.isLiveDemo ? 'Demo Running...' : 'Start Live Demo';
        }
    }

    // Update route polyline with color coding
    updateRoutePolyline() {
        if (!this.routePolyline) return;
        
        // Color code route based on wave conditions
        let routeColor = 'rgb(45, 185, 164)'; // Default green
        
        if (this.currentConditions.wave) {
            const waveHeight = this.currentConditions.wave.waveHeight;
            if (waveHeight > 4) {
                routeColor = '#ff4500'; // Red for high waves
            } else if (waveHeight > 3) {
                routeColor = '#ff8c00'; // Orange
            } else if (waveHeight > 2) {
                routeColor = '#ffd700'; // Yellow
            } else if (waveHeight > 1) {
                routeColor = '#32cd32'; // Light green
            }
        }
        
        this.routePolyline.setStyle({ color: routeColor });
        this.routePolyline.setLatLngs(this.routeCoordinates);
    }

    // Update maritime conditions from all sensors
    updateMaritimeConditions() {
        // Get current wave data
        if (this.sensor1) {
            this.currentConditions.wave = this.sensor1.getNextReading();
            this.updateWaveDisplay();
        }
        
        // Get current vessel data
        if (this.sensor2) {
            this.currentConditions.vessel = this.sensor2.getNextReading();
            this.updateVesselDisplay();
        }
        
        // Calculate MSDV if PSD system is available
        if (this.powerSpectralDensity && this.currentConditions.wave) {
            this.updateMSDVAnalysis();
        }
    }

    // Update wave conditions display
    updateWaveDisplay() {
        const wave = this.currentConditions.wave;
        if (!wave) return;
        
        document.getElementById('waveHeight').textContent = `${wave.waveHeight.toFixed(1)} m`;
        document.getElementById('wavePeriod').textContent = `${wave.wavePeriod.toFixed(1)} s`;
        document.getElementById('waveDirection').textContent = `${wave.waveDirection.toFixed(0)}°`;
    }

    // Update vessel data display
    updateVesselDisplay() {
        const vessel = this.currentConditions.vessel;
        if (!vessel) return;
        
        document.getElementById('vesselSpeed').textContent = `${vessel.speed.toFixed(1)} kts`;
        document.getElementById('vesselHeading').textContent = `${vessel.heading.toFixed(0)}°`;
    }

    // Update ship position display
    updateShipPositionDisplay() {
        const position = this.currentConditions.position;
        if (!position) return;
        
        document.getElementById('currentLat').textContent = position.latitude.toFixed(6);
        document.getElementById('currentLon').textContent = position.longitude.toFixed(6);
        document.getElementById('currentTime').textContent = position.timestamp.toLocaleTimeString();
        document.getElementById('routePoints').textContent = this.routeCoordinates.length.toString();
    }

    // Update MSDV analysis and comfort zones
    updateMSDVAnalysis() {
        const wave = this.currentConditions.wave;
        if (!wave || !this.powerSpectralDensity) return;
        
        try {
            // Calculate current MSDV at midships (simplified estimation)
            // In a real system, this would use the full PSD calculation
            const estimatedMSDV = this.estimateMSDV(wave.waveHeight, wave.wavePeriod);
            this.currentConditions.msdv = estimatedMSDV;
            
            // Update display
            document.getElementById('msdvMidships').textContent = `${estimatedMSDV.toFixed(2)} m/s²`;
            
            // Update comfort recommendation
            this.updateComfortRecommendation(estimatedMSDV);
            
        } catch (error) {
            console.warn('Error calculating MSDV:', error);
            document.getElementById('msdvMidships').textContent = 'Calc. Error';
        }
    }

    // Simplified MSDV estimation based on wave conditions
    estimateMSDV(waveHeight, wavePeriod) {
        // Simplified estimation - in reality this would use full spectral analysis
        // MSDV typically scales with wave height and frequency content
        const frequency = 2 * Math.PI / wavePeriod;
        const baseAcceleration = waveHeight * Math.pow(frequency, 2);
        
        // Apply empirical scaling factor for typical vessel response
        return baseAcceleration * 0.1;
    }

    // Update comfort recommendation based on MSDV
    updateComfortRecommendation(msdv) {
        const recommendationEl = document.getElementById('comfortRecommendation');
        const alertEl = document.getElementById('alertStatus');
        
        if (msdv < 0.5) {
            recommendationEl.textContent = 'Comfortable conditions for crew operations.';
            alertEl.textContent = 'Normal Operations';
            alertEl.className = 'alert-normal';
        } else if (msdv < 1.0) {
            recommendationEl.textContent = 'Elevated motion levels. Monitor crew comfort.';
            alertEl.textContent = 'Caution - Monitor Comfort';
            alertEl.className = 'alert-caution';
        } else {
            recommendationEl.textContent = 'High motion levels. Consider speed/heading adjustment.';
            alertEl.textContent = 'Warning - High Motion';
            alertEl.className = 'alert-warning';
        }
    }

    // Update navigation recommendations
    updateRecommendations() {
        const wave = this.currentConditions.wave;
        const vessel = this.currentConditions.vessel;
        const msdv = this.currentConditions.msdv;
        
        // Calculate optimal speed recommendation
        let optimalSpeed = 'Maintain current';
        if (msdv && msdv > 0.8 && vessel) {
            const reducedSpeed = Math.max(vessel.speed * 0.8, 8); // Reduce speed but not below 8 knots
            optimalSpeed = `Reduce to ${reducedSpeed.toFixed(1)} kts`;
        }
        
        // Calculate heading recommendation
        let recommendedHeading = 'Current heading OK';
        if (wave && vessel) {
            const relativeAngle = Math.abs(vessel.heading - wave.waveDirection);
            if (relativeAngle < 30 || relativeAngle > 330) {
                // Head seas - potentially uncomfortable
                recommendedHeading = `Consider heading ±30° from ${wave.waveDirection.toFixed(0)}°`;
            }
        }
        
        // Generate forecast
        let forecast = 'Monitoring current conditions...';
        if (wave) {
            if (wave.waveHeight > 3) {
                forecast = 'Rough seas expected to continue. Monitor for comfort.';
            } else if (wave.waveHeight < 1.5) {
                forecast = 'Calm seas. Good conditions for operations.';
            } else {
                forecast = 'Moderate seas. Normal operations possible.';
            }
        }
        
        // Update displays
        document.getElementById('optimalSpeed').textContent = optimalSpeed;
        document.getElementById('recommendedHeading').textContent = recommendedHeading;
        document.getElementById('forecast').textContent = forecast;
    }

    // Get demo status
    isDemoRunning() {
        return this.isLiveDemo;
    }

    // Get current route coordinates
    getRouteCoordinates() {
        return this.routeCoordinates;
    }
}

// Create global bridge dashboard instance
window.bridgeDashboard = new BridgeDashboard();

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize bridge dashboard when the bridge view becomes active
    const bridgeView = document.getElementById('bridgeView');
    if (bridgeView) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (bridgeView.classList.contains('active') && !window.bridgeDashboard.sensor3) {
                        window.bridgeDashboard.init();
                    }
                }
            });
        });
        
        observer.observe(bridgeView, { attributes: true });
        
        // Also initialize if bridge view is already active
        if (bridgeView.classList.contains('active')) {
            window.bridgeDashboard.init();
        }
    }
});
