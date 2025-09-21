const express = require('express');
const path = require('path');

const app = express();
const PORT = 4522;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the main HTML file on root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Driftway client server is running',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Handle 404s by serving the main app (for SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log('🌊 Driftway Client Server Started!');
    console.log(`📱 Client running on: http://localhost:${PORT}`);
    console.log(`🔗 Open in browser: http://localhost:${PORT}`);
    console.log('💡 Make sure the API server is running on port 3000');
    console.log('');
});