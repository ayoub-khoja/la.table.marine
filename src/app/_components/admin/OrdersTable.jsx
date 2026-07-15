"use client";

import { useCallback, useEffect, useState } from "react";

import Popup from "@components/Popup";

const PAGE_SIZE = 10;

const TYPE_FILTERS = [
  { id: "all", label: "Toutes les commandes", icon: "fa-layer-group" },
  { id: "delivery", label: "Livraison", icon: "fa-truck" },
  { id: "takeaway", label: "À emporter", icon: "fa-store" },
];

const PERIOD_OPTIONS = [
  { id: "all", label: "Toutes les périodes" },
  { id: "today", label: "Aujourd'hui" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
];

const PAYMENT_OPTIONS = [
  { id: "all", label: "Tous les paiements" },
  { id: "cash", label: "Espèces" },
  { id: "card", label: "Carte bancaire" },
];

function formatClientName(name) {
  return String(name || "")
    .replace(/\s+-\s*$/, "")
    .trim();
}

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

function formatDateParts(iso) {
  try {
    const date = new Date(iso);
    return {
      date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(date),
      time: new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date),
    };
  } catch {
    return { date: "—", time: "" };
  }
}

function formatAddress(order) {
  const parts = [order.address, order.postcode, order.city].filter(Boolean);
  return parts.join(", ") || "—";
}

function formatItemTotal(item) {
  const currency = item.currency || "€";
  const total = Number(item.price) * Number(item.quantity);
  if (!Number.isFinite(total)) return "—";
  return `${currency}${total.toFixed(2).replace(".", ",")}`;
}

function getOrderTypeMeta(state) {
  if (state === "Livraison") {
    return { label: "Livraison", className: "is-delivery", icon: "fa-truck" };
  }
  if (state === "À emporter") {
    return { label: "À emporter", className: "is-takeaway", icon: "fa-store" };
  }
  return { label: state || "—", className: "", icon: "fa-question" };
}

function getPaymentMeta(order) {
  const label = order.paymentLabel || order.payment_method || "—";
  const method = order.payment_method || "";
  return {
    label,
    className: method === "card" ? "is-card" : method === "cash" ? "is-cash" : "",
    icon: method === "card" ? "fa-credit-card" : "fa-money-bill-wave",
  };
}

function summarizeItems(items = []) {
  const count = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const first = items[0]?.title || "—";
  const extra = items.length > 1 ? ` +${items.length - 1}` : "";
  return { count, preview: `${first}${extra}` };
}

function OrderBadges({ order }) {
  const type = getOrderTypeMeta(order.state);
  const payment = getPaymentMeta(order);

  return (
    <div className="tst-admin-orders__badges">
      <span className={`tst-admin-orders__badge ${type.className}`}>
        <i className={`fas ${type.icon}`} aria-hidden="true" />
        {type.label}
      </span>
      <span className={`tst-admin-orders__badge ${payment.className}`}>
        <i className={`fas ${payment.icon}`} aria-hidden="true" />
        {payment.label}
      </span>
      <span className="tst-admin-orders__badge is-total">
        <i className="fas fa-receipt" aria-hidden="true" />
        {order.totalFormatted}
      </span>
    </div>
  );
}

