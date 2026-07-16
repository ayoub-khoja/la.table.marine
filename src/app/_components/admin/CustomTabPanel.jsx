"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import MenuItemCard from "@components/menu/MenuItemCard";
import Popup from "@components/Popup";

const PAGE_SIZE = 50;

const EMPTY_FORM = {
  section: "Général",
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

const CustomTabPanel = ({ tab }) => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  const fetchItems = useCallback(async () => {
    if (!tab?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tabId: tab.id,
        page: "1",
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/admin/menu-tab-items?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement.");
      }

      setItems(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [tab?.id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const sections = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const name = item.section || "Général";
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(item);
    }
    return Array.from(map.entries()).map(([name, sectionItems]) => ({
      id: name,
      name,
      items: sectionItems,
    }));
  }, [items]);

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
      const res = await fetch("/api/admin/menu-tab-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tabId: tab.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'ajouter l’article.");
      }

      const savedSection = form.section || "Général";
      closeAddModal();
      await fetchItems();
      setOpenSections((current) => ({ ...current, [savedSection]: true }));
      showFeedback("success", "Ajouté", "L’article a été ajouté.");
    } catch (err) {
      setFormError(err.message || "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/menu-tab-items/${itemToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de supprimer.");
      }

      setDeleteModalOpen(false);
      setItemToDelete(null);
      await fetchItems();
      showFeedback("success", "Supprimé", "L’article a été retiré.");
    } catch (err) {
      showFeedback("error", "Suppression impossible", err.message || "Erreur réseau.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="tst-admin-products__tabs tst-admin-categories__toolbar">
        <button
          type="button"
          className="tst-admin-products__tab is-active"
          aria-current="page"
        >
          <i className={`fas ${tab.icon || "fa-utensils"}`} aria-hidden="true" />
          {tab.label}
        </button>
        <button
          type="button"
          className="tst-admin-products__tab"
          onClick={openAddModal}
        >
          <i className="fas fa-plus" aria-hidden="true" />
          Ajouter
        </button>
      </div>

      <div className="tst-admin-orders">
        <div className="tst-admin-orders__toolbar">
          <p className="tst-admin-orders__count">
            {pagination?.total ?? items.length} article
            {(pagination?.total ?? items.length) > 1 ? "s" : ""}
          </p>
        </div>

        {loading && !items.length ? (
          <div className="tst-admin-orders__state" role="status">
            <i className="fas fa-spinner fa-spin" aria-hidden="true" />
            <p>Chargement…</p>
          </div>
        ) : error ? (
          <div className="tst-admin-orders__state tst-admin-orders__state--error">
            <p>{error}</p>
            <button
              type="button"
              className="tst-admin-orders__retry"
              onClick={fetchItems}
            >
              Réessayer
            </button>
          </div>
        ) : !items.length ? (
          <div className="tst-admin-orders__state">
            <i className="fas fa-utensils" aria-hidden="true" />
            <p>Aucun article dans cet onglet.</p>
            <span className="tst-admin-orders__hint">
              Cliquez sur « Ajouter » pour en créer un.
            </span>
          </div>
        ) : (
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
                    <span className="menu-accordion__name">{section.name}</span>
                    <i
                      className={`fas fa-chevron-${isOpen ? "up" : "down"}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen ? (
                    <div className="menu-accordion__panel">
                      <div className="menu-item-cards">
                        {section.items.map((item) => (
                          <div key={item.id} className="tst-admin-wine-card">
                            <MenuItemCard
                              name={item.title}
                              description={item.short}
                              priceLabel={
                                item.priceFormatted ||
                                formatPreviewPrice(item.price)
                              }
                            />
                            <button
                              type="button"
                              className="tst-admin-categories__action tst-admin-categories__action--delete tst-admin-wine-card__delete"
                              onClick={() => {
                                setItemToDelete(item);
                                setDeleteModalOpen(true);
                              }}
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
        )}
      </div>

      <Popup open={addModalOpen} onClose={closeAddModal} title={`Ajouter — ${tab.label}`}>
        <form className="tst-admin-products__form" onSubmit={handleSubmit}>
          {formError ? (
            <p className="tst-admin-products__form-error" role="alert">
              {formError}
            </p>
          ) : null}

          <label className="tst-admin-products__field">
            <span>Section</span>
            <input
              type="text"
              name="section"
              value={form.section}
              onChange={handleFormChange}
              placeholder="Général"
            />
          </label>

          <label className="tst-admin-products__field">
            <span>Titre *</span>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleFormChange}
              required
            />
          </label>

          <label className="tst-admin-products__field">
            <span>Description</span>
            <textarea
              name="short"
              value={form.short}
              onChange={handleFormChange}
              rows={3}
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
              placeholder="12"
            />
          </label>

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
        onClose={() => !deleteLoading && setDeleteModalOpen(false)}
        title="Supprimer"
      >
        <div className="tst-admin-categories__delete">
          <p className="tst-admin-categories__delete-text">
            Supprimer <strong>« {itemToDelete?.title} »</strong> ?
          </p>
          <div className="tst-admin-products__actions">
            <button
              type="button"
              className="tst-admin-products__btn tst-admin-products__btn--ghost"
              onClick={() => setDeleteModalOpen(false)}
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
        onClose={() => setFeedbackOpen(false)}
        title={feedbackState.title}
      >
        <div
          className={`tst-admin-categories__feedback tst-admin-categories__feedback--${feedbackState.type}`}
        >
          <p>{feedbackState.message}</p>
        </div>
      </Popup>
    </>
  );
};

export default CustomTabPanel;
