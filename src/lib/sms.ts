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

/**
 * Send an SMS via Fast2SMS. Active only when FAST2SMS_AUTH_KEY is configured;
 * otherwise no-ops.
 */
export async function sendSMS({ to, body }: { to: string; body: string }) {
  const authKey = process.env.FAST2SMS_AUTH_KEY;
  if (!authKey || authKey === "none" || authKey === "disabled") {
    console.log("Fast2SMS not configured; skipping SMS");
    return { ok: true, sent: false };
  }

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

  return { ok: true, sent: true };
}
