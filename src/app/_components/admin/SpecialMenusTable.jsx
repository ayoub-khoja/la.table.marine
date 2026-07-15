"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

import Popup from "@components/Popup";

const PAGE_SIZE = 10;

const EMPTY_COURSE = {
  title: "",
  itemsText: "",
};

const EMPTY_FORM = {
  name: "",
  price: "",
  image: "",
  subtitle: "",
  courses: [{ ...EMPTY_COURSE }],
  accompanimentsText: "",
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

function linesToArray(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function coursesToPayload(courses) {
  return courses
    .map((course) => ({
      title: course.title.trim(),
      items: linesToArray(course.itemsText),
    }))
    .filter((course) => course.title && course.items.length);
}

function buildFormPayload(form) {
  return {
    name: form.name,
    price: form.price,
    image: form.image,
    subtitle: form.subtitle,
    courses: coursesToPayload(form.courses),
    accompaniments: linesToArray(form.accompanimentsText),
  };
}

function menuToForm(menu) {
  return {
    name: menu.name || "",
    price: String(menu.price ?? ""),
    image: menu.image || "",
    subtitle: menu.subtitle || "",
    courses: menu.courses?.length
      ? menu.courses.map((course) => ({
          title: course.title || "",
          itemsText: (course.items || []).join("\n"),
        }))
      : [{ ...EMPTY_COURSE }],
    accompanimentsText: (menu.accompaniments || []).join("\n"),
  };
}

const SpecialMenusTable = () => {
  const [menus, setMenus] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
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

  const closeFeedback = () => {
    setFeedbackOpen(false);
  };

  const fetchMenus = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/admin/special-menus?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement.");
      }

      setMenus(data.menus || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
      setMenus([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus(page);
  }, [page, fetchMenus]);

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

  const closeFormModal = () => {
    setFormModalOpen(false);
    setEditingMenuId(null);
    resetForm();
    setSubmitting(false);
  };

  const openAddModal = () => {
    resetForm();
    setEditingMenuId(null);
    setFormModalOpen(true);
  };

  const openEditModal = (menu) => {
    setForm(menuToForm(menu));
    setFormError(null);
    setImageFile(null);
    setImageError(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview("");
    setEditingMenuId(menu.id);
    setFormModalOpen(true);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError(null);
  };

  const handleCourseChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      courses: current.courses.map((course, courseIndex) =>
        courseIndex === index ? { ...course, [field]: value } : course
      ),
    }));
    setFormError(null);
  };

  const addCourse = () => {
    setForm((current) => ({
      ...current,
      courses: [...current.courses, { ...EMPTY_COURSE }],
    }));
  };

  const removeCourse = (index) => {
    setForm((current) => ({
      ...current,
      courses:
        current.courses.length > 1
          ? current.courses.filter((_, courseIndex) => courseIndex !== index)
          : current.courses,
    }));
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

  const openDeleteModal = (menu) => {
    setMenuToDelete(menu);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setMenuToDelete(null);
    setDeleteLoading(false);
  };

  const confirmDelete = async () => {
    if (!menuToDelete) return;

    setDeleteLoading(true);
    setActionLoading(menuToDelete.id);

    try {
      const res = await fetch(`/api/admin/special-menus/${menuToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Suppression impossible.");
      }

      const menuName = menuToDelete.name;
      closeDeleteModal();

      const nextPage = menus.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await fetchMenus(nextPage);
      }

      showFeedback(
        "success",
        "Menu supprimé",
        `Le menu « ${menuName} » a été supprimé avec succès.`
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

    const payload = buildFormPayload(form);
    const isEditing = Boolean(editingMenuId);

    try {
      const res = await fetch(
        isEditing
          ? `/api/admin/special-menus/${editingMenuId}`
          : "/api/admin/special-menus",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            (isEditing
              ? "Impossible de modifier le menu."
              : "Impossible d'ajouter le menu.")
        );
      }

      closeFormModal();
      if (!isEditing) {
        setPage(1);
        await fetchMenus(1);
      } else {
        await fetchMenus(page);
      }
      showFeedback(
        "success",
        isEditing ? "Menu modifié" : "Menu ajouté",
        isEditing
          ? "Le menu spécial a été modifié avec succès."
          : "Le menu spécial a été ajouté avec succès."
      );
    } catch (err) {
      const message = err.message || "Erreur réseau.";
      setFormError(message);
      showFeedback(
        "error",
        isEditing ? "Modification impossible" : "Ajout impossible",
        message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading && !menus.length) {
      return (
        <div className="tst-admin-orders__state" role="status">
          <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          <p>Chargement des menus spéciaux…</p>
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
            onClick={() => fetchMenus(page)}
          >
            Réessayer
          </button>
        </div>
      );
    }

    if (!menus.length) {
      return (
        <div className="tst-admin-orders__state">
          <i className="fas fa-utensils" aria-hidden="true" />
          <p>Aucun menu spécial pour le moment.</p>
          <span className="tst-admin-orders__hint">
            Cliquez sur « Ajouter menu » pour en créer un.
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
                  Prix
                </th>
                <th scope="col">Étapes</th>
                <th scope="col">Ajouté le</th>
                <th scope="col" className="tst-admin-categories__col--actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => {
                const isLoading = actionLoading === menu.id;

                return (
                  <tr key={menu.id}>
                    <td data-label="Nom">
                      <strong>{menu.name}</strong>
                    </td>
                    <td
                      data-label="Prix"
                      className="tst-admin-categories__col--count"
                    >
                      <strong>{menu.priceFormatted}</strong>
                    </td>
                    <td data-label="Étapes">{menu.courses?.length ?? 0}</td>
                    <td data-label="Ajouté le">
                      {formatCreatedAt(menu.createdAt)}
                    </td>
                    <td data-label="Actions" className="tst-admin-categories__col--actions">
                      <div className="tst-admin-categories__actions">
                        <button
                          type="button"
                          className="tst-admin-categories__action"
                          disabled={isLoading}
                          onClick={() => openEditModal(menu)}
                        >
                          <i className="fas fa-pen" aria-hidden="true" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="tst-admin-categories__action tst-admin-categories__action--delete"
                          disabled={isLoading}
                          onClick={() => openDeleteModal(menu)}
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
            aria-label="Pagination des menus spéciaux"
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
          <i className="fas fa-utensils" aria-hidden="true" />
          Tous les menus spéciaux
        </button>
        <button
          type="button"
          className="tst-admin-products__tab"
          onClick={openAddModal}
        >
          <i className="fas fa-plus" aria-hidden="true" />
          Ajouter menu
        </button>
      </div>

      <div className="tst-admin-orders">
        <div className="tst-admin-orders__toolbar">
          <p className="tst-admin-orders__count">
            {(pagination?.total ?? 0) === 1
              ? "1 menu spécial"
              : `${pagination?.total ?? 0} menus spéciaux`}
          </p>
        </div>

        {renderContent()}
      </div>

      <Popup
        open={formModalOpen}
        onClose={closeFormModal}
        title={editingMenuId ? "Modifier le menu spécial" : "Ajouter un menu spécial"}
      >
        <form className="tst-admin-products__form tst-admin-special-menu__form" onSubmit={handleSubmit}>
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
              onChange={handleFieldChange}
              required
              placeholder="Menu Royal, Menu Marine…"
            />
          </label>

          <label className="tst-admin-products__field">
            <span>Prix *</span>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleFieldChange}
              required
              min="0"
              step="0.01"
              placeholder="49"
            />
          </label>

          <label className="tst-admin-products__field">
            <span>Sous-titre</span>
            <input
              type="text"
              name="subtitle"
              value={form.subtitle}
              onChange={handleFieldChange}
              placeholder="Cocktail au choix inclus"
            />
          </label>

          <div className="tst-admin-products__image-section">
            <span className="tst-admin-products__section-label">Image du menu</span>

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
                    alt="Image du menu"
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

          <div className="tst-admin-special-menu__courses">
            <div className="tst-admin-special-menu__courses-head">
              <span className="tst-admin-products__section-label">Étapes du menu *</span>
              <button type="button" className="tst-admin-products__btn tst-admin-products__btn--ghost" onClick={addCourse}>
                Ajouter une étape
              </button>
            </div>

            {form.courses.map((course, index) => (
              <div key={`course-${index}`} className="tst-admin-special-menu__course">
                <div className="tst-admin-special-menu__course-head">
                  <strong>Étape {index + 1}</strong>
                  {form.courses.length > 1 ? (
                    <button
                      type="button"
                      className="tst-admin-categories__action tst-admin-categories__action--delete"
                      onClick={() => removeCourse(index)}
                    >
                      Retirer
                    </button>
                  ) : null}
                </div>

                <label className="tst-admin-products__field">
                  <span>Titre</span>
                  <input
                    type="text"
                    value={course.title}
                    onChange={(e) => handleCourseChange(index, "title", e.target.value)}
                    placeholder="Entrée au choix"
                  />
                </label>

                <label className="tst-admin-products__field">
                  <span>Choix (un par ligne)</span>
                  <textarea
                    value={course.itemsText}
                    onChange={(e) => handleCourseChange(index, "itemsText", e.target.value)}
                    rows={4}
                    placeholder={"Tiramisu maison\nSalade de fruit frais"}
                  />
                </label>
              </div>
            ))}
          </div>

          <label className="tst-admin-products__field">
            <span>Accompagnements au choix (un par ligne)</span>
            <textarea
              name="accompanimentsText"
              value={form.accompanimentsText}
              onChange={handleFieldChange}
              rows={4}
              placeholder={"Pâtes\nRiz\nHaricots verts\nFrites\nLégumes grillés"}
            />
          </label>

          <div className="tst-admin-products__actions">
            <button
              type="button"
              className="tst-admin-products__btn tst-admin-products__btn--ghost"
              onClick={closeFormModal}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="tst-admin-products__btn"
              disabled={submitting}
            >
              {submitting
                ? "Enregistrement…"
                : editingMenuId
                  ? "Enregistrer les modifications"
                  : "Enregistrer"}
            </button>
          </div>
        </form>
      </Popup>

      <Popup
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Supprimer le menu"
      >
        <div className="tst-admin-categories__delete">
          <p className="tst-admin-categories__delete-text">
            Êtes-vous sûr de vouloir supprimer le menu{" "}
            <strong>« {menuToDelete?.name} »</strong> ?
          </p>
          <p className="tst-admin-categories__delete-warning">
            <i className="fas fa-exclamation-triangle" aria-hidden="true" />
            Cette action est définitive et le menu ne sera plus visible sur le
            site.
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

export default SpecialMenusTable;
