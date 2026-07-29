const express = require('express');
const twilio = require('twilio');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const API_KEY = process.env.TWILIO_API_KEY;
const API_SECRET = process.env.TWILIO_API_SECRET;
const TWIML_APP_SID = process.env.TWIML_APP_SID;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

// 1. Browser Access Token Endpoint
app.get('/api/token', (req, res) => {
    try {
        if (!ACCOUNT_SID || !API_KEY || !API_SECRET || !TWIML_APP_SID) {
            console.error("Missing Environment Variables on Server!");
            return res.status(500).json({ success: false, error: "Server config missing (Env variables)" });
        }

        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: TWIML_APP_SID,
            incomingAllow: true,
        });

        const token = new AccessToken(
            ACCOUNT_SID,
            API_KEY,
            API_SECRET,
            { identity: 'user_' + Math.floor(Math.random() * 1000) }
        );

        token.addGrant(voiceGrant);
        res.json({ success: true, token: token.toJwt() });
    } catch (err) {
        console.error("Token Generation Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Option B Matched Endpoint: /api/voice-webhook
app.post('/api/voice-webhook', (req, res) => {
    console.log("Webhook hit! Body:", req.body);
    const twiml = new twilio.twiml.VoiceResponse();
    const targetNumber = req.body.To;

    if (targetNumber) {
        const dial = twiml.dial({
            callerId: TWILIO_PHONE_NUMBER
        });
        dial.number(targetNumber);
    } else {
        twiml.say("Invalid target phone number.");
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

// 3. Bridge Mode Route
app.post('/api/bridge-call', async (req, res) => {
    const { yourActiveNumber, targetNumber } = req.body;
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

    try {
        const call = await client.calls.create({
            url: 'https://secret-call-production.up.railway.app/api/voice-webhook',
            to: yourActiveNumber,
            from: TWILIO_PHONE_NUMBER
        });
        res.json({ success: true, callSid: call.sid });
    } catch (err) {
        console.error("Bridge Call Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
