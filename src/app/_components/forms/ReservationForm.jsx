"use client";

import { Formik, useFormikContext } from "formik";
import { useEffect, useMemo, useRef, useState } from "react";
import Popup from "@components/Popup";

import {
  trackReservationCompleted,
  trackReservationStarted,
} from "@library/cookies/track-analytics-events";

import {
  OCCASION_LABELS,
  SERVICE_TYPE_LABELS,
} from "@library/reservations/labels";

const OCCASIONS = [
  { value: "diner-prive", label: OCCASION_LABELS["diner-prive"], icon: "fa-user-friends" },
  { value: "soiree", label: OCCASION_LABELS.soiree, icon: "fa-glass-cheers" },
  { value: "anniversaire", label: OCCASION_LABELS.anniversaire, icon: "fa-birthday-cake" },
  { value: "autre", label: OCCASION_LABELS.autre, icon: "fa-square" },
];

const SERVICE_TYPES = [
  { value: "dejeuner", label: SERVICE_TYPE_LABELS.dejeuner, icon: "fa-sun" },
  { value: "diner", label: SERVICE_TYPE_LABELS.diner, icon: "fa-moon" },
];

function buildTimeSlots(service) {
  const toHHMM = (d) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
      2,
      "0"
    )}`;

  const base = new Date(2000, 0, 1);
  let startH = 12;
  let startM = 0;
  let endH = 14;
  let endM = 0;

  if (service === "diner") {
    startH = 19;
    startM = 0;
    endH = 22;
    endM = 0;
  }

  const start = new Date(base);
  start.setHours(startH, startM, 0, 0);
  const end = new Date(base);
  end.setHours(endH, endM, 0, 0);

  const slots = [];
  for (let t = new Date(start); t <= end; t = new Date(t.getTime() + 15 * 60000)) {
    slots.push(toHHMM(t));
  }
  return slots;
}

function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLabel(isoDate) {
  if (!isoDate) return "";
  try {
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(y, m - 1, d));
  } catch {
    return isoDate;
  }
}

const STEP_REQUIRED = {
  1: ["requestType", "occasion", "serviceType", "date", "time"],
  2: ["first_name", "last_name", "email", "phone", "person"],
  3: [],
};

function isStepComplete(values, step) {
  const fields = STEP_REQUIRED[step] || [];
  return fields.every((key) => Boolean((values?.[key] || "").toString().trim()));
}

function AutoAdvance({ step, setStep, isSubmitting, pausedUntilTs }) {
  const { values } = useFormikContext();
  const canAdvance = useMemo(() => isStepComplete(values, step), [values, step]);

  useEffect(() => {
    if (isSubmitting) return;
    if (pausedUntilTs && Date.now() < pausedUntilTs) return;
    if (!canAdvance) return;
    if (step >= 3) return;

    const id = window.setTimeout(() => {
      setStep((s) => (s === step ? Math.min(3, s + 1) : s));
    }, 250);

    return () => window.clearTimeout(id);
  }, [canAdvance, isSubmitting, setStep, step]);

  return null;
}

const ReservationForm = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupState, setPopupState] = useState({ type: "success", message: "" });
  const [step, setStep] = useState(1);
  const [autoPauseUntil, setAutoPauseUntil] = useState(0);
  const hasTrackedStart = useRef(false);
  const minReservationDate = useMemo(() => todayLocalISO(), []);

  useEffect(() => {
    if (hasTrackedStart.current) return;
    hasTrackedStart.current = true;
    trackReservationStarted({
      page_path: typeof window !== "undefined" ? window.location.pathname : "/reservation",
    });
  }, []);

  const validateAll = (values) => {
    const errors = {};
    if (!values.requestType) errors.requestType = "Champ requis";
    if (!values.occasion) errors.occasion = "Champ requis";
    if (!values.serviceType) errors.serviceType = "Champ requis";
    if (!values.first_name) errors.first_name = "Champ requis";
    if (!values.last_name) errors.last_name = "Champ requis";
    if (!values.phone) errors.phone = "Champ requis";
    if (!values.person) errors.person = "Champ requis";
    if (!values.date) errors.date = "Champ requis";
    if (!values.time) errors.time = "Champ requis";
    if (!values.email) {
      errors.email = "Champ requis";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
    ) {
      errors.email = "Adresse e-mail invalide";
    }
    return errors;
  };

  const stepFields = {
    1: ["requestType", "occasion", "serviceType", "date", "time"],
    2: ["first_name", "last_name", "email", "phone", "person"],
    3: [],
  };

  const validateStep = (values, currentStep) => {
    const errors = validateAll(values);
    const fields = stepFields[currentStep] || [];
    return fields.reduce((acc, key) => {
      if (errors[key]) acc[key] = errors[key];
      return acc;
    }, {});
  };

  return (
    <>
      <Formik
        initialValues={{
          requestType: "reservation",
          occasion: "",
          serviceType: "dejeuner",
          email: "",
          phone: "",
          first_name: "",
          last_name: "",
          time: "",
          date: "",
          person: "",
          reservation_note: "",
        }}
        validate={(values) => validateStep(values, step)}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            const res = await fetch("/api/reservation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                phone: values.phone,
                person: values.person,
                date: values.date,
                time: values.time,
                requestType: values.requestType,
                occasion: values.occasion,
                serviceType: values.serviceType,
                message: (values.reservation_note || "").trim(),
                website: "",
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
                data?.emailSent === false
                  ? "Merci ! Votre demande de réservation a bien été envoyée. Nous vous confirmerons rapidement."
                  : "Merci ! Votre demande de réservation a bien été envoyée. Un e-mail de confirmation vous a été adressé.",
            });
            trackReservationCompleted({
              request_type: values.requestType,
              service_type: values.serviceType,
              occasion: values.occasion,
            });
            setPopupOpen(true);
            resetForm();
            setStep(1);
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
          setTouched,
          setFieldValue,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit} id="reservationForm" className="tst-reservation-wizard">
            <AutoAdvance
              step={step}
              setStep={setStep}
              isSubmitting={isSubmitting}
              pausedUntilTs={autoPauseUntil}
            />
            <div className="tst-mb-30" aria-label="Progression du formulaire">
              <div className="tst-text tst-text-sm" style={{ opacity: 0.8 }}>
                Étape {step} sur 3
              </div>
              <div
                style={{
                  height: 6,
                  background: "rgba(0,0,0,0.08)",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(step / 3) * 100}%`,
                    background: "#014196",
                    transition: "width 220ms ease",
                  }}
                />
              </div>
            </div>

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

              {step === 1 ? (
                <>
                  <div className="col-12 tst-mb-15">
                    <h3 className="tst-mb-0">Type de demande</h3>
                    <p className="tst-text tst-text-sm" style={{ marginTop: 8 }}>
                      Choisissez le type de votre demande.
                    </p>
                  </div>

                  <div className="col-12">
                    <div className="tst-reservation-wizard__toggle" role="group">
                      <button
                        type="button"
                        className={`tst-reservation-wizard__pill${
                          values.requestType === "reservation" ? " is-active" : ""
                        }`}
                        onClick={(e) => {
                          setFieldValue("requestType", "reservation");
                          e.currentTarget.blur();
                        }}
                      >
                        <i className="fas fa-calendar-alt" aria-hidden="true" />
                        Réservation
                      </button>
                      <button
                        type="button"
                        className={`tst-reservation-wizard__pill${
                          values.requestType === "autre" ? " is-active" : ""
                        }`}
                        onClick={(e) => {
                          setFieldValue("requestType", "autre");
                          e.currentTarget.blur();
                        }}
                      >
                        <i className="far fa-comment" aria-hidden="true" />
                        Autre
                      </button>
                    </div>
                  </div>

                  {touched.requestType && errors.requestType ? (
                    <div className="col-12">
                      <p className="tst-reservation-wizard__error" role="alert">
                        Veuillez choisir un type de demande.
                      </p>
                    </div>
                  ) : null}

                  {values.requestType ? (
                    <>
                      <div className="col-12 tst-mt-30 tst-mb-15">
                        <h3 className="tst-mb-0">Occasion</h3>
                        <p
                          className="tst-text tst-text-sm"
                          style={{ marginTop: 8 }}
                        >
                          Sélectionnez l’occasion de votre réservation.
                        </p>
                      </div>

                      <div className="col-12">
                        <div className="tst-reservation-wizard__grid">
                          {OCCASIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className={`tst-reservation-wizard__card${
                                values.occasion === opt.value ? " is-active" : ""
                              }`}
                              onClick={(e) => {
                                setFieldValue("occasion", opt.value);
                                e.currentTarget.blur();
                              }}
                              aria-pressed={values.occasion === opt.value}
                            >
                              <span className="tst-reservation-wizard__card-icon">
                                <i className={`fas ${opt.icon}`} aria-hidden="true" />
                              </span>
                              <span className="tst-reservation-wizard__card-label">
                                {opt.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {touched.occasion && errors.occasion ? (
                        <div className="col-12">
                          <p className="tst-reservation-wizard__error" role="alert">
                            Veuillez sélectionner une occasion.
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {values.occasion ? (
                    <>
                      <div className="col-12 tst-mt-30 tst-mb-15">
                        <h3 className="tst-mb-0">Date et Horaire</h3>
                        <p
                          className="tst-text tst-text-sm"
                          style={{ marginTop: 8 }}
                        >
                          Choisissez le service, la date et l’horaire souhaité.
                        </p>
                      </div>

                      <div className="col-12">
                        <div className="tst-reservation-wizard__toggle" role="group">
                          {SERVICE_TYPES.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className={`tst-reservation-wizard__pill${
                                values.serviceType === opt.value ? " is-active" : ""
                              }`}
                              onClick={(e) => {
                                setFieldValue("serviceType", opt.value);
                                setFieldValue("time", "");
                                e.currentTarget.blur();
                              }}
                              aria-pressed={values.serviceType === opt.value}
                            >
                              <i className={`fas ${opt.icon}`} aria-hidden="true" />
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {touched.serviceType && errors.serviceType ? (
                        <div className="col-12">
                          <p className="tst-reservation-wizard__error" role="alert">
                            Veuillez choisir un service (déjeuner ou dîner).
                          </p>
                        </div>
                      ) : null}

                      <div className="col-12">
                        <label className="tst-reservation-wizard__date-field" htmlFor="reservation-date">
                          <span className="tst-reservation-wizard__date-label">Date</span>
                          <div className="tst-reservation-wizard__date-trigger">
                            <span
                              className={`tst-reservation-wizard__date-value${
                                values.date ? "" : " is-placeholder"
                              }`}
                            >
                              {values.date
                                ? formatDateLabel(values.date)
                                : "Choisir une date"}
                            </span>
                            <i
                              className="fas fa-calendar-alt tst-reservation-wizard__date-icon"
                              aria-hidden="true"
                            />
                            <input
                              id="reservation-date"
                              type="date"
                              name="date"
                              className="tst-reservation-wizard__date-input"
                              required
                              min={minReservationDate}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              value={values.date}
                              aria-invalid={Boolean(touched.date && errors.date)}
                            />
                          </div>
                        </label>
                      </div>

                      {touched.date && errors.date ? (
                        <div className="col-12">
                          <p className="tst-reservation-wizard__error" role="alert">
                            Veuillez sélectionner une date.
                          </p>
                        </div>
                      ) : null}

                      {values.date ? (
                        <div className="col-12">
                          <div
                            className="tst-reservation-wizard__slots"
                            role="list"
                          >
                            {buildTimeSlots(values.serviceType).map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                className={`tst-reservation-wizard__slot${
                                  values.time === slot ? " is-active" : ""
                                }`}
                                onClick={(e) => {
                                  setFieldValue("time", slot);
                                  e.currentTarget.blur();
                                }}
                                role="listitem"
                                aria-pressed={values.time === slot}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="col-12">
                          <p className="tst-reservation-wizard__hint">
                            Sélectionnez d’abord une date pour afficher les horaires disponibles.
                          </p>
                        </div>
                      )}

                      {touched.time && errors.time ? (
                        <div className="col-12">
                          <p className="tst-reservation-wizard__error" role="alert">
                            Veuillez choisir une heure.
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="col-12 tst-mb-15">
                    <h3 className="tst-mb-0">Coordonnées</h3>
                    <p className="tst-text tst-text-sm" style={{ marginTop: 8 }}>
                      Renseignez vos coordonnées pour que nous puissions vous confirmer.
                    </p>
                  </div>
                  <div className="col-6 col-md-4">
                    <input
                      type="text"
                      placeholder="Prénom"
                      name="first_name"
                      required
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.first_name}
                      aria-invalid={Boolean(touched.first_name && errors.first_name)}
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
                      aria-invalid={Boolean(touched.last_name && errors.last_name)}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <input
                      type="email"
                      placeholder="E-mail"
                      name="email"
                      required
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.email}
                      aria-invalid={Boolean(touched.email && errors.email)}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <input
                      type="tel"
                      placeholder="Téléphone"
                      name="phone"
                      required
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.phone}
                      aria-invalid={Boolean(touched.phone && errors.phone)}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <select
                      name="person"
                      className="wide"
                      required
                      value={values.person}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={Boolean(touched.person && errors.person)}
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

                  {touched.first_name && errors.first_name ? (
                    <div className="col-12">
                      <p className="tst-reservation-wizard__error" role="alert">
                        Veuillez renseigner votre prénom.
                      </p>
                    </div>
                  ) : null}

                  {touched.last_name && errors.last_name ? (
                    <div className="col-12">
                      <p className="tst-reservation-wizard__error" role="alert">
                        Veuillez renseigner votre nom.
                      </p>
                    </div>
                  ) : null}

                  {touched.email && errors.email ? (
                    <div className="col-12">
                      <p className="tst-reservation-wizard__error" role="alert">
                        Veuillez renseigner une adresse e-mail valide.
                      </p>
                    </div>
                  ) : null}

                  {touched.phone && errors.phone ? (
                    <div className="col-12">
                      <p className="tst-reservation-wizard__error" role="alert">
                        Veuillez renseigner votre numéro de téléphone.
                      </p>
                    </div>
                  ) : null}

                  {touched.person && errors.person ? (
                    <div className="col-12">
                      <p className="tst-reservation-wizard__error" role="alert">
                        Veuillez sélectionner le nombre de personnes.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}

              <div className="col-12" style={{ display: step === 3 ? "block" : "none" }}>
                <div className="tst-mb-15">
                  <h3 className="tst-mb-0">Message optionnel</h3>
                  <p className="tst-text tst-text-sm" style={{ marginTop: 8 }}>
                    Allergies, préférences ou demande spéciale.
                  </p>
                </div>
                <textarea
                  placeholder="Ex. table près de la fenêtre, allergie aux fruits de mer…"
                  name="reservation_note"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.reservation_note}
                  rows="4"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  aria-label="Message optionnel pour votre réservation"
                  aria-invalid={Boolean(
                    touched.reservation_note && errors.reservation_note
                  )}
                />
              </div>
            </div>

            <div
              className="tst-mt-30"
              style={{ display: "flex", gap: 12, alignItems: "center" }}
            >
              {step > 1 ? (
                <button
                  className="tst-btn tst-btn--sm"
                  type="button"
                  onClick={() => {
                    setAutoPauseUntil(Date.now() + 1200);
                    setStep((s) => Math.max(1, s - 1));
                  }}
                  disabled={isSubmitting}
                >
                  Retour
                </button>
              ) : null}

              {step < 3 ? (
                <button
                  className="tst-btn"
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setAutoPauseUntil(Date.now() + 600);
                    const fields = stepFields[step] || [];
                    const nextTouched = fields.reduce((acc, key) => {
                      acc[key] = true;
                      return acc;
                    }, {});
                    await setTouched({ ...touched, ...nextTouched }, true);

                    const stepErrors = validateStep(values, step);
                    if (Object.keys(stepErrors).length > 0) return;
                    setStep((s) => Math.min(3, s + 1));
                  }}
                >
                  Suivant →
                </button>
              ) : (
                <button
                  className="tst-btn"
                  type="submit"
                  name="button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Envoi en cours…" : "Réserver une table"}
                </button>
              )}
            </div>
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
