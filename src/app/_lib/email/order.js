import fs from "fs";
import path from "path";

import { renderEmailFooter } from "@library/email/footer";
import { wrapEmailHtml } from "@library/email/layout";
import { normalizeCustomerMessage } from "@library/email/message";
import {
  EMAIL_CONTENT_BOX,
  EMAIL_MESSAGE_BOX,
  EMAIL_PARAGRAPH,
  EMAIL_PARAGRAPH_LAST,
  EMAIL_TEXT_WRAP,
} from "@library/email/styles";

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function paymentLabel(paymentMethod) {
  if (paymentMethod === "cash") return "Espèces";
  if (paymentMethod === "card") return "Carte bancaire";
  if (paymentMethod === "3") return "Paiement à la livraison";
  if (paymentMethod === "2") return "Paiement par chèque";
  if (paymentMethod === "1") return "Virement bancaire";
  return String(paymentMethod || "");
}

export function formatMoney(amount, currency = "$") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "";
  return `${currency}${n.toFixed(2)}`;
}

export function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .map((it) => ({
      title: (it?.title || "").toString().trim(),
      quantity: Number(it?.quantity || 0),
      price: Number(it?.price || 0),
      currency: (it?.currency || "$").toString(),
    }))
    .filter((it) => it.title && Number.isFinite(it.quantity) && it.quantity > 0);
}

