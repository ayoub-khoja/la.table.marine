"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 10;

function formatCreatedAt(iso) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

const ReservationsTable = () => {
  const [reservations, setReservations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchReservations = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/admin/reservations?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement.");
      }

      setReservations(data.reservations || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
      setReservations([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations(page);
  }, [page, fetchReservations]);

  const toggleExpand = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const goToPage = (next) => {
    if (!pagination) return;
    const target = Math.max(1, Math.min(pagination.totalPages, next));
    if (target !== page) setPage(target);
  };

  if (loading && !reservations.length) {
    return (
      <div className="tst-admin-orders__state" role="status">
        <i className="fas fa-spinner fa-spin" aria-hidden="true" />
        <p>Chargement des réservations…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tst-admin-orders__state tst-admin-orders__state--error">
        <i className="fas fa-exclamation-circle" aria-hidden="true" />
        <p>{error}</p>
        <button
          type="button"
          className="tst-admin-orders__retry"
          onClick={() => fetchReservations(page)}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!reservations.length) {
    return (
      <div className="tst-admin-orders__state">
        <i className="fas fa-calendar-check" aria-hidden="true" />
        <p>Aucune réservation pour le moment.</p>
        <span className="tst-admin-orders__hint">
          Les demandes envoyées via le formulaire apparaîtront ici.
        </span>
      </div>
    );
  }

  return (
    <div className="tst-admin-orders">
      <div className="tst-admin-orders__toolbar">
        <p className="tst-admin-orders__count">
          {pagination?.total ?? 0} réservation
          {(pagination?.total ?? 0) > 1 ? "s" : ""}
        </p>
      </div>

      <div className="tst-admin-orders__table-wrap">
        <table className="tst-admin-orders__table">
          <thead>
            <tr>
              <th scope="col">Reçue le</th>
              <th scope="col">Client</th>
              <th scope="col">Contact</th>
              <th scope="col">Date souhaitée</th>
              <th scope="col">Heure</th>
              <th scope="col">Personnes</th>
              <th scope="col" className="tst-admin-orders__col--action">
                <span className="visually-hidden">Détails</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((row) => {
              const isOpen = expandedId === row.id;

              return (
                <Fragment key={row.id}>
                  <tr className={isOpen ? "is-expanded" : ""}>
                    <td data-label="Reçue le">
                      {formatCreatedAt(row.createdAt)}
                    </td>
                    <td data-label="Client">
                      <strong>{row.fullName}</strong>
                    </td>
                    <td data-label="Contact">
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                    </td>
                    <td data-label="Date">{row.dateFormatted || row.date}</td>
                    <td data-label="Heure">{row.time}</td>
                    <td data-label="Personnes">{row.personLabel}</td>
                    <td className="tst-admin-orders__col--action">
                      <button
                        type="button"
                        className="tst-admin-orders__expand"
                        onClick={() => toggleExpand(row.id)}
                        aria-expanded={isOpen}
                        aria-controls={`reservation-detail-${row.id}`}
                      >
                        <i
                          className={`fas fa-chevron-${isOpen ? "up" : "down"}`}
                          aria-hidden="true"
                        />
                        <span>{isOpen ? "Masquer" : "Détails"}</span>
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr
                      id={`reservation-detail-${row.id}`}
                      className="tst-admin-orders__detail-row"
                    >
                      <td colSpan={7}>
                        <div className="tst-admin-orders__detail">
                          <div className="tst-admin-orders__detail-grid">
                            <div>
                              <h3>Message</h3>
                              <p className="tst-admin-reservations__message">
                                {row.message || "—"}
                              </p>
                            </div>
                            <div>
                              <h3>Informations</h3>
                              <dl className="tst-admin-orders__meta">
                                <div>
                                  <dt>Date (ISO)</dt>
                                  <dd>{row.date}</dd>
                                </div>
                                <div>
                                  <dt>Référence</dt>
                                  <dd>
                                    <code>{row.id}</code>
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <nav
          className="tst-admin-orders__pagination"
          aria-label="Pagination des réservations"
        >
          <button
            type="button"
            disabled={!pagination.hasPrev || loading}
            onClick={() => goToPage(page - 1)}
          >
            <i className="fas fa-chevron-left" aria-hidden="true" />
            Précédent
          </button>
          <span>
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNext || loading}
            onClick={() => goToPage(page + 1)}
          >
            Suivant
            <i className="fas fa-chevron-right" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default ReservationsTable;
