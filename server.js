require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const googleTTS = require('google-tts-api');

const app = express();
const http = require('http');
const { initializeWebSocketServer } = require('./websocket-server');

const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);
const HELIX_WORKSPACE = process.env.HELIX_WORKSPACE || path.join(__dirname, 'helix_workspace');
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const CF_VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';
const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`;
const CF_VISION_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_VISION_MODEL}`;
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const VALID_PLANS = new Set(['free', 'pro', 'proplus', 'ultra']);

if (!fs.existsSync(HELIX_WORKSPACE)) {
    fs.mkdirSync(HELIX_WORKSPACE, { recursive: true });
}

// ── User Registry ──────────────────────────────────────────────────
const USERS_FILE = path.join(__dirname, 'users.json');
let _usersRegistry = [];

function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            _usersRegistry = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        } else {
            _usersRegistry = [];
            saveUsers();
        }
    } catch (e) {
        console.error('[Registry] Failed to load users.json:', e.message);
        _usersRegistry = [];
    }
}

function saveUsers() {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(_usersRegistry, null, 2), 'utf8');
    } catch (e) {
        console.error('[Registry] Failed to save users.json:', e.message);
        throw e;
    }
}

function registerOrUpdateUser(email, name, picture = null) {
    const now = new Date().toISOString();
    const existing = _usersRegistry.find(u => u.email === email);
    if (!existing) {
        const newUser = { email, name, plan: 'free', signedUpAt: now, lastActiveAt: now, messageCount: 0, loginCount: 1, blocked: false, picture };
        _usersRegistry.push(newUser);
        saveUsers();
        return newUser;
    } else {
        existing.lastActiveAt = now;
        existing.loginCount = (existing.loginCount || 0) + 1;
        if (picture) existing.picture = picture;
        saveUsers();
        return existing;
    }
}

function checkBlocked(email) {
    if (!email) return false;
    const user = _usersRegistry.find(u => u.email === email);
    return user ? user.blocked === true : false;
}

function requireAdmin(req, res) {
    const secret = req.headers['x-admin-secret'] || '';
    if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
        res.status(401).json({ error: 'Unauthorized' });
        return false;
    }
    return true;
}

loadUsers();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Serve static files but explicitly exclude users.json (registry must not be publicly accessible)
app.use(express.static(__dirname, {
    index: false,
    setHeaders: (res, filePath) => {
        if (path.basename(filePath) === 'users.json') {
            res.status(403).end();
        }
    }
}));
app.use((req, res, next) => {
    if (req.path === '/users.json') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
});

// Serve frontend (Next.js handles this, but backend root can just say API running)
app.get('/', (req, res) => {
    res.send('HELIX Backend API is running');
});

// Expand literal \n sequences in env vars (dotenv doesn't do this automatically)
function expandEnvNewlines(str) {
    return str ? str.replace(/\\n/g, '\n') : str;
}

