"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

import Popup from "@components/Popup";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: "",
  image: "",
  accompanimentsText: "",
};

function linesToArray(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildCategoryPayload(form) {
  return {
    name: form.name,
    image: form.image,
    accompaniments: linesToArray(form.accompanimentsText),
  };
}

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

const CategoriesTable = () => {
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteProductCount, setDeleteProductCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackState, setFeedbackState] = useState({
    type: "success",
    title: "",
    message: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);

  const showFeedback = (type, title, message) => {
    setFeedbackState({ type, title, message });
    setFeedbackOpen(true);
  };

  const closeFeedback = () => {
    setFeedbackOpen(false);
  };

  const fetchCategories = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/admin/categories?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement.");
      }

      setCategories(data.categories || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
      setCategories([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(page);
  }, [page, fetchCategories]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const goToPage = (next) => {
    if (!pagination) return;
    const target = Math.max(1, Math.min(pagination.totalPages, next));
    if (target !== page) setPage(target);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError(null);
  };

  const handleImageSelect = (e) => {
    const selected = e.target.files?.[0] || null;
    setImageFile(selected);
    setImageError(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    if (selected) {
      setImagePreview(URL.createObjectURL(selected));
    } else {
      setImagePreview("");
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      setImageError("Sélectionnez une image.");
      return;
    }

    setUploadingImage(true);
    setImageError(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'enregistrer l'image.");
      }

      setForm((current) => ({ ...current, image: data.url }));
      setImageFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview("");
    } catch (err) {
      setImageError(err.message || "Erreur réseau.");
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setImageFile(null);
    setImageError(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview("");
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    resetForm();
    setSubmitting(false);
  };

  const openAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const openDeleteModal = async (category) => {
    setCategoryToDelete(category);
    setDeleteProductCount(0);
    setDeleteModalOpen(true);

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`);
      const data = await res.json();

      if (res.ok) {
        setDeleteProductCount(data.productCount ?? 0);
      }
    } catch {
      /* ignore count fetch errors */
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
    setDeleteProductCount(0);
    setDeleteLoading(false);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    setDeleteLoading(true);
    setActionLoading(categoryToDelete.id);

    try {
      const res = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Suppression impossible.");
      }

      const deletedProducts = data.deletedProducts ?? 0;
      const categoryName = categoryToDelete.name;

      closeDeleteModal();

      const nextPage =
        categories.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await fetchCategories(nextPage);
      }

      showFeedback(
        "success",
        "Catégorie supprimée",
        deletedProducts > 0
          ? `La catégorie « ${categoryName} » et ${deletedProducts} produit${deletedProducts > 1 ? "s" : ""} associé${deletedProducts > 1 ? "s" : ""} ont été supprimés.`
          : `La catégorie « ${categoryName} » a été supprimée avec succès.`
      );
    } catch (err) {
      showFeedback(
        "error",
        "Suppression impossible",
        err.message || "Erreur réseau."
      );
    } finally {
      setDeleteLoading(false);
      setActionLoading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCategoryPayload(form)),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'ajouter la catégorie.");
      }

      closeAddModal();
      setPage(1);
      await fetchCategories(1);
      showFeedback(
        "success",
        "Catégorie ajoutée",
        "La catégorie a été ajoutée avec succès."
      );
    } catch (err) {
      const message = err.message || "Erreur réseau.";
      setFormError(message);
      showFeedback("error", "Ajout impossible", message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading && !categories.length) {
      return (
        <div className="tst-admin-orders__state" role="status">
          <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          <p>Chargement des catégories…</p>
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
            onClick={() => fetchCategories(page)}
          >
            Réessayer
          </button>
        </div>
      );
    }

    if (!categories.length) {
      return (
        <div className="tst-admin-orders__state">
          <i className="fas fa-tags" aria-hidden="true" />
          <p>Aucune catégorie pour le moment.</p>
          <span className="tst-admin-orders__hint">
            Cliquez sur « Ajouter catégorie » pour en créer une.
          </span>
        </div>
      );
    }

    return (
      <>
        <div className="tst-admin-orders__table-wrap">
          <table className="tst-admin-orders__table">
            <thead>
              <tr>
                <th scope="col">Nom</th>
                <th scope="col" className="tst-admin-categories__col--count">
                  Produits
                </th>
                <th scope="col">Ajoutée le</th>
                <th scope="col" className="tst-admin-categories__col--actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const isLoading = actionLoading === category.id;

                return (
                  <tr key={category.id}>
                    <td data-label="Nom">
                      <strong>{category.name}</strong>
                    </td>
                    <td
                      data-label="Produits"
                      className="tst-admin-categories__col--count"
                    >
                      <strong>{category.productCount ?? 0}</strong>
                    </td>
                    <td data-label="Ajoutée le">
                      {formatCreatedAt(category.createdAt)}
                    </td>
                    <td data-label="Actions" className="tst-admin-categories__col--actions">
                      <div className="tst-admin-categories__actions">
                        <button
                          type="button"
                          className="tst-admin-categories__action tst-admin-categories__action--delete"
                          disabled={isLoading}
                          onClick={() => openDeleteModal(category)}
                        >
                          <i className="fas fa-trash" aria-hidden="true" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <nav
            className="tst-admin-orders__pagination"
            aria-label="Pagination des catégories"
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
          <i className="fas fa-tags" aria-hidden="true" />
          Toutes les catégories
        </button>
        <button
          type="button"
          className="tst-admin-products__tab"
          onClick={openAddModal}
        >
          <i className="fas fa-plus" aria-hidden="true" />
          Ajouter catégorie
        </button>
      </div>

      <div className="tst-admin-orders">
        <div className="tst-admin-orders__toolbar">
          <p className="tst-admin-orders__count">
            {pagination?.total ?? 0} catégorie
            {(pagination?.total ?? 0) > 1 ? "s" : ""}
          </p>
        </div>

        {renderContent()}
      </div>

      <Popup
        open={addModalOpen}
        onClose={closeAddModal}
        title="Ajouter une catégorie"
      >
        <form className="tst-admin-products__form" onSubmit={handleSubmit}>
          {formError ? (
            <p className="tst-admin-products__form-error" role="alert">
              {formError}
            </p>
          ) : null}

          <label className="tst-admin-products__field">
            <span>Nom *</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              required
              placeholder="Entrée, Dessert, Salade…"
            />
          </label>

          <div className="tst-admin-products__image-section">
            <span className="tst-admin-products__section-label">Image de la catégorie</span>

            <label className="tst-admin-upload__dropzone">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
              />
              <i className="fas fa-image" aria-hidden="true" />
              <span>
                {imageFile
                  ? imageFile.name
                  : "Cliquez pour choisir une image (JPG, PNG, WEBP, GIF — max. 4 Mo)"}
              </span>
            </label>

            {(imagePreview || form.image) && (
              <div className="tst-admin-products__preview">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Aperçu" />
                ) : form.image ? (
                  <Image
                    src={form.image}
                    alt="Image de la catégorie"
                    width={160}
                    height={100}
                  />
                ) : null}
              </div>
            )}

            {imageError ? (
              <p className="tst-admin-products__form-error" role="alert">
                {imageError}
              </p>
            ) : null}

            {imageFile ? (
              <button
                type="button"
                className="tst-admin-products__btn"
                onClick={handleImageUpload}
                disabled={uploadingImage}
              >
                {uploadingImage ? "Téléversement…" : "Téléverser l'image"}
              </button>
            ) : null}
          </div>

          <label className="tst-admin-products__field">
            <span>Accompagnements (optionnel)</span>
            <textarea
              name="accompanimentsText"
              value={form.accompanimentsText}
              onChange={handleFormChange}
              rows={4}
              placeholder={"Riz\nHaricots verts\nFrites\nLégumes grillés"}
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
        onClose={closeDeleteModal}
        title="Supprimer la catégorie"
      >
        <div className="tst-admin-categories__delete">
          <p className="tst-admin-categories__delete-text">
            Êtes-vous sûr de vouloir supprimer la catégorie{" "}
            <strong>« {categoryToDelete?.name} »</strong> ?
          </p>
          <p className="tst-admin-categories__delete-warning">
            <i className="fas fa-exclamation-triangle" aria-hidden="true" />
            Attention : si vous supprimez cette catégorie, tous les produits qui
            y sont associés seront également supprimés.
            {deleteProductCount > 0
              ? ` (${deleteProductCount} produit${deleteProductCount > 1 ? "s" : ""} concerné${deleteProductCount > 1 ? "s" : ""})`
              : ""}
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
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      </Popup>

      <Popup
        open={feedbackOpen}
        onClose={closeFeedback}
        title={feedbackState.title}
      >
        <p
          className={`tst-text tst-admin-categories__feedback tst-admin-categories__feedback--${feedbackState.type}`}
          style={{ margin: 0 }}
        >
          <i
            className={`fas ${
              feedbackState.type === "success"
                ? "fa-check-circle"
                : "fa-exclamation-circle"
            }`}
            aria-hidden="true"
          />
          {feedbackState.message}
        </p>
      </Popup>
    </>
  );
};

export default CategoriesTable;
