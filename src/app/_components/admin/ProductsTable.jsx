"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import CategoriesTable from "@components/admin/CategoriesTable";
import SpecialMenusTable from "@components/admin/SpecialMenusTable";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  title: "",
  image: "",
  price: "",
  short: "",
  categoryId: "",
};

const PRODUCT_TABS = [
  { id: "list", label: "Tous les produits", icon: "fa-box" },
  { id: "add", label: "Ajouter produit", icon: "fa-plus" },
];

const MAIN_TABS = [
  { id: "products", label: "Produits", icon: "fa-box" },
  { id: "categories", label: "Catégories", icon: "fa-tags" },
  { id: "special-menus", label: "Nos Menus Spéciaux", icon: "fa-utensils" },
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

const ProductsTable = () => {
  const [mainTab, setMainTab] = useState("products");
  const [activeTab, setActiveTab] = useState("list");
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
      });
      const res = await fetch(`/api/admin/categories?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement des catégories.");
      }

      setCategories(data.categories || []);
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const categoryNameById = useMemo(() => {
    return Object.fromEntries(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const fetchProducts = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement.");
      }

      setProducts(data.products || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "list") {
      fetchProducts(page);
    }
  }, [page, activeTab, fetchProducts]);

  useEffect(() => {
    if (activeTab === "add" || activeTab === "list") {
      fetchCategories();
    }
  }, [activeTab, fetchCategories]);

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
    setFormSuccess(null);
  };

  const handleImageSelect = (e) => {
    const selected = e.target.files?.[0] || null;
    setImageFile(selected);
    setImageError(null);
    setFormSuccess(null);

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
    setImageFile(null);
    setImageError(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'ajouter le produit.");
      }

      setForm(EMPTY_FORM);
      setImageFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview("");
      setFormSuccess("Produit ajouté avec succès.");
      setPage(1);
      await fetchProducts(1);
    } catch (err) {
      setFormError(err.message || "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderListTab = () => {
    if (loading && !products.length) {
      return (
        <div className="tst-admin-orders__state" role="status">
          <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          <p>Chargement des produits…</p>
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
            onClick={() => fetchProducts(page)}
          >
            Réessayer
          </button>
        </div>
      );
    }

    if (!products.length) {
      return (
        <div className="tst-admin-orders__state">
          <i className="fas fa-box" aria-hidden="true" />
          <p>Aucun produit pour le moment.</p>
          <span className="tst-admin-orders__hint">
            Utilisez l&apos;onglet « Ajouter produit » pour en créer un.
          </span>
        </div>
      );
    }

    return (
      <>
        <div className="tst-admin-orders__toolbar">
          <p className="tst-admin-orders__count">
            {pagination?.total ?? 0} produit
            {(pagination?.total ?? 0) > 1 ? "s" : ""}
          </p>
        </div>

        <div className="tst-admin-orders__table-wrap">
          <table className="tst-admin-orders__table">
            <thead>
              <tr>
                <th scope="col">Image</th>
                <th scope="col">Titre</th>
                <th scope="col">Catégorie</th>
                <th scope="col">Description</th>
                <th scope="col" className="tst-admin-orders__col--num">
                  Prix
                </th>
                <th scope="col">Ajouté le</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td data-label="Image">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        width={48}
                        height={48}
                        className="tst-admin-products__thumb"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td data-label="Titre">
                    <strong>{product.title}</strong>
                  </td>
                  <td data-label="Catégorie">
                    {categoryNameById[product.categoryId] || product.categorySlug || "—"}
                  </td>
                  <td data-label="Description">
                    {product.short
                      ? product.short.length > 80
                        ? `${product.short.slice(0, 80)}…`
                        : product.short
                      : "—"}
                  </td>
                  <td
                    data-label="Prix"
                    className="tst-admin-orders__col--num"
                  >
                    <strong>{product.priceFormatted}</strong>
                  </td>
                  <td data-label="Ajouté le">
                    {formatCreatedAt(product.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <nav
            className="tst-admin-orders__pagination"
            aria-label="Pagination des produits"
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

  const renderAddTab = () => (
    <div className="tst-admin-products__form-panel">
      <form className="tst-admin-products__form" onSubmit={handleSubmit}>
        {formError ? (
          <p className="tst-admin-products__form-error" role="alert">
            {formError}
          </p>
        ) : null}

        {formSuccess ? (
          <p className="tst-admin-products__form-success" role="status">
            {formSuccess}
          </p>
        ) : null}

        <label className="tst-admin-products__field">
          <span>Catégorie *</span>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleFormChange}
            required
            disabled={categoriesLoading || !categories.length}
          >
            <option value="">
              {categoriesLoading
                ? "Chargement des catégories…"
                : categories.length
                  ? "Sélectionnez une catégorie"
                  : "Aucune catégorie — créez-en une d'abord"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
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
          />
        </label>

        <div className="tst-admin-products__image-section">
          <span className="tst-admin-products__section-label">Image du produit</span>

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
                  alt="Image du produit"
                  width={120}
                  height={120}
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
          <span>Prix (€) *</span>
          <input
            type="text"
            name="price"
            value={form.price}
            onChange={handleFormChange}
            required
            placeholder="12,90"
          />
        </label>

        <label className="tst-admin-products__field">
          <span>Description</span>
          <textarea
            name="short"
            value={form.short}
            onChange={handleFormChange}
            rows={4}
            placeholder="Ingrédients, accompagnements, précisions…"
          />
        </label>

        <div className="tst-admin-products__actions">
          <button
            type="button"
            className="tst-admin-products__btn tst-admin-products__btn--ghost"
            onClick={resetForm}
            disabled={submitting}
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            className="tst-admin-products__btn"
            disabled={submitting}
          >
            {submitting ? "Enregistrement…" : "Enregistrer le produit"}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="tst-admin-products">
      <div
        className="tst-admin-products__main-tabs"
        role="tablist"
        aria-label="Produits, catégories et menus spéciaux"
      >
        {MAIN_TABS.map((tab) => {
          const isActive = mainTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`products-main-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`products-main-panel-${tab.id}`}
              className={`tst-admin-products__main-tab${isActive ? " is-active" : ""}`}
              onClick={() => setMainTab(tab.id)}
            >
              <i className={`fas ${tab.icon}`} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {mainTab === "categories" ? (
        <div
          role="tabpanel"
          id="products-main-panel-categories"
          aria-labelledby="products-main-tab-categories"
        >
          <CategoriesTable />
        </div>
      ) : mainTab === "special-menus" ? (
        <div
          role="tabpanel"
          id="products-main-panel-special-menus"
          aria-labelledby="products-main-tab-special-menus"
        >
          <SpecialMenusTable />
        </div>
      ) : (
        <>
          <div
            className="tst-admin-products__tabs"
            role="tablist"
            aria-label="Gestion des produits"
          >
            {PRODUCT_TABS.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`products-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`products-panel-${tab.id}`}
                  className={`tst-admin-products__tab${isActive ? " is-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`fas ${tab.icon}`} aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="tst-admin-orders">
            <div
              role="tabpanel"
              id={`products-panel-${activeTab}`}
              aria-labelledby={`products-tab-${activeTab}`}
            >
              {activeTab === "list" ? renderListTab() : renderAddTab()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductsTable;
