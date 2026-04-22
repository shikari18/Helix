const { v4: uuidv4 } = require('uuid');
const validator = require('validator');

/**
 * MessageHandler Service
 * Handles message validation, sanitization, and rate limiting
 */

class MessageHandler {
    constructor() {
        // Rate limiting: track message counts per participant
        this.rateLimits = new Map(); // participantId -> { count, resetTime }
        this.MAX_MESSAGES_PER_WINDOW = 10;
        this.RATE_LIMIT_WINDOW = 10 * 1000; // 10 seconds
        this.MAX_MESSAGE_LENGTH = 4000;
    }

    /**
     * Validate message content
     * @param {string} content - Message content
     * @returns {Object} { valid: boolean, error: string|null }
     */
    validateMessage(content) {
        // Check if empty or whitespace only
        if (!content || validator.isEmpty(content.trim())) {
            return { valid: false, error: 'Message cannot be empty' };
        }

        // Check length
        if (content.length > this.MAX_MESSAGE_LENGTH) {
            return { valid: false, error: `Message exceeds maximum length of ${this.MAX_MESSAGE_LENGTH} characters` };
        }

        return { valid: true, error: null };
    }

    /**
     * Sanitize message content to prevent XSS
     * @param {string} content - Message content
     * @returns {string} Sanitized content
     */
    sanitizeMessage(content) {
        // Escape HTML special characters
        let sanitized = validator.escape(content);
        
        // Remove any script tags (extra safety)
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        return sanitized;
    }

    /**
     * Check rate limit for participant
     * @param {string} participantId - Participant identifier
     * @returns {Object} { allowed: boolean, error: string|null }
     */
    checkRateLimit(participantId) {
        const now = Date.now();
        const limit = this.rateLimits.get(participantId);

        if (!limit || now > limit.resetTime) {
            // Reset or initialize rate limit
            this.rateLimits.set(participantId, {
                count: 1,
                resetTime: now + this.RATE_LIMIT_WINDOW
            });
            return { allowed: true, error: null };
        }

        if (limit.count >= this.MAX_MESSAGES_PER_WINDOW) {
            return { 
                allowed: false, 
                error: `Rate limit exceeded. Please wait ${Math.ceil((limit.resetTime - now) / 1000)} seconds.` 
            };
        }

        // Increment count
        limit.count++;
        return { allowed: true, error: null };
    }

    /**
     * Process and validate message before broadcasting
     * @param {Object} message - Raw message object
     * @param {string} participantId - Sender's participant ID
     * @returns {Object} { success: boolean, message: Object|null, error: string|null }
     */
    processMessage(message, participantId) {
        // Validate content
        const validation = this.validateMessage(message.content);
        if (!validation.valid) {
            return { success: false, message: null, error: validation.error };
        }

        // Check rate limit
        const rateCheck = this.checkRateLimit(participantId);
        if (!rateCheck.allowed) {
            return { success: false, message: null, error: rateCheck.error };
        }

        // Sanitize content
        const sanitizedContent = this.sanitizeMessage(message.content);

        // Create processed message
        const processedMessage = {
            id: message.id || uuidv4(),
            roomId: message.roomId,
            senderId: message.senderId,
            senderName: validator.escape(message.senderName || 'Anonymous'),
            senderAvatar: message.senderAvatar || '',
            content: sanitizedContent,
            images: message.images || [],
            timestamp: Date.now(),
            isHelixResponse: message.isHelixResponse || false
        };

        return { success: true, message: processedMessage, error: null };
    }

    /**
     * Clean up old rate limit entries (call periodically)
     */
    cleanupRateLimits() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [participantId, limit] of this.rateLimits.entries()) {
            if (now > limit.resetTime + (60 * 1000)) { // Clean up entries older than 1 minute past reset
                this.rateLimits.delete(participantId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`[MessageHandler] Cleaned up ${cleanedCount} old rate limit entries`);
        }

        return cleanedCount;
    }

    /**
     * Detect if message mentions Helix AI
     * @param {string} content - Message content
     * @returns {boolean} True if Helix is mentioned
     */
    detectHelixMention(content) {
        if (!content) return false;
        
        const lowerContent = content.toLowerCase();
        
        // Check for "helix" or "@helix" patterns
        return /\bhelix\b|@helix/i.test(content);
    }

    async forwardToHelix(message, roomHistory, participantCount, participantNames = []) {
        const axios = require('axios');

        try {
            const history = roomHistory.slice(-10).map(msg => ({
                role: msg.isHelixResponse ? 'assistant' : 'user',
                content: `${msg.senderName}: ${msg.content}`
            }));

            const onlineNames = participantNames.filter(Boolean);

            const response = await axios.post('http://localhost:8000/api/chat', {
                message: message.content,
                history: history,
                images: message.images && message.images.length > 0 ? message.images : undefined,
                groupChat: true,
                participantNames: onlineNames,
                participantCount: onlineNames.length,
            });

            return response.data.reply;
        } catch (error) {
            console.error('[MessageHandler] Helix API error:', error.message);
            throw new Error('Helix is temporarily unavailable. Try again in a moment.');
        }
    }
}

// Export singleton instance
const messageHandler = new MessageHandler();

// Schedule periodic cleanup of rate limits (every 5 minutes)
setInterval(() => {
    messageHandler.cleanupRateLimits();
}, 5 * 60 * 1000);

module.exports = messageHandler;
