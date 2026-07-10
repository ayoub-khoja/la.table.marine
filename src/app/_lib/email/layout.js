import { EMAIL_CONTAINER } from "@library/email/styles";
import { renderEmailUniqueTail } from "@library/email/footer";

/**
 * Enveloppe HTML commune pour les e-mails transactionnels.
 */
export function wrapEmailHtml(bodyHtml, footerHtml = "", unique = null) {
  const tail = unique
    ? renderEmailUniqueTail(unique.referenceId, unique.sentAt)
    : "";

  return `
    <div style="margin:0;padding:0;background:#f1f5f9;${EMAIL_CONTAINER}">
      <div style="max-width:680px;width:100%;margin:0 auto;padding:22px 14px 34px;box-sizing:border-box;">
        <div style="background:#ffffff;border:1px solid #e9edf2;border-radius:16px;box-shadow:0 10px 30px rgba(2,6,23,0.08);${EMAIL_CONTAINER}">
          <div style="overflow:hidden;border-radius:16px 16px 0 0;line-height:0;">
            <img src="cid:header-email" alt="La Table Marine" style="display:block;width:100%;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;margin:0;" />
          </div>
          <div style="padding:22px 18px 26px;box-sizing:border-box;${EMAIL_CONTAINER}">
            ${bodyHtml}
            ${footerHtml}
            ${tail}
          </div>
        </div>
      </div>
    </div>
  `;
}
