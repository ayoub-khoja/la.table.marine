"use client";

import { Formik } from 'formik';
import AppData from "@data/app.json";

const ReservationForm = () => {
  return (
    <>
        {/* contact form */}
        <Formik
        initialValues = {{ email: '', first_name: '', last_name: '', time: '', date: '', person: '', message: '' }}
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
        onSubmit = {( values, { setSubmitting } ) => {
            const form = document.getElementById("reservationForm");
            const status = document.getElementById("reservationFormStatus");
            const data = new FormData();

            data.append('first_name', values.first_name);
            data.append('last_name', values.last_name);
            data.append('email', values.email);
            data.append('person', values.person);
            data.append('time', values.time);
            data.append('date', values.date);
            data.append('message', values.message);

            fetch(form.action, {
                method: 'POST',
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    status.innerHTML = "<h5>Merci, votre demande a bien été envoyée !</h5>"
                    form.reset()
                } else {
                    response.json().then(data => {
                        if (Object.hasOwn(data, 'errors')) {
                            status.innerHTML = "<h5 style='color:red;'>"+data["errors"].map(error => error["message"]).join(", ")+"</h5>"
                        } else {
                            status.innerHTML = "<h5 style='color:red;'>Oups ! Un problème est survenu lors de l’envoi du formulaire.</h5>"
                        }
                    })
                }
            }).catch(error => {
                status.innerHTML = "<h5 style='color:red;'>Oups ! Un problème est survenu lors de l’envoi du formulaire.</h5>"
            });

            setSubmitting(false);
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
            /* and other goodies */
        }) => (
        <form onSubmit={handleSubmit} id="reservationForm" action={AppData.settings.formspreeURL}>
            <div className="row">
                <div className="col-6 col-md-4">
                    <input
                        type="text" 
                        placeholder="Prénom"
                        name="first_name" 
                        required="required" 
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
                        required="required" 
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
                        required="required"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.email} 
                    />
                </div>
                <div className="col-6 col-md-4">
                    <select name="person" className="wide">
                        <option>Personnes</option>
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
                        required="required"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.date} 
                    />
                </div>
                <div className="col-6 col-md-4">
                    <select name="time" className="wide">
                        <option>Heure</option>
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
                        required="required"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.message}
                        rows="4" 
                    />
                </div>
            </div>
            <button className="tst-btn" type="submit" name="button">Réserver une table</button>

            <div id="reservationFormStatus" className="tst-form-status"></div>
        </form>
        )}
        </Formik>
        {/* contact form end */}
    </>
  );
};
export default ReservationForm;