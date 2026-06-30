import { renderEmailFooter } from "@library/email/footer";

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function paymentLabel(paymentMethod) {
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
            <div style="font-weight:600;color:#0f172a;">${escapeHtml(it.title)}</div>
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
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#ffffff;border:1px solid #e9edf2;border-radius:12px;overflow:hidden;">
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
  if (!message) return "";
  return `
    <div style="margin-top:18px;text-align:left;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">Notes</div>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 14px;color:#7c2d12;">
        ${escapeHtml(message).replaceAll("\n", "<br/>")}
      </div>
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
      <p style="margin:0;font-size:14px;color:#64748b;">${escapeHtml(email)} · ${escapeHtml(tel)}</p>
    </div>
  `;
}

function renderDeliveryBlock(order) {
  const { address, city, state, postcode, payment_method, tel, email, variant } =
    order;

  const lines = [
    `<p style="margin:0 0 8px;"><b>Adresse :</b> ${escapeHtml(address)}</p>`,
    `<p style="margin:0 0 8px;"><b>Ville :</b> ${escapeHtml(city)}</p>`,
    state
      ? `<p style="margin:0 0 8px;"><b>Région/Province :</b> ${escapeHtml(state)}</p>`
      : "",
    postcode
      ? `<p style="margin:0 0 8px;"><b>Code postal :</b> ${escapeHtml(postcode)}</p>`
      : "",
    `<p style="margin:0 0 8px;"><b>Paiement :</b> ${escapeHtml(paymentLabel(payment_method))}</p>`,
  ];

  if (variant === "customer") {
    lines.push(
      `<p style="margin:0 0 8px;"><b>Téléphone :</b> ${escapeHtml(tel)}</p>`,
      `<p style="margin:0;"><b>E-mail :</b> ${escapeHtml(email)}</p>`
    );
  }

  const title =
    variant === "customer" ? "Vos informations" : "Informations";

  return `
    <div style="margin-top:18px;text-align:left;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">${title}</div>
      <div style="background:#f8fafc;border:1px solid #e9edf2;border-radius:12px;padding:14px 14px;color:#0f172a;">
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
  const { items, message } = order;

  return `
    <div style="margin:0;padding:0;background:#f1f5f9;">
      <div style="max-width:680px;margin:0 auto;padding:22px 14px 34px;">
        <div style="background:#ffffff;border:1px solid #e9edf2;border-radius:16px;box-shadow:0 10px 30px rgba(2,6,23,0.08);overflow:hidden;">
          <img src="cid:header-email" alt="La Table Marine" style="display:block;width:100%;height:auto;border:0;outline:none;text-decoration:none;margin:0;" />
          <div style="padding:22px 18px;">
            ${renderHeaderBlock(variant, { ...order, variant })}
            ${renderDeliveryBlock({ ...order, variant })}
            ${items.length ? renderOrderTable(items) : ""}
            ${renderNotesBlock(message)}
          </div>
          ${renderEmailFooter(escapeHtml)}
        </div>
      </div>
    </div>
  `;
}

export function getOrderEmailAttachment(headerImagePath) {
  return {
    filename: "header-email.png",
    path: headerImagePath,
    cid: "header-email",
  };
}
