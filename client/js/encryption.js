/**
 * End-to-End Encryption Utilities for Driftway
 * Uses Web Crypto API with AES-GCM encryption
 */

class DriftwayEncryption {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12; // 96 bits for GCM
        this.saltLength = 16; // 128 bits
        this.tagLength = 16; // 128 bits
    }

    /**
     * Generate a random encryption key for a conversation
     * @returns {Promise<CryptoKey>} The generated AES-GCM key
     */
    async generateConversationKey() {
        return await crypto.subtle.generateKey(
            {
                name: this.algorithm,
                length: this.keyLength
            },
            true, // extractable
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Export a CryptoKey to a base64 string for storage/transmission
     * @param {CryptoKey} key - The key to export
     * @returns {Promise<string>} Base64 encoded key
     */
    async exportKey(key) {
        const exported = await crypto.subtle.exportKey('raw', key);
        return this.arrayBufferToBase64(exported);
    }

    /**
     * Import a base64 key string back to a CryptoKey
     * @param {string} keyData - Base64 encoded key
     * @returns {Promise<CryptoKey>} The imported key
     */
    async importKey(keyData) {
        const keyBuffer = this.base64ToArrayBuffer(keyData);
        return await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            {
                name: this.algorithm,
                length: this.keyLength
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Derive a key from a password using PBKDF2
     * @param {string} password - The password to derive from
     * @param {Uint8Array} salt - The salt for key derivation
     * @returns {Promise<CryptoKey>} The derived key
     */
    async deriveKeyFromPassword(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        // Import password as a key
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey']
        );

        // Derive the actual encryption key
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            {
                name: this.algorithm,
                length: this.keyLength
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypt a message with the given key
     * @param {string} message - The plaintext message
     * @param {CryptoKey} key - The encryption key
     * @returns {Promise<Object>} Encrypted data with IV and ciphertext
     */
    async encryptMessage(message, key) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);

        // Generate a random IV
        const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));

        // Encrypt the message
        const ciphertext = await crypto.subtle.encrypt(
            {
                name: this.algorithm,
                iv: iv
            },
            key,
            data
        );

        return {
            iv: this.arrayBufferToBase64(iv),
            ciphertext: this.arrayBufferToBase64(ciphertext),
            algorithm: this.algorithm
        };
    }

    /**
     * Decrypt a message with the given key
     * @param {Object} encryptedData - Object with iv and ciphertext
     * @param {CryptoKey} key - The decryption key
     * @returns {Promise<string>} The decrypted plaintext message
     */
    async decryptMessage(encryptedData, key) {
        const iv = this.base64ToArrayBuffer(encryptedData.iv);
        const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);

        try {
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                ciphertext
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt message');
        }
    }

    /**
     * Generate a random salt for key derivation
     * @returns {Uint8Array} Random salt
     */
    generateSalt() {
        return crypto.getRandomValues(new Uint8Array(this.saltLength));
    }

    /**
     * Convert ArrayBuffer to base64 string
     * @param {ArrayBuffer} buffer - The buffer to convert
     * @returns {string} Base64 string
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert base64 string to ArrayBuffer
     * @param {string} base64 - The base64 string
     * @returns {ArrayBuffer} The converted buffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Generate a shareable key bundle for conversation participants
     * @param {CryptoKey} conversationKey - The conversation key to bundle
     * @returns {Promise<string>} Base64 encoded key bundle
     */
    async generateKeyBundle(conversationKey) {
        const keyData = await this.exportKey(conversationKey);
        const bundle = {
            key: keyData,
            algorithm: this.algorithm,
            created: Date.now()
        };
        
        // Encode the bundle as base64 JSON
        const bundleJson = JSON.stringify(bundle);
        return btoa(bundleJson);
    }

    /**
     * Parse a key bundle and import the conversation key
     * @param {string} keyBundle - Base64 encoded key bundle
     * @returns {Promise<CryptoKey>} The imported conversation key
     */
    async parseKeyBundle(keyBundle) {
        try {
            const bundleJson = atob(keyBundle);
            const bundle = JSON.parse(bundleJson);
            
            if (bundle.algorithm !== this.algorithm) {
                throw new Error('Unsupported encryption algorithm');
            }
            
            return await this.importKey(bundle.key);
        } catch (error) {
            console.error('Failed to parse key bundle:', error);
            throw new Error('Invalid key bundle');
        }
    }

    /**
     * Create a secure hash of a string (for key verification)
     * @param {string} input - The input string
     * @returns {Promise<string>} Hex-encoded hash
     */
    async createHash(input) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

// Export the encryption class
window.DriftwayEncryption = DriftwayEncryption;

// Create a global instance
window.driftwayEncryption = new DriftwayEncryption();

console.log('✅ Driftway Encryption utilities loaded');