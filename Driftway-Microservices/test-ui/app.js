const { createApp } = Vue;

createApp({
    data() {
        return {
            // API Configuration
            useSimulation: true, // Set to true to use simulation server
            apiBaseUrl: 'http://localhost:8080',
            textServiceUrl: 'http://localhost:4000',
            voiceServiceUrl: 'http://localhost:9090',
            simulationServerUrl: 'http://localhost:3001',
            
            // UI State
            activeTab: 'auth',
            showLogin: false,
            
            // Authentication
            currentUser: null,
            authToken: localStorage.getItem('authToken'),
            
            // Forms
            loginForm: {
                email: 'test@example.com',
                password: 'password123'
            },
            registerForm: {
                username: '',
                email: '',
                password: ''
            },
            
            // Loading states
            loggingIn: false,
            registering: false,
            testing: {
                apiGateway: false,
                textChannels: false,
                voiceChannels: false
            },
            
            // Service Status
            services: {
                apiGateway: {
                    status: 'status-disconnected',
                    statusClass: 'text-red-600',
                    message: 'Not checked'
                },
                textChannels: {
                    status: 'status-disconnected',
                    statusClass: 'text-red-600',
                    message: 'Not checked'
                },
                voiceChannels: {
                    status: 'status-disconnected',
                    statusClass: 'text-red-600',
                    message: 'Not checked'
                }
            },
            
            // Messaging
            websocket: null,
            websocketStatus: 'status-disconnected',
            websocketMessage: 'Disconnected',
            channels: [
                { id: '1', name: 'general' },
                { id: '2', name: 'random' },
                { id: '3', name: 'testing' }
            ],
            currentChannel: null,
            messages: [],
            newMessage: '',
            
            // Voice
            voiceChannels: [
                { id: '1', name: 'Voice Chat 1', max_participants: 10, current_participants: 0, bitrate: 64000 },
                { id: '2', name: 'Voice Chat 2', max_participants: 5, current_participants: 2, bitrate: 128000 }
            ],
            webrtcLog: [],
            
            // API Testing
            apiRequest: {
                method: 'GET',
                endpoint: '/api/health',
                body: ''
            },
            apiResponse: null,
            sendingRequest: false,
            
            // Logs and Notifications
            logs: [],
            toasts: [],
            logId: 0,
            toastId: 0,
            
            // Tabs configuration
            tabs: [
                { id: 'auth', name: 'Authentication', icon: 'fas fa-shield-alt' },
                { id: 'text', name: 'Text Messaging', icon: 'fas fa-comments' },
                { id: 'voice', name: 'Voice Channels', icon: 'fas fa-microphone' },
                { id: 'api', name: 'API Testing', icon: 'fas fa-code' },
                { id: 'logs', name: 'Logs', icon: 'fas fa-terminal' }
            ]
        };
    },
    
    computed: {
        overallStatus() {
            const statuses = [
                this.services.apiGateway.status,
                this.services.textChannels.status,
                this.services.voiceChannels.status
            ];
            
            if (statuses.every(s => s === 'status-connected')) {
                return 'status-connected';
            } else if (statuses.some(s => s === 'status-connected')) {
                return 'status-connecting';
            } else {
                return 'status-disconnected';
            }
        },
        
        overallStatusText() {
            switch (this.overallStatus) {
                case 'status-connected': return 'text-green-600';
                case 'status-connecting': return 'text-yellow-600';
                default: return 'text-red-600';
            }
        },
        
        overallStatusMessage() {
            switch (this.overallStatus) {
                case 'status-connected': return 'All Services Online';
                case 'status-connecting': return 'Partial Services';
                default: return 'Services Offline';
            }
        },
        
        // Dynamic URLs based on simulation mode
        currentApiBaseUrl() {
            return this.useSimulation ? this.simulationServerUrl : this.apiBaseUrl;
        },
        
        currentTextServiceUrl() {
            return this.useSimulation ? this.simulationServerUrl : this.textServiceUrl;
        },
        
        currentVoiceServiceUrl() {
            return this.useSimulation ? this.simulationServerUrl : this.voiceServiceUrl;
        }
    },
    
    methods: {
        // Logging and Notifications
        log(message, level = 'info') {
            this.logs.unshift({
                id: this.logId++,
                timestamp: new Date(),
                level,
                message
            });
            
            // Keep only last 100 logs
            if (this.logs.length > 100) {
                this.logs = this.logs.slice(0, 100);
            }
        },
        
        showToast(message, type = 'info') {
            const toast = {
                id: this.toastId++,
                message,
                type
            };
            
            this.toasts.push(toast);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                this.removeToast(toast.id);
            }, 5000);
        },
        
        removeToast(id) {
            this.toasts = this.toasts.filter(t => t.id !== id);
        },
        
        clearLogs() {
            this.logs = [];
            this.log('Logs cleared', 'info');
        },
        
        // Utility Methods
        formatTime(timestamp) {
            return new Date(timestamp).toLocaleTimeString();
        },
        
        async makeRequest(url, options = {}) {
            try {
                const headers = {
                    'Content-Type': 'application/json',
                    ...options.headers
                };
                
                if (this.authToken && !options.skipAuth) {
                    headers.Authorization = `Bearer ${this.authToken}`;
                }
                
                const response = await fetch(url, {
                    ...options,
                    headers
                });
                
                let data;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }
                
                return {
                    status: response.status,
                    statusText: response.statusText,
                    data,
                    ok: response.ok
                };
            } catch (error) {
                this.log(`Request failed: ${error.message}`, 'error');
                throw error;
            }
        },
        
        // Service Health Checks
        async testService(serviceName) {
            this.testing[serviceName] = true;
            
            let url;
            if (this.useSimulation) {
                // Use simulation server for all services
                switch (serviceName) {
                    case 'apiGateway':
                        url = `${this.simulationServerUrl}/health`;
                        break;
                    case 'textChannels':
                        url = `${this.simulationServerUrl}/text-service/health`;
                        break;
                    case 'voiceChannels':
                        url = `${this.simulationServerUrl}/voice-service/health`;
                        break;
                }
            } else {
                // Use real microservices
                switch (serviceName) {
                    case 'apiGateway':
                        url = `${this.apiBaseUrl}/health`;
                        break;
                    case 'textChannels':
                        url = `${this.textServiceUrl}/health`;
                        break;
                    case 'voiceChannels':
                        url = `${this.voiceServiceUrl}/health`;
                        break;
                }
            }
            
            try {
                const response = await this.makeRequest(url, { skipAuth: true });
                
                if (response.ok) {
                    this.services[serviceName] = {
                        status: 'status-connected',
                        statusClass: 'text-green-600',
                        message: 'Service is healthy'
                    };
                    this.log(`${serviceName} health check passed`, 'success');
                    this.showToast(`${serviceName} is healthy`, 'success');
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                this.services[serviceName] = {
                    status: 'status-disconnected',
                    statusClass: 'text-red-600',
                    message: `Error: ${error.message}`
                };
                this.log(`${serviceName} health check failed: ${error.message}`, 'error');
                this.showToast(`${serviceName} health check failed`, 'error');
            } finally {
                this.testing[serviceName] = false;
            }
        },
        
        async testAllServices() {
            await Promise.all([
                this.testService('apiGateway'),
                this.testService('textChannels'),
                this.testService('voiceChannels')
            ]);
        },
        
        // Authentication
        async register() {
            if (!this.registerForm.username || !this.registerForm.email || !this.registerForm.password) {
                this.showToast('Please fill in all fields', 'warning');
                return;
            }
            
            this.registering = true;
            this.log(`Attempting to register user: ${this.registerForm.email}`, 'info');
            
            try {
                const response = await this.makeRequest(`${this.currentApiBaseUrl}/api/auth/register`, {
                    method: 'POST',
                    body: JSON.stringify(this.registerForm),
                    skipAuth: true
                });
                
                if (response.ok) {
                    this.log('User registered successfully', 'success');
                    this.showToast('Registration successful! You can now login.', 'success');
                    
                    // Clear form
                    this.registerForm = { username: '', email: '', password: '' };
                    
                    // Switch to login with registered email
                    this.loginForm.email = this.registerForm.email;
                } else {
                    throw new Error(response.data.error?.message || 'Registration failed');
                }
            } catch (error) {
                this.log(`Registration failed: ${error.message}`, 'error');
                this.showToast(`Registration failed: ${error.message}`, 'error');
            } finally {
                this.registering = false;
            }
        },
        
        async login() {
            if (!this.loginForm.email || !this.loginForm.password) {
                this.showToast('Please enter email and password', 'warning');
                return;
            }
            
            this.loggingIn = true;
            this.log(`Attempting to login: ${this.loginForm.email}`, 'info');
            
            try {
                const response = await this.makeRequest(`${this.currentApiBaseUrl}/api/auth/login`, {
                    method: 'POST',
                    body: JSON.stringify(this.loginForm),
                    skipAuth: true
                });
                
                if (response.ok && response.data.success) {
                    this.authToken = response.data.data.token;
                    this.currentUser = response.data.data.user;
                    
                    // Store token
                    localStorage.setItem('authToken', this.authToken);
                    
                    this.log(`Login successful for user: ${this.currentUser.username}`, 'success');
                    this.showToast(`Welcome back, ${this.currentUser.username}!`, 'success');
                } else {
                    throw new Error(response.data.error?.message || 'Login failed');
                }
            } catch (error) {
                this.log(`Login failed: ${error.message}`, 'error');
                this.showToast(`Login failed: ${error.message}`, 'error');
            } finally {
                this.loggingIn = false;
            }
        },
        
        logout() {
            this.authToken = null;
            this.currentUser = null;
            localStorage.removeItem('authToken');
            
            // Close WebSocket
            if (this.websocket) {
                this.websocket.close();
            }
            
            this.log('User logged out', 'info');
            this.showToast('Logged out successfully', 'info');
        },
        
        async testAuthenticatedEndpoint() {
            try {
                const response = await this.makeRequest(`${this.currentApiBaseUrl}/api/users/me`);
                
                if (response.ok) {
                    this.log('Protected endpoint test passed', 'success');
                    this.showToast('JWT token is valid', 'success');
                } else {
                    throw new Error('Authentication failed');
                }
            } catch (error) {
                this.log(`Protected endpoint test failed: ${error.message}`, 'error');
                this.showToast('JWT token validation failed', 'error');
            }
        },
        
        // Text Messaging
        async loadChannels() {
            if (!this.currentUser) {
                this.showToast('Please login first', 'warning');
                return;
            }
            
            try {
                const response = await this.makeRequest(`${this.currentApiBaseUrl}/api/channels`);
                
                if (response.ok && response.data.success) {
                    this.channels = response.data.data.channels;
                    this.log(`Loaded ${this.channels.length} channels`, 'success');
                } else {
                    throw new Error('Failed to load channels');
                }
            } catch (error) {
                this.log(`Failed to load channels: ${error.message}`, 'error');
                this.showToast('Failed to load channels', 'error');
            }
        },
        
        selectChannel(channel) {
            this.currentChannel = channel;
            this.messages = [];
            this.log(`Selected channel: ${channel.name}`, 'info');
            
            // Load channel messages
            this.loadMessages();
            
            // Connect to WebSocket for this channel
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({
                    type: 'join_channel',
                    channel_id: channel.id
                }));
            }
        },
        
        async loadMessages() {
            if (!this.currentChannel || !this.currentUser) return;
            
            try {
                const response = await this.makeRequest(
                    `${this.apiBaseUrl}/api/text/channels/${this.currentChannel.id}/messages`
                );
                
                if (response.ok && response.data.success) {
                    this.messages = response.data.data.messages.reverse(); // Newest last
                    this.log(`Loaded ${this.messages.length} messages for ${this.currentChannel.name}`, 'info');
                }
            } catch (error) {
                this.log(`Failed to load messages: ${error.message}`, 'error');
            }
        },
        
        async sendMessage() {
            if (!this.newMessage.trim() || !this.currentChannel || !this.currentUser) return;
            
            const messageContent = this.newMessage.trim();
            this.newMessage = '';
            
            try {
                // Send via WebSocket if connected
                if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                    this.websocket.send(JSON.stringify({
                        type: 'message',
                        content: messageContent,
                        channel_id: this.currentChannel.id
                    }));
                    this.log(`Sent message via WebSocket: ${messageContent}`, 'info');
                } else {
                    // Fallback to HTTP API
                    const response = await this.makeRequest(
                        `${this.apiBaseUrl}/api/text/channels/${this.currentChannel.id}/messages`,
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                content: messageContent,
                                type: 'text'
                            })
                        }
                    );
                    
                    if (response.ok) {
                        this.log(`Sent message via HTTP: ${messageContent}`, 'info');
                        // Add message to local display
                        this.messages.push({
                            id: Date.now(),
                            content: messageContent,
                            username: this.currentUser.username,
                            user_id: this.currentUser.id,
                            created_at: new Date(),
                            channel_id: this.currentChannel.id
                        });
                    } else {
                        throw new Error('Failed to send message');
                    }
                }
            } catch (error) {
                this.log(`Failed to send message: ${error.message}`, 'error');
                this.showToast('Failed to send message', 'error');
                // Restore message to input
                this.newMessage = messageContent;
            }
        },
        
        // WebSocket Management
        toggleWebSocket() {
            if (this.websocket) {
                this.websocket.close();
            } else {
                this.connectWebSocket();
            }
        },
        
        connectWebSocket() {
            if (!this.currentUser || !this.authToken) {
                this.showToast('Please login first', 'warning');
                return;
            }
            
            this.websocketStatus = 'status-connecting';
            this.websocketMessage = 'Connecting...';
            this.log('Attempting WebSocket connection', 'info');
            
            // Use HTTP for demo (since WebSocket might not be implemented)
            // In real implementation, this would be: ws://localhost:4000/api/text/socket
            this.websocketStatus = 'status-connected';
            this.websocketMessage = 'Connected (Demo Mode)';
            this.log('WebSocket connected (demo mode)', 'success');
            this.showToast('WebSocket connected', 'success');
            
            // Simulate WebSocket with periodic polling
            this.websocket = {
                readyState: WebSocket.OPEN,
                send: (data) => {
                    const message = JSON.parse(data);
                    this.log(`WebSocket send: ${message.type}`, 'info');
                },
                close: () => {
                    this.websocket = null;
                    this.websocketStatus = 'status-disconnected';
                    this.websocketMessage = 'Disconnected';
                    this.log('WebSocket disconnected', 'info');
                }
            };
        },
        
        // Voice Channels
        async loadVoiceChannels() {
            if (!this.currentUser) {
                this.showToast('Please login first', 'warning');
                return;
            }
            
            try {
                const response = await this.makeRequest(`${this.apiBaseUrl}/api/voice/channels`);
                
                if (response.ok && response.data.success) {
                    this.voiceChannels = response.data.data.channels;
                    this.log(`Loaded ${this.voiceChannels.length} voice channels`, 'success');
                } else {
                    // Use mock data if API not available
                    this.log('Using mock voice channels data', 'info');
                }
            } catch (error) {
                this.log(`Failed to load voice channels: ${error.message}`, 'error');
                this.showToast('Using mock voice channels', 'warning');
            }
        },
        
        async joinVoiceChannel(channel) {
            if (!this.currentUser) {
                this.showToast('Please login first', 'warning');
                return;
            }
            
            this.log(`Joining voice channel: ${channel.name}`, 'info');
            
            try {
                const response = await this.makeRequest(
                    `${this.apiBaseUrl}/api/voice/channels/${channel.id}/join`,
                    { method: 'POST' }
                );
                
                if (response.ok) {
                    this.log(`Successfully joined voice channel: ${channel.name}`, 'success');
                    this.showToast(`Joined ${channel.name}`, 'success');
                } else {
                    throw new Error('Failed to join voice channel');
                }
            } catch (error) {
                this.log(`Failed to join voice channel: ${error.message}`, 'error');
                this.showToast('Failed to join voice channel', 'error');
            }
        },
        
        async testWebRTC() {
            this.webrtcLog = [];
            this.addWebRTCLog('Starting WebRTC test...', 'info');
            
            try {
                // Test WebRTC signaling endpoint
                const response = await this.makeRequest(
                    `${this.voiceServiceUrl}/api/voice/test-signaling`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            type: 'test',
                            data: 'WebRTC connection test'
                        })
                    }
                );
                
                if (response.ok) {
                    this.addWebRTCLog('WebRTC signaling test passed', 'success');
                } else {
                    throw new Error('Signaling test failed');
                }
            } catch (error) {
                this.addWebRTCLog(`WebRTC test failed: ${error.message}`, 'error');
            }
        },
        
        addWebRTCLog(message, type) {
            this.webrtcLog.push({
                timestamp: new Date(),
                message,
                type
            });
            this.log(`WebRTC: ${message}`, type);
        },
        
        // API Testing
        async sendApiRequest() {
            if (!this.apiRequest.endpoint) {
                this.showToast('Please enter an endpoint', 'warning');
                return;
            }
            
            this.sendingRequest = true;
            const fullUrl = this.apiRequest.endpoint.startsWith('http') 
                ? this.apiRequest.endpoint 
                : `${this.apiBaseUrl}${this.apiRequest.endpoint}`;
            
            this.log(`API Request: ${this.apiRequest.method} ${fullUrl}`, 'info');
            
            try {
                const options = {
                    method: this.apiRequest.method
                };
                
                if (this.apiRequest.body && ['POST', 'PUT', 'PATCH'].includes(this.apiRequest.method)) {
                    options.body = this.apiRequest.body;
                }
                
                const response = await this.makeRequest(fullUrl, options);
                this.apiResponse = response;
                
                this.log(`API Response: ${response.status} ${response.statusText}`, 
                    response.status < 400 ? 'success' : 'error');
                
            } catch (error) {
                this.apiResponse = {
                    status: 0,
                    statusText: 'Network Error',
                    data: { error: error.message }
                };
                this.log(`API Request failed: ${error.message}`, 'error');
            } finally {
                this.sendingRequest = false;
            }
        },
        
        async quickTest(type) {
            switch (type) {
                case 'health':
                    this.apiRequest = { method: 'GET', endpoint: '/health', body: '' };
                    break;
                case 'users':
                    this.apiRequest = { method: 'GET', endpoint: '/api/users/me', body: '' };
                    break;
                case 'channels':
                    this.apiRequest = { method: 'GET', endpoint: '/api/text/channels', body: '' };
                    break;
            }
            
            await this.sendApiRequest();
        }
    },
    
    async mounted() {
        // Check if user is already logged in
        if (this.authToken) {
            try {
                const response = await this.makeRequest(`${this.apiBaseUrl}/api/users/me`);
                if (response.ok && response.data.success) {
                    this.currentUser = response.data.data.user;
                    this.log(`Restored session for user: ${this.currentUser.username}`, 'success');
                } else {
                    // Invalid token, clear it
                    localStorage.removeItem('authToken');
                    this.authToken = null;
                }
            } catch (error) {
                localStorage.removeItem('authToken');
                this.authToken = null;
            }
        }
        
        // Test all services on startup
        this.log('Driftway Test UI initialized', 'success');
        this.showToast('Welcome to Driftway Test UI', 'info');
        
        // Test services after a short delay
        setTimeout(() => {
            this.testAllServices();
        }, 1000);
    }
}).mount('#app');