import MenuPanel from "@components/admin/MenuPanel";

export const metadata = {
  title: "Menu",
};

const MenuPage = () => {
  return (
    <>
      <header className="tst-admin-panel__header">
        <h1>Menu PDF & QR code</h1>
        <p>
          Importez ou remplacez la carte PDF. L&apos;URL publique /menu et le QR
          code restent permanents.
        </p>
      </header>
      <MenuPanel />
    </>
  );
};

export default MenuPage;
