const express = require('express');
const twilio = require('twilio');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const virtualSecretNumber = process.env.TWILIO_PHONE_NUMBER;
const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Bridge Call Route
app.post('/api/bridge-call', async (req, res) => {
    const { yourActiveNumber, targetNumber } = req.body;

    if (!accountSid || !authToken || !virtualSecretNumber) {
        return res.status(500).json({ success: false, error: "Environment variables missing!" });
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

// WebRTC Access Token Route
app.get('/api/token', (req, res) => {
    if (!accountSid || !authToken || !twimlAppSid) {
        return res.status(500).json({ 
            success: false, 
            error: "Twilio credentials (ACCOUNT_SID, AUTH_TOKEN, or TWIML_APP_SID) missing in Railway Environment Variables!" 
        });
    }

    try {
        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;

        const identity = 'user_' + Math.floor(Math.random() * 10000);

        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: twimlAppSid,
            incomingAllow: true
        });

        const token = new AccessToken(accountSid, accountSid, authToken, { identity: identity });
        token.addGrant(voiceGrant);

        res.json({ success: true, token: token.toJwt() });
    } catch (error) {
        console.error("Token Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// TwiML Voice Webhook
app.post('/api/voice-webhook', (req, res) => {
    const targetNumber = req.body.To;
    const twiml = new twilio.twiml.VoiceResponse();

    if (targetNumber) {
        const dial = twiml.dial({ callerId: virtualSecretNumber });
        dial.number(targetNumber);
    } else {
        twiml.say('No target number provided.');
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
