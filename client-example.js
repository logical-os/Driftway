// Example client code for making authenticated requests to Driftway API

const crypto = require('crypto');

// Your API credentials (keep these secure!)
const PLAIN_API_KEY = '81e3ab2ce1b1b558aec070bbf1b2d024a121957edf0de5fb26436fc20398fa66';
const API_SECRET = 'f1eb04396d78118980e6020bc21714429269598b0604158e919e872eafcf7945';

// Function to hash API key for requests
function hashApiKey(apiKey, secret) {
    return crypto.createHmac('sha256', secret).update(apiKey).digest('hex');
}

// Function to make authenticated API requests
async function makeAuthenticatedRequest(endpoint, options = {}) {
    const hashedKey = hashApiKey(PLAIN_API_KEY, API_SECRET);
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': hashedKey
    };

    const requestOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(endpoint, requestOptions);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Example usage:
async function example() {
    try {
        // Login request
        const loginResponse = await makeAuthenticatedRequest('https://api.yourdomain.com/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                username: 'testuser',
                password: 'testpass123'
            })
        });
        
        console.log('Login successful:', loginResponse);
        
        // Send message request (with user token)
        const messageResponse = await makeAuthenticatedRequest('https://api.yourdomain.com/api/messages', {
            method: 'POST',
            headers: {
                'x-auth-token': loginResponse.token // User session token
            },
            body: JSON.stringify({
                channelId: 'channel_id_here',
                content: 'Hello, world!'
            })
        });
        
        console.log('Message sent:', messageResponse);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Uncomment to run example
// example();

module.exports = {
    hashApiKey,
    makeAuthenticatedRequest
};
