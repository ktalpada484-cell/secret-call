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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- OPTION 1: Bridge Call Route ---
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

// --- OPTION 2: Direct Browser Trigger Route ---
app.post('/api/browser-call', async (req, res) => {
    const { targetNumber } = req.body;

    if (!accountSid || !authToken || !virtualSecretNumber) {
        return res.status(500).json({ success: false, error: "Twilio Environment Variables missing!" });
    }

    try {
        const client = twilio(accountSid, authToken);
        const call = await client.calls.create({
            twiml: `<Response><Dial callerId="${virtualSecretNumber}">${targetNumber}</Dial></Response>`,
            to: targetNumber,
            from: virtualSecretNumber
        });

        res.json({ success: true, message: "Browser Direct Call Triggered!", callSid: call.sid });
    } catch (error) {
        console.error("Browser Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
