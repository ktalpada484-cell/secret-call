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

// Root Route - Serves index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- OPTION 1: Bridge Method (Call active phone first, then target) ---
app.post('/api/bridge-call', async (req, res) => {
    const { yourActiveNumber, targetNumber } = req.body;

    if (!accountSid || !authToken || !virtualSecretNumber) {
        return res.status(500).json({ 
            success: false, 
            error: "Railway me TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ya TWILIO_PHONE_NUMBER missing hain!" 
        });
    }

    try {
        const client = twilio(accountSid, authToken);

        // Pehle active number par call aayegi, uthane par target connect hoga
        const call = await client.calls.create({
            twiml: `<Response><Say>Connecting your secret call.</Say><Dial callerId="${virtualSecretNumber}">${targetNumber}</Dial></Response>`,
            to: yourActiveNumber,
            from: virtualSecretNumber
        });

        res.json({ success: true, message: "Bridge Call Initiated!", callSid: call.sid });
    } catch (error) {
        console.error("Bridge Call Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- OPTION 2: Direct Browser / Direct Trigger Method ---
app.post('/api/browser-call', async (req, res) => {
    const { targetNumber } = req.body;

    if (!accountSid || !authToken || !virtualSecretNumber) {
        return res.status(500).json({ 
            success: false, 
            error: "Railway me TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ya TWILIO_PHONE_NUMBER missing hain!" 
        });
    }

    try {
        const client = twilio(accountSid, authToken);

        // Direct call to target number using Virtual Number as Caller ID
        const call = await client.calls.create({
            twiml: `<Response><Dial callerId="${virtualSecretNumber}">${targetNumber}</Dial></Response>`,
            to: targetNumber,
            from: virtualSecretNumber
        });

        res.json({ success: true, message: "Direct Call Active!", callSid: call.sid });
    } catch (error) {
        console.error("Browser Call Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
