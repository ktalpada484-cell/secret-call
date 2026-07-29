const express = require('express');
const twilio = require('twilio');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Environment Variables
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const API_KEY = process.env.TWILIO_API_KEY;
const API_SECRET = process.env.TWILIO_API_SECRET;
const TWIML_APP_SID = process.env.TWIML_APP_SID;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

// 1. Browser Voice Call Access Token Endpoint
app.get('/api/token', (req, res) => {
    try {
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
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. CRITICAL: Twilio TwiML Voice Routing Webhook
// Yeh route Twilio ko batata hai ki target number par call kaise lagani hai
app.post('/voice', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    const targetNumber = req.body.To;

    if (targetNumber) {
        const dial = twiml.dial({
            callerId: TWILIO_PHONE_NUMBER // Direct Masked Caller ID
        });
        dial.number(targetNumber);
    } else {
        twiml.say("Invalid target phone number.");
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

// 3. Bridge Call Endpoint (Jisme SIM/Recharge ki zaroorat hoti hai)
app.post('/api/bridge-call', async (req, res) => {
    const { yourActiveNumber, targetNumber } = req.body;
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

    try {
        const call = await client.calls.create({
            url: `https://${req.headers.host}/voice`,
            to: yourActiveNumber,
            from: TWILIO_PHONE_NUMBER
        });
        res.json({ success: true, callSid: call.sid });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
