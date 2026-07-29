const express = require('express');
const twilio = require('twilio');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Railway Environment Variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const virtualSecretNumber = process.env.TWILIO_PHONE_NUMBER;
const twimlAppSid = process.env.TWILIO_TWIML_APP_SID; // TwiML App Sid zaroori hai Browser calling ke liye

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- OPTION 1: Bridge Call Route (Phone-to-Phone) ---
app.post('/api/bridge-call', async (req, res) => {
    const { yourActiveNumber, targetNumber } = req.body;

    if (!accountSid || !authToken || !virtualSecretNumber) {
        return res.status(500).json({ success: false, error: "Twilio Environment Variables missing!" });
    }

    try {
        const client = twilio(accountSid, authToken);
        const call = await client.calls.create({
            twiml: `<Response><Say>Connecting your secret call.</Say><Dial callerId="${virtualSecretNumber}">${targetNumber}</Dial></Response>`,
            to: yourActiveNumber,
            from: virtualSecretNumber
        });

        res.json({ success: true, message: "Bridge Call Dispatched!", callSid: call.sid });
    } catch (error) {
        console.error("Bridge Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- OPTION 2: Browser Voice Token Route (For Real-time WebRTC 2-Way Audio) ---
app.get('/api/token', (req, res) => {
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    if (!accountSid || !authToken || !twimlAppSid) {
        return res.status(500).json({ success: false, error: "Twilio API Key or TwiML App SID missing in Environment Variables!" });
    }

    try {
        // Unique identity for browser user
        const identity = 'BrowserUser_' + Math.floor(Math.random() * 1000);

        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: twimlAppSid,
            incomingAllow: true
        });

        const token = new AccessToken(accountSid, process.env.TWILIO_API_KEY || authToken, process.env.TWILIO_API_SECRET || authToken, { identity: identity });
        token.addGrant(voiceGrant);

        res.json({ success: true, token: token.toJwt() });
    } catch (error) {
        console.error("Token Generation Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// TwiML Voice Webhook (Called by Twilio when browser initiates voice call)
app.post('/api/voice-webhook', (req, res) => {
    const targetNumber = req.body.To;
    const twiml = new twilio.twiml.VoiceResponse();
    
    const dial = twiml.dial({ callerId: virtualSecretNumber });
    dial.number(targetNumber);

    res.type('text/xml');
    res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
