"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import MenuItemCard from "@components/menu/MenuItemCard";
import Popup from "@components/Popup";
import { WINE_SECTIONS } from "@library/wines/constants";

const PAGE_SIZE = 50;

const EMPTY_FORM = {
  section: "Rouge",
  title: "",
  short: "",
  price: "",
};

function formatPreviewPrice(value) {
  const raw = (value ?? "").toString().trim().replace(",", ".");
  const number = Number(raw);
  if (!Number.isFinite(number) || raw === "") return "0,00€";
  return `${number.toFixed(2).replace(".", ",")}€`;
}

const WineListTable = () => {
  const [wines, setWines] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [wineToDelete, setWineToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackState, setFeedbackState] = useState({
    type: "success",
    title: "",
    message: "",
  });

  const showFeedback = (type, title, message) => {
    setFeedbackState({ type, title, message });
    setFeedbackOpen(true);
  };

  const closeFeedback = () => setFeedbackOpen(false);

  const fetchWines = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/admin/wines?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement.");
      }

      setWines(data.wines || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
      setWines([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWines();
  }, [fetchWines]);

  const sections = useMemo(() => {
    const map = new Map();

    for (const wine of wines) {
      const name = wine.section || "Autres";
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(wine);
    }

    const ordered = [];
    for (const name of WINE_SECTIONS) {
      if (map.has(name)) {
        ordered.push({ id: name, name, items: map.get(name) });
        map.delete(name);
      }
    }
    for (const [name, items] of map.entries()) {
      ordered.push({ id: name, name, items });
    }
    return ordered;
  }, [wines]);

  useEffect(() => {
    if (!sections.length) return;
    setOpenSections((current) => {
      if (Object.keys(current).length) return current;
      return { [sections[0].id]: true };
    });
  }, [sections]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const openAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    resetForm();
    setSubmitting(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError(null);
  };

  const toggleSection = (id) => {
    setOpenSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/wines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'ajouter le vin.");
      }

      const savedSection = form.section;
      closeAddModal();
      await fetchWines();
      if (savedSection) {
        setOpenSections((current) => ({
          ...current,
          [savedSection]: true,
        }));
      }
      showFeedback(
        "success",
        "Vin ajouté",
        "Le vin apparaît dans l’admin et sur la commande en ligne."
      );
    } catch (err) {
      setFormError(err.message || "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (wine) => {
    setWineToDelete(wine);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setWineToDelete(null);
  };

  const handleDelete = async () => {
    if (!wineToDelete) return;

    setDeleteLoading(true);
    setActionLoading(wineToDelete.id);

    try {
      const res = await fetch(`/api/admin/wines/${wineToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de supprimer le vin.");
      }

      setDeleteModalOpen(false);
      setWineToDelete(null);
      await fetchWines();
      showFeedback("success", "Vin supprimé", "Le vin a été retiré de la carte.");
    } catch (err) {
      showFeedback("error", "Suppression impossible", err.message || "Erreur réseau.");
    } finally {
      setDeleteLoading(false);
      setActionLoading(null);
    }
  };

  const renderContent = () => {
    if (loading && !wines.length) {
      return (
        <div className="tst-admin-orders__state" role="status">
          <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          <p>Chargement de la carte des vins…</p>
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
            onClick={fetchWines}
          >
            Réessayer
          </button>
        </div>
      );
    }

    if (!wines.length) {
      return (
        <div className="tst-admin-orders__state">
          <i className="fas fa-wine-glass-alt" aria-hidden="true" />
          <p>La carte des vins est vide.</p>
          <span className="tst-admin-orders__hint">
            Cliquez sur « Ajouter un vin » pour commencer.
          </span>
        </div>
      );
    }

    return (
      <div className="menu-accordion">
        {sections.map((section) => {
          const isOpen = Boolean(openSections[section.id]);

          return (
            <article
              key={section.id}
              className={`menu-accordion__item${isOpen ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="menu-accordion__trigger"
                aria-expanded={isOpen}
                onClick={() => toggleSection(section.id)}
              >
                <span className="menu-accordion__thumb menu-accordion__thumb--wine">
                  <i className="fas fa-wine-glass-alt" aria-hidden="true" />
                </span>
                <span className="menu-accordion__name">{section.name}</span>
                <i
                  className={`fas fa-chevron-${isOpen ? "up" : "down"}`}
                  aria-hidden="true"
                />
              </button>

              {isOpen ? (
                <div className="menu-accordion__panel">
                  <div className="menu-item-cards">
                    {section.items.map((wine) => (
                      <div key={wine.id} className="tst-admin-wine-card">
                        <MenuItemCard
                          name={wine.title}
                          description={wine.short}
                          priceLabel={
                            wine.priceFormatted || formatPreviewPrice(wine.price)
                          }
                        />
                        <button
                          type="button"
                          className="tst-admin-categories__action tst-admin-categories__action--delete tst-admin-wine-card__delete"
                          disabled={actionLoading === wine.id}
                          onClick={() => openDeleteModal(wine)}
                        >
                          <i className="fas fa-trash" aria-hidden="true" />
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="tst-admin-products__tabs tst-admin-categories__toolbar">
        <button
          type="button"
          className="tst-admin-products__tab is-active"
          aria-current="page"
        >
          <i className="fas fa-wine-glass-alt" aria-hidden="true" />
          Toute la carte des vins
        </button>
        <button
          type="button"
          className="tst-admin-products__tab"
          onClick={openAddModal}
        >
          <i className="fas fa-plus" aria-hidden="true" />
          Ajouter un vin
        </button>
      </div>

      <div className="tst-admin-orders">
        <div className="tst-admin-orders__toolbar">
          <p className="tst-admin-orders__count">
            {pagination?.total ?? wines.length} vin
            {(pagination?.total ?? wines.length) > 1 ? "s" : ""}
          </p>
        </div>
        {renderContent()}
      </div>

      <Popup
        open={addModalOpen}
        onClose={closeAddModal}
        title="Ajouter un vin"
      >
        <form className="tst-admin-products__form" onSubmit={handleSubmit}>
          {formError ? (
            <p className="tst-admin-products__form-error" role="alert">
              {formError}
            </p>
          ) : null}

          <label className="tst-admin-products__field">
            <span>Section *</span>
            <select
              name="section"
              value={form.section}
              onChange={handleFormChange}
              required
            >
              {WINE_SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </label>

          <label className="tst-admin-products__field">
            <span>Titre *</span>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleFormChange}
              required
              placeholder="Château Margaux 2015"
            />
          </label>

          <label className="tst-admin-products__field">
            <span>Description</span>
            <textarea
              name="short"
              value={form.short}
              onChange={handleFormChange}
              rows={3}
              placeholder="Bordeaux, notes de fruits noirs…"
            />
          </label>

          <label className="tst-admin-products__field">
            <span>Prix (€) *</span>
            <input
              type="text"
              name="price"
              value={form.price}
              onChange={handleFormChange}
              required
              placeholder="45"
            />
          </label>

          <div className="tst-admin-products__preview-card">
            <span className="tst-admin-products__section-label">
              Aperçu (même affichage que la commande)
            </span>
            <MenuItemCard
              className="menu-item-card--preview"
              name={form.title.trim() || "Titre du vin"}
              description={form.short.trim() || "Description du vin"}
              priceLabel={formatPreviewPrice(form.price)}
            />
          </div>

          <div className="tst-admin-products__actions">
            <button
              type="button"
              className="tst-admin-products__btn tst-admin-products__btn--ghost"
              onClick={closeAddModal}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="tst-admin-products__btn"
              disabled={submitting}
            >
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Popup>

      <Popup
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Supprimer le vin"
      >
        <div className="tst-admin-categories__delete">
          <p className="tst-admin-categories__delete-text">
            Êtes-vous sûr de vouloir supprimer{" "}
            <strong>« {wineToDelete?.title} »</strong> ?
          </p>
          <div className="tst-admin-products__actions">
            <button
              type="button"
              className="tst-admin-products__btn tst-admin-products__btn--ghost"
              onClick={closeDeleteModal}
              disabled={deleteLoading}
            >
              Annuler
            </button>
            <button
              type="button"
              className="tst-admin-products__btn tst-admin-products__btn--danger"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </div>
      </Popup>

      <Popup
        open={feedbackOpen}
        onClose={closeFeedback}
        title={feedbackState.title}
      >
        <div
          className={`tst-admin-categories__feedback tst-admin-categories__feedback--${feedbackState.type}`}
        >
          <i
            className={`fas ${
              feedbackState.type === "success"
                ? "fa-check-circle"
                : "fa-exclamation-circle"
            }`}
            aria-hidden="true"
          />
          <p>{feedbackState.message}</p>
        </div>
      </Popup>
    </>
  );
};

export default WineListTable;
