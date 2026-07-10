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

const MessagesTable = () => {
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchMessages = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/admin/messages?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement.");
      }

      setMessages(data.messages || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
      setMessages([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages(page);
  }, [page, fetchMessages]);

  const toggleExpand = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const goToPage = (next) => {
    if (!pagination) return;
    const target = Math.max(1, Math.min(pagination.totalPages, next));
    if (target !== page) setPage(target);
  };

  if (loading && !messages.length) {
    return (
      <div className="tst-admin-orders__state" role="status">
        <i className="fas fa-spinner fa-spin" aria-hidden="true" />
        <p>Chargement des messages…</p>
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
          onClick={() => fetchMessages(page)}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="tst-admin-orders__state">
        <i className="fas fa-envelope" aria-hidden="true" />
        <p>Aucun message pour le moment.</p>
        <span className="tst-admin-orders__hint">
          Les messages envoyés via le formulaire de contact apparaîtront ici.
        </span>
      </div>
    );
  }

  return (
    <div className="tst-admin-orders">
      <div className="tst-admin-orders__toolbar">
        <p className="tst-admin-orders__count">
          {pagination?.total ?? 0} message
          {(pagination?.total ?? 0) > 1 ? "s" : ""}
        </p>
      </div>

      <div className="tst-admin-orders__table-wrap">
        <table className="tst-admin-orders__table">
          <thead>
            <tr>
              <th scope="col">Reçu le</th>
              <th scope="col">Client</th>
              <th scope="col">Contact</th>
              <th scope="col">Aperçu</th>
              <th scope="col" className="tst-admin-orders__col--action">
                <span className="visually-hidden">Détails</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {messages.map((row) => {
              const isOpen = expandedId === row.id;

              return (
                <Fragment key={row.id}>
                  <tr className={isOpen ? "is-expanded" : ""}>
                    <td data-label="Reçu le">
                      {formatCreatedAt(row.createdAt)}
                    </td>
                    <td data-label="Client">
                      <strong>{row.fullName}</strong>
                    </td>
                    <td data-label="Contact">
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                      <br />
                      <a href={`tel:${row.phone}`}>{row.phone}</a>
                    </td>
                    <td data-label="Aperçu">{row.preview}</td>
                    <td className="tst-admin-orders__col--action">
                      <button
                        type="button"
                        className="tst-admin-orders__expand"
                        onClick={() => toggleExpand(row.id)}
                        aria-expanded={isOpen}
                        aria-controls={`message-detail-${row.id}`}
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
                      id={`message-detail-${row.id}`}
                      className="tst-admin-orders__detail-row"
                    >
                      <td colSpan={5}>
                        <div className="tst-admin-orders__detail">
                          <p className="tst-admin-reservations__message">
                            {row.message}
                          </p>
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
          aria-label="Pagination des messages"
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

export default MessagesTable;