function OrderDetailContent({ order }) {
  const clientName = formatClientName(order.fullName);
  const summary = summarizeItems(order.items);

  return (
    <div className="tst-admin-orders__detail">
      <OrderBadges order={order} />

      <div className="tst-admin-orders__detail-summary">
        <div>
          <span className="tst-admin-orders__detail-label">Date</span>
          <strong>{formatDate(order.createdAt)}</strong>
        </div>
        <div>
          <span className="tst-admin-orders__detail-label">Articles</span>
          <strong>
            {summary.count} article{summary.count > 1 ? "s" : ""}
          </strong>
        </div>
      </div>

      <div className="tst-admin-orders__detail-grid">
        <div className="tst-admin-orders__detail-card">
          <h3>
            <i className="fas fa-shopping-basket" aria-hidden="true" />
            Articles
          </h3>
          <ul className="tst-admin-orders__items">
            {(order.items || []).map((item, idx) => (
              <li key={`${order.id}-item-${idx}`}>
                <div className="tst-admin-orders__item-title">
                  <span>{item.title}</span>
                  <small>×{item.quantity}</small>
                </div>
                <span className="tst-admin-orders__item-price">
                  {formatItemTotal(item)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="tst-admin-orders__detail-card">
          <h3>
            <i className="fas fa-user" aria-hidden="true" />
            Informations
          </h3>
          <dl className="tst-admin-orders__meta">
            <div>
              <dt>Client</dt>
              <dd>{clientName || "—"}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>
                <a href={`mailto:${order.email}`}>{order.email}</a>
              </dd>
            </div>
            <div>
              <dt>Téléphone</dt>
              <dd>
                <a href={`tel:${order.tel}`}>{order.tel}</a>
              </dd>
            </div>
            <div>
              <dt>Adresse</dt>
              <dd>{formatAddress(order)}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{order.state || "—"}</dd>
            </div>
            <div>
              <dt>Paiement</dt>
              <dd>{order.paymentLabel || order.payment_method || "—"}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>
                <strong>{order.totalFormatted}</strong>
              </dd>
            </div>
            {order.message ? (
              <div className="tst-admin-orders__meta--full">
                <dt>Notes</dt>
                <dd>{order.message}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
}

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const activeFilters = {
    search,
    type: typeFilter,
    period: periodFilter,
    payment: paymentFilter,
  };

  const hasActiveFilters =
    Boolean(search) ||
    typeFilter !== "all" ||
    periodFilter !== "all" ||
    paymentFilter !== "all";

  const fetchOrders = useCallback(async (pageNum, filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
        type: filters.type,
        period: filters.period,
        payment: filters.payment,
      });

      if (filters.search) {
        params.set("q", filters.search);
      }

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
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchOrders(page, activeFilters);
  }, [page, search, typeFilter, periodFilter, paymentFilter, fetchOrders]);

  const goToPage = (next) => {
    if (!pagination) return;
    const target = Math.max(1, Math.min(pagination.totalPages, next));
    if (target !== page) setPage(target);
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
    setPage(1);
  };

  const handlePeriodFilter = (event) => {
    setPeriodFilter(event.target.value);
    setPage(1);
  };

  const handlePaymentFilter = (event) => {
    setPaymentFilter(event.target.value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setTypeFilter("all");
    setPeriodFilter("all");
    setPaymentFilter("all");
    setPage(1);
  };

  const reload = () => {
    fetchOrders(page, activeFilters);
  };

  if (loading && !orders.length && !hasActiveFilters) {
    return (
      <div className="tst-admin-orders tst-admin-reservations">
        <div className="tst-admin-orders__state" role="status">
          <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          <p>Chargement des commandes…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tst-admin-orders tst-admin-reservations">
        <div className="tst-admin-orders__state tst-admin-orders__state--error">
          <i className="fas fa-exclamation-circle" aria-hidden="true" />
          <p>{error}</p>
          <button type="button" className="tst-admin-orders__retry" onClick={reload}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="tst-admin-orders tst-admin-reservations">
        <div className="tst-admin-reservations__header">
          <div className="tst-admin-reservations__topbar">
            <div className="tst-admin-reservations__stat">
              <div className="tst-admin-reservations__stat-icon" aria-hidden="true">
                <i className="fas fa-shopping-bag" />
              </div>
              <div className="tst-admin-reservations__stat-text">
                <strong>{pagination?.total ?? 0}</strong>
                <span>{hasActiveFilters ? "résultat(s)" : "commande(s)"}</span>
              </div>
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                className="tst-admin-reservations__reset"
                onClick={resetFilters}
              >
                <i className="fas fa-times" aria-hidden="true" />
                Réinitialiser les filtres
              </button>
            ) : null}
          </div>

          <div className="tst-admin-reservations__filters">
            <label className="tst-admin-reservations__search">
              <i className="fas fa-search" aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Rechercher par client, e-mail, téléphone, adresse ou référence…"
                aria-label="Rechercher une commande"
              />
            </label>

            <div className="tst-admin-reservations__selects">
              <label className="tst-admin-reservations__select-wrap">
                <span>Période</span>
                <select value={periodFilter} onChange={handlePeriodFilter}>
                  {PERIOD_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tst-admin-reservations__select-wrap">
                <span>Paiement</span>
                <select value={paymentFilter} onChange={handlePaymentFilter}>
                  {PAYMENT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div
            className="tst-admin-reservations__tabs"
            role="tablist"
            aria-label="Filtrer par type de commande"
          >
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={typeFilter === filter.id}
                className={`tst-admin-reservations__tab tst-admin-reservations__tab--${filter.id}${
                  typeFilter === filter.id ? " is-active" : ""
                }`}
                onClick={(event) => {
                  handleTypeFilter(filter.id);
                  event.currentTarget.blur();
                }}
              >
                <i className={`fas ${filter.icon}`} aria-hidden="true" />
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading && orders.length ? (
          <div className="tst-admin-orders__loading-bar" role="status">
            <i className="fas fa-spinner fa-spin" aria-hidden="true" />
            Mise à jour…
          </div>
        ) : null}

        {!orders.length ? (
          <div className="tst-admin-orders__state">
            <i className="fas fa-shopping-bag" aria-hidden="true" />
            <p>
              {hasActiveFilters
                ? "Aucune commande ne correspond à vos filtres."
                : "Aucune commande pour le moment."}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                className="tst-admin-orders__retry"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <span className="tst-admin-orders__hint">
                Les commandes passées sur le site apparaîtront ici.
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="tst-admin-orders__table-wrap">
              <table className="tst-admin-orders__table tst-admin-orders__table--enhanced">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Client</th>
                    <th scope="col">Commande</th>
                    <th scope="col">Livraison</th>
                    <th scope="col">Paiement</th>
                    <th scope="col" className="tst-admin-orders__col--num">
                      Total
                    </th>
                    <th scope="col" className="tst-admin-orders__col--action">
                      <span className="visually-hidden">Voir</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const clientName = formatClientName(order.fullName);
                    const dateParts = formatDateParts(order.createdAt);
                    const summary = summarizeItems(order.items);
                    const type = getOrderTypeMeta(order.state);
                    const payment = getPaymentMeta(order);

                    return (
                      <tr key={order.id}>
                        <td data-label="Date">
                          <div className="tst-admin-orders__date">
                            <strong>{dateParts.date}</strong>
                            <span>{dateParts.time}</span>
                          </div>
                        </td>
                        <td data-label="Client">
                          <div className="tst-admin-orders__client">
                            <strong>{clientName || "—"}</strong>
                            <a href={`mailto:${order.email}`}>{order.email}</a>
                            <a href={`tel:${order.tel}`}>{order.tel}</a>
                          </div>
                        </td>
                        <td data-label="Commande">
                          <div className="tst-admin-orders__order-preview">
                            <span className={`tst-admin-orders__badge ${type.className}`}>
                              <i className={`fas ${type.icon}`} aria-hidden="true" />
                              {type.label}
                            </span>
                            <span className="tst-admin-orders__order-items">
                              {summary.count} art. — {summary.preview}
                            </span>
                          </div>
                        </td>
                        <td data-label="Livraison">
                          <span className="tst-admin-orders__address">
                            {formatAddress(order)}
                          </span>
                        </td>
                        <td data-label="Paiement">
                          <span className={`tst-admin-orders__badge ${payment.className}`}>
                            <i className={`fas ${payment.icon}`} aria-hidden="true" />
                            {payment.label}
                          </span>
                        </td>
                        <td data-label="Total" className="tst-admin-orders__col--num">
                          <strong className="tst-admin-orders__total">
                            {order.totalFormatted}
                          </strong>
                        </td>
                        <td className="tst-admin-orders__col--action">
                          <button
                            type="button"
                            className="tst-admin-orders__view"
                            onClick={() => setSelectedOrder(order)}
                            aria-label={`Voir les détails de la commande de ${clientName || "client"}`}
                          >
                            <i className="fas fa-eye" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 ? (
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
            ) : null}
          </>
        )}
      </div>

      <Popup
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        className="tst-admin-orders-popup"
        title={
          selectedOrder
            ? `Commande — ${formatClientName(selectedOrder.fullName) || "Client"}`
            : "Détails de la commande"
        }
      >
        {selectedOrder ? <OrderDetailContent order={selectedOrder} /> : null}
      </Popup>
    </>
  );
};

export default OrdersTable;
