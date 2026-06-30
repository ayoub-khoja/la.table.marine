import ReservationsTable from "@components/admin/ReservationsTable";

export const metadata = {
  title: "Réservation",
};

const ReservationsPage = () => {
  return (
    <>
      <header className="tst-admin-panel__header">
        <h1>Réservation</h1>
        <p>Gérez les demandes de réservation de table.</p>
      </header>
      <ReservationsTable />
    </>
  );
};

export default ReservationsPage;
