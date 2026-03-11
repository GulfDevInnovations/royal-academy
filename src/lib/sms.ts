// src/lib/sms.ts
// ─────────────────────────────────────────────────────────────────────────────
// SMS utility — scaffolded, provider-agnostic.
//
// TO PLUG IN A PROVIDER:
//   Twilio:    npm install twilio
//              set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env
//   Unifonic:  npm install axios (already likely installed)
//              set UNIFONIC_APP_SID, UNIFONIC_SENDER_ID in .env
//
// Just replace the body of `sendSms` below with your provider's SDK call.
// Everything that calls sendSms stays exactly the same.
// ─────────────────────────────────────────────────────────────────────────────

export interface SmsPayload {
  to: string;   // E.164 format e.g. "+96891234567"
  body: string;
}

export async function sendSms(payload: SmsPayload): Promise<{ success: boolean; error?: string }> {
  const { to, body } = payload;

  if (!to) return { success: false, error: "No phone number provided." };

  // ── Uncomment and fill in when you add a provider ──────────────────────────

  // ── Twilio ──
  // import twilio from "twilio";
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  // await client.messages.create({ body, from: process.env.TWILIO_FROM_NUMBER!, to });
  // return { success: true };

  // ── Unifonic ──
  // const response = await fetch("https://el.cloud.unifonic.com/rest/SMS/messages", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     AppSid:      process.env.UNIFONIC_APP_SID,
  //     SenderID:    process.env.UNIFONIC_SENDER_ID,
  //     Body:        body,
  //     Recipient:   to,
  //   }),
  // });
  // if (!response.ok) return { success: false, error: "Unifonic error" };
  // return { success: true };

  // ── SCAFFOLD: log only until a provider is wired ───────────────────────────
  console.log(`[SMS scaffold] To: ${to} | Body: ${body}`);
  return { success: true };
}