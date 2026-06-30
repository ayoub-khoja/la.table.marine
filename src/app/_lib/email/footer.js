import appData from "@data/app.json";

const BRAND = "La Table Marine";
const BRAND_COLOR = "#014196";
const LINK_COLOR = "#3b82f6";

function getContactInfo() {
  const items = appData?.footer?.contact?.items ?? [];
  const byLabel = (label) =>
    items.find((item) => item.label?.toLowerCase() === label.toLowerCase())
      ?.value ?? "";

  return {
    email: byLabel("Email") || "contact@latablemarine.com",
    phone: byLabel("Téléphone"),
    address: byLabel("Adresse") || "2, rue Pierre Curie, 78370 Plaisir",
    copyright:
      appData?.footer?.copy?.replace(/<[^>]+>/g, "") ||
      `© ${new Date().getFullYear()} ${BRAND}. Tous droits réservés.`,
  };
}

function siteBaseUrl() {
  const url = process.env.SITE_URL?.trim();
  if (!url) return "";
  return url.replace(/\/$/, "");
}

/**
 * Pied de page HTML pour les e-mails transactionnels (contact, commande).
 * @param { (str: string) => string } escapeHtml
 */
export function renderEmailFooter(escapeHtml) {
  const { email, address, copyright } = getContactInfo();
  const base = siteBaseUrl();
  const contactUrl = base ? `${base}/contact` : null;

  const legalLinks = contactUrl
    ? `
      <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
        <a href="${escapeHtml(contactUrl)}" style="color:${LINK_COLOR};text-decoration:none;">Nous contacter</a>
      </p>
    `
    : "";

  return `
    <div style="border-top:1px solid #e9edf2;padding:28px 22px 26px;background:#f8fafc;text-align:center;">
      <h3 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;">Besoin d'aide ?</h3>
      <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:#334155;">
        Si vous avez des questions ou des suggestions, contactez-nous par e-mail à :
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.55;">
        <a href="mailto:${escapeHtml(email)}" style="color:${LINK_COLOR};text-decoration:none;font-weight:500;">${escapeHtml(email)}</a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:#334155;">
        <b>Adresse :</b> ${escapeHtml(address)}
      </p>
      <div style="margin:22px auto 0;max-width:420px;height:1px;background:#e2e8f0;"></div>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
        ${escapeHtml(copyright).replace(
          escapeHtml(BRAND),
          `<strong style="color:${BRAND_COLOR};">${escapeHtml(BRAND)}</strong>`
        )}
      </p>
      ${legalLinks}
    </div>
  `;
}
