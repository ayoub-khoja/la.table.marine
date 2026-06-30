import ProductsTable from "@components/admin/ProductsTable";

export const metadata = {
  title: "Produit",
};

const ProduitsPage = () => {
  return (
    <>
      <header className="tst-admin-panel__header">
        <h1>Produit</h1>
        <p>Consultez et gérez tous les produits du site.</p>
      </header>
      <ProductsTable />
    </>
  );
};

export default ProduitsPage;
