// Sensor class for handling data loading and streaming
class Sensor1 {
    constructor() {
        this.data = [];         // Array to store all readings
        this.currentIndex = 0;  // Index to track current reading
        this.isLoading = false; // Flag to track loading state
        this.jonswapSpectrum = new JonswapSpectrum(); // Initialize JONSWAP spectrum
        this.currentReading = null; // Cache current reading for hourly updates
    }

    // Load and parse CSV data
    async loadData() {
        if (this.isLoading) return false;
        this.isLoading = true;

        try {
            console.log('Fetching CSV data...');
            const response = await fetch('./era5Data copy.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            console.log('CSV data received');
            
            // Parse CSV data
            const rows = csvText.split('\n')
                              .filter(row => row.trim() && !row.startsWith('//'))
                              .map(row => row.split(','));
            
            console.log('Found', rows.length, 'rows in CSV');
            
            // Get header row indices
            const headers = rows[0];
            const timeIndex = headers.findIndex(h => h === 'Time');
            const heightIndex = headers.findIndex(h => h === 'Significant height of combined wind waves and swell');
            const periodIndex = headers.findIndex(h => h === 'Mean wave period');
            const directionIndex = headers.findIndex(h => h === 'Mean wave direction');

            if (timeIndex === -1 || heightIndex === -1 || periodIndex === -1 || directionIndex === -1) {
                throw new Error('Required columns not found in CSV');
            }

            // Process data rows
            this.data = rows.slice(1)
                           .map(row => ({
                               timestamp: new Date(row[timeIndex]),
                               waveHeight: parseFloat(row[heightIndex]),
                               wavePeriod: parseFloat(row[periodIndex]),
                               waveDirection: parseFloat(row[directionIndex])
                           }))
                           .filter(reading => {
                               return !isNaN(reading.timestamp.getTime()) && 
                                      !isNaN(reading.waveHeight) && 
                                      !isNaN(reading.wavePeriod) && 
                                      !isNaN(reading.waveDirection);
                           });

            if (this.data.length === 0) {
                throw new Error('No valid data points found in CSV');
            }

            console.log(`Successfully loaded ${this.data.length} valid sensor readings`);
            this.currentIndex = 0;
            this.isLoading = false;
            return true;

        } catch (error) {
            console.error('Error loading sensor data:', error);
            this.data = [];
            this.currentIndex = 0;
            this.isLoading = false;
            return false;
        }
    }

    // Get next reading with caching for hourly updates
    getNextReading(forceUpdate = false) {
        if (this.data.length === 0) {
            console.warn('No data available to read');
            return null;
        }
        
        // Return cached reading unless force update is requested
        if (!forceUpdate && this.currentReading) {
            return this.currentReading;
        }

        const reading = this.data[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.data.length;
        this.currentReading = reading;
        return reading;
    }

    // Start simulated streaming - now just returns first reading
    startStreaming(callback, interval = 3600000) {
        if (this.data.length === 0) {
            console.error('No data loaded. Call loadData() first.');
            return null;
        }

        console.log('Getting initial sensor1 reading');
        const reading = this.getNextReading(true);
        callback(reading);
        return reading;
    }
}

// Make Sensor1 available globally
window.Sensor1 = Sensor1;

// Sensor class for handling vessel data loading and streaming
class Sensor2 {
    constructor() {
        this.data = [];         // Array to store all readings
        this.currentIndex = 0;  // Index to track current reading
        this.isLoading = false; // Flag to track loading state
    }

    // Load and parse CSV data
    async loadData() {
        if (this.isLoading) return false;
        this.isLoading = true;

        try {
            console.log('Fetching vessel CSV data...');
            const response = await fetch('./five_minute_batch copy.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            console.log('Vessel CSV data received');
            
            // Parse CSV data
            const rows = csvText.split('\n')
                              .filter(row => row.trim() && !row.startsWith('//'))
                              .map(row => row.split(','));
            
            console.log('Found', rows.length, 'rows in vessel CSV');
            
            // Get header row indices
            const headers = rows[0];
            const timeIndex = headers.findIndex(h => h === 'TIME_SERVER');
            const headingIndex = headers.findIndex(h => h === 'MEAN_HEADING');
            const speedIndex = headers.findIndex(h => h === 'MEAN_GPS_SOG_KNOTS');

            if (timeIndex === -1 || headingIndex === -1 || speedIndex === -1) {
                throw new Error('Required columns not found in vessel CSV');
            }

            // Process data rows
            this.data = rows.slice(1)
                           .map(row => ({
                               timestamp: new Date(row[timeIndex]),
                               heading: parseFloat(row[headingIndex]),
                               speed: parseFloat(row[speedIndex])
                           }))
                           .filter(reading => {
                               return !isNaN(reading.timestamp.getTime()) && 
                                      !isNaN(reading.heading) && 
                                      !isNaN(reading.speed);
                           });

            if (this.data.length === 0) {
                throw new Error('No valid data points found in vessel CSV');
            }

            console.log(`Successfully loaded ${this.data.length} valid vessel readings`);
            this.currentIndex = 0;
            this.isLoading = false;
            return true;

        } catch (error) {
            console.error('Error loading vessel data:', error);
            this.data = [];
            this.currentIndex = 0;
            this.isLoading = false;
            return false;
        }
    }

    // Get next reading - now returns every 5 minutes
    getNextReading() {
        if (this.data.length === 0) {
            console.warn('No vessel data available to read');
            return null;
        }
        
        const reading = this.data[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.data.length;
        return reading;
    }

    // Start simulated streaming - now just returns first reading
    startStreaming(callback, interval = 300000) {
        if (this.data.length === 0) {
            console.error('No vessel data loaded. Call loadData() first.');
            return null;
        }

        console.log('Getting initial sensor2 reading');
        const reading = this.getNextReading();
        callback(reading);
        return reading;
    }
}

// Make Sensor2 available globally
window.Sensor2 = Sensor2;

// Sensor3 class for GPS tracking data
class Sensor3 {
    constructor() {
        this.data = [];         // Array to store all GPS readings
        this.currentIndex = 0;  // Index to track current reading
        this.isLoading = false; // Flag to track loading state
        this.currentReading = null; // Cache current reading
    }

    // Load and parse GPS CSV data
    async loadData() {
        if (this.isLoading) return false;
        this.isLoading = true;

        try {
            console.log('Fetching GPS CSV data...');
            const response = await fetch('./SDS_Export_300722_233846_SCALE_Winter2022_Full copy.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            console.log('GPS CSV data received');
            
            // Parse CSV data - note this file uses quoted values
            const rows = csvText.split('\n')
                              .filter(row => row.trim() && !row.startsWith('//'))
                              .map(row => {
                                  // Handle quoted CSV properly
                                  const result = [];
                                  let current = '';
                                  let inQuotes = false;
                                  
                                  for (let i = 0; i < row.length; i++) {
                                      const char = row[i];
                                      if (char === '"') {
                                          inQuotes = !inQuotes;
                                      } else if (char === ',' && !inQuotes) {
                                          result.push(current.trim());
                                          current = '';
                                      } else {
                                          current += char;
                                      }
                                  }
                                  result.push(current.trim());
                                  return result;
                              });
            
            console.log('Found', rows.length, 'rows in GPS CSV');
            
            // Get header row indices
            const headers = rows[0].map(h => h.replace(/"/g, ''));
            const timeIndex = headers.findIndex(h => h === 'TIME_SERVER');
            const latIndex = headers.findIndex(h => h === 'LAT_DEC');
            const lonIndex = headers.findIndex(h => h === 'LON_DEC');

            console.log('Header indices:', { timeIndex, latIndex, lonIndex });
            console.log('Headers:', headers.slice(0, 10));

            if (timeIndex === -1 || latIndex === -1 || lonIndex === -1) {
                throw new Error('Required GPS columns not found in CSV');
            }

            // Process data rows and filter to 5-minute intervals
            const allData = rows.slice(1)
                               .map(row => {
                                   const timeStr = row[timeIndex]?.replace(/"/g, '');
                                   const lat = parseFloat(row[latIndex]?.replace(/"/g, ''));
                                   const lon = parseFloat(row[lonIndex]?.replace(/"/g, ''));
                                   
                                   if (!timeStr || isNaN(lat) || isNaN(lon)) return null;
                                   
                                   return {
                                       timestamp: new Date(timeStr),
                                       latitude: lat,
                                       longitude: lon
                                   };
                               })
                               .filter(row => row !== null);

            // Filter to approximately 5-minute intervals
            this.data = [];
            let lastTime = null;
            
            for (const reading of allData) {
                if (!lastTime || (reading.timestamp - lastTime) >= 4.5 * 60 * 1000) { // 4.5 minutes tolerance
                    this.data.push(reading);
                    lastTime = reading.timestamp;
                }
            }

            console.log('Processed GPS data:', this.data.length, 'readings at ~5 minute intervals');
            console.log('Sample GPS reading:', this.data[0]);
            console.log('Date range:', this.data[0]?.timestamp, 'to', this.data[this.data.length - 1]?.timestamp);

            this.isLoading = false;
            return true;

        } catch (error) {
            console.error('Error loading GPS data:', error);
            this.isLoading = false;
            return false;
        }
    }

    // Get next GPS reading in sequence
    getNextReading() {
        if (this.data.length === 0) {
            console.warn('No GPS data available');
            return null;
        }

        const reading = this.data[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.data.length;
        
        this.currentReading = reading;
        return reading;
    }

    // Get current GPS reading
    getCurrentReading() {
        return this.currentReading;
    }

    // Stream GPS data with callback (5-minute intervals simulated)
    startStream(callback, intervalMs = 5000) { // Default 5 seconds for demo (represents 5 minutes)
        console.log('Starting GPS stream with', intervalMs, 'ms intervals');
        
        // Get initial reading
        const initialReading = this.getNextReading();
        if (initialReading) {
            callback(initialReading);
        }
        
        // Set up interval for subsequent readings
        return setInterval(() => {
            const reading = this.getNextReading();
            if (reading) {
                callback(reading);
            }
        }, intervalMs);
    }

    // Stop streaming
    stopStream(intervalId) {
        if (intervalId) {
            clearInterval(intervalId);
            console.log('GPS stream stopped');
        }
    }

    // Reset to beginning of data
    reset() {
        this.currentIndex = 0;
        this.currentReading = null;
    }
}

// Make Sensor3 available globally
window.Sensor3 = Sensor3;


