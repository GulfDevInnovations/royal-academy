// src/lib/emails/auto-notification-emails.ts
// Royal Academy — auto-notification HTML email templates

// ─────────────────────────────────────────────────────────────────────────────
// Shared style constants
// ─────────────────────────────────────────────────────────────────────────────
const GOLD = "#c9a84c";
const DARK = "#0f0f0f";
const CARD = "#1a1a1a";
const CREAM = "#e4d0b5";
const MUTED = "#888";

function baseWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Royal Academy</title>
</head>
<body style="margin:0;padding:0;background:${DARK};font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${DARK};padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 32px 0;text-align:center;">
              <div style="display:inline-block;border-bottom:1px solid ${GOLD};padding-bottom:16px;">
                <span style="font-size:22px;letter-spacing:4px;color:${GOLD};text-transform:uppercase;font-weight:400;">
                  Royal Academy
                </span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${CARD};border:1px solid #2a2a2a;border-radius:12px;padding:40px 48px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0 0;text-align:center;">
              <p style="color:${MUTED};font-size:12px;margin:0;line-height:1.8;">
                Royal Academy · Muscat, Oman<br/>
                You are receiving this because you are enrolled at Royal Academy.<br/>
                <a href="mailto:support@royalacademy.om" style="color:${GOLD};text-decoration:none;">
                  support@royalacademy.om
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Reminder Email  (24 hours before class)
// ─────────────────────────────────────────────────────────────────────────────
export function buildSessionReminderHtml({
  studentName,
  className,
  teacherName,
  sessionDate,   // e.g. "Monday, 14 April 2025"
  sessionTime,   // e.g. "10:00 – 11:00"
  location,      // optional
}: {
  studentName: string;
  className: string;
  teacherName: string;
  sessionDate: string;
  sessionTime: string;
  location?: string;
}): string {
  const content = `
    <!-- Icon -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="
        display:inline-block;
        width:60px;height:60px;
        border-radius:50%;
        background:rgba(201,168,76,0.1);
        border:1px solid rgba(201,168,76,0.3);
        line-height:60px;
        font-size:26px;
        text-align:center;
      ">🎵</div>
    </div>

    <!-- Greeting -->
    <h1 style="color:${CREAM};font-size:22px;font-weight:400;margin:0 0 8px 0;text-align:center;letter-spacing:1px;">
      Class Reminder
    </h1>
    <p style="color:${MUTED};font-size:13px;text-align:center;margin:0 0 32px 0;letter-spacing:2px;text-transform:uppercase;">
      24 hours to go
    </p>

    <p style="color:${CREAM};font-size:15px;margin:0 0 24px 0;line-height:1.7;">
      Dear <strong style="color:${GOLD};">${studentName}</strong>,
    </p>
    <p style="color:${CREAM};opacity:0.8;font-size:14px;margin:0 0 28px 0;line-height:1.8;">
      This is a friendly reminder that you have a class scheduled tomorrow. 
      We look forward to seeing you!
    </p>

    <!-- Session details card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="
      background:rgba(201,168,76,0.05);
      border:1px solid rgba(201,168,76,0.2);
      border-radius:8px;
      margin-bottom:28px;
    ">
      <tr>
        <td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:2px;">Class</span><br/>
                <span style="color:${CREAM};font-size:15px;font-weight:500;">${className}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:2px;">Teacher</span><br/>
                <span style="color:${CREAM};font-size:15px;">${teacherName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:2px;">Date</span><br/>
                <span style="color:${GOLD};font-size:15px;font-weight:500;">${sessionDate}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0${location ? ";border-bottom:1px solid rgba(255,255,255,0.05)" : ""};">
                <span style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:2px;">Time</span><br/>
                <span style="color:${CREAM};font-size:15px;">${sessionTime}</span>
              </td>
            </tr>
            ${location ? `
            <tr>
              <td style="padding:10px 0 0 0;">
                <span style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:2px;">Location</span><br/>
                <span style="color:${CREAM};font-size:15px;">${location}</span>
              </td>
            </tr>` : ""}
          </table>
        </td>
      </tr>
    </table>

    <p style="color:${CREAM};opacity:0.6;font-size:13px;margin:0;line-height:1.7;text-align:center;">
      If you need to reschedule, please do so at least 24 hours before your session 
      through your <a href="https://royalacademy.om/en/my-classes" style="color:${GOLD};text-decoration:none;">My Classes</a> page.
    </p>
  `;
  return baseWrapper(content);
}

// ─────────────────────────────────────────────────────────────────────────────
// Birthday Email
// ─────────────────────────────────────────────────────────────────────────────
export function buildBirthdayHtml({
  studentName,
}: {
  studentName: string;
}): string {
  const content = `
    <!-- Decorative top -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:40px;margin-bottom:8px;">🎂</div>
      <div style="
        display:inline-block;
        padding:4px 20px;
        border:1px solid ${GOLD};
        border-radius:100px;
        color:${GOLD};
        font-size:11px;
        letter-spacing:3px;
        text-transform:uppercase;
      ">Happy Birthday</div>
    </div>

    <h1 style="
      color:${CREAM};
      font-size:26px;
      font-weight:400;
      margin:0 0 24px 0;
      text-align:center;
      letter-spacing:2px;
    ">
      ${studentName}
    </h1>

    <!-- Gold divider -->
    <div style="text-align:center;margin-bottom:28px;">
      <span style="display:inline-block;width:60px;height:1px;background:${GOLD};opacity:0.4;"></span>
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${GOLD};margin:0 8px;vertical-align:middle;"></span>
      <span style="display:inline-block;width:60px;height:1px;background:${GOLD};opacity:0.4;"></span>
    </div>

    <p style="color:${CREAM};opacity:0.85;font-size:15px;line-height:1.9;text-align:center;margin:0 0 24px 0;">
      On this special day, everyone at Royal Academy wishes you 
      joy, growth, and beautiful music in the year ahead.
    </p>

    <p style="color:${CREAM};opacity:0.6;font-size:14px;line-height:1.9;text-align:center;margin:0 0 32px 0;">
      Your journey with us inspires those around you every day. 
      May this birthday mark another year of creativity and excellence.
    </p>

    <!-- Quote box -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="
          border-left:3px solid ${GOLD};
          padding:12px 20px;
          background:rgba(201,168,76,0.05);
          border-radius:0 8px 8px 0;
          margin-bottom:0;
        ">
          <p style="color:${GOLD};font-size:14px;font-style:italic;margin:0;line-height:1.7;">
            "Music gives a soul to the universe, wings to the mind, flight to the imagination,
            and life to everything."
          </p>
          <p style="color:${MUTED};font-size:12px;margin:8px 0 0 0;">— Plato</p>
        </td>
      </tr>
    </table>
  `;
  return baseWrapper(content);
}

// ─────────────────────────────────────────────────────────────────────────────
// SMS message builders (plain text, kept short for SMS limits)
// ─────────────────────────────────────────────────────────────────────────────
export function buildSessionReminderSms({
  studentName,
  className,
  sessionDate,
  sessionTime,
}: {
  studentName: string;
  className: string;
  sessionDate: string;
  sessionTime: string;
}): string {
  return `Hi ${studentName}, reminder: your ${className} class is tomorrow (${sessionDate}) at ${sessionTime}. See you there! - Royal Academy`;
}

export function buildBirthdaySms({
  studentName,
}: {
  studentName: string;
}): string {
  return `Happy Birthday, ${studentName}! 🎉 Wishing you a wonderful day. From all of us at Royal Academy.`;
}