"use client";

import { Formik } from "formik";
import { useState } from "react";
import Popup from "@components/Popup";

const ContactForm = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupState, setPopupState] = useState({ type: "success", message: "" });

  return (
    <>
      <Formik
        initialValues={{
          email: "",
          phone: "",
          first_name: "",
          last_name: "",
          message: "",
        }}
        validate={(values) => {
          const errors = {};
          if (!values.first_name) errors.first_name = "Champ requis";
          if (!values.last_name) errors.last_name = "Champ requis";
          if (!values.phone) errors.phone = "Champ requis";
          if (!values.message) errors.message = "Champ requis";
          if (!values.email) {
            errors.email = "Champ requis";
          } else if (
            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
          ) {
            errors.email = "Adresse e-mail invalide";
          }
          return errors;
        }}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            const res = await fetch("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                phone: values.phone,
                message: values.message,
                website: "",
              }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data?.success) {
              setPopupState({
                type: "error",
                message:
                  data?.error ||
                  "Oups ! Un problème est survenu lors de l'envoi du message.",
              });
              setPopupOpen(true);
              setSubmitting(false);
              return;
            }

            setPopupState({
              type: "success",
              message:
                data?.emailSent === false
                  ? "Merci ! Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais."
                  : "Merci ! Votre message a bien été envoyé. Un e-mail de confirmation vous a été adressé.",
            });
            setPopupOpen(true);
            resetForm();
          } catch {
            setPopupState({
              type: "error",
              message: "Erreur réseau. Réessayez plus tard.",
            });
            setPopupOpen(true);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit} id="contactForm">
            <div className="row">
              <input
                type="text"
                name="website"
                value=""
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ display: "none" }}
                readOnly
              />
              <div className="col-lg-6">
                <input
                  type="text"
                  placeholder="Prénom"
                  name="first_name"
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.first_name}
                />
              </div>
              <div className="col-lg-6">
                <input
                  type="text"
                  placeholder="Nom"
                  name="last_name"
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.last_name}
                />
              </div>
              <div className="col-lg-6">
                <input
                  type="tel"
                  placeholder="Téléphone"
                  name="phone"
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.phone}
                />
              </div>
              <div className="col-lg-6">
                <input
                  type="email"
                  placeholder="E-mail"
                  name="email"
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.email}
                />
              </div>
              <div className="col-lg-12">
                <textarea
                  placeholder="Message"
                  name="message"
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.message}
                  rows="4"
                />
              </div>
            </div>
            <button
              className="tst-btn"
              type="submit"
              name="button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Envoi en cours…" : "Envoyer le message"}
            </button>
          </form>
        )}
      </Formik>

      <Popup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        title={
          popupState.type === "success"
            ? "Message envoyé"
            : "Envoi impossible"
        }
      >
        <p className="tst-text" style={{ margin: 0 }}>
          {popupState.message}
        </p>
      </Popup>
    </>
  );
};

export default ContactForm;
