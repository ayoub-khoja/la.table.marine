import OrdersTable from "@components/admin/OrdersTable";

export const metadata = {
  title: "Commande",
};

const CommandesPage = () => {
  return (
    <>
      <header className="tst-admin-panel__header">
        <h1>Commande</h1>
        <p>Consultez toutes les commandes passées sur le site.</p>
      </header>
      <OrdersTable />
    </>
  );
};

export default CommandesPage;
