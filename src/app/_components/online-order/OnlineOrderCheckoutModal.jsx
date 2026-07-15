"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import Popup from "@components/Popup";
import { formatPrice } from "@library/online-order/format-price";

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  houseNumber: "",
  postcode: "",
  city: "",
  addressNotes: "",
  notes: "",
};

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstname: "", lastname: "" };
  if (parts.length === 1) return { firstname: parts[0], lastname: "-" };
  return { firstname: parts[0], lastname: parts.slice(1).join(" ") };
}

function OnlineOrderCheckoutModal({
  isOpen,
  onClose,
  lines,
  total,
  restaurantAddress,
}) {
  const [orderType, setOrderType] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupState, setPopupState] = useState({ type: "success", message: "" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const updateField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetAndClose = useCallback(() => {
    setForm(INITIAL_FORM);
    setOrderType("delivery");
    setPaymentMethod("cash");
    onClose();
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!lines.length || submitting) return;

    const { firstname, lastname } = splitFullName(form.fullName);
    const isDelivery = orderType === "delivery";
    const address = isDelivery
      ? [form.address, form.houseNumber].filter(Boolean).join(" ").trim()
      : restaurantAddress;
    const city = isDelivery ? form.city.trim() : "Plaisir";
    const messageParts = [
      `Type de commande : ${isDelivery ? "Livraison" : "À emporter"}`,
      form.addressNotes.trim() ? `Notes d'adresse : ${form.addressNotes.trim()}` : "",
      form.notes.trim() ? `Notes : ${form.notes.trim()}` : "",
    ].filter(Boolean);

    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname,
          lastname,
          email: form.email.trim(),
          tel: form.phone.trim(),
          address,
          city,
          state: isDelivery ? "Livraison" : "À emporter",
          postcode: isDelivery ? form.postcode.trim() : "",
          message: messageParts.join("\n"),
          payment_method: paymentMethod,
          items: lines.map((line) => ({
            title: line.name,
            quantity: line.quantity,
            price: line.price,
            currency: "€",
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setPopupState({
          type: "error",
          message: data?.error || "Oups ! Un problème est survenu lors de l'envoi de la commande.",
        });
        setPopupOpen(true);
        return;
      }

      setPopupState({
        type: "success",
        message: "Merci ! Votre commande a été envoyée. Nous vous contacterons rapidement.",
      });
      setPopupOpen(true);
      setForm(INITIAL_FORM);
      setOrderType("delivery");
      setPaymentMethod("cash");
      onClose({ success: true });
    } catch {
      setPopupState({
        type: "error",
        message: "Erreur réseau. Réessayez plus tard.",
      });
      setPopupOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  const checkoutDialog = isOpen ? (
    <div
      className="online-order-checkout"
      role="dialog"
      aria-modal="true"
      aria-labelledby="online-order-checkout-title"
    >
      <button
        type="button"
        className="online-order-checkout__backdrop"
        aria-label="Fermer le formulaire"
        onClick={resetAndClose}
      />
      <div className="online-order-checkout__panel">
        <div className="online-order-checkout__header">
          <h2 id="online-order-checkout-title">Finaliser la commande</h2>
          <button
            type="button"
            className="online-order-checkout__close"
            aria-label="Fermer"
            onClick={resetAndClose}
          >
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>

        <form className="online-order-checkout__form" onSubmit={handleSubmit}>
          <fieldset className="online-order-checkout__fieldset">
            <legend>Type de commande</legend>
            <div className="online-order-checkout__toggle">
              <button
                type="button"
                className={orderType === "delivery" ? "is-active" : ""}
                onClick={() => setOrderType("delivery")}
              >
                <span aria-hidden="true">🚚</span>
                Livraison
              </button>
              <button
                type="button"
                className={orderType === "takeaway" ? "is-active" : ""}
                onClick={() => setOrderType("takeaway")}
              >
                <span aria-hidden="true">🏪</span>
                À emporter
              </button>
            </div>
          </fieldset>

          <label className="online-order-checkout__field">
            <span>Nom complet</span>
            <input
              type="text"
              name="fullName"
              required
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
            />
          </label>

          <label className="online-order-checkout__field">
            <span>Téléphone</span>
            <input
              type="tel"
              name="phone"
              required
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </label>

          <label className="online-order-checkout__field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </label>

          {orderType === "delivery" ? (
            <>
              <label className="online-order-checkout__field">
                <span>Adresse de livraison</span>
                <input
                  type="text"
                  name="address"
                  required
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </label>

              <label className="online-order-checkout__field">
                <span>Numéro de maison</span>
                <input
                  type="text"
                  name="houseNumber"
                  value={form.houseNumber}
                  onChange={(e) => updateField("houseNumber", e.target.value)}
                />
              </label>

              <label className="online-order-checkout__field">
                <span>Code postal</span>
                <input
                  type="text"
                  name="postcode"
                  required
                  value={form.postcode}
                  onChange={(e) => updateField("postcode", e.target.value)}
                />
              </label>

              <label className="online-order-checkout__field">
                <span>Ville (Plaisir et alentours)</span>
                <input
                  type="text"
                  name="city"
                  required
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </label>

              <label className="online-order-checkout__field">
                <span>Notes d&apos;adresse</span>
                <input
                  type="text"
                  name="addressNotes"
                  value={form.addressNotes}
                  onChange={(e) => updateField("addressNotes", e.target.value)}
                />
              </label>
            </>
          ) : null}

          <fieldset className="online-order-checkout__fieldset">
            <legend>Méthode de paiement</legend>
            <div className="online-order-checkout__toggle">
              <button
                type="button"
                className={paymentMethod === "cash" ? "is-active" : ""}
                onClick={() => setPaymentMethod("cash")}
              >
                <span aria-hidden="true">💵</span>
                Espèces
              </button>
              <button
                type="button"
                className={paymentMethod === "card" ? "is-active" : ""}
                onClick={() => setPaymentMethod("card")}
              >
                <span aria-hidden="true">💳</span>
                Carte bancaire
              </button>
            </div>
          </fieldset>

          <label className="online-order-checkout__field">
            <span>Notes supplémentaires</span>
            <textarea
              name="notes"
              rows={4}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </label>

          <div className="online-order-checkout__footer">
            <div className="online-order-checkout__row">
              <span>Livraison</span>
              <span>Gratuite</span>
            </div>
            <div className="online-order-checkout__row online-order-checkout__row--total">
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            <button
              type="submit"
              className="online-order-checkout__submit tst-btn"
              disabled={submitting || !lines.length}
            >
              {submitting ? "Envoi en cours…" : "Confirmer la commande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      {checkoutDialog ? createPortal(checkoutDialog, document.body) : null}

      <Popup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        title={popupState.type === "success" ? "Commande envoyée" : "Commande non envoyée"}
      >
        <p className="tst-text" style={{ margin: 0 }}>
          {popupState.message}
        </p>
      </Popup>
    </>
  );
}

export default OnlineOrderCheckoutModal;
