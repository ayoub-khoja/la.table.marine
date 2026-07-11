"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { normalizeCustomerMessage } from "@library/email/message";
import {
  OCCASION_LABELS,
  REQUEST_TYPE_LABELS,
} from "@library/reservations/labels";

const PAGE_SIZE = 10;

const SERVICE_FILTERS = [
  { id: "all", label: "Tous les services", icon: "fa-layer-group" },
  { id: "dejeuner", label: "Déjeuner", icon: "fa-sun" },
  { id: "diner", label: "Dîner", icon: "fa-moon" },
];

const PERIOD_OPTIONS = [
  { id: "all", label: "Toutes les périodes" },
  { id: "today", label: "Aujourd'hui" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "upcoming", label: "À venir" },
];

const OCCASION_OPTIONS = [
  { id: "all", label: "Toutes les occasions" },
  ...Object.entries(OCCASION_LABELS).map(([id, label]) => ({ id, label })),
];

const REQUEST_TYPE_OPTIONS = [
  { id: "all", label: "Tous les types" },
  ...Object.entries(REQUEST_TYPE_LABELS).map(([id, label]) => ({ id, label })),
];

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
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [occasionFilter, setOccasionFilter] = useState("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState("all");

  const activeFilters = {
    search,
    service: serviceFilter,
    period: periodFilter,
    occasion: occasionFilter,
    requestType: requestTypeFilter,
  };

  const hasActiveFilters =
    Boolean(search) ||
    serviceFilter !== "all" ||
    periodFilter !== "all" ||
    occasionFilter !== "all" ||
    requestTypeFilter !== "all";

  const fetchReservations = useCallback(async (pageNum, filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
        service: filters.service,
        period: filters.period,
        occasion: filters.occasion,
        requestType: filters.requestType,
      });

      if (filters.search) {
        params.set("q", filters.search);
      }

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
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchReservations(page, activeFilters);
  }, [
    page,
    search,
    serviceFilter,
    periodFilter,
    occasionFilter,
    requestTypeFilter,
    fetchReservations,
  ]);

  const toggleExpand = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const goToPage = (next) => {
    if (!pagination) return;
    const target = Math.max(1, Math.min(pagination.totalPages, next));
    if (target !== page) setPage(target);
  };

  const handleServiceFilter = (service) => {
    setServiceFilter(service);
    setPage(1);
  };

  const handlePeriodFilter = (event) => {
    setPeriodFilter(event.target.value);
    setPage(1);
  };

  const handleOccasionFilter = (event) => {
    setOccasionFilter(event.target.value);
    setPage(1);
  };

  const handleRequestTypeFilter = (event) => {
    setRequestTypeFilter(event.target.value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setServiceFilter("all");
    setPeriodFilter("all");
    setOccasionFilter("all");
    setRequestTypeFilter("all");
    setPage(1);
  };

  const reload = () => {
    fetchReservations(page, activeFilters);
  };

  if (loading && !reservations.length) {
    return (
      <div className="tst-admin-orders tst-admin-reservations">
        <div className="tst-admin-orders__state" role="status">
          <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          <p>Chargement des réservations…</p>
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
    <div className="tst-admin-orders tst-admin-reservations">
      <div className="tst-admin-reservations__header">
        <div className="tst-admin-reservations__topbar">
          <div className="tst-admin-reservations__stat">
            <div className="tst-admin-reservations__stat-icon" aria-hidden="true">
              <i className="fas fa-calendar-check" />
            </div>
            <div className="tst-admin-reservations__stat-text">
              <strong>{pagination?.total ?? 0}</strong>
              <span>
                {hasActiveFilters ? "résultat(s)" : "réservation(s)"}
              </span>
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
              placeholder="Rechercher par nom, e-mail, téléphone ou message…"
              aria-label="Rechercher une réservation"
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
              <span>Occasion</span>
              <select value={occasionFilter} onChange={handleOccasionFilter}>
                {OCCASION_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="tst-admin-reservations__select-wrap">
              <span>Type</span>
              <select value={requestTypeFilter} onChange={handleRequestTypeFilter}>
                {REQUEST_TYPE_OPTIONS.map((option) => (
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
          aria-label="Filtrer par service"
        >
          {SERVICE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={serviceFilter === filter.id}
              className={`tst-admin-reservations__tab tst-admin-reservations__tab--${filter.id}${
                serviceFilter === filter.id ? " is-active" : ""
              }`}
              onClick={(event) => {
                handleServiceFilter(filter.id);
                event.currentTarget.blur();
              }}
            >
              <i className={`fas ${filter.icon}`} aria-hidden="true" />
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {!reservations.length ? (
        <div className="tst-admin-orders__state">
          <i className="fas fa-calendar-check" aria-hidden="true" />
          <p>
            {hasActiveFilters
              ? "Aucune réservation ne correspond à vos filtres."
              : "Aucune réservation pour le moment."}
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
              Les demandes envoyées via le formulaire apparaîtront ici.
            </span>
          )}
        </div>
      ) : (
        <>
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
                  const message = normalizeCustomerMessage(row.message);

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
                                {message ? (
                                  <div>
                                    <h3>Message</h3>
                                    <p className="tst-admin-reservations__message">
                                      {message}
                                    </p>
                                  </div>
                                ) : null}
                                <div>
                                  <h3>Informations</h3>
                                  <dl className="tst-admin-orders__meta">
                                    {row.requestTypeLabel ? (
                                      <div>
                                        <dt>Type de demande</dt>
                                        <dd>{row.requestTypeLabel}</dd>
                                      </div>
                                    ) : null}
                                    {row.occasionLabel ? (
                                      <div>
                                        <dt>Occasion</dt>
                                        <dd>{row.occasionLabel}</dd>
                                      </div>
                                    ) : null}
                                    {row.serviceTypeLabel ? (
                                      <div>
                                        <dt>Service</dt>
                                        <dd>{row.serviceTypeLabel}</dd>
                                      </div>
                                    ) : null}
                                    {row.phone ? (
                                      <div>
                                        <dt>Téléphone</dt>
                                        <dd>
                                          <a href={`tel:${row.phone}`}>{row.phone}</a>
                                        </dd>
                                      </div>
                                    ) : null}
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
        </>
      )}
    </div>
  );
};

export default ReservationsTable;
