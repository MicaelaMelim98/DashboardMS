// Sensor class for handling data loading and streaming
class Sensor1 {
    constructor() {
        this.data = [];         // Array to store all readings
        this.currentIndex = 0;  // Index to track current reading
        this.isLoading = false; // Flag to track loading state
        this.jonswapSpectrum = new JonswapSpectrum(); // Initialize JONSWAP spectrum
    }

    // Load and parse CSV data
    async loadData() {
        if (this.isLoading) return false;
        this.isLoading = true;

        try {
            console.log('Fetching CSV data...');
            const response = await fetch('./data/era5Data copy.csv');
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

    // Get next reading
    getNextReading() {
        if (this.data.length === 0) {
            console.warn('No data available to read');
            return null;
        }
        
        const reading = this.data[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.data.length;
        return reading;
    }

    // Start simulated streaming
    startStreaming(callback, interval = 3600000) {
        if (this.data.length === 0) {
            console.error('No data loaded. Call loadData() first.');
            return null;
        }

        console.log(`Starting data streaming with ${interval}ms interval`);
        
        // Initial reading
        callback(this.getNextReading());
        
        // Set up interval for subsequent readings
        return setInterval(() => {
            const reading = this.getNextReading();
            console.log('Streaming new reading:', reading);
            callback(reading);
        }, interval);
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
            const response = await fetch('./data/five_minute_batch copy.csv');
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

    // Get next reading
    getNextReading() {
        if (this.data.length === 0) {
            console.warn('No vessel data available to read');
            return null;
        }
        
        const reading = this.data[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.data.length;
        return reading;
    }

    // Start simulated streaming with 5-minute (300000ms) default interval to match data collection
    startStreaming(callback, interval = 300000) {
        if (this.data.length === 0) {
            console.error('No vessel data loaded. Call loadData() first.');
            return null;
        }

        console.log(`Starting vessel data streaming with ${interval}ms interval`);
        
        // Initial reading
        callback(this.getNextReading());
        
        // Set up interval for subsequent readings
        return setInterval(() => {
            const reading = this.getNextReading();
            console.log('Streaming new vessel reading:', reading);
            callback(reading);
        }, interval);
    }
}

// Make Sensor2 available globally
window.Sensor2 = Sensor2;

// Current date/time stamp
const timeStamp = "2022/07/12 08:19";

// Wave parameters
const Hs = 4.58887597013465;  // Significant wave height [m]
const Tp = 14.236200317715;   // Peak period [s]
const peakOmega = 0.44135269011079;  // Peak angular frequency [rad/s]
// Spectrum data
const spectrumData = [
    { x: 0.188495559215388, y: 3.32362960222955E-14 },
    // ...rest of spectrum data...
];
// RAO data
const raoAmplitudeData = [
    { x: 0.1, y: 1.00021 },
    // ...rest of amplitude data...
];
const raoPhaseData = [
    { x: 0.1, y: 0.0001 },
    // ...rest of phase data...
];
// Pitch RAO data
const raoPitchAmplitudeData = [
    { x: 0.1, y: 0.05072843 },
    // ...rest of pitch amplitude data...
];
const raoPitchPhaseData = [
    { x: 0.1, y: 269.8399 },
    // ...rest of pitch phase data...
];
// Vertical motion PSD data
const verticalPSDDataMinus30 = [
    { x: 0.10, y: 0.000000e+00 },
    // ...rest of -30m PSD data...
];
const verticalPSDDataMinus15 = [
    { x: 0.10, y: 0.000000e+00 },
    // ...rest of -15m PSD data...
];
const verticalPSDData0 = [
    { x: 0.10, y: 0.000000e+00 },
    // ...rest of 0m PSD data...
];
const verticalPSDData15 = [
    { x: 0.10, y: 0.000000e+00 },
    // ...rest of 15m PSD data...
];
const verticalPSDData30 = [
    { x: 0.10, y: 0.000000e+00 },
    // ...rest of 30m PSD data...
];
// MSDV data
const msdvPositions = ['-30 m', '-15 m', '0 m', '15 m', '30 m'];
const msdvValues = [0.8, 1.2, 1.5, 1.2, 0.8];  // Example values
