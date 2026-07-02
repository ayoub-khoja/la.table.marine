import ReviewsTable from "@components/admin/ReviewsTable";

export const metadata = {
  title: "Avis clients",
};

const AvisPage = () => {
  return (
    <>
      <header className="tst-admin-panel__header">
        <h1>Avis clients</h1>
        <p>Modérez les avis des visiteurs et publiez des témoignages.</p>
      </header>
      <ReviewsTable />
    </>
  );
};

export default AvisPage;
