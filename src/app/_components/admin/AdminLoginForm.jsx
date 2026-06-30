"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Formik } from "formik";
import AppData from "@data/app.json";
import { ADMIN_DEFAULT_REDIRECT } from "@library/admin/constants";

const AdminLoginForm = () => {
  const { admin } = AppData;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(null);

  const redirectParam = searchParams.get("redirect");

  return (
    <Formik
      initialValues={{ email: "", password: "", remember: false }}
      validate={(values) => {
        const errors = {};
        if (!values.email) {
          errors.email = "Champ requis";
        } else if (
          !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
        ) {
          errors.email = "Adresse e-mail invalide";
        }
        if (!values.password) {
          errors.password = "Champ requis";
        }
        return errors;
      }}
      onSubmit={async (values, { setSubmitting }) => {
        setStatus(null);

        try {
          const res = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: values.email,
              password: values.password,
              remember: values.remember,
              redirect: redirectParam || ADMIN_DEFAULT_REDIRECT,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            setStatus({
              type: "error",
              message: data.error || "Connexion impossible.",
            });
            setSubmitting(false);
            return;
          }

          router.push(data.redirect || ADMIN_DEFAULT_REDIRECT);
          router.refresh();
        } catch {
          setStatus({
            type: "error",
            message: "Erreur réseau. Vérifiez votre connexion.",
          });
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
        <form onSubmit={handleSubmit} className="tst-admin__form" noValidate>
          <div className="tst-admin__field">
            <label htmlFor="admin-email">E-mail</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder={admin.login.emailPlaceholder}
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.email && errors.email && (
              <span className="tst-admin__error">{errors.email}</span>
            )}
          </div>

          <div className="tst-admin__field">
            <label htmlFor="admin-password">Mot de passe</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder={admin.login.passwordPlaceholder}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.password && errors.password && (
              <span className="tst-admin__error">{errors.password}</span>
            )}
          </div>

          <div className="tst-admin__row">
            <label className="tst-admin__remember">
              <input
                type="checkbox"
                name="remember"
                checked={values.remember}
                onChange={handleChange}
              />
              Se souvenir de moi
            </label>
            <span className="tst-admin__forgot tst-admin__forgot--muted">
              {admin.login.forgotPassword}
            </span>
          </div>

          <button
            type="submit"
            className="tst-admin__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Connexion…" : admin.login.submitLabel}
          </button>

          {status && (
            <div
              className={`tst-admin__status${status.type === "error" ? " tst-admin__status--error" : ""}`}
              role="alert"
            >
              {status.message}
            </div>
          )}

          <Link href="/" className="tst-admin__back">
            ← Retour au site
          </Link>
        </form>
      )}
    </Formik>
  );
};

export default AdminLoginForm;
