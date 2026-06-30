"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 10;

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatAddress(order) {
  const parts = [order.address, order.postcode, order.city].filter(Boolean);
  return parts.join(", ") || "—";
}

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement.");
      }

      setOrders(data.orders || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
      setOrders([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [page, fetchOrders]);

  const toggleExpand = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const goToPage = (next) => {
    if (!pagination) return;
    const target = Math.max(1, Math.min(pagination.totalPages, next));
    if (target !== page) setPage(target);
  };

  if (loading && !orders.length) {
    return (
      <div className="tst-admin-orders__state" role="status">
        <i className="fas fa-spinner fa-spin" aria-hidden="true" />
        <p>Chargement des commandes…</p>
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
          onClick={() => fetchOrders(page)}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="tst-admin-orders__state">
        <i className="fas fa-shopping-bag" aria-hidden="true" />
        <p>Aucune commande pour le moment.</p>
        <span className="tst-admin-orders__hint">
          Les commandes passées sur le site apparaîtront ici.
        </span>
      </div>
    );
  }

  return (
    <div className="tst-admin-orders">
      <div className="tst-admin-orders__toolbar">
        <p className="tst-admin-orders__count">
          {pagination?.total ?? 0} commande
          {(pagination?.total ?? 0) > 1 ? "s" : ""}
        </p>
      </div>

      <div className="tst-admin-orders__table-wrap">
        <table className="tst-admin-orders__table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Client</th>
              <th scope="col">Contact</th>
              <th scope="col">Livraison</th>
              <th scope="col">Paiement</th>
              <th scope="col" className="tst-admin-orders__col--num">
                Total
              </th>
              <th scope="col" className="tst-admin-orders__col--action">
                <span className="visually-hidden">Détails</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isOpen = expandedId === order.id;

              return (
                <Fragment key={order.id}>
                  <tr className={isOpen ? "is-expanded" : ""}>
                    <td data-label="Date">{formatDate(order.createdAt)}</td>
                    <td data-label="Client">
                      <strong>{order.fullName}</strong>
                    </td>
                    <td data-label="Contact">
                      <a href={`mailto:${order.email}`}>{order.email}</a>
                      <br />
                      <a href={`tel:${order.tel}`}>{order.tel}</a>
                    </td>
                    <td data-label="Livraison">{formatAddress(order)}</td>
                    <td data-label="Paiement">
                      {order.paymentLabel || order.payment_method || "—"}
                    </td>
                    <td
                      data-label="Total"
                      className="tst-admin-orders__col--num"
                    >
                      <strong>{order.totalFormatted}</strong>
                    </td>
                    <td className="tst-admin-orders__col--action">
                      <button
                        type="button"
                        className="tst-admin-orders__expand"
                        onClick={() => toggleExpand(order.id)}
                        aria-expanded={isOpen}
                        aria-controls={`order-detail-${order.id}`}
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
                      id={`order-detail-${order.id}`}
                      className="tst-admin-orders__detail-row"
                    >
                      <td colSpan={7}>
                        <div className="tst-admin-orders__detail">
                          <div className="tst-admin-orders__detail-grid">
                            <div>
                              <h3>Articles</h3>
                              <ul className="tst-admin-orders__items">
                                {(order.items || []).map((item, idx) => (
                                  <li key={`${order.id}-item-${idx}`}>
                                    <span>{item.title}</span>
                                    <span>
                                      ×{item.quantity} —{" "}
                                      {item.currency}
                                      {(item.price * item.quantity).toFixed(2)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h3>Informations</h3>
                              <dl className="tst-admin-orders__meta">
                                <div>
                                  <dt>Région</dt>
                                  <dd>{order.state || "—"}</dd>
                                </div>
                                <div>
                                  <dt>Code postal</dt>
                                  <dd>{order.postcode || "—"}</dd>
                                </div>
                                {order.message ? (
                                  <div className="tst-admin-orders__meta--full">
                                    <dt>Notes</dt>
                                    <dd>{order.message}</dd>
                                  </div>
                                ) : null}
                                <div>
                                  <dt>Référence</dt>
                                  <dd>
                                    <code>{order.id}</code>
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
          aria-label="Pagination des commandes"
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

export default OrdersTable;
