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

// Real Two-Way Secret Bridge Call API
app.post('/api/make-secret-call', async (req, res) => {
    const { myNumber, targetNumber } = req.body;

    if (!accountSid || !authToken || !virtualSecretNumber) {
        return res.status(500).json({ 
            success: false, 
            error: "Railway me Twilio Environment Variables missing hain!" 
        });
    }

    try {
        const client = twilio(accountSid, authToken);

        // 1. Pehle aapke phone (myNumber) par call aayegi.
        // 2. Jaise hi aap uthayenge, Twilio targetNumber ko dial karke 2-way conversation start kar dega.
        const call = await client.calls.create({
            twiml: `<Response><Dial callerId="${virtualSecretNumber}">${targetNumber}</Dial></Response>`,
            to: myNumber,               // Aapka mobile number
            from: virtualSecretNumber   // Aapka +1 Virtual Number
        });

        res.json({ success: true, message: "Bridge Call Initiated!", callSid: call.sid });
    } catch (error) {
        console.error("Twilio API Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Secret Call Gateway running on port ${PORT}`);
});
