import Link from "next/link";
import DashboardStats from "@components/admin/DashboardStats";
import { getDashboardStats } from "@library/admin/stats";

export const metadata = {
  title: "Tableau de bord",
};

const DashboardPage = async () => {
  const stats = await getDashboardStats();

  return (
    <>
      <header className="tst-admin-panel__header">
        <h1>Tableau de bord</h1>
        <p>Vue d&apos;ensemble de votre espace d&apos;administration.</p>
      </header>

      <div className="tst-admin-panel__cards tst-admin-panel__cards--compact">
        <article className="tst-admin-panel__card">
          <span className="tst-admin-panel__card-label">Commandes</span>
          <strong className="tst-admin-panel__card-value">
            {stats.orders.total}
          </strong>
          <p>
            <Link href="/admin/commandes" className="tst-admin-panel__card-link">
              Voir toutes →
            </Link>
          </p>
        </article>
        <article className="tst-admin-panel__card">
          <span className="tst-admin-panel__card-label">Réservations</span>
          <strong className="tst-admin-panel__card-value">
            {stats.reservations.total}
          </strong>
          <p>
            <Link
              href="/admin/reservations"
              className="tst-admin-panel__card-link"
            >
              Voir toutes →
            </Link>
          </p>
        </article>
        <article className="tst-admin-panel__card">
          <span className="tst-admin-panel__card-label">Messages</span>
          <strong className="tst-admin-panel__card-value">
            {stats.messages.total}
          </strong>
          <p>
            <Link href="/admin/messages" className="tst-admin-panel__card-link">
              Voir tous →
            </Link>
          </p>
        </article>
        <article className="tst-admin-panel__card">
          <span className="tst-admin-panel__card-label">Statut</span>
          <strong className="tst-admin-panel__card-value tst-admin-panel__card-value--ok">
            En ligne
          </strong>
          <p>Session administrateur active.</p>
        </article>
      </div>

      <DashboardStats stats={stats} />
    </>
  );
};

export default DashboardPage;
