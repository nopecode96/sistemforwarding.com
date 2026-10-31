/**
 * Hostinger Notification Dispatcher Utility Module
 * Handles sending transactional Email and WhatsApp notifications.
 * Security: Reads auth token strictly from process.env.HOSTINGER_API_TOKEN.
 */

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendWhatsAppPayload {
  recipientPhone: string; // E.164 formatted telephone number e.g. "+6281234567890"
  message: string;
  templateId?: string;
  parameters?: Record<string, string>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Hostinger API Endpoint configuration (driven by environment variables, with fallback)
const HOSTINGER_API_BASE_URL =
  process.env.HOSTINGER_API_BASE_URL || "https://api.hostinger.com/v1";

/**
 * Helper to obtain and validate Hostinger API Token from environment variables.
 * Guarantees zero hardcoded credentials in codebase.
 */
function getHostingerToken(): string {
  const token = process.env.HOSTINGER_API_TOKEN;
  if (!token) {
    throw new Error(
      "[Hostinger Service] Missing HOSTINGER_API_TOKEN in environment configuration."
    );
  }
  return token;
}

/**
 * Sends an email notification using Hostinger API service.
 * Ready to be invoked from operational workflows (e.g., Job File creation, Invoicing, Billing status updates).
 */
export async function sendEmail(
  payload: SendEmailPayload
): Promise<NotificationResult> {
  try {
    const token = getHostingerToken();

    console.info(`[Hostinger Email] Dispatching email to: ${payload.to} | Subject: "${payload.subject}"`);

    const response = await fetch(`${HOSTINGER_API_BASE_URL}/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        from: payload.from || process.env.NOTIFICATION_EMAIL_FROM || "no-reply@sistemforwarding.com",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text || payload.html.replace(/<[^>]*>?/gm, ""),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Hostinger Email] API request failed with HTTP ${response.status}:`, errorText);
      return {
        success: false,
        error: `Hostinger Email API responded with HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data?.id || data?.messageId || "sent",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[Hostinger Email] Exception while sending email:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sends a WhatsApp notification using Hostinger WhatsApp API service.
 * Ready to be invoked for instant operational alerts, driver dispatch, and customer shipment tracking updates.
 */
export async function sendWhatsApp(
  payload: SendWhatsAppPayload
): Promise<NotificationResult> {
  try {
    const token = getHostingerToken();

    console.info(`[Hostinger WhatsApp] Dispatching WhatsApp alert to: ${payload.recipientPhone}`);

    const response = await fetch(`${HOSTINGER_API_BASE_URL}/whatsapp/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: payload.recipientPhone,
        message: payload.message,
        template_id: payload.templateId,
        params: payload.parameters,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Hostinger WhatsApp] API request failed with HTTP ${response.status}:`, errorText);
      return {
        success: false,
        error: `Hostinger WhatsApp API responded with HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data?.id || data?.messageId || "dispatched",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[Hostinger WhatsApp] Exception while sending WhatsApp alert:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
