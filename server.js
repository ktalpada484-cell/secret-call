const express = require('express');
const twilio = require('twilio');
const path = require('path');

const app = express();
app.use(express.json());

// Public folder ki static files serve karne ke liye
app.use(express.static(path.join(__dirname, 'public')));

// Railway Variables se keys pick karega
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const virtualSecretNumber = process.env.TWILIO_PHONE_NUMBER;

let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

// Main Page Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Real Phone Anonymous Call Trigger Route
app.post('/api/make-secret-call', async (req, res) => {
    const { targetNumber } = req.body;

    if (!client) {
        return res.status(500).json({ 
            success: false, 
            error: "Railway me Twilio Environment Variables set nahi hain!" 
        });
    }

    try {
        const call = await client.calls.create({
            twiml: '<Response><Say>Connecting your private encrypted secret call.</Say></Response>',
            to: targetNumber,           // Receiver Ka Mobile (+91...)
            from: virtualSecretNumber  // Twilio Anonymous Virtual Number (Aapka identity hide karega)
        });

        res.json({ success: true, message: "Secret Call Dispatched!", callSid: call.sid });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Secret Call Gateway running on port ${PORT}`);
});
