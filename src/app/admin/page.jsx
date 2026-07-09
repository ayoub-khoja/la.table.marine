import { Suspense } from "react";
import Image from "next/image";
import AppData from "@data/app.json";
import AdminLoginForm from "@components/admin/AdminLoginForm";

const AdminLoginPage = () => {
  const { admin } = AppData;

  return (
    <section className="tst-admin">
      <div className="tst-admin__card">
        <Image
          src={admin.logo.image}
          alt={admin.logo.alt}
          width={180}
          height={72}
          className="tst-admin__logo"
          priority
        />
        <h1 className="tst-admin__title">{admin.title}</h1>
        <p className="tst-admin__subtitle">{admin.subtitle}</p>
        <Suspense fallback={<p className="tst-admin__subtitle">Chargement…</p>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </section>
  );
};

export default AdminLoginPage;
