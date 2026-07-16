import ProductsTable from "@components/admin/ProductsTable";

export const metadata = {
  title: "Notre carte",
};

const ProduitsPage = () => {
  return (
    <>
      <header className="tst-admin-panel__header">
        <h1>Notre carte</h1>
        <p>Consultez et gérez notre carte, les boissons, les vins et les menus spéciaux du site.</p>
      </header>
      <ProductsTable />
    </>
  );
};

export default ProduitsPage;
