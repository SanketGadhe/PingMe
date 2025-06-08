import { Buffer } from 'buffer'; // Required in React Native

export const triggerTwilioCall = async ({ to, from, message, sid, token }) => {
    try {
        console.log("Request made", { to, from, message, sid, token })
        const twiml = `<Response><Say>${message}</Say></Response>`;

        const formBody = `To=${encodeURIComponent(to)}&From=${encodeURIComponent(from)}&Twiml=${encodeURIComponent(twiml)}`;

        const base64Credentials = Buffer.from(`${sid}:${token}`).toString('base64');

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody,
        });

        const result = await response.json();
        console.log("Result Success", result);

        if (result.error_message) {
            throw new Error(result.error_message);
        }
    } catch (err) {
    }
}; export const sendSMSviaTwilio = async ({ to, message, sid, token, from }) => {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

    const formBody = new URLSearchParams({
        To: to,
        From: from,
        Body: message,
    }).toString();

    // 🔐 Use `btoa()` instead of Buffer for base64
    const base64Credentials = btoa(`${sid}:${token}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${base64Credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
    });

    const result = await response.json();

    console.log('Result of message', { to, from, sid }, result);

    if (response.ok) {
        console.log('✅ SMS sent via Twilio:', result.sid);
        return true;
    } else {
        console.warn('❌ SMS failed:', result);
        throw new Error(result.message || 'Twilio SMS failed');
    }
};
