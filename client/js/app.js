// Driftway Discord-like Client Application

class DriftwayApp {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.currentConversation = null;
        this.users = [];
        this.conversations = [];
        this.messages = {};
        this.typingTimeout = null;
        this.isTyping = false;
        
        // Encryption support
        this.conversationKeys = new Map(); // conversationId -> CryptoKey
        this.encryptionEnabled = true; // Enable E2E encryption by default
        
        this.init();
    }

    async init() {
        console.log('🌊 Initializing Driftway...');
        
        // Load users and show login modal
        await this.loadUsers();
        this.showLoginModal();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    // === Encryption Methods ===
    
    async getConversationKey(conversationId) {
        // Check if we already have the key in memory
        if (this.conversationKeys.has(conversationId)) {
            return this.conversationKeys.get(conversationId);
        }

        try {
            // Try to fetch existing key from server
            const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}/key`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.keyBundle) {
                    const key = await window.driftwayEncryption.parseKeyBundle(data.data.keyBundle);
                    this.conversationKeys.set(conversationId, key);
                    return key;
                }
            }
        } catch (error) {
            console.log('No existing key found, creating new one:', error.message);
        }

        // Create new encryption key for this conversation
        return await this.createConversationKey(conversationId);
    }

    async createConversationKey(conversationId) {
        try {
            // Generate a new encryption key
            const key = await window.driftwayEncryption.generateConversationKey();
            const keyBundle = await window.driftwayEncryption.generateKeyBundle(key);

            // Send the key to the server
            const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}/key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keyBundle: keyBundle
                })
            });

            if (response.ok) {
                this.conversationKeys.set(conversationId, key);
                console.log(`✅ Created encryption key for conversation ${conversationId}`);
                return key;
            } else {
                throw new Error('Failed to store conversation key on server');
            }
        } catch (error) {
            console.error('Failed to create conversation key:', error);
            // Fallback: disable encryption for this conversation
            this.conversationKeys.set(conversationId, null);
            return null;
        }
    }

    async encryptMessage(message, conversationId) {
        if (!this.encryptionEnabled) {
            return { content: message, isEncrypted: false };
        }

        try {
            const key = await this.getConversationKey(conversationId);
            if (!key) {
                return { content: message, isEncrypted: false };
            }

            const encrypted = await window.driftwayEncryption.encryptMessage(message, key);
            return {
                content: message, // Keep original for fallback
                encryptedContent: encrypted.ciphertext,
                encryptionIV: encrypted.iv,
                isEncrypted: true
            };
        } catch (error) {
            console.error('Encryption failed, sending plain text:', error);
            return { content: message, isEncrypted: false };
        }
    }

    async decryptMessage(messageData) {
        if (!messageData.isEncrypted || !this.encryptionEnabled) {
            return messageData.content;
        }

        try {
            const key = await this.getConversationKey(messageData.conversationId);
            if (!key) {
                return messageData.content; // Fallback to encrypted content
            }

            const encryptedData = {
                ciphertext: messageData.content, // Server stores encrypted content in content field
                iv: messageData.encryptionIV
            };

            return await window.driftwayEncryption.decryptMessage(encryptedData, key);
        } catch (error) {
            console.error('Decryption failed:', error);
            return '[❌ Decryption failed]';
        }
    }

    // === End Encryption Methods ===

    async loadUsers() {
        try {
            const response = await fetch('http://localhost:3000/api/users');
            const data = await response.json();
            
            if (data.success) {
                this.users = data.data;
                this.populateUserList();
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    populateUserList() {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
        
        this.users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.onclick = () => this.selectUser(user, userItem);
            
            userItem.innerHTML = `
                <div class="user-avatar">${user.displayName.charAt(0).toUpperCase()}</div>
                <div class="user-details">
                    <h4>${user.displayName}</h4>
                    <p>@${user.username}</p>
                </div>
            `;
            
            userList.appendChild(userItem);
        });
    }

    selectUser(user, element) {
        // Remove previous selection
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Select current user
        element.classList.add('selected');
        this.currentUser = user;
        
        // Auto login after selection
        setTimeout(() => this.login(), 500);
    }

    async createUser() {
        const username = document.getElementById('newUsername').value.trim();
        const displayName = document.getElementById('newDisplayName').value.trim();
        const email = document.getElementById('newEmail').value.trim();
        
        if (!username || !displayName || !email) {
            alert('Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    displayName,
                    email
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.data;
                this.users.push(data.data);
                this.login();
            } else {
                alert('Failed to create user: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to create user:', error);
            alert('Failed to create user. Please try again.');
        }
    }

    login() {
        if (!this.currentUser) {
            alert('Please select a user');
            return;
        }
        
        console.log(`🔐 Logging in as ${this.currentUser.displayName}...`);
        
        // Hide login modal
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        
        // Update UI with current user
        this.updateCurrentUserUI();
        
        // Connect to WebSocket
        this.connectWebSocket();
        
        // Load conversations
        this.loadConversations();
        
        // Load online users
        this.loadOnlineUsers();
    }

    updateCurrentUserUI() {
        document.getElementById('currentUsername').textContent = this.currentUser.displayName;
        document.getElementById('currentUserAvatar').textContent = 
            this.currentUser.displayName.charAt(0).toUpperCase();
    }

    connectWebSocket() {
        console.log('🔌 Connecting to WebSocket...');
        
        this.socket = io('http://localhost:3000');
        
        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            
            // Authenticate with the server
            this.socket.emit('authenticate', {
                userId: this.currentUser.id,
                username: this.currentUser.username
            });
        });
        
        this.socket.on('authenticated', (data) => {
            if (data.success) {
                console.log('✅ WebSocket authenticated');
                this.addSystemMessage('Connected to Driftway!');
            }
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            this.addSystemMessage('Disconnected from server');
        });
        
        this.socket.on('message-received', (message) => {
            this.handleIncomingMessage(message);
        });
        
        this.socket.on('user-joined', (data) => {
            this.addSystemMessage(`${data.username} joined the conversation`);
        });
        
        this.socket.on('user-left', (data) => {
            this.addSystemMessage(`${data.username} left the conversation`);
        });
        
        this.socket.on('user-typing', (data) => {
            if (data.userId !== this.currentUser.id) {
                this.showTypingIndicator(`${data.username} is typing...`);
            }
        });
        
        this.socket.on('user-stopped-typing', (data) => {
            if (data.userId !== this.currentUser.id) {
                this.hideTypingIndicator();
            }
        });
        
        this.socket.on('user-online', (data) => {
            this.updateUserOnlineStatus(data.userId, true);
        });
        
        this.socket.on('user-offline', (data) => {
            this.updateUserOnlineStatus(data.userId, false);
        });
        
        this.socket.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            this.addSystemMessage(`Error: ${error.message}`);
        });
    }

    async loadConversations() {
        try {
            const response = await fetch(`http://localhost:3000/api/conversations?userId=${this.currentUser.id}`);
            const data = await response.json();
            
            if (data.success) {
                this.conversations = data.data;
                this.populateConversationsList();
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }

    populateConversationsList() {
        const conversationsList = document.getElementById('conversationsList');
        conversationsList.innerHTML = '';
        
        this.conversations.forEach(conversation => {
            const conversationItem = document.createElement('div');
            conversationItem.className = 'conversation-item';
            conversationItem.onclick = () => this.selectConversation(conversation, conversationItem);
            
            const displayName = this.getConversationDisplayName(conversation);
            const lastMessage = conversation.lastMessage ? 
                conversation.lastMessage.content.substring(0, 30) + '...' : 
                'No messages yet';
            
            conversationItem.innerHTML = `
                <div class="conversation-info">
                    <div class="user-avatar">${displayName.charAt(0).toUpperCase()}</div>
                    <div class="conversation-details">
                        <h4>${displayName}</h4>
                        <p>${lastMessage}</p>
                    </div>
                </div>
                ${conversation.unreadCount > 0 ? `<div class="unread-badge">${conversation.unreadCount}</div>` : ''}
            `;
            
            conversationsList.appendChild(conversationItem);
        });
    }

    getConversationDisplayName(conversation) {
        if (conversation.name) {
            return conversation.name;
        }
        
        if (conversation.type === 'direct') {
            const otherParticipant = conversation.participants.find(p => p !== this.currentUser.id);
            const user = this.users.find(u => u.id === otherParticipant);
            return user ? user.displayName : 'Unknown User';
        }
        
        return 'Group Chat';
    }

    async selectConversation(conversation, element) {
        // Remove previous selection
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Select current conversation
        element.classList.add('active');
        this.currentConversation = conversation;
        
        // Update chat header
        this.updateChatHeader();
        
        // Show message input
        document.getElementById('messageInputContainer').style.display = 'block';
        
        // Join conversation room
        if (this.socket) {
            this.socket.emit('join-conversation', conversation.id);
        }
        
        // Load messages
        await this.loadMessages();
        
        // Focus message input
        document.getElementById('messageInput').focus();
    }

    updateChatHeader() {
        const displayName = this.getConversationDisplayName(this.currentConversation);
        const participantCount = this.currentConversation.participants.length;
        
        document.getElementById('conversationName').textContent = displayName;
        document.getElementById('conversationMeta').textContent = 
            `${participantCount} participant${participantCount > 1 ? 's' : ''}`;
    }

    async loadMessages() {
        try {
            const response = await fetch(
                `http://localhost:3000/api/messages?conversationId=${this.currentConversation.id}`
            );
            const data = await response.json();
            
            if (data.success) {
                this.messages[this.currentConversation.id] = data.data;
                this.displayMessages();
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    async displayMessages() {
        const messagesList = document.getElementById('messagesList');
        messagesList.innerHTML = '';
        
        const messages = this.messages[this.currentConversation.id] || [];
        
        if (messages.length === 0) {
            messagesList.innerHTML = `
                <div class="welcome-message">
                    <h3>Start the conversation! 💬</h3>
                    <p>Send a message to get things started.</p>
                </div>
            `;
            return;
        }
        
        // Process messages sequentially to maintain order during decryption
        for (const message of messages) {
            await this.addMessageToUI(message);
        }
        
        // Scroll to bottom
        this.scrollToBottom();
    }

    async addMessageToUI(message) {
        const messagesList = document.getElementById('messagesList');
        const messageElement = document.createElement('div');
        
        const isOwnMessage = message.senderId === this.currentUser.id;
        const sender = this.users.find(u => u.id === message.senderId);
        const senderName = sender ? sender.displayName : 'Unknown User';
        
        messageElement.className = `message ${isOwnMessage ? 'own' : ''}`;
        
        if (message.messageType === 'system') {
            messageElement.className = 'message system';
            messageElement.textContent = message.content;
        } else {
            const timestamp = new Date(message.timestamp).toLocaleTimeString([], 
                { hour: '2-digit', minute: '2-digit' });
            
            // Decrypt the message content if it's encrypted
            let displayContent = message.content;
            try {
                displayContent = await this.decryptMessage(message);
            } catch (error) {
                console.error('Failed to decrypt message:', error);
                displayContent = '[❌ Decryption failed]';
            }
            
            // Add encryption indicator
            const encryptionIcon = message.isEncrypted ? '🔒' : '';
            
            messageElement.innerHTML = `
                <div class="user-avatar">${senderName.charAt(0).toUpperCase()}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${senderName}</span>
                        <span class="message-timestamp">${timestamp} ${encryptionIcon}</span>
                    </div>
                    <div class="message-text">${this.escapeHtml(displayContent)}</div>
                </div>
            `;
        }
        
        messagesList.appendChild(messageElement);
    }

    async handleIncomingMessage(message) {
        // Add to messages array
        if (!this.messages[message.conversationId]) {
            this.messages[message.conversationId] = [];
        }
        this.messages[message.conversationId].push(message);
        
        // If message is for current conversation, display it
        if (this.currentConversation && message.conversationId === this.currentConversation.id) {
            await this.addMessageToUI(message);
            this.scrollToBottom();
            
            // Mark as read if not own message
            if (message.senderId !== this.currentUser.id) {
                this.markMessageAsRead(message.id);
            }
        }
        
        // Update conversation list
        this.loadConversations();
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content || !this.currentConversation) return;
        
        try {
            // Encrypt the message before sending
            const encryptedMessage = await this.encryptMessage(content, this.currentConversation.id);
            
            // Send via WebSocket for real-time delivery
            if (this.socket) {
                const messageData = {
                    conversationId: this.currentConversation.id,
                    content: encryptedMessage.content,
                    messageType: 'text'
                };

                // Add encrypted fields if encryption was successful
                if (encryptedMessage.isEncrypted) {
                    messageData.encryptedContent = encryptedMessage.encryptedContent;
                    messageData.encryptionIV = encryptedMessage.encryptionIV;
                }

                this.socket.emit('send-message', messageData);
                console.log(`📤 Sent ${encryptedMessage.isEncrypted ? 'encrypted' : 'plain'} message`);
            }
            
            messageInput.value = '';
            this.stopTyping();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    handleMessageKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
            return;
        }
        
        this.handleTyping();
    }

    handleTyping() {
        if (!this.currentConversation || !this.socket) return;
        
        if (!this.isTyping) {
            this.isTyping = true;
            this.socket.emit('typing-start', this.currentConversation.id);
        }
        
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 2000);
    }

    stopTyping() {
        if (this.isTyping && this.socket && this.currentConversation) {
            this.isTyping = false;
            this.socket.emit('typing-stop', this.currentConversation.id);
        }
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
    }

    showTypingIndicator(text) {
        document.getElementById('typingIndicator').textContent = text;
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').textContent = '';
    }

    async markMessageAsRead(messageId) {
        try {
            await fetch(`http://localhost:3000/api/messages/${messageId}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentUser.id
                })
            });
        } catch (error) {
            console.error('Failed to mark message as read:', error);
        }
    }

    addSystemMessage(text) {
        if (this.currentConversation) {
            const systemMessage = {
                id: Date.now().toString(),
                conversationId: this.currentConversation.id,
                content: text,
                messageType: 'system',
                timestamp: new Date()
            };
            
            this.addMessageToUI(systemMessage);
            this.scrollToBottom();
        }
    }

    scrollToBottom() {
        const messagesList = document.getElementById('messagesList');
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    async loadOnlineUsers() {
        try {
            const response = await fetch('http://localhost:3000/api/users/status/online');
            const data = await response.json();
            
            if (data.success) {
                this.populateOnlineUsersList(data.data);
            }
        } catch (error) {
            console.error('Failed to load online users:', error);
        }
    }

    populateOnlineUsersList(onlineUsers) {
        const onlineUsersList = document.getElementById('onlineUsersList');
        onlineUsersList.innerHTML = '';
        
        onlineUsers.forEach(user => {
            if (user.id === this.currentUser.id) return; // Don't show current user
            
            const userItem = document.createElement('div');
            userItem.className = 'online-user-item';
            userItem.onclick = () => this.startDirectMessage(user);
            
            userItem.innerHTML = `
                <div class="user-avatar">${user.displayName.charAt(0).toUpperCase()}</div>
                <div class="username">${user.displayName}</div>
            `;
            
            onlineUsersList.appendChild(userItem);
        });
    }

    async startDirectMessage(user) {
        // Check if conversation already exists
        const existingConversation = this.conversations.find(conv => 
            conv.type === 'direct' && 
            conv.participants.includes(user.id) && 
            conv.participants.includes(this.currentUser.id)
        );
        
        if (existingConversation) {
            // Select existing conversation
            const conversationElement = document.querySelector(
                `.conversation-item:nth-child(${this.conversations.indexOf(existingConversation) + 1})`
            );
            if (conversationElement) {
                this.selectConversation(existingConversation, conversationElement);
            }
            return;
        }
        
        // Create new direct conversation
        try {
            const response = await fetch('http://localhost:3000/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'direct',
                    participants: [this.currentUser.id, user.id],
                    createdBy: this.currentUser.id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.loadConversations();
                
                // Select the new conversation
                const newConversation = this.conversations.find(conv => conv.id === data.data.id);
                if (newConversation) {
                    const conversationElements = document.querySelectorAll('.conversation-item');
                    const index = this.conversations.indexOf(newConversation);
                    if (conversationElements[index]) {
                        this.selectConversation(newConversation, conversationElements[index]);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to create direct message:', error);
        }
    }

    setupEventListeners() {
        // Message input enter key
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            this.handleMessageKeyPress(e);
        });
        
        // Message input typing
        document.getElementById('messageInput').addEventListener('input', () => {
            this.handleTyping();
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateUserOnlineStatus(userId, isOnline) {
        // Update user in users array
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.isOnline = isOnline;
        }
        
        // Refresh online users list
        this.loadOnlineUsers();
    }

    // Utility functions for UI interactions
    logout() {
        if (this.socket) {
            this.socket.disconnect();
        }
        
        location.reload();
    }

    toggleMute() {
        const muteIcon = document.getElementById('muteIcon');
        muteIcon.textContent = muteIcon.textContent === '🔊' ? '🔇' : '🔊';
    }

    showSettings() {
        alert('Settings coming soon!');
    }

    showCreateConversation() {
        this.populateUserSelectionList();
        document.getElementById('createConversationModal').style.display = 'flex';
    }

    hideCreateConversation() {
        document.getElementById('createConversationModal').style.display = 'none';
    }

    toggleConversationNameField() {
        const type = document.getElementById('conversationType').value;
        const nameGroup = document.getElementById('conversationNameGroup');
        nameGroup.style.display = type === 'group' ? 'block' : 'none';
    }

    populateUserSelectionList() {
        const userSelectionList = document.getElementById('userSelectionList');
        userSelectionList.innerHTML = '';
        
        this.users.filter(user => user.id !== this.currentUser.id).forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-selection-item';
            userItem.onclick = () => this.toggleUserSelection(user.id, userItem);
            
            userItem.innerHTML = `
                <input type="checkbox" id="user-${user.id}">
                <div class="user-avatar">${user.displayName.charAt(0).toUpperCase()}</div>
                <div class="user-details">
                    <h4>${user.displayName}</h4>
                    <p>@${user.username}</p>
                </div>
            `;
            
            userSelectionList.appendChild(userItem);
        });
    }

    toggleUserSelection(userId, element) {
        const checkbox = element.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        element.classList.toggle('selected', checkbox.checked);
    }

    async createConversation() {
        const type = document.getElementById('conversationType').value;
        const name = document.getElementById('conversationNameInput').value.trim();
        
        const selectedUsers = Array.from(document.querySelectorAll('#userSelectionList input:checked'))
            .map(checkbox => checkbox.id.replace('user-', ''));
        
        if (selectedUsers.length === 0) {
            alert('Please select at least one user');
            return;
        }
        
        if (type === 'group' && !name) {
            alert('Please enter a name for the group conversation');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type,
                    name: type === 'group' ? name : undefined,
                    participants: [...selectedUsers, this.currentUser.id],
                    createdBy: this.currentUser.id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.hideCreateConversation();
                await this.loadConversations();
                
                // Select the new conversation
                const newConversation = this.conversations.find(conv => conv.id === data.data.id);
                if (newConversation) {
                    const conversationElements = document.querySelectorAll('.conversation-item');
                    const index = this.conversations.indexOf(newConversation);
                    if (conversationElements[index]) {
                        this.selectConversation(newConversation, conversationElements[index]);
                    }
                }
            } else {
                alert('Failed to create conversation: ' + data.error);
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
            alert('Failed to create conversation');
        }
    }

    showConversationInfo() {
        if (!this.currentConversation) return;
        
        const participantNames = this.currentConversation.participants
            .map(id => {
                const user = this.users.find(u => u.id === id);
                return user ? user.displayName : 'Unknown User';
            })
            .join(', ');
        
        alert(`Conversation Info:\nType: ${this.currentConversation.type}\nParticipants: ${participantNames}`);
    }

    searchMessages() {
        const query = prompt('Search messages:');
        if (query) {
            alert('Search functionality coming soon!');
        }
    }

    attachFile() {
        alert('File attachment coming soon!');
    }

    showEmojiPicker() {
        alert('Emoji picker coming soon!');
    }
}

// Global functions for HTML onclick events
function selectUser(user, element) {
    window.app.selectUser(user, element);
}

function createUser() {
    window.app.createUser();
}

function sendMessage() {
    window.app.sendMessage();
}

function handleMessageKeyPress(event) {
    window.app.handleMessageKeyPress(event);
}

function handleTyping() {
    window.app.handleTyping();
}

function logout() {
    window.app.logout();
}

function toggleMute() {
    window.app.toggleMute();
}

function showSettings() {
    window.app.showSettings();
}

function showCreateConversation() {
    window.app.showCreateConversation();
}

function hideCreateConversation() {
    window.app.hideCreateConversation();
}

function toggleConversationNameField() {
    window.app.toggleConversationNameField();
}

function createConversation() {
    window.app.createConversation();
}

function showConversationInfo() {
    window.app.showConversationInfo();
}

function searchMessages() {
    window.app.searchMessages();
}

function attachFile() {
    window.app.attachFile();
}

function showEmojiPicker() {
    window.app.showEmojiPicker();
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌊 Starting Driftway...');
    window.app = new DriftwayApp();
});