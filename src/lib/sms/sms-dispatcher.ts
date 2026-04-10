// src/lib/sms/sms-dispatcher.ts
// ─────────────────────────────────────────────────────────────────────────────
// SMS Dispatcher — Provider-agnostic stub
//
// To add a provider later, implement the sendViaTwilio / sendViaMsegat / etc.
// function and call it from dispatchSms().
//
// Supported providers (set SMS_PROVIDER env var):
//   "twilio"  → uses TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
//   "msegat"  → uses MSEGAT_API_KEY, MSEGAT_USERNAME, MSEGAT_SENDER_ID  (popular in Oman/KSA)
//   "unifonic" → uses UNIFONIC_APP_SID, UNIFONIC_SENDER_ID
//   "log"     → just logs to console (development default)
// ─────────────────────────────────────────────────────────────────────────────

export type SmsResult =
  | { success: true; messageId?: string }
  | { success: false; error: string };

export async function dispatchSms({
  to,
  message,
}: {
  to: string;         // E.164 format recommended: +96891234567
  message: string;
}): Promise<SmsResult> {
  const provider = process.env.SMS_PROVIDER ?? "log";

  switch (provider) {
    case "twilio":
      return sendViaTwilio({ to, message });

    case "msegat":
      return sendViaMsegat({ to, message });

    case "unifonic":
      return sendViaUnifonic({ to, message });

    case "log":
    default:
      // Development fallback — just log it
      console.log(`[SMS:log] To: ${to} | Message: ${message}`);
      return { success: true, messageId: `log-${Date.now()}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Twilio
// ─────────────────────────────────────────────────────────────────────────────
async function sendViaTwilio({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<SmsResult> {
  // Uncomment and install: npm install twilio
  // import twilio from "twilio";
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  // const result = await client.messages.create({
  //   from: process.env.TWILIO_FROM_NUMBER!,
  //   to,
  //   body: message,
  // });
  // return { success: true, messageId: result.sid };

  console.warn("[SMS:twilio] Twilio not configured yet. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.");
  return { success: false, error: "Twilio not configured" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Msegat (popular in Oman / Saudi Arabia)
// https://www.msegat.com/
// ─────────────────────────────────────────────────────────────────────────────
async function sendViaMsegat({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<SmsResult> {
  // Uncomment when ready:
  // const payload = {
  //   userName: process.env.MSEGAT_USERNAME!,
  //   apiKey:   process.env.MSEGAT_API_KEY!,
  //   userSender: process.env.MSEGAT_SENDER_ID!,
  //   numbers:  to,
  //   msg:      message,
  //   msgEncoding: "UTF8",
  // };
  // const res = await fetch("https://www.msegat.com/gw/sendsms.php", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });
  // const text = await res.text();
  // if (text === "1") return { success: true };
  // return { success: false, error: `Msegat error: ${text}` };

  console.warn("[SMS:msegat] Msegat not configured yet. Set MSEGAT_API_KEY, MSEGAT_USERNAME, MSEGAT_SENDER_ID.");
  return { success: false, error: "Msegat not configured" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Unifonic
// https://unifonic.com/
// ─────────────────────────────────────────────────────────────────────────────
async function sendViaUnifonic({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<SmsResult> {
  // Uncomment when ready:
  // const res = await fetch("https://el.cloud.unifonic.com/rest/SMS/messages", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/x-www-form-urlencoded",
  //     Authorization: `Bearer ${process.env.UNIFONIC_APP_SID}`,
  //   },
  //   body: new URLSearchParams({
  //     AppSid:     process.env.UNIFONIC_APP_SID!,
  //     SenderID:   process.env.UNIFONIC_SENDER_ID!,
  //     Body:       message,
  //     Recipient:  to,
  //   }),
  // });
  // const data = await res.json();
  // if (data.Success) return { success: true, messageId: data.data?.MessageID };
  // return { success: false, error: data.Message ?? "Unifonic error" };

  console.warn("[SMS:unifonic] Unifonic not configured yet. Set UNIFONIC_APP_SID, UNIFONIC_SENDER_ID.");
  return { success: false, error: "Unifonic not configured" };
}