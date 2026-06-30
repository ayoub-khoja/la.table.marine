import Link from "next/link";

function formatDateTime(iso) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

const DashboardStats = ({ stats }) => {
  if (!stats) return null;

  const kpis = [
    {
      id: "orders",
      label: "Commandes",
      value: stats.orders.total,
      hint: `${stats.orders.thisMonth} ce mois · ${stats.orders.thisWeek} cette semaine`,
      icon: "fa-shopping-bag",
      href: "/admin/commandes",
      accent: "orders",
    },
    {
      id: "reservations",
      label: "Réservations",
      value: stats.reservations.total,
      hint: `${stats.reservations.thisMonth} ce mois · ${stats.reservations.thisWeek} cette semaine`,
      icon: "fa-calendar-check",
      href: "/admin/reservations",
      accent: "reservations",
    },
    {
      id: "revenue",
      label: "Chiffre d'affaires",
      value: stats.revenue.formattedTotal,
      hint: `${stats.revenue.formattedMonth} ce mois`,
      icon: "fa-chart-line",
      href: "/admin/commandes",
      accent: "revenue",
      isText: true,
    },
    {
      id: "activity",
      label: "Activité (7 jours)",
      value: stats.activity.weekTotal,
      hint: "Commandes + réservations + messages",
      icon: "fa-bolt",
      href: null,
      accent: "activity",
    },
  ];

  return (
    <section className="tst-admin-stats" aria-labelledby="admin-stats-title">
      <div className="tst-admin-stats__section-head">
        <h2 id="admin-stats-title">Statistiques</h2>
        <p>Aperçu de l&apos;activité de votre site en temps réel.</p>
      </div>

      <div className="tst-admin-stats__kpis">
        {kpis.map((kpi) => {
          const inner = (
            <article
              className={`tst-admin-stats__kpi tst-admin-stats__kpi--${kpi.accent}`}
            >
              <div className="tst-admin-stats__kpi-icon" aria-hidden="true">
                <i className={`fas ${kpi.icon}`} />
              </div>
              <div className="tst-admin-stats__kpi-body">
                <span className="tst-admin-stats__kpi-label">{kpi.label}</span>
                <strong
                  className={`tst-admin-stats__kpi-value${kpi.isText ? " tst-admin-stats__kpi-value--sm" : ""}`}
                >
                  {kpi.value}
                </strong>
                <span className="tst-admin-stats__kpi-hint">{kpi.hint}</span>
              </div>
            </article>
          );

          return kpi.href ? (
            <Link key={kpi.id} href={kpi.href} className="tst-admin-stats__kpi-link">
              {inner}
            </Link>
          ) : (
            <div key={kpi.id} className="tst-admin-stats__kpi-link">
              {inner}
            </div>
          );
        })}
      </div>

      <div className="tst-admin-stats__grid">
        <article className="tst-admin-stats__panel">
          <header className="tst-admin-stats__panel-head">
            <h3>Activité des 7 derniers jours</h3>
            <div className="tst-admin-stats__legend">
              <span>
                <i className="tst-admin-stats__dot tst-admin-stats__dot--orders" />
                Commandes
              </span>
              <span>
                <i className="tst-admin-stats__dot tst-admin-stats__dot--reservations" />
                Réservations
              </span>
            </div>
          </header>
          <div className="tst-admin-stats__chart">
            {stats.activity.last7Days.map((day) => {
              const ordersPct = (day.orders / day.max) * 100;
              const resPct = (day.reservations / day.max) * 100;

              return (
                <div key={day.key} className="tst-admin-stats__bar-group">
                  <div
                    className="tst-admin-stats__bars"
                    title={`${day.orders} commande(s), ${day.reservations} réservation(s)`}
                  >
                    <div
                      className="tst-admin-stats__bar tst-admin-stats__bar--orders"
                      style={{ height: `${ordersPct}%` }}
                    />
                    <div
                      className="tst-admin-stats__bar tst-admin-stats__bar--reservations"
                      style={{ height: `${resPct}%` }}
                    />
                  </div>
                  <span className="tst-admin-stats__bar-label">{day.label}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="tst-admin-stats__panel">
          <header className="tst-admin-stats__panel-head">
            <h3>Période en cours</h3>
          </header>
          <ul className="tst-admin-stats__breakdown">
            <li>
              <span className="tst-admin-stats__breakdown-label">
                Commandes ce mois
              </span>
              <strong>{stats.orders.thisMonth}</strong>
            </li>
            <li>
              <span className="tst-admin-stats__breakdown-label">
                Réservations ce mois
              </span>
              <strong>{stats.reservations.thisMonth}</strong>
            </li>
            <li>
              <span className="tst-admin-stats__breakdown-label">
                Commandes cette semaine
              </span>
              <strong>{stats.orders.thisWeek}</strong>
            </li>
            <li>
              <span className="tst-admin-stats__breakdown-label">
                Réservations cette semaine
              </span>
              <strong>{stats.reservations.thisWeek}</strong>
            </li>
            <li>
              <span className="tst-admin-stats__breakdown-label">
                Messages ce mois
              </span>
              <strong>{stats.messages.thisMonth}</strong>
            </li>
            <li>
              <span className="tst-admin-stats__breakdown-label">
                Messages cette semaine
              </span>
              <strong>{stats.messages.thisWeek}</strong>
            </li>
            <li className="tst-admin-stats__breakdown-highlight">
              <span className="tst-admin-stats__breakdown-label">
                CA du mois
              </span>
              <strong>{stats.revenue.formattedMonth}</strong>
            </li>
          </ul>
        </article>
      </div>

      <article className="tst-admin-stats__panel tst-admin-stats__panel--wide">
        <header className="tst-admin-stats__panel-head">
          <h3>Dernière activité</h3>
        </header>
        {stats.recentActivity.length === 0 ? (
          <p className="tst-admin-stats__empty">
            Aucune activité enregistrée pour le moment.
          </p>
        ) : (
          <ul className="tst-admin-stats__activity">
            {stats.recentActivity.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link href={item.href} className="tst-admin-stats__activity-row">
                  <span
                    className={`tst-admin-stats__badge tst-admin-stats__badge--${item.type}`}
                  >
                    {item.typeLabel}
                  </span>
                  <span className="tst-admin-stats__activity-main">
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </span>
                  <time dateTime={item.createdAt}>
                    {formatDateTime(item.createdAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
};

export default DashboardStats;
