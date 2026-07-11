import appData from "@data/app.json";
import { EMAIL_TEXT_WRAP } from "@library/email/styles";

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

function formatSentAt(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function shortRef(referenceId) {
  if (!referenceId) return "";
  return String(referenceId).slice(0, 8);
}

/**
 * @param { (str: string) => string } escapeHtml
 * @param {{
 *   referenceId?: string;
 *   sentAt?: string;
 *   contextLine?: string;
 * }} [options]
 */
export function renderEmailFooter(escapeHtml, options = {}) {
  const { email, address, copyright } = getContactInfo();
  const base = siteBaseUrl();
  const contactUrl = base ? `${base}/contact` : null;
  const { referenceId, sentAt, contextLine } = options;

  const contextBlock = contextLine
    ? `<p style="margin:0 0 14px;font-size:13px;line-height:1.55;color:#64748b;${EMAIL_TEXT_WRAP}">${escapeHtml(contextLine)}</p>`
    : "";

  const sentAtLabel = formatSentAt(sentAt);
  const refShort = shortRef(referenceId);

  const metaLine =
    referenceId || sentAtLabel
      ? `<p style="margin:14px 0 0;font-size:11px;line-height:1.5;color:#94a3b8;${EMAIL_TEXT_WRAP}">${[
          refShort ? `Réf. ${escapeHtml(refShort)}` : "",
          sentAtLabel ? `Envoyé le ${escapeHtml(sentAtLabel)}` : "",
        ]
          .filter(Boolean)
          .join(" · ")}</p>`
      : "";

  const legalLinks = contactUrl
    ? `
      <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
        <a href="${escapeHtml(contactUrl)}" style="color:${LINK_COLOR};text-decoration:none;">Nous contacter</a>
      </p>
    `
    : "";

  return `
    <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e9edf2;text-align:center;box-sizing:border-box;${EMAIL_TEXT_WRAP}">
      <h3 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;">Besoin d'aide ?</h3>
      ${contextBlock}
      <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:#334155;${EMAIL_TEXT_WRAP}">
        Si vous avez des questions ou des suggestions, contactez-nous par e-mail à :
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.55;${EMAIL_TEXT_WRAP}">
        <a href="mailto:${escapeHtml(email)}" style="color:${LINK_COLOR};text-decoration:none;font-weight:500;${EMAIL_TEXT_WRAP}">${escapeHtml(email)}</a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:#334155;${EMAIL_TEXT_WRAP}">
        <b>Adresse :</b> ${escapeHtml(address)}
      </p>
      <div style="margin:22px auto 0;max-width:420px;height:1px;background:#e2e8f0;"></div>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#64748b;${EMAIL_TEXT_WRAP}">
        ${escapeHtml(copyright).replace(
          escapeHtml(BRAND),
          `<strong style="color:${BRAND_COLOR};">${escapeHtml(BRAND)}</strong>`
        )}
      </p>
      ${legalLinks}
      ${metaLine}
    </div>
  `;
}

/**
 * Marqueur unique en fin d'e-mail pour éviter le repli automatique Gmail.
 */
export function renderEmailUniqueTail(referenceId, sentAt) {
  const token = [referenceId || "", sentAt || "", Date.now()].filter(Boolean).join("-");
  if (!token) return "";

  return `<div style="font-size:1px;line-height:1px;color:#ffffff;max-height:0;overflow:hidden;mso-hide:all;">${token}</div>`;
}
