"use client";

import { Formik } from 'formik';
import AppData from "@data/app.json";
import { useState } from 'react';
import Popup from "@components/Popup";
import CartData from "@data/cart.json";

const CheckoutForm = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupState, setPopupState] = useState({ type: "success", message: "" });

  return (
    <>
        {/* contact form */}
        <Formik
        initialValues = {{ firstname: '', lastname: '', email: '', tel: '', company: '', country: '', city: '', state: '', address: '', postcode: '', message: '', payment_method: '3' }}
        validate = { values => {
            const errors = {};
            if (!values.email) {
                errors.email = 'Champ requis';
            } else if (
                !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
            ) {
                errors.email = 'Adresse e-mail invalide';
            }
            return errors;
        }}
        onSubmit = {async ( values, { setSubmitting, resetForm } ) => {
            try {
                const items = (CartData?.items || []).map((item) => ({
                    title: item.title,
                    quantity: Number(item.quantity || 0),
                    price: Number(item.price || 0),
                    currency: item.currency || "$",
                    image: item.image,
                }));

                const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstname: values.firstname,
                        lastname: values.lastname,
                        email: values.email,
                        tel: values.tel,
                        company: values.company,
                        country: values.country,
                        city: values.city,
                        state: values.state,
                        address: values.address,
                        postcode: values.postcode,
                        message: values.message,
                        payment_method: values.payment_method,
                        items,
                    }),
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok || !data?.success) {
                    setPopupState({
                        type: "error",
                        message: data?.error || "Oups ! Un problème est survenu lors de l’envoi de la commande.",
                    });
                    setPopupOpen(true);
                    setSubmitting(false);
                    return;
                }

                setPopupState({
                    type: "success",
                    message: "Merci ! Votre commande a été envoyée. Nous vous contacterons rapidement.",
                });
                setPopupOpen(true);
                resetForm();
            } catch (e) {
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
            setFieldValue,
            /* and other goodies */
        }) => (
        <form onSubmit={handleSubmit} id="checkoutForm" className="tst-checkout-form">
            <div className="tst-mb-30">
                <h5>Détails de facturation</h5>
            </div>
            <div className="row">
                <div className="col-lg-6">
                <div className="tst-group-input">
                    <label>Prénom</label>
                    <input 
                        type="text" 
                        placeholder="Alex"
                        name="firstname" 
                        required="required" 
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.firstname} 
                    />
                </div>
                </div>
                <div className="col-lg-6">
                <div className="tst-group-input">
                    <label>Nom</label>
                    <input 
                        type="text" 
                        placeholder="Adler"
                        name="lastname" 
                        required="required" 
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.lastname} 
                    />
                </div>
                </div>
                <div className="col-lg-6">
                <div className="tst-group-input">
                    <label>Entreprise</label>
                    <input 
                        type="text" 
                        placeholder="Plax ltd"
                        name="company"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.company} 
                    />
                </div>
                </div>
                <div className="col-lg-6">
                <div className="tst-group-input">
                    <label>Pays</label>
                    <input 
                        type="text" 
                        placeholder="Italy"
                        name="country"
                        required="required"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.country} 
                    />
                </div>
                </div>
                <div className="col-lg-6">
                <div className="tst-group-input">
                    <label>Ville</label>
                    <input 
                        type="text" 
                        placeholder="Rome"
                        name="city"
                        required="required"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.city} 
                    />
                </div>
                </div>
                <div className="col-lg-6">
                <div className="tst-group-input">
                    <label>Région / Province</label>
                    <input 
                        type="text" 
                        placeholder="Lazio"
                        name="state"
                        required="required"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.state} 
                    />
                </div>
                </div>
                <div className="col-lg-6">
                <div className="tst-group-input">
                    <label>Adresse</label>
                    <input 
                        type="text" 
                        placeholder="Via Savoia 77"
                        name="address"
                        required="required"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.address} 
                    />
                </div>
                </div>
                <div className="col-lg-6">
                <div className="tst-group-input">
                    <label>Code postal</label>
                    <input 
                        type="text" 
                        placeholder="00198"
                        name="postcode"
                        required="required"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.postcode} 
                    />
                </div>
                </div>
                <div className="col-lg-6">
                <div className="tst-group-input">
                    <label>Téléphone</label>
                    <input 
                        type="tel" 
                        placeholder="1-877-111-2222"
                        name="tel"
                        required="required"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.tel} 
                    />
                </div>
                </div>
                <div className="col-lg-6">
                <div className="tst-group-input">
                    <label>E-mail</label>
                    <input 
                        type="email" 
                        placeholder="yourEmail@gmail.com"
                        name="email"
                        required="required"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.email} 
                    />
                </div>
                </div>
            </div>
            <div className="tst-mb-30">
                <h5>Informations complémentaires</h5>
            </div>
            <div className="tst-group-input">
                <label>Notes de commande</label>
                <textarea 
                    placeholder="Notes supplémentaires"
                    name="message" 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.message} 
                />
            </div>
            <div className="tst-mb-30">
                <h5 className="tst-mb-30">Mode de paiement</h5>
                <ul>
                    {/*
                      <li className="tst-radio">
                        <input type="radio" id="option-1" name="payment_method" value="1" />
                        <label htmlFor="option-1">Virement bancaire</label>
                        <div className="tst-check"></div>
                      </li>
                      <li className="tst-radio">
                        <input type="radio" id="option-2" name="payment_method" value="2" />
                        <label htmlFor="option-2">Paiement par chèque</label>
                        <div className="tst-check"></div>
                      </li>
                    */}
                    <li className="tst-radio">
                        <input
                          type="radio"
                          id="option-3"
                          name="payment_method"
                          value="3"
                          checked={values.payment_method === '3'}
                          onChange={() => setFieldValue('payment_method', '3')}
                        />
                        <label htmlFor="option-3">Paiement à la livraison</label>
                        <div className="tst-check"></div>
                    </li>
                </ul>
            </div>
            {/* button */}
            <button type="submit" className="tst-btn tst-btn-with-icon tst-m-0">
                <span className="tst-icon">
                    <img src="/img/ui/icons/arrow.svg" alt="icon" />
                </span>
                <span>Passer la commande</span>
            </button>
            {/* button end */}
        </form>
        )}
        </Formik>
        {/* contact form end */}

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
};
export default CheckoutForm;