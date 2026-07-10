import { renderEmailFooter } from "@library/email/footer";
import { wrapEmailHtml } from "@library/email/layout";
import { normalizeCustomerMessage } from "@library/email/message";
import { escapeHtml } from "@library/email/order";
import {
  EMAIL_CONTENT_BOX,
  EMAIL_MESSAGE_BOX,
  EMAIL_PARAGRAPH,
  EMAIL_PARAGRAPH_LAST,
  EMAIL_TEXT_WRAP,
} from "@library/email/styles";

function renderMessageBlock(message) {
  const text = (message || "").trim();
  if (!text) return "";

  const html = escapeHtml(text).replaceAll("\n", "<br/>");

  return `
    <div style="margin-top:18px;text-align:left;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">Message</div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;width:100%;">
        <tr>
          <td style="${EMAIL_MESSAGE_BOX}">
            ${html}
          </td>
        </tr>
      </table>
    </div>
  `;
}

function renderHeaderBlock(variant, data) {
  const { first_name, fullName, email } = data;

  if (variant === "customer") {
    const greeting = first_name ? escapeHtml(first_name) : escapeHtml(fullName);
    return `
      <div style="text-align:center;">
        <div style="display:inline-block;background:rgba(1,65,150,0.10);color:#014196;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
          Message reçu
        </div>
        <h2 style="margin:14px 0 6px;font-size:22px;line-height:1.25;color:#0f172a;">Bonjour ${greeting},</h2>
        <p style="margin:0;font-size:14px;line-height:1.55;color:#64748b;max-width:520px;margin-left:auto;margin-right:auto;">
          Merci de nous avoir contactés. Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.
        </p>
      </div>
    `;
  }

  return `
    <div style="text-align:center;">
      <div style="display:inline-block;background:rgba(1,65,150,0.10);color:#014196;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
        Nouveau message
      </div>
      <h2 style="margin:14px 0 6px;font-size:22px;line-height:1.25;color:#0f172a;">${escapeHtml(fullName)}</h2>
      <p style="margin:0;font-size:14px;color:#64748b;${EMAIL_TEXT_WRAP}">${escapeHtml(email)}</p>
    </div>
  `;
}

function renderDetailsBlock(data) {
  const { phone, email, variant } = data;
  const lines = [];

  if (phone) {
    lines.push(`<p style="${EMAIL_PARAGRAPH}"><b>Téléphone :</b> ${escapeHtml(phone)}</p>`);
  }

  if (variant === "customer") {
    lines.push(`<p style="${EMAIL_PARAGRAPH_LAST}"><b>E-mail :</b> ${escapeHtml(email)}</p>`);
  } else if (phone) {
    lines.push(`<p style="${EMAIL_PARAGRAPH_LAST}"><b>E-mail :</b> ${escapeHtml(email)}</p>`);
  } else {
    lines.push(`<p style="${EMAIL_PARAGRAPH_LAST}"><b>E-mail :</b> ${escapeHtml(email)}</p>`);
  }

  const title =
    variant === "customer" ? "Vos coordonnées" : "Coordonnées";

  return `
    <div style="margin-top:18px;text-align:left;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">${title}</div>
      <div style="${EMAIL_CONTENT_BOX}">
        ${lines.join("")}
      </div>
    </div>
  `;
}

/**
 * @param {"admin" | "customer"} variant
 * @param {object} data
 */
export function renderContactEmailHtml(variant, data) {
  const message = normalizeCustomerMessage(data.message);
  const contextLine =
    variant === "customer"
      ? "Concernant votre message envoyé via le site."
      : `Message reçu de ${data.fullName || "un client"}.`;

  return wrapEmailHtml(
    `
      ${renderHeaderBlock(variant, { ...data, variant })}
      ${renderDetailsBlock({ ...data, variant })}
      ${message ? renderMessageBlock(message) : ""}
      ${renderEmailFooter(escapeHtml, {
        referenceId: data.id,
        sentAt: data.createdAt,
        contextLine,
      })}
    `,
    "",
    { referenceId: data.id, sentAt: data.createdAt }
  );
}
