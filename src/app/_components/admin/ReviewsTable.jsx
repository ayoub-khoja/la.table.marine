"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import ReviewFormPopup from "@components/forms/ReviewFormPopup";

const PAGE_SIZE = 5;

const STATUS_FILTERS = [
  { id: "all", label: "Tous", icon: "fa-layer-group" },
  { id: "pending", label: "En attente", icon: "fa-clock" },
  { id: "approved", label: "Publiés", icon: "fa-check-circle" },
  { id: "rejected", label: "Refusés", icon: "fa-ban" },
];

const STATUS_LABELS = {
  pending: "En attente",
  approved: "Publié",
  rejected: "Refusé",
};

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

function formatDateParts(iso) {
  try {
    const date = new Date(iso);
    return {
      date: new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date),
      time: new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date),
    };
  } catch {
    return { date: "—", time: "" };
  }
}

function formatClientName(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getClientInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function statusClass(status) {
  return `tst-admin-reviews__status tst-admin-reviews__status--${status}`;
}

function getDisplayRange(pagination) {
  if (!pagination?.total) {
    return { from: 0, to: 0 };
  }

  const from = (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.page * pagination.limit, pagination.total);

  return { from, to };
}

function getPageNumbers(current, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, current, current - 1, current + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

const ReviewsTable = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [addPopupOpen, setAddPopupOpen] = useState(false);
  const [editReview, setEditReview] = useState(null);

  const fetchReviews = useCallback(async (pageNum, status) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
        status,
      });
      const res = await fetch(`/api/admin/reviews?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement.");
      }

      setReviews(data.reviews || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
      setReviews([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(page, statusFilter);
  }, [page, statusFilter, fetchReviews]);

  const goToPage = (next) => {
    if (!pagination) return;
    const target = Math.max(1, Math.min(pagination.totalPages, next));
    if (target !== page) setPage(target);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const toggleExpand = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const updateReviewStatus = async (id, status) => {
    setActionLoading(id);

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Action impossible.");
      }

      await fetchReviews(page, statusFilter);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Supprimer définitivement cet avis ?")) return;

    setActionLoading(id);

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Suppression impossible.");
      }

      if (expandedId === id) setExpandedId(null);
      if (editReview?.id === id) setEditReview(null);

      await fetchReviews(page, statusFilter);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewAdded = () => {
    setPage(1);
    setStatusFilter("all");
    fetchReviews(1, "all");
  };

  const handleReviewUpdated = () => {
    setEditReview(null);
    fetchReviews(page, statusFilter);
  };

  const openEdit = (review) => {
    setEditReview(review);
    setExpandedId(review.id);
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const { from, to } = getDisplayRange(pagination);
    const pages = getPageNumbers(pagination.page, pagination.totalPages);

    return (
      <nav
        className="tst-admin-reviews__pagination"
        aria-label="Pagination des avis"
      >
        <p className="tst-admin-reviews__pagination-info">
          Affichage <strong>{from}</strong>–<strong>{to}</strong> sur{" "}
          <strong>{pagination.total}</strong> avis
        </p>

        <div className="tst-admin-reviews__pagination-controls">
          <button
            type="button"
            className="tst-admin-reviews__pagination-btn"
            disabled={!pagination.hasPrev || loading}
            onClick={() => goToPage(page - 1)}
            aria-label="Page précédente"
          >
            <i className="fas fa-chevron-left" aria-hidden="true" />
          </button>

          {pages.map((pageNumber, index) => {
            const prev = pages[index - 1];
            const showEllipsis = prev && pageNumber - prev > 1;

            return (
              <Fragment key={pageNumber}>
                {showEllipsis ? (
                  <span className="tst-admin-reviews__pagination-ellipsis">…</span>
                ) : null}
                <button
                  type="button"
                  className={`tst-admin-reviews__pagination-btn tst-admin-reviews__pagination-btn--page${
                    pageNumber === pagination.page ? " is-active" : ""
                  }`}
                  disabled={loading}
                  onClick={() => goToPage(pageNumber)}
                  aria-current={pageNumber === pagination.page ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              </Fragment>
            );
          })}

          <button
            type="button"
            className="tst-admin-reviews__pagination-btn"
            disabled={!pagination.hasNext || loading}
            onClick={() => goToPage(page + 1)}
            aria-label="Page suivante"
          >
            <i className="fas fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </nav>
    );
  };

  const renderList = () => {
    if (loading && !reviews.length) {
      return (
        <div className="tst-admin-orders__state" role="status">
          <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          <p>Chargement des avis…</p>
        </div>
      );
    }

    if (error && !reviews.length) {
      return (
        <div className="tst-admin-orders__state tst-admin-orders__state--error">
          <i className="fas fa-exclamation-circle" aria-hidden="true" />
          <p>{error}</p>
          <button
            type="button"
            className="tst-admin-orders__retry"
            onClick={() => fetchReviews(page, statusFilter)}
          >
            Réessayer
          </button>
        </div>
      );
    }

    if (!reviews.length) {
      return (
        <div className="tst-admin-reviews__table-card">
          <div className="tst-admin-orders__state">
            <i className="fas fa-star" aria-hidden="true" />
            <p>Aucun avis pour ce filtre.</p>
          </div>
          {renderPagination()}
        </div>
      );
    }

    return (
      <div className="tst-admin-reviews__table-card">
        <div className="tst-admin-orders__table-wrap">
          <table className="tst-admin-orders__table tst-admin-reviews__table">
            <colgroup>
              <col className="tst-admin-reviews__col tst-admin-reviews__col--date" />
              <col className="tst-admin-reviews__col tst-admin-reviews__col--client" />
              <col className="tst-admin-reviews__col tst-admin-reviews__col--title" />
              <col className="tst-admin-reviews__col tst-admin-reviews__col--rating" />
              <col className="tst-admin-reviews__col tst-admin-reviews__col--status" />
              <col className="tst-admin-reviews__col tst-admin-reviews__col--action" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="tst-admin-reviews__th tst-admin-reviews__th--date">
                  <span className="tst-admin-reviews__th-inner">
                    <span className="tst-admin-reviews__th-icon" aria-hidden="true">
                      <i className="fas fa-calendar-alt" />
                    </span>
                    <span className="tst-admin-reviews__th-label">Date</span>
                  </span>
                </th>
                <th scope="col" className="tst-admin-reviews__th tst-admin-reviews__th--client">
                  <span className="tst-admin-reviews__th-inner">
                    <span className="tst-admin-reviews__th-icon" aria-hidden="true">
                      <i className="fas fa-user" />
                    </span>
                    <span className="tst-admin-reviews__th-label">Client</span>
                  </span>
                </th>
                <th scope="col" className="tst-admin-reviews__th tst-admin-reviews__th--title">
                  <span className="tst-admin-reviews__th-inner">
                    <span className="tst-admin-reviews__th-icon" aria-hidden="true">
                      <i className="fas fa-quote-left" />
                    </span>
                    <span className="tst-admin-reviews__th-label">Titre</span>
                  </span>
                </th>
                <th scope="col" className="tst-admin-reviews__th tst-admin-reviews__th--rating">
                  <span className="tst-admin-reviews__th-inner">
                    <span className="tst-admin-reviews__th-icon" aria-hidden="true">
                      <i className="fas fa-star" />
                    </span>
                    <span className="tst-admin-reviews__th-label">Note</span>
                  </span>
                </th>
                <th scope="col" className="tst-admin-reviews__th tst-admin-reviews__th--status">
                  <span className="tst-admin-reviews__th-inner">
                    <span className="tst-admin-reviews__th-icon" aria-hidden="true">
                      <i className="fas fa-flag" />
                    </span>
                    <span className="tst-admin-reviews__th-label">Statut</span>
                  </span>
                </th>
                <th
                  scope="col"
                  className="tst-admin-orders__col--action tst-admin-reviews__th tst-admin-reviews__th--action"
                >
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((row, index) => {
                const isOpen = expandedId === row.id;
                const isLoading = actionLoading === row.id;
                const dateParts = formatDateParts(row.createdAt);
                const clientName = formatClientName(row.name);

                return (
                  <Fragment key={row.id}>
                    <tr
                      className={`${isOpen ? "is-expanded" : ""}${
                        index % 2 === 1 ? " is-striped" : ""
                      }`}
                    >
                      <td data-label="Date" className="tst-admin-reviews__date-cell">
                        <time
                          className="tst-admin-reviews__date"
                          dateTime={row.createdAt}
                          title={formatCreatedAt(row.createdAt)}
                        >
                          <span className="tst-admin-reviews__date-day">
                            {dateParts.date}
                          </span>
                          {dateParts.time ? (
                            <span className="tst-admin-reviews__date-time">
                              {dateParts.time}
                            </span>
                          ) : null}
                        </time>
                      </td>
                      <td data-label="Client" className="tst-admin-reviews__client-cell">
                        <div className="tst-admin-reviews__client">
                          <span
                            className="tst-admin-reviews__avatar"
                            aria-hidden="true"
                          >
                            {getClientInitials(row.name)}
                          </span>
                          <div className="tst-admin-reviews__client-info">
                            <strong>{clientName}</strong>
                            {row.email ? (
                              <a href={`mailto:${row.email}`}>{row.email}</a>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td
                        data-label="Titre"
                        className="tst-admin-reviews__title-cell"
                        title={row.title}
                      >
                        <span className="tst-admin-reviews__title-text">
                          {row.title}
                        </span>
                      </td>
                      <td data-label="Note" className="tst-admin-reviews__rating-cell">
                        <span
                          className="tst-admin-reviews__rating-pill"
                          title={`${row.rating} sur 5`}
                        >
                          <span className="tst-admin-reviews__rating-score">
                            {row.rating}/5
                          </span>
                          <span className="tst-admin-reviews__stars" aria-hidden="true">
                            {"★".repeat(row.rating)}
                            <span className="tst-admin-reviews__stars-empty">
                              {"★".repeat(5 - row.rating)}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td data-label="Statut" className="tst-admin-reviews__status-cell">
                        <span className={statusClass(row.status)}>
                          {STATUS_LABELS[row.status] || row.status}
                        </span>
                      </td>
                      <td className="tst-admin-orders__col--action">
                        <button
                          type="button"
                          className="tst-admin-orders__expand"
                          onClick={() => toggleExpand(row.id)}
                          aria-expanded={isOpen}
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
                      <tr className="tst-admin-orders__detail-row">
                        <td colSpan={6}>
                          <div className="tst-admin-orders__detail tst-admin-reviews__detail">
                            <div className="tst-admin-reviews__detail-content">
                              <h3>Avis complet</h3>
                              <p className="tst-admin-reviews__message">
                                {row.text}
                              </p>
                            </div>
                            <div className="tst-admin-reviews__detail-actions">
                              <h3>Actions</h3>
                              <div className="tst-admin-reviews__actions">
                                <button
                                  type="button"
                                  className="tst-admin-reviews__action tst-admin-reviews__action--edit"
                                  disabled={isLoading}
                                  onClick={() => openEdit(row)}
                                >
                                  <i className="fas fa-pen" aria-hidden="true" />
                                  Modifier
                                </button>
                                {row.status !== "approved" ? (
                                  <button
                                    type="button"
                                    className="tst-admin-reviews__action tst-admin-reviews__action--approve"
                                    disabled={isLoading}
                                    onClick={() =>
                                      updateReviewStatus(row.id, "approved")
                                    }
                                  >
                                    <i className="fas fa-check" aria-hidden="true" />
                                    Publier
                                  </button>
                                ) : null}
                                {row.status !== "rejected" ? (
                                  <button
                                    type="button"
                                    className="tst-admin-reviews__action tst-admin-reviews__action--reject"
                                    disabled={isLoading}
                                    onClick={() =>
                                      updateReviewStatus(row.id, "rejected")
                                    }
                                  >
                                    <i className="fas fa-ban" aria-hidden="true" />
                                    Refuser
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="tst-admin-reviews__action tst-admin-reviews__action--delete"
                                  disabled={isLoading}
                                  onClick={() => deleteReview(row.id)}
                                >
                                  <i className="fas fa-trash" aria-hidden="true" />
                                  Supprimer
                                </button>
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
        {renderPagination()}
      </div>
    );
  };

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://latablemarine.com"
  ).replace(/\/$/, "");
  const googleReviewQrUrl = `${siteUrl}/avis-google`;

  return (
    <div className="tst-admin-orders tst-admin-reviews">
      <div className="tst-admin-menu__permanent tst-admin-reviews__qr">
        <div className="tst-admin-menu__permanent-main">
          <div>
            <strong>QR code avis Google — prêt à imprimer</strong>
            <p>
              <code>{googleReviewQrUrl}</code>
            </p>
            <p className="tst-admin-menu__meta">
              Format présentoir (étoiles, SCANNEZ, couleurs La Table Marine).
              Le client arrive sur /avis-google puis est redirigé vers Google.
              L&apos;URL encodée ne change jamais.
            </p>
            <div className="tst-admin-menu__qr-actions">
              <a
                href="/api/qr-code/avis-google?format=png&variant=branded"
                className="tst-admin-products__btn"
                download
              >
                <i className="fas fa-qrcode" aria-hidden="true" />
                Télécharger le carton PNG
              </a>
              <a
                href="/api/qr-code/avis-google?format=svg&variant=branded"
                className="tst-admin-products__btn tst-admin-products__btn--ghost"
                download
              >
                <i className="fas fa-download" aria-hidden="true" />
                SVG
              </a>
              <a
                href="/api/qr-code/avis-google?format=png&variant=compact"
                className="tst-admin-products__btn tst-admin-products__btn--ghost"
                download
              >
                PNG compact
              </a>
            </div>
          </div>
          <div className="tst-admin-menu__qr-preview tst-admin-reviews__qr-preview">
            <img
              src="/api/qr-code/avis-google?format=png&variant=branded&download=0&v=branded3"
              alt="Aperçu du QR code avis Google La Table Marine"
              width={160}
              height={210}
            />
          </div>
        </div>
      </div>

      <div className="tst-admin-reviews__header">
        <div className="tst-admin-reviews__topbar">
          <div className="tst-admin-reviews__stat">
            <div className="tst-admin-reviews__stat-icon" aria-hidden="true">
              <i className="fas fa-star" />
            </div>
            <div className="tst-admin-reviews__stat-text">
              <strong>{pagination?.total ?? 0}</strong>
              <span>
                {statusFilter === "all"
                  ? "avis au total"
                  : `avis ${STATUS_FILTERS.find((f) => f.id === statusFilter)?.label.toLowerCase()}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="tst-admin-reviews__add-btn"
            onClick={() => setAddPopupOpen(true)}
          >
            <i className="fas fa-plus" aria-hidden="true" />
            Ajouter un avis
          </button>
        </div>

        <div
          className="tst-admin-reviews__tabs"
          role="tablist"
          aria-label="Filtrer par statut"
        >
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={statusFilter === filter.id}
              className={`tst-admin-reviews__tab tst-admin-reviews__tab--${filter.id}${
                statusFilter === filter.id ? " is-active" : ""
              }`}
              onClick={() => handleStatusFilter(filter.id)}
            >
              <i className={`fas ${filter.icon}`} aria-hidden="true" />
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {renderList()}

      <ReviewFormPopup
        variant="admin"
        open={addPopupOpen}
        onClose={() => setAddPopupOpen(false)}
        onSuccess={handleReviewAdded}
      />

      <ReviewFormPopup
        variant="admin"
        editReview={editReview}
        open={Boolean(editReview)}
        onClose={() => setEditReview(null)}
        onSuccess={handleReviewUpdated}
      />
    </div>
  );
};

export default ReviewsTable;
