"use client";

import { useEffect, useId, useState } from "react";
import Popup from "@components/Popup";

const EMPTY_FORM = {
  name: "",
  email: "",
  title: "",
  text: "",
  rating: 5,
};

const VARIANT_CONFIG = {
  public: {
    title: "Laisser un avis",
    submitLabel: "Envoyer mon avis",
    submittingLabel: "Envoi en cours…",
    successMessage:
      "Merci ! Votre avis sera publié après validation par notre équipe.",
    apiUrl: "/api/reviews",
    nameLabel: "Votre nom *",
    namePlaceholder: "Prénom et nom",
    titleLabel: "Titre de votre avis *",
    textLabel: "Votre avis *",
    textPlaceholder: "Partagez votre expérience au restaurant…",
  },
  admin: {
    title: "Ajouter un avis",
    submitLabel: "Publier l'avis",
    submittingLabel: "Publication…",
    successMessage: "Avis publié avec succès.",
    apiUrl: "/api/admin/reviews",
    nameLabel: "Nom du client *",
    namePlaceholder: "Prénom et nom",
    titleLabel: "Titre de l'avis *",
    textLabel: "Texte de l'avis *",
    textPlaceholder: "Rédigez le témoignage du client…",
  },
  adminEdit: {
    title: "Modifier l'avis",
    submitLabel: "Enregistrer les modifications",
    submittingLabel: "Enregistrement…",
    successMessage: "Avis modifié avec succès.",
    apiUrl: null,
    nameLabel: "Nom du client *",
    namePlaceholder: "Prénom et nom",
    titleLabel: "Titre de l'avis *",
    textLabel: "Texte de l'avis *",
    textPlaceholder: "Rédigez le témoignage du client…",
  },
};

function StarRating({ value, onChange, idPrefix }) {
  const [hovered, setHovered] = useState(null);
  const displayValue = hovered ?? value;

  return (
    <div className="tst-review-stars-wrap">
      <div
        className="tst-review-stars"
        role="radiogroup"
        aria-label="Note"
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= displayValue;

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === value}
              className={`tst-review-stars__btn${isActive ? " is-active" : ""}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
            >
              <i
                className={`${isActive ? "fas" : "far"} fa-star`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
      <span className="tst-review-stars__score" id={`${idPrefix}-score`} aria-live="polite">
        {displayValue}/5
      </span>
    </div>
  );
}

const ReviewFormPopup = ({
  open,
  onClose,
  onSuccess,
  variant = "public",
  editReview = null,
}) => {
  const isEdit = Boolean(editReview?.id);
  const config =
    isEdit
      ? VARIANT_CONFIG.adminEdit
      : VARIANT_CONFIG[variant] || VARIANT_CONFIG.public;
  const fieldId = useId().replace(/:/g, "");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setError(null);
      setSuccess(null);
      setSubmitting(false);
      return;
    }

    if (editReview) {
      setForm({
        name: editReview.name || "",
        email: editReview.email || "",
        title: editReview.title || "",
        text: editReview.text || "",
        rating: Number(editReview.rating) || 5,
      });
    }
  }, [open, editReview]);

  const handleClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const url = isEdit
        ? `/api/admin/reviews/${editReview.id}`
        : config.apiUrl;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error ||
            (isEdit
              ? "Impossible de modifier l'avis."
              : variant === "admin"
                ? "Impossible d'ajouter l'avis."
                : "Impossible d'envoyer votre avis.")
        );
      }

      setSuccess(data.message || config.successMessage);
      setForm(EMPTY_FORM);
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popup open={open} onClose={handleClose} title={config.title}>
      {success ? (
        <div className="tst-review-form__feedback tst-review-form__feedback--success">
          <i className="fas fa-check-circle" aria-hidden="true" />
          <p>{success}</p>
          <button
            type="button"
            className="tst-btn tst-anima-link"
            onClick={handleClose}
          >
            Fermer
          </button>
        </div>
      ) : (
        <form className="tst-review-form" onSubmit={handleSubmit}>
          <div className="tst-review-form__field">
            <label htmlFor={`${fieldId}-name`}>{config.nameLabel}</label>
            <input
              id={`${fieldId}-name`}
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={80}
              placeholder={config.namePlaceholder}
            />
          </div>

          <div className="tst-review-form__field">
            <label htmlFor={`${fieldId}-email`}>E-mail (optionnel)</label>
            <input
              id={`${fieldId}-email`}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              maxLength={120}
              placeholder="votre@email.com"
            />
          </div>

          <div className="tst-review-form__field">
            <label htmlFor={`${fieldId}-title`}>{config.titleLabel}</label>
            <input
              id={`${fieldId}-title`}
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={120}
              placeholder="Ex. : Une soirée parfaite !"
            />
          </div>

          <div className="tst-review-form__field">
            <label htmlFor={`${fieldId}-rating`}>Note *</label>
            <StarRating
              idPrefix={fieldId}
              value={form.rating}
              onChange={(rating) =>
                setForm((current) => ({ ...current, rating }))
              }
            />
          </div>

          <div className="tst-review-form__field">
            <label htmlFor={`${fieldId}-text`}>{config.textLabel}</label>
            <textarea
              id={`${fieldId}-text`}
              name="text"
              value={form.text}
              onChange={handleChange}
              required
              minLength={20}
              maxLength={1000}
              rows={5}
              placeholder={config.textPlaceholder}
            />
          </div>

          {error ? (
            <p className="tst-review-form__error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="tst-btn tst-anima-link tst-btn-full"
            disabled={submitting}
          >
            {submitting ? config.submittingLabel : config.submitLabel}
          </button>
        </form>
      )}
    </Popup>
  );
};

export default ReviewFormPopup;
