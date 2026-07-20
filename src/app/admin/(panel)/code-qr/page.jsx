import QrCodesPanel from "@components/admin/QrCodesPanel";

export const metadata = {
  title: "Code QR",
};

const CodeQrPage = () => {
  return (
    <>
      <header className="tst-admin-panel__header">
        <h1>Code QR</h1>
        <p>
          Tous les QR codes du site, prêts à imprimer ou à partager avec vos
          clients.
        </p>
      </header>
      <QrCodesPanel />
    </>
  );
};

export default CodeQrPage;
