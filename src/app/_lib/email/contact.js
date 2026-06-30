import { renderEmailFooter } from "@library/email/footer";
import { escapeHtml } from "@library/email/order";

function renderMessageBlock(message) {
  return `
    <div style="margin-top:18px;text-align:left;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">Message</div>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 14px;color:#7c2d12;">
        ${escapeHtml(message).replaceAll("\n", "<br/>")}
      </div>
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
      <p style="margin:0;font-size:14px;color:#64748b;">${escapeHtml(email)}</p>
    </div>
  `;
}

function renderDetailsBlock(data) {
  const { phone, email, variant } = data;
  const lines = [];

  if (phone) {
    lines.push(`<p style="margin:0 0 8px;"><b>Téléphone :</b> ${escapeHtml(phone)}</p>`);
  }

  if (variant === "customer") {
    lines.push(`<p style="margin:0;"><b>E-mail :</b> ${escapeHtml(email)}</p>`);
  } else if (phone) {
    lines.push(`<p style="margin:0;"><b>E-mail :</b> ${escapeHtml(email)}</p>`);
  } else {
    lines.push(`<p style="margin:0;"><b>E-mail :</b> ${escapeHtml(email)}</p>`);
  }

  const title =
    variant === "customer" ? "Vos coordonnées" : "Coordonnées";

  return `
    <div style="margin-top:18px;text-align:left;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">${title}</div>
      <div style="background:#f8fafc;border:1px solid #e9edf2;border-radius:12px;padding:14px 14px;color:#0f172a;">
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
  const { message } = data;

  return `
    <div style="margin:0;padding:0;background:#f1f5f9;">
      <div style="max-width:680px;margin:0 auto;padding:22px 14px 34px;">
        <div style="background:#ffffff;border:1px solid #e9edf2;border-radius:16px;box-shadow:0 10px 30px rgba(2,6,23,0.08);overflow:hidden;">
          <img src="cid:header-email" alt="La Table Marine" style="display:block;width:100%;height:auto;border:0;outline:none;text-decoration:none;margin:0;" />
          <div style="padding:22px 18px;">
            ${renderHeaderBlock(variant, { ...data, variant })}
            ${renderDetailsBlock({ ...data, variant })}
            ${renderMessageBlock(message)}
          </div>
          ${renderEmailFooter(escapeHtml)}
        </div>
      </div>
    </div>
  `;
}
