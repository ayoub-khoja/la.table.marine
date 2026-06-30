import MenuPanel from "@components/admin/MenuPanel";

export const metadata = {
  title: "Menu",
};

const MenuPage = () => {
  return (
    <>
      <header className="tst-admin-panel__header">
        <h1>Menu</h1>
        <p>Téléversez et gérez le menu du restaurant au format PDF.</p>
      </header>
      <MenuPanel />
    </>
  );
};

export default MenuPage;
