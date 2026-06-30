import { renderEmailFooter } from "@library/email/footer";
import { escapeHtml } from "@library/email/order";

const PERSON_LABELS = {
  "1": "1 personne",
  "2": "2 personnes",
  "3": "3 personnes",
  "4": "4 personnes",
  "5": "5 personnes",
  "6": "6 ou plus",
};

export function personLabel(value) {
  return PERSON_LABELS[String(value)] || String(value || "");
}

export function formatReservationDate(dateStr) {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(y, m - 1, d));
  } catch {
    return dateStr;
  }
}

function renderNotesBlock(message) {
  if (!message) return "";
  return `
    <div style="margin-top:18px;text-align:left;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">Message</div>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 14px;color:#7c2d12;">
        ${escapeHtml(message).replaceAll("\n", "<br/>")}
      </div>
    </div>
  `;
}

function renderHeaderBlock(variant, reservation) {
  const { first_name, fullName, email } = reservation;

  if (variant === "customer") {
    const greeting = first_name ? escapeHtml(first_name) : escapeHtml(fullName);
    return `
      <div style="text-align:center;">
        <div style="display:inline-block;background:rgba(1,65,150,0.10);color:#014196;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
          Réservation confirmée
        </div>
        <h2 style="margin:14px 0 6px;font-size:22px;line-height:1.25;color:#0f172a;">Bonjour ${greeting},</h2>
        <p style="margin:0;font-size:14px;line-height:1.55;color:#64748b;max-width:520px;margin-left:auto;margin-right:auto;">
          Merci pour votre demande de réservation. Nous l'avons bien reçue et nous vous confirmerons votre table très prochainement.
        </p>
      </div>
    `;
  }

  return `
    <div style="text-align:center;">
      <div style="display:inline-block;background:rgba(1,65,150,0.10);color:#014196;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
        Nouvelle réservation
      </div>
      <h2 style="margin:14px 0 6px;font-size:22px;line-height:1.25;color:#0f172a;">${escapeHtml(fullName)}</h2>
      <p style="margin:0;font-size:14px;color:#64748b;">${escapeHtml(email)}</p>
    </div>
  `;
}

function renderDetailsBlock(reservation) {
  const {
    personLabel: persons,
    dateFormatted,
    time,
    email,
    variant,
  } = reservation;

  const lines = [
    `<p style="margin:0 0 8px;"><b>Date :</b> ${escapeHtml(dateFormatted)}</p>`,
    `<p style="margin:0 0 8px;"><b>Heure :</b> ${escapeHtml(time)}</p>`,
    `<p style="margin:0 0 8px;"><b>Personnes :</b> ${escapeHtml(persons)}</p>`,
  ];

  if (variant === "customer") {
    lines.push(`<p style="margin:0;"><b>E-mail :</b> ${escapeHtml(email)}</p>`);
  }

  const title =
    variant === "customer" ? "Détails de votre réservation" : "Informations";

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
 * @param {object} reservation
 */
export function renderReservationEmailHtml(variant, reservation) {
  const { message } = reservation;

  return `
    <div style="margin:0;padding:0;background:#f1f5f9;">
      <div style="max-width:680px;margin:0 auto;padding:22px 14px 34px;">
        <div style="background:#ffffff;border:1px solid #e9edf2;border-radius:16px;box-shadow:0 10px 30px rgba(2,6,23,0.08);overflow:hidden;">
          <img src="cid:header-email" alt="La Table Marine" style="display:block;width:100%;height:auto;border:0;outline:none;text-decoration:none;margin:0;" />
          <div style="padding:22px 18px;">
            ${renderHeaderBlock(variant, { ...reservation, variant })}
            ${renderDetailsBlock({ ...reservation, variant })}
            ${renderNotesBlock(message)}
          </div>
          ${renderEmailFooter(escapeHtml)}
        </div>
      </div>
    </div>
  `;
}