// Helper: call Cloudflare Workers AI
async function callCF(systemPrompt, messages, maxTokens = 2048) {
    const cfMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
    ];

    const response = await axios.post(CF_URL, {
        messages: cfMessages,
        max_tokens: maxTokens
    }, {
        headers: {
            'Authorization': `Bearer ${CF_API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.result.response;
}

// Helper: call Cloudflare Vision AI with image
async function callCFVision(systemPrompt, userText, imageBase64) {
    // Strip data URL prefix to get raw base64
    const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Array.from(Buffer.from(base64, 'base64'));

    const response = await axios.post(CF_VISION_URL, {
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText || 'What is in this image? Describe it.' }
        ],
        image: imageBytes,
        max_tokens: 1024
    }, {
        headers: {
            'Authorization': `Bearer ${CF_API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.result.response;
}

// --- MAIN CHAT ---
app.post('/api/chat', async (req, res) => {
    const { message, history, deepThink, images, groupChat, groupContext } = req.body;

    const webSearchKeywords = /\b(latest|breaking|news|weather|temperature|forecast|price|stock market|score|live score|trending|just happened|right now|this week|this month|2025|2026|who won|what happened|current|recent events|today|tonight|yesterday|this year|match|game|played|vs|versus|standings|results|update|release|launch|announced|dropped|happened|currently|live|ongoing|upcoming|schedule|fixture|transfer|signing|election|vote|winner|champion|title|record|streak)\b/i;
    // Detect if user is pasting content to process (summarize/rewrite/explain)
    // Indicators: message is long OR starts with summary/tldr/explain/key points prefix
    const summaryPrefixes = /^(summarize|summary|tldr|tl;dr|quick summary|give me the key|key points|explain this|what does this|what's the main|what is the main|rewrite|simplify|break down)/i;
    const isPastedContent = message.length > 300 || summaryPrefixes.test(message.trim());
    // Block web search for short casual/conversational messages (greetings, small talk)
    const isConversational = /^(hey|hi|hello|sup|yo|hiya|howdy|what'?s up|how are you|how r u|how do you do|good morning|good night|good evening|thanks|thank you|ok|okay|cool|nice|lol|haha|bye|goodbye|see you|cya)[!?.]*$/i.test(message.trim()) || message.trim().split(/\s+/).length <= 3 && !/\b(weather|news|score|price|stock|forecast|results|standings|election|match|game|vs|versus)\b/i.test(message);
    const needsWebSearch = webSearchKeywords.test(message) && !deepThink && message.length > 15 && !isPastedContent && !isConversational;

    // If images are attached, use LLaVA vision (no license agreement needed)
    if (images && images.length > 0) {
        try {
            const base64 = images[0].replace(/^data:image\/\w+;base64,/, '');
            const imageBytes = Array.from(Buffer.from(base64, 'base64'));

            const visionUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`;
            const visionRes = await axios.post(visionUrl, {
                image: imageBytes,
                prompt: message ? `${message}\n\nLook at this image and help the user with their request. Be helpful, specific and engaging. Use the image context to give useful advice or information.` : `Look at this image carefully. Understand what it shows and provide helpful, relevant information or assistance about it. Be specific and engaging, not just descriptive.`,
                max_tokens: 1024
            }, {
                headers: { 'Authorization': `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' }
            });

            const reply = visionRes.data.result?.description || visionRes.data.result?.response || 'I can see the image but could not analyze it.';
            res.json({ reply, webSearched: false, sources: [], locationQuery: null });
        } catch (error) {
            console.error('Vision Error:', error.response?.data || error.message);
            res.status(500).json({ error: 'Failed to analyze image' });
        }
        return;
    }

    // Location detection
    const locationKeywords = /\b(restaurant|hotel|place|location|where is|directions to|how to get to|address of|map of|near me|find|show me on map)\b/i;
    let locationQuery = null;
    if (locationKeywords.test(message)) {
        try {
            const extracted = await callCF(
                'Extract place names from messages. Reply with ONLY the place name, nothing else. If no specific place, reply "none".',
                [{ role: 'user', content: `Extract place name from: "${message}"` }],
                30
            );
            const clean = extracted.trim();
            if (clean && clean.toLowerCase() !== 'none' && clean.length < 100) locationQuery = clean;
        } catch(e) { /* ignore */ }
    }

    try {
        const chatHistory = history.map(msg => ({ role: msg.role, content: msg.content }));
        let sources = [];

        // Use the same system prompt for both normal and group chat
        const systemPrompt = expandEnvNewlines(process.env.SYSTEM_MESSAGE);

        // If web search needed, fetch real results first
        if (needsWebSearch) {
            try {
                const searchRes = await axios.get('https://api.duckduckgo.com/', {
                    params: { q: message, format: 'json', no_html: 1, skip_disambig: 1 }
                });
                const ddg = searchRes.data;
                if (ddg.RelatedTopics) {
                    ddg.RelatedTopics.slice(0, 5).forEach(t => {
                        if (t.FirstURL && t.Text) sources.push({ url: t.FirstURL, title: t.Text.substring(0, 80) });
                    });
                }
                let searchContext = '';
                if (ddg.AbstractText) searchContext += `Summary: ${ddg.AbstractText}\n\n`;
                if (ddg.Answer) searchContext += `Answer: ${ddg.Answer}\n\n`;
                sources.forEach(s => { searchContext += `- ${s.title} (${s.url})\n`; });

                const userMsgWithSearch = `User question: ${message}\n\nWeb search results:\n${searchContext || 'No results.'}\n\nAnswer using the search results.`;
                chatHistory.push({ role: 'user', content: userMsgWithSearch });
            } catch(e) {
                chatHistory.push({ role: 'user', content: message });
            }
        } else {
            const userMsg = deepThink
                ? `[DEEP THINK MODE]\nBefore answering, write your genuine internal reasoning inside <think>...</think> tags. Think naturally and honestly. Write at least 3-5 sentences of real thought.\n\nThen after </think>, give your actual response.\n\nUser message: ${message}`
                : message;
            chatHistory.push({ role: 'user', content: userMsg });
        }

        const reply = await callCF(systemPrompt, chatHistory, 2048);
        res.json({ reply, webSearched: needsWebSearch, sources, locationQuery });
    } catch (error) {
        console.error('CF Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
});

// --- TTS ---
app.post('/api/tts', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'No text provided' });
        const cleanText = text.replace(/[*#_`<>'"]/g, '').replace(/\[.*?\]\(.*?\)/g, '').substring(0, 2000);
        const audioUrl = googleTTS.getAudioUrl(cleanText, { lang: 'en-US', slow: false, host: 'https://translate.google.com' });
        const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        res.set('Content-Type', 'audio/mpeg');
        res.send(audioResponse.data);
    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({ error: 'TTS failed' });
    }
});

// --- CODE EXECUTION ---
app.post('/api/execute', (req, res) => {
    const { code, language } = req.body;
    const filename = `temp_${Date.now()}.${language === 'python' ? 'py' : 'js'}`;
    const filePath = path.join(HELIX_WORKSPACE, filename);
    fs.writeFileSync(filePath, code);
    const command = language === 'python' ? `python "${filePath}"` : language === 'javascript' ? `node "${filePath}"` : null;
    if (!command) return res.status(400).json({ error: 'Unsupported language' });
    exec(command, (error, stdout, stderr) => {
        try { fs.unlinkSync(filePath); } catch (e) {}
        if (error) return res.json({ success: false, output: stderr || error.message });
        res.json({ success: true, output: stdout });
    });
});

// --- WEB SEARCH ---
app.post('/api/search', async (req, res) => {
    const { message, history } = req.body;

    const baseSystemPrompt = expandEnvNewlines(process.env.SYSTEM_MESSAGE);

    // Detect URLs in the message
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = message.match(urlRegex) || [];

    // Detect casual/conversational messages — no search needed
    const isConversational = /^(hey|hi|hello|sup|yo|hiya|howdy|what'?s up|how are you|how r u|good morning|good night|good evening|thanks|thank you|ok|okay|cool|nice|lol|haha|bye|goodbye|see you|cya|what do you think|tell me about yourself|who are you)[!?.]*$/i.test(message.trim())
        || (message.trim().split(/\s+/).length <= 4 && !/\b(weather|news|score|price|stock|forecast|results|standings|election|match|game|vs|versus|latest|current|today|tonight|who|what|when|where|why|how)\b/i.test(message));

    // ── CASE 1: Casual chat — just reply normally, no search ──
    if (isConversational && urls.length === 0) {
        try {
            const chatHistory = [
                ...history.map(msg => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: message }
            ];
            const reply = await callCF(baseSystemPrompt, chatHistory, 2048);
            return res.json({ reply, sources: [], webSearched: false });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to get response' });
        }
    }

    // ── CASE 2: URL(s) provided — fetch page content ──
    if (urls.length > 0) {
        try {
            const sources = [];
            let urlContext = '';

            for (const url of urls.slice(0, 2)) { // max 2 URLs
                try {
                    const pageRes = await axios.get(url, {
                        timeout: 8000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HelixBot/1.0)' },
                        responseType: 'text'
                    });
                    // Strip HTML tags and collapse whitespace
                    const text = pageRes.data
                        .replace(/<script[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[\s\S]*?<\/style>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .substring(0, 4000);
                    urlContext += `\n\n--- Content from ${url} ---\n${text}`;
                    sources.push({ url, title: url });
                } catch (e) {
                    urlContext += `\n\n--- Could not fetch ${url} ---`;
                }
            }

            const userPrompt = message.replace(urlRegex, '').trim() || 'Summarize and explain this page.';
            const chatHistory = [
                ...history.map(msg => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: `User request: ${userPrompt}\n\nPage content:${urlContext}\n\nAnswer based on the page content above.` }
            ];
            const searchSystemPrompt = baseSystemPrompt + '\n\nIMPORTANT: The user has shared a URL. Use the fetched page content to answer their request accurately. Be specific and reference details from the page.';
            const reply = await callCF(searchSystemPrompt, chatHistory, 2048);
            return res.json({ reply, sources, webSearched: true });
        } catch (error) {
            console.error('URL fetch error:', error.message);
            return res.status(500).json({ error: 'Failed to fetch URL content' });
        }
    }

    // ── CASE 3: Regular search query ──
    try {
        // 1. DuckDuckGo search
        const searchRes = await axios.get('https://api.duckduckgo.com/', {
            params: { q: message, format: 'json', no_html: 1, skip_disambig: 1 }
        });
        const ddg = searchRes.data;

        const sources = [];
        if (ddg.RelatedTopics) {
            ddg.RelatedTopics.slice(0, 5).forEach(t => {
                if (t.FirstURL && t.Text) {
                    sources.push({ url: t.FirstURL, title: t.Text.substring(0, 80) });
                }
            });
        }

        let searchContext = '';
        if (ddg.AbstractText) searchContext += `Summary: ${ddg.AbstractText}\n\n`;
        if (ddg.Answer) searchContext += `Answer: ${ddg.Answer}\n\n`;
        sources.forEach(s => { searchContext += `- ${s.title} (${s.url})\n`; });

        // 2. Try to fetch the top result page for richer content
        if (sources.length > 0) {
            try {
                const topUrl = sources[0].url;
                const pageRes = await axios.get(topUrl, {
                    timeout: 6000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HelixBot/1.0)' },
                    responseType: 'text'
                });
                const pageText = pageRes.data
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 3000);
                if (pageText.length > 200) {
                    searchContext += `\n\nDetailed content from top result:\n${pageText}`;
                }
            } catch (e) { /* ignore page fetch failures */ }
        }

        // 3. Ask CF to answer using the search context
        const chatHistory = [
            ...history.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: `User question: ${message}\n\nWeb search results:\n${searchContext || 'No results found.'}\n\nAnswer the question using the search results above.` }
        ];
        const searchSystemPrompt = baseSystemPrompt + '\n\nIMPORTANT: Web search is active. Answer the user\'s question using the provided search results. Be informative and specific — do NOT give a generic or casual reply. Cite relevant details from the results.';
        const reply = await callCF(searchSystemPrompt, chatHistory, 2048);
        res.json({ reply, sources, webSearched: true });
    } catch (error) {
        console.error('Web Search Error:', error.response?.data || error.message);
        // Fallback to regular chat if search fails
        try {
            const chatHistory = [
                ...history.map(msg => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: message }
            ];
            const reply = await callCF(baseSystemPrompt, chatHistory, 2048);
            res.json({ reply, sources: [] });
        } catch (e) {
            res.status(500).json({ error: 'Failed to get web search response' });
        }
    }
});

// --- CHAT TITLE ---
app.post('/api/title', async (req, res) => {
    const { message, greetingOnly } = req.body;
    try {
        // For pure greeting exchanges, generate a warm casual title
        const prompt = greetingOnly
            ? 'Generate a short, specific title for a casual chat. Examples: "Catching Up", "Quick Chat", "Just Saying Hey", "Friendly Check-in". Max 3 words. No quotes. No punctuation at end.'
            : 'Generate a short, specific chat title based on the conversation. Use the actual topic — never use generic titles like "Casual Greeting", "Greeting Exchange", "New Chat", "New Conversation", "Brief Hello". Examples of GOOD titles: "ToS Rights Breakdown", "Football Match Results", "Python Debugging Help", "Sleep Science Facts", "Coffee Maker Switch". Max 5 words. No quotes. No punctuation at end.';

        const title = await callCF(
            prompt,
            [{ role: 'user', content: `Conversation:\n${message.substring(0, 400)}` }],
            25
        );
        res.json({ title: title.trim().replace(/^["']|["']$/g, '') });
    } catch (error) {
        console.error('Title gen error:', error.response?.data || error.message);
        res.json({ title: message.substring(0, 30) });
    }
});

// ── Force logout registry ──────────────────────────────────────────
const _forceLogoutSet = new Set();

app.post('/api/admin/force-logout', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    _forceLogoutSet.add(email);
    // Auto-clear after 5 minutes
    setTimeout(() => _forceLogoutSet.delete(email), 5 * 60 * 1000);
    res.json({ success: true });
});

// Clients poll this to check if they've been force-logged out
app.post('/api/auth/check-session', (req, res) => {
    const { email } = req.body;
    if (email && _forceLogoutSet.has(email)) {
        _forceLogoutSet.delete(email);
        return res.json({ forceLogout: true });
    }
    // Also check if blocked
    if (email && checkBlocked(email)) {
        return res.json({ forceLogout: true, reason: 'blocked' });
    }
    res.json({ forceLogout: false });
});

// Check if an email is blocked (called at login time)
app.post('/api/auth/check-blocked', (req, res) => {
    const { email } = req.body;
    if (!email) return res.json({ blocked: false });
    res.json({ blocked: checkBlocked(email) });
});

// ── Admin Routes ───────────────────────────────────────────────────
app.get('/api/admin/users', (req, res) => {
    if (!requireAdmin(req, res)) return;
    res.json({ users: _usersRegistry });
});

app.post('/api/admin/block', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { email } = req.body;
    const user = _usersRegistry.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.blocked = true;
    try { saveUsers(); } catch (e) { return res.status(500).json({ error: 'Failed to save' }); }
    res.json({ success: true, user });
});

app.post('/api/admin/unblock', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { email } = req.body;
    const user = _usersRegistry.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.blocked = false;
    try { saveUsers(); } catch (e) { return res.status(500).json({ error: 'Failed to save' }); }
    res.json({ success: true, user });
});

app.post('/api/admin/update-plan', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { email, plan } = req.body;
    if (!VALID_PLANS.has(plan)) return res.status(400).json({ error: 'Invalid plan' });
    const user = _usersRegistry.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.plan = plan;
    try { saveUsers(); } catch (e) { return res.status(500).json({ error: 'Failed to save' }); }
    res.json({ success: true, user });
});

app.post('/api/admin/register-user', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { email, name, picture } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const user = registerOrUpdateUser(email, name || email.split('@')[0], picture || null);
    res.json({ success: true, user });
});

app.post('/api/admin/delete-user', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { email } = req.body;
    const idx = _usersRegistry.findIndex(u => u.email === email);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    _usersRegistry.splice(idx, 1);
    try { saveUsers(); } catch (e) { return res.status(500).json({ error: 'Failed to save' }); }
    res.json({ success: true });
});

app.post('/api/admin/send-email', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { to, subject, body } = req.body;
    try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
        });
        await transporter.sendMail({
            from: `HELIX AI <${process.env.GMAIL_USER}>`,
            to, subject,
            html: body.includes('<') ? body : `<p style="font-family:sans-serif;color:#e0e0e0;background:#141414;padding:20px">${body.replace(/\n/g, '<br>')}</p>`
        });
        res.json({ success: true });
    } catch (e) {
        console.error('[Admin] send-email failed:', e.message);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Initialize WebSocket server
const io = initializeWebSocketServer(httpServer);

httpServer.listen(PORT, () => {
    console.log(`\n🚀 Helix Backend running at http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server initialized`);
    console.log(`📁 Files will be run in: ${HELIX_WORKSPACE}\n`);
});
