"use client";

import { Formik } from "formik";
import { useState } from "react";
import Popup from "@components/Popup";

const ReservationForm = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupState, setPopupState] = useState({ type: "success", message: "" });

  return (
    <>
      <Formik
        initialValues={{
          email: "",
          first_name: "",
          last_name: "",
          time: "",
          date: "",
          person: "",
          message: "",
        }}
        validate={(values) => {
          const errors = {};
          if (!values.first_name) errors.first_name = "Champ requis";
          if (!values.last_name) errors.last_name = "Champ requis";
          if (!values.person) errors.person = "Champ requis";
          if (!values.date) errors.date = "Champ requis";
          if (!values.time) errors.time = "Champ requis";
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
            const res = await fetch("/api/reservation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                person: values.person,
                date: values.date,
                time: values.time,
                message: values.message,
              }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data?.success) {
              setPopupState({
                type: "error",
                message:
                  data?.error ||
                  "Oups ! Un problème est survenu lors de l'envoi de la réservation.",
              });
              setPopupOpen(true);
              setSubmitting(false);
              return;
            }

            setPopupState({
              type: "success",
              message:
                "Merci ! Votre demande de réservation a bien été envoyée. Un e-mail de confirmation vous a été adressé.",
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
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit} id="reservationForm">
            <div className="row">
              <div className="col-6 col-md-4">
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
              <div className="col-6 col-md-4">
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
              <div className="col-6 col-md-4">
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
              <div className="col-6 col-md-4">
                <select
                  name="person"
                  className="wide"
                  required
                  value={values.person}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="" disabled>
                    Personnes
                  </option>
                  <option value="1">1 personne</option>
                  <option value="2">2 personnes</option>
                  <option value="3">3 personnes</option>
                  <option value="4">4 personnes</option>
                  <option value="5">5 personnes</option>
                  <option value="6">6 ou plus</option>
                </select>
              </div>
              <div className="col-6 col-md-4">
                <input
                  type="date"
                  name="date"
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.date}
                />
              </div>
              <div className="col-6 col-md-4">
                <select
                  name="time"
                  className="wide"
                  required
                  value={values.time}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="" disabled>
                    Heure
                  </option>
                  <option value="10:00am">10:00 am</option>
                  <option value="11:00am">11:00 am</option>
                  <option value="12:00pm">12:00 pm</option>
                  <option value="1:00pm">1:00 pm</option>
                  <option value="2:00pm">2:00 pm</option>
                  <option value="3:00pm">3:00 pm</option>
                  <option value="4:00pm">4:00 pm</option>
                  <option value="5:00pm">5:00 pm</option>
                  <option value="6:00pm">6:00 pm</option>
                  <option value="7:00pm">7:00 pm</option>
                  <option value="8:00pm">8:00 pm</option>
                  <option value="9:00pm">9:00 pm</option>
                  <option value="10:00pm">10:00 pm</option>
                </select>
              </div>
              <div className="col-12">
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
              {isSubmitting ? "Envoi en cours…" : "Réserver une table"}
            </button>
          </form>
        )}
      </Formik>

      <Popup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        title={
          popupState.type === "success"
            ? "Réservation envoyée"
            : "Réservation non envoyée"
        }
      >
        <p className="tst-text" style={{ margin: 0 }}>
          {popupState.message}
        </p>
      </Popup>
    </>
  );
};

export default ReservationForm;
