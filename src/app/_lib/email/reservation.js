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

function renderHeaderBlock(variant, reservation) {
  const { first_name, fullName, email } = reservation;

  if (variant === "customer") {
    const greeting = first_name ? escapeHtml(first_name) : escapeHtml(fullName);
    return `
      <div style="text-align:center;">
        <div style="display:inline-block;background:rgba(1,65,150,0.10);color:#014196;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
          Demande reçue
        </div>
        <h2 style="margin:14px 0 6px;font-size:22px;line-height:1.25;color:#0f172a;">Bonjour ${greeting},</h2>
        <p style="margin:0;font-size:14px;line-height:1.55;color:#64748b;max-width:520px;margin-left:auto;margin-right:auto;">
          Merci pour votre demande de réservation. Nous l’avons bien reçue et nous vous confirmerons votre table très prochainement.
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
      <p style="margin:0;font-size:14px;color:#64748b;${EMAIL_TEXT_WRAP}">${escapeHtml(email)}</p>
    </div>
  `;
}

function renderDetailsBlock(reservation) {
  const {
    personLabel: persons,
    dateFormatted,
    time,
    email,
    phone,
    requestTypeLabel,
    occasionLabel,
    serviceTypeLabel,
    variant,
  } = reservation;

  const lines = [];

  if (requestTypeLabel) {
    lines.push(
      `<p style="${EMAIL_PARAGRAPH}"><b>Type de demande :</b> ${escapeHtml(requestTypeLabel)}</p>`
    );
  }

  if (occasionLabel) {
    lines.push(
      `<p style="${EMAIL_PARAGRAPH}"><b>Occasion :</b> ${escapeHtml(occasionLabel)}</p>`
    );
  }

  if (serviceTypeLabel) {
    lines.push(
      `<p style="${EMAIL_PARAGRAPH}"><b>Service :</b> ${escapeHtml(serviceTypeLabel)}</p>`
    );
  }

  lines.push(
    `<p style="${EMAIL_PARAGRAPH}"><b>Date :</b> ${escapeHtml(dateFormatted)}</p>`,
    `<p style="${EMAIL_PARAGRAPH}"><b>Heure :</b> ${escapeHtml(time)}</p>`,
    `<p style="${EMAIL_PARAGRAPH}"><b>Personnes :</b> ${escapeHtml(persons)}</p>`
  );

  if (phone) {
    lines.push(`<p style="${EMAIL_PARAGRAPH}"><b>Téléphone :</b> ${escapeHtml(phone)}</p>`);
  }

  if (variant === "customer") {
    lines.push(`<p style="${EMAIL_PARAGRAPH_LAST}"><b>E-mail :</b> ${escapeHtml(email)}</p>`);
  }

  const title =
    variant === "customer" ? "Détails de votre réservation" : "Informations";

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
 * @param {object} reservation
 */
export function renderReservationEmailHtml(variant, reservation) {
  const message = normalizeCustomerMessage(reservation.message);
  const contextLine =
    variant === "customer"
      ? `Concernant votre réservation du ${reservation.dateFormatted || reservation.date} à ${reservation.time}.`
      : `Nouvelle demande pour le ${reservation.dateFormatted || reservation.date} à ${reservation.time}.`;

  return wrapEmailHtml(
    `
      ${renderHeaderBlock(variant, { ...reservation, variant })}
      ${renderDetailsBlock({ ...reservation, variant })}
      ${renderNotesBlock(message)}
      ${renderEmailFooter(escapeHtml, {
        referenceId: reservation.id,
        sentAt: reservation.createdAt,
        contextLine,
      })}
    `,
    "",
    { referenceId: reservation.id, sentAt: reservation.createdAt }
  );
}