function renderOrderTable(items) {
  const currency = items[0]?.currency || "$";
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const rows = items
    .map((it) => {
      const lineTotal = it.price * it.quantity;
      return `
        <tr>
          <td style="padding:12px 10px;border-bottom:1px solid #e9edf2;">
            <div style="font-weight:600;color:#0f172a;${EMAIL_TEXT_WRAP}">${escapeHtml(it.title)}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">x${it.quantity}</div>
          </td>
          <td style="padding:12px 10px;border-bottom:1px solid #e9edf2;text-align:right;font-weight:600;color:#0f172a;white-space:nowrap;">
            ${escapeHtml(formatMoney(lineTotal, currency))}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="margin-top:18px;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:10px;text-align:left;">
        Votre commande
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#ffffff;border:1px solid #e9edf2;border-radius:12px;overflow:hidden;table-layout:fixed;width:100%;max-width:100%;">
        <thead>
          <tr>
            <th style="padding:12px 10px;text-align:left;background:#f8fafc;border-bottom:1px solid #e9edf2;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#475569;">Produit</th>
            <th style="padding:12px 10px;text-align:right;background:#f8fafc;border-bottom:1px solid #e9edf2;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#475569;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows || ""}
          <tr>
            <td style="padding:14px 10px;text-align:left;font-weight:700;color:#0f172a;">Total</td>
            <td style="padding:14px 10px;text-align:right;font-weight:800;color:#0f172a;white-space:nowrap;">
              ${escapeHtml(formatMoney(subtotal, currency))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderNotesBlock(message) {
  const text = (message || "").trim();
  if (!text) return "";

  const html = escapeHtml(text).replaceAll("\n", "<br/>");

  return `
    <div style="margin-top:18px;text-align:left;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">Notes</div>
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

function renderHeaderBlock(variant, order) {
  const { firstname, fullName, email, tel } = order;

  if (variant === "customer") {
    const greeting = firstname ? escapeHtml(firstname) : escapeHtml(fullName);
    return `
      <div style="text-align:center;">
        <div style="display:inline-block;background:rgba(1,65,150,0.10);color:#014196;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
          Commande confirmée
        </div>
        <h2 style="margin:14px 0 6px;font-size:22px;line-height:1.25;color:#0f172a;">Bonjour ${greeting},</h2>
        <p style="margin:0;font-size:14px;line-height:1.55;color:#64748b;max-width:520px;margin-left:auto;margin-right:auto;">
          Merci pour votre commande. Nous l'avons bien reçue et nous la préparons avec soin.
          Retrouvez ci-dessous le récapitulatif de votre commande.
        </p>
      </div>
    `;
  }

  return `
    <div style="text-align:center;">
      <div style="display:inline-block;background:rgba(1,65,150,0.10);color:#014196;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
        Nouvelle commande
      </div>
      <h2 style="margin:14px 0 6px;font-size:22px;line-height:1.25;color:#0f172a;">${escapeHtml(fullName)}</h2>
      <p style="margin:0;font-size:14px;color:#64748b;${EMAIL_TEXT_WRAP}">${escapeHtml(email)} · ${escapeHtml(tel)}</p>
    </div>
  `;
}

function renderDeliveryBlock(order) {
  const { address, city, state, postcode, payment_method, tel, email, variant } =
    order;

  const lines = [
    `<p style="${EMAIL_PARAGRAPH}"><b>Adresse :</b> ${escapeHtml(address)}</p>`,
    `<p style="${EMAIL_PARAGRAPH}"><b>Ville :</b> ${escapeHtml(city)}</p>`,
    state
      ? `<p style="${EMAIL_PARAGRAPH}"><b>Région/Province :</b> ${escapeHtml(state)}</p>`
      : "",
    postcode
      ? `<p style="${EMAIL_PARAGRAPH}"><b>Code postal :</b> ${escapeHtml(postcode)}</p>`
      : "",
    `<p style="${EMAIL_PARAGRAPH}"><b>Paiement :</b> ${escapeHtml(paymentLabel(payment_method))}</p>`,
  ];

  if (variant === "customer") {
    lines.push(
      `<p style="${EMAIL_PARAGRAPH}"><b>Téléphone :</b> ${escapeHtml(tel)}</p>`,
      `<p style="${EMAIL_PARAGRAPH_LAST}"><b>E-mail :</b> ${escapeHtml(email)}</p>`
    );
  }

  const title =
    variant === "customer" ? "Vos informations" : "Informations";

  return `
    <div style="margin-top:18px;text-align:left;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">${title}</div>
      <div style="${EMAIL_CONTENT_BOX}">
        ${lines.filter(Boolean).join("")}
      </div>
    </div>
  `;
}

/**
 * @param {"admin" | "customer"} variant
 * @param {object} order
 */
export function renderOrderEmailHtml(variant, order) {
  const { items } = order;
  const message = normalizeCustomerMessage(order.message);
  const contextLine =
    variant === "customer"
      ? `Concernant votre commande du ${order.createdAt ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(order.createdAt)) : "jour même"}.`
      : `Nouvelle commande de ${order.fullName || "un client"}.`;

  return wrapEmailHtml(
    `
      ${renderHeaderBlock(variant, { ...order, variant })}
      ${renderDeliveryBlock({ ...order, variant })}
      ${items.length ? renderOrderTable(items) : ""}
      ${renderNotesBlock(message)}
      ${renderEmailFooter(escapeHtml, {
        referenceId: order.id,
        sentAt: order.createdAt,
        contextLine,
      })}
    `,
    "",
    { referenceId: order.id, sentAt: order.createdAt }
  );
}

export function getEmailHeaderAttachments() {
  const candidates = [
    path.join(process.cwd(), "public", "img", "header-email.jpeg"),
    path.join(process.cwd(), "..", "public", "img", "header-email.jpeg"),
  ];

  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        return [
          {
            filename: "header-email.jpeg",
            content: fs.readFileSync(filePath),
            cid: "header-email",
            contentDisposition: "inline",
            contentType: "image/jpeg",
          },
        ];
      }
    } catch {
      /* ignore */
    }
  }

  return [];
}

/** @deprecated Utiliser getEmailHeaderAttachments() */
export function getOrderEmailAttachment(headerImagePath) {
  try {
    if (headerImagePath && fs.existsSync(headerImagePath)) {
      return {
        filename: "header-email.jpeg",
        content: fs.readFileSync(headerImagePath),
        cid: "header-email",
        contentDisposition: "inline",
        contentType: "image/jpeg",
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}
