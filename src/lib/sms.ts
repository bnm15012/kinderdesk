const DEFAULT_COUNTRY_CODE = process.env.SMS_DEFAULT_COUNTRY_CODE ?? "+91";

function normalizePhone(phone: string) {
  if (phone.startsWith("+")) return phone;
  const digits = phone.replace(/\D/g, "");
  return `${DEFAULT_COUNTRY_CODE}${digits}`;
}

/**
 * Send an SMS. Active only when SMS_PROVIDER is configured; otherwise no-ops.
 * Supported providers: "twilio"
 */
export async function sendSMS({ to, body }: { to: string; body: string }) {
  const provider = (process.env.SMS_PROVIDER ?? "").toLowerCase();
  if (!provider || provider === "none") {
    console.log("SMS not configured; skipping SMS");
    return { ok: true, sent: false, provider: "none" };
  }

  const formattedTo = normalizePhone(to);

  if (provider === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!accountSid || !authToken || !from) {
      throw new Error("Twilio credentials not configured");
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: from,
          To: formattedTo,
          Body: body,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Twilio error: ${response.status} ${text}`);
    }

    return { ok: true, sent: true, provider };
  }

  throw new Error(`Unsupported SMS provider: ${provider}`);
}
