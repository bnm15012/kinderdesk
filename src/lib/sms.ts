const DEFAULT_COUNTRY_CODE = process.env.SMS_DEFAULT_COUNTRY_CODE ?? "+91";

function to10Digit(phone: string) {
  const countryCode = DEFAULT_COUNTRY_CODE.replace(/\D/g, "");
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith(countryCode) && digits.length > countryCode.length) {
    digits = digits.slice(countryCode.length);
  }
  if (digits.length > 10) digits = digits.slice(-10);
  return digits;
}

function toE164(phone: string) {
  if (phone.startsWith("+")) return phone;
  const countryCode = DEFAULT_COUNTRY_CODE.replace(/\D/g, "");
  return `+${countryCode}${to10Digit(phone)}`;
}

/**
 * Send an SMS. Active only when SMS_PROVIDER is configured; otherwise no-ops.
 * Supported providers: "twilio", "fast2sms"
 */
export async function sendSMS({ to, body }: { to: string; body: string }) {
  const provider = (process.env.SMS_PROVIDER ?? "").toLowerCase();
  if (!provider || provider === "none") {
    console.log("SMS not configured; skipping SMS");
    return { ok: true, sent: false, provider: "none" };
  }

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
          To: toE164(to),
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

  if (provider === "fast2sms") {
    const authKey = process.env.FAST2SMS_AUTH_KEY;
    if (!authKey) throw new Error("Fast2SMS auth key not configured");

    const numbers = to10Digit(to);
    const route = process.env.FAST2SMS_ROUTE ?? "q";
    const payload: Record<string, any> = {
      route,
      numbers,
      message: body,
      language: process.env.FAST2SMS_LANGUAGE ?? "english",
      flash: 0,
    };

    if (route === "dlt") {
      if (process.env.FAST2SMS_SENDER_ID) payload.sender_id = process.env.FAST2SMS_SENDER_ID;
      if (process.env.FAST2SMS_TEMPLATE_ID) payload.template_id = process.env.FAST2SMS_TEMPLATE_ID;
    }

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: authKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json().catch(() => ({} as any));
    if (!response.ok || json.return === false) {
      throw new Error(`Fast2SMS error: ${response.status} ${JSON.stringify(json)}`);
    }

    return { ok: true, sent: true, provider };
  }

  throw new Error(`Unsupported SMS provider: ${provider}`);
}
