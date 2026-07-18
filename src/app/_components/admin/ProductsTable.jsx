"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import CategoriesTable from "@components/admin/CategoriesTable";
import CustomTabPanel from "@components/admin/CustomTabPanel";
import SpecialMenusTable from "@components/admin/SpecialMenusTable";
import WineListTable from "@components/admin/WineListTable";
import MenuItemCard from "@components/menu/MenuItemCard";
import Popup from "@components/Popup";

const PAGE_SIZE = 100;

const EMPTY_FORM = {
  title: "",
  image: "",
  price: "",
  short: "",
  categoryId: "",
};

const EMPTY_TAB_FORM = {
  label: "",
};

function formatPreviewPrice(value) {
  const raw = (value ?? "").toString().trim().replace(",", ".");
  const number = Number(raw);
  if (!Number.isFinite(number) || raw === "") return "0,00€";
  return `${number.toFixed(2).replace(".", ",")}€`;
}

const ProductsTable = () => {
  const [mainTabs, setMainTabs] = useState([]);
  const [tabsLoading, setTabsLoading] = useState(true);
  const [mainTab, setMainTab] = useState("products");
  const [addTabModalOpen, setAddTabModalOpen] = useState(false);
  const [tabForm, setTabForm] = useState(EMPTY_TAB_FORM);
  const [tabFormError, setTabFormError] = useState(null);
  const [tabSubmitting, setTabSubmitting] = useState(false);
  const [tabActionLoading, setTabActionLoading] = useState(null);
  const [deleteTabModalOpen, setDeleteTabModalOpen] = useState(false);
  const [tabToDelete, setTabToDelete] = useState(null);
  const [deleteTabLoading, setDeleteTabLoading] = useState(false);
  const [productActionLoading, setProductActionLoading] = useState(null);
  const [deleteProductModalOpen, setDeleteProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteProductLoading, setDeleteProductLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
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

  const closeFeedback = () => {
    setFeedbackOpen(false);
  };

  const fetchTabs = useCallback(async () => {
    setTabsLoading(true);

    try {
      const res = await fetch("/api/admin/menu-tabs");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de charger les onglets.");
      }

      const tabs = data.tabs || [];
      setMainTabs(tabs);

      setMainTab((current) => {
        if (tabs.some((tab) => tab.id === current)) return current;
        return tabs[0]?.id || "products";
      });
    } catch {
      setMainTabs([]);
    } finally {
      setTabsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  const activeTabMeta = useMemo(
    () => mainTabs.find((tab) => tab.id === mainTab) || null,
    [mainTabs, mainTab]
  );

  const openAddTabModal = () => {
    setTabForm(EMPTY_TAB_FORM);
    setTabFormError(null);
    setAddTabModalOpen(true);
  };

  const closeAddTabModal = () => {
    setAddTabModalOpen(false);
    setTabForm(EMPTY_TAB_FORM);
    setTabFormError(null);
    setTabSubmitting(false);
  };

  const handleTabFormChange = (e) => {
    const { name, value } = e.target;
    setTabForm((current) => ({ ...current, [name]: value }));
    setTabFormError(null);
  };

  const handleCreateTab = async (e) => {
    e.preventDefault();
    setTabFormError(null);
    setTabSubmitting(true);

    try {
      const res = await fetch("/api/admin/menu-tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: tabForm.label }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'ajouter l’onglet.");
      }

      closeAddTabModal();
      await fetchTabs();
      if (data.tab?.id) setMainTab(data.tab.id);
      showFeedback("success", "Onglet ajouté", "Le nouvel onglet est disponible.");
    } catch (err) {
      setTabFormError(err.message || "Erreur réseau.");
    } finally {
      setTabSubmitting(false);
    }
  };

  const handleMoveTab = async (tabId, direction) => {
    setTabActionLoading(`${tabId}-${direction}`);

    try {
      const res = await fetch(`/api/admin/menu-tabs/${tabId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de déplacer l’onglet.");
      }

      if (data.tabs) {
        setMainTabs(data.tabs);
      } else {
        await fetchTabs();
      }
    } catch (err) {
      showFeedback("error", "Déplacement impossible", err.message || "Erreur réseau.");
    } finally {
      setTabActionLoading(null);
    }
  };

  const openDeleteTabModal = (tab) => {
    setTabToDelete(tab);
    setDeleteTabModalOpen(true);
  };

  const closeDeleteTabModal = () => {
    if (deleteTabLoading) return;
    setDeleteTabModalOpen(false);
    setTabToDelete(null);
  };

  const handleDeleteTab = async () => {
    if (!tabToDelete) return;

    setDeleteTabLoading(true);

    try {
      const res = await fetch(`/api/admin/menu-tabs/${tabToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de supprimer l’onglet.");
      }

      setDeleteTabModalOpen(false);
      setTabToDelete(null);
      await fetchTabs();
      showFeedback("success", "Onglet supprimé", "L’onglet a été retiré.");
    } catch (err) {
      showFeedback("error", "Suppression impossible", err.message || "Erreur réseau.");
    } finally {
      setDeleteTabLoading(false);
    }
  };

  const handleMoveProduct = async (productId, direction) => {
    setProductActionLoading(`${productId}-${direction}`);

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de déplacer l’article.");
      }

      await fetchProducts();
    } catch (err) {
      showFeedback("error", "Déplacement impossible", err.message || "Erreur réseau.");
    } finally {
      setProductActionLoading(null);
    }
  };

  const openDeleteProductModal = (product) => {
    setProductToDelete(product);
    setDeleteProductModalOpen(true);
  };

  const closeDeleteProductModal = () => {
    if (deleteProductLoading) return;
    setDeleteProductModalOpen(false);
    setProductToDelete(null);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setDeleteProductLoading(true);

    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de supprimer l’article.");
      }

      setDeleteProductModalOpen(false);
      setProductToDelete(null);
      await fetchProducts();
      showFeedback("success", "Article supprimé", "L’article a été retiré de la carte.");
    } catch (err) {
      showFeedback("error", "Suppression impossible", err.message || "Erreur réseau.");
    } finally {
      setDeleteProductLoading(false);
    }
  };

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
        throw new Error(data.error || "Erreur lors du chargement des boissons.");
      }

      setCategories(data.categories || []);
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: "1",
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
    if (activeTabMeta?.kind !== "products") return;
    fetchProducts();
    fetchCategories();
  }, [activeTabMeta?.kind, fetchProducts, fetchCategories]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!categories.length) return;
    setOpenSections((current) => {
      if (Object.keys(current).length) return current;
      const firstId = categories[0]?.id;
      return firstId ? { [firstId]: true } : {};
    });
  }, [categories]);

  const sections = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      items: products.filter((product) => product.categoryId === category.id),
    }));
  }, [categories, products]);

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
    fetchCategories();
    setAddModalOpen(true);
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
      let imageUrl = form.image;

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch("/api/admin/products/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Impossible d'enregistrer l'image.");
        }

        imageUrl = uploadData.url;
      }

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image: imageUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'ajouter à notre carte.");
      }

      const savedCategoryId = form.categoryId;
      closeAddModal();
      await fetchProducts();
      if (savedCategoryId) {
        setOpenSections((current) => ({
          ...current,
          [savedCategoryId]: true,
        }));
      }
      showFeedback(
        "success",
        "Ajouté",
        "L’article apparaît maintenant dans l’admin et sur la commande en ligne."
      );
    } catch (err) {
      setFormError(err.message || "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderList = () => {
    if (loading && !products.length && !categories.length) {
      return (
        <div className="tst-admin-orders__state" role="status">
          <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          <p>Chargement de notre carte…</p>
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
            onClick={fetchProducts}
          >
            Réessayer
          </button>
        </div>
      );
    }

    if (!categories.length) {
      return (
        <div className="tst-admin-orders__state">
          <i className="fas fa-glass-martini-alt" aria-hidden="true" />
          <p>Aucune section boisson pour le moment.</p>
          <span className="tst-admin-orders__hint">
            Allez dans l’onglet « Boissons » pour créer une section (ex. Cocktails),
            puis ajoutez les articles ici.
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
                <span className="menu-accordion__thumb">
                  {section.image ? (
                    <Image
                      src={section.image}
                      alt=""
                      width={80}
                      height={80}
                      sizes="56px"
                    />
                  ) : null}
                </span>
                <span className="menu-accordion__name">{section.name}</span>
                <i
                  className={`fas fa-chevron-${isOpen ? "up" : "down"}`}
                  aria-hidden="true"
                />
              </button>

              {isOpen ? (
                <div className="menu-accordion__panel">
                  {section.items.length ? (
                    <div className="menu-item-cards">
                      {section.items.map((product, itemIndex) => (
                        <div key={product.id} className="tst-admin-wine-card">
                          <MenuItemCard
                            name={product.title}
                            description={product.short}
                            priceLabel={
                              product.priceFormatted ||
                              formatPreviewPrice(product.price)
                            }
                          />
                          <div className="tst-admin-wine-card__actions">
                            <button
                              type="button"
                              className="tst-admin-categories__action"
                              aria-label={`Monter ${product.title}`}
                              disabled={
                                itemIndex === 0 || Boolean(productActionLoading)
                              }
                              onClick={() => handleMoveProduct(product.id, "up")}
                            >
                              <i className="fas fa-chevron-up" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="tst-admin-categories__action"
                              aria-label={`Descendre ${product.title}`}
                              disabled={
                                itemIndex === section.items.length - 1 ||
                                Boolean(productActionLoading)
                              }
                              onClick={() =>
                                handleMoveProduct(product.id, "down")
                              }
                            >
                              <i
                                className="fas fa-chevron-down"
                                aria-hidden="true"
                              />
                            </button>
                            <button
                              type="button"
                              className="tst-admin-categories__action tst-admin-categories__action--delete"
                              onClick={() => openDeleteProductModal(product)}
                              disabled={Boolean(productActionLoading)}
                            >
                              <i className="fas fa-trash" aria-hidden="true" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="tst-admin-orders__hint">
                      Aucun article — cliquez sur « Ajouter à notre carte ».
                    </p>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="tst-admin-products">
      <div
        className="tst-admin-products__main-tabs"
        role="tablist"
        aria-label="Onglets de la carte"
      >
        {tabsLoading ? (
          <span className="tst-admin-products__tabs-loading">Chargement des onglets…</span>
        ) : (
          mainTabs.map((tab, index) => {
            const isActive = mainTab === tab.id;
            const canMoveLeft = index > 0;
            const canMoveRight = index < mainTabs.length - 1;
            const canDelete = mainTabs.length > 1;

            return (
              <div
                key={tab.id}
                className={`tst-admin-products__main-tab-wrap${isActive ? " is-active" : ""}`}
              >
                <button
                  type="button"
                  role="tab"
                  id={`products-main-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`products-main-panel-${tab.id}`}
                  className={`tst-admin-products__main-tab${isActive ? " is-active" : ""}`}
                  onClick={() => setMainTab(tab.id)}
                >
                  <i className={`fas ${tab.icon || "fa-utensils"}`} aria-hidden="true" />
                  {tab.label}
                </button>

                <div className="tst-admin-products__main-tab-actions">
                  <button
                    type="button"
                    className="tst-admin-products__main-tab-action"
                    aria-label={`Déplacer ${tab.label} vers la gauche`}
                    disabled={!canMoveLeft || Boolean(tabActionLoading)}
                    onClick={() => handleMoveTab(tab.id, "left")}
                  >
                    <i className="fas fa-chevron-left" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="tst-admin-products__main-tab-action"
                    aria-label={`Déplacer ${tab.label} vers la droite`}
                    disabled={!canMoveRight || Boolean(tabActionLoading)}
                    onClick={() => handleMoveTab(tab.id, "right")}
                  >
                    <i className="fas fa-chevron-right" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="tst-admin-products__main-tab-action tst-admin-products__main-tab-action--danger"
                    aria-label={`Supprimer ${tab.label}`}
                    disabled={!canDelete || Boolean(tabActionLoading)}
                    onClick={() => openDeleteTabModal(tab)}
                  >
                    <i className="fas fa-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        <button
          type="button"
          className="tst-admin-products__main-tab tst-admin-products__main-tab--add"
          onClick={openAddTabModal}
          aria-label="Ajouter un onglet"
        >
          <i className="fas fa-plus" aria-hidden="true" />
          Ajouter
        </button>
      </div>

      {activeTabMeta?.kind === "categories" ? (
        <div
          role="tabpanel"
          id={`products-main-panel-${activeTabMeta.id}`}
          aria-labelledby={`products-main-tab-${activeTabMeta.id}`}
        >
          <CategoriesTable />
        </div>
      ) : activeTabMeta?.kind === "wines" ? (
        <div
          role="tabpanel"
          id={`products-main-panel-${activeTabMeta.id}`}
          aria-labelledby={`products-main-tab-${activeTabMeta.id}`}
        >
          <WineListTable />
        </div>
      ) : activeTabMeta?.kind === "special-menus" ? (
        <div
          role="tabpanel"
          id={`products-main-panel-${activeTabMeta.id}`}
          aria-labelledby={`products-main-tab-${activeTabMeta.id}`}
        >
          <SpecialMenusTable />
        </div>
      ) : activeTabMeta?.kind === "custom" ? (
        <div
          role="tabpanel"
          id={`products-main-panel-${activeTabMeta.id}`}
          aria-labelledby={`products-main-tab-${activeTabMeta.id}`}
        >
          <CustomTabPanel tab={activeTabMeta} />
        </div>
      ) : activeTabMeta?.kind === "products" ? (
        <>
          <div className="tst-admin-products__tabs">
            <button
              type="button"
              className="tst-admin-products__tab is-active"
              aria-current="page"
            >
              <i className="fas fa-utensils" aria-hidden="true" />
              Toute notre carte
            </button>
            <button
              type="button"
              className="tst-admin-products__tab"
              onClick={openAddModal}
            >
              <i className="fas fa-plus" aria-hidden="true" />
              Ajouter à notre carte
            </button>
          </div>

          <div className="tst-admin-orders">
            <div className="tst-admin-orders__toolbar">
              <p className="tst-admin-orders__count">
                {pagination?.total ?? products.length} article
                {(pagination?.total ?? products.length) > 1 ? "s" : ""}
              </p>
            </div>
            {renderList()}
          </div>
        </>
      ) : (
        <div className="tst-admin-orders__state">
          <p>Aucun onglet disponible.</p>
        </div>
      )}

      <Popup
        open={addTabModalOpen}
        onClose={closeAddTabModal}
        title="Ajouter un onglet"
      >
        <form className="tst-admin-products__form" onSubmit={handleCreateTab}>
          {tabFormError ? (
            <p className="tst-admin-products__form-error" role="alert">
              {tabFormError}
            </p>
          ) : null}

          <label className="tst-admin-products__field">
            <span>Nom de l’onglet *</span>
            <input
              type="text"
              name="label"
              value={tabForm.label}
              onChange={handleTabFormChange}
              required
              placeholder="Ex. Desserts, Apéritifs…"
            />
          </label>

          <div className="tst-admin-products__actions">
            <button
              type="button"
              className="tst-admin-products__btn tst-admin-products__btn--ghost"
              onClick={closeAddTabModal}
              disabled={tabSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="tst-admin-products__btn"
              disabled={tabSubmitting}
            >
              {tabSubmitting ? "Création…" : "Créer l’onglet"}
            </button>
          </div>
        </form>
      </Popup>

      <Popup
        open={deleteTabModalOpen}
        onClose={closeDeleteTabModal}
        title="Supprimer l’onglet"
      >
        <div className="tst-admin-categories__delete">
          <p className="tst-admin-categories__delete-text">
            Êtes-vous sûr de vouloir supprimer l’onglet{" "}
            <strong>« {tabToDelete?.label} »</strong> ?
          </p>
          <div className="tst-admin-products__actions">
            <button
              type="button"
              className="tst-admin-products__btn tst-admin-products__btn--ghost"
              onClick={closeDeleteTabModal}
              disabled={deleteTabLoading}
            >
              Annuler
            </button>
            <button
              type="button"
              className="tst-admin-products__btn tst-admin-products__btn--danger"
              onClick={handleDeleteTab}
              disabled={deleteTabLoading}
            >
              {deleteTabLoading ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </div>
      </Popup>

      <Popup
        open={deleteProductModalOpen}
        onClose={closeDeleteProductModal}
        title="Supprimer l’article"
      >
        <div className="tst-admin-categories__delete">
          <p className="tst-admin-categories__delete-text">
            Êtes-vous sûr de vouloir supprimer{" "}
            <strong>« {productToDelete?.title} »</strong> de la carte ?
          </p>
          <div className="tst-admin-products__actions">
            <button
              type="button"
              className="tst-admin-products__btn tst-admin-products__btn--ghost"
              onClick={closeDeleteProductModal}
              disabled={deleteProductLoading}
            >
              Annuler
            </button>
            <button
              type="button"
              className="tst-admin-products__btn tst-admin-products__btn--danger"
              onClick={handleDeleteProduct}
              disabled={deleteProductLoading}
            >
              {deleteProductLoading ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </div>
      </Popup>

      <Popup
        open={addModalOpen}
        onClose={closeAddModal}
        title="Ajouter à notre carte"
        className="tst-admin-products-popup"
      >
        <form className="tst-admin-products__form" onSubmit={handleSubmit}>
          {formError ? (
            <p className="tst-admin-products__form-error" role="alert">
              {formError}
            </p>
          ) : null}

          <label className="tst-admin-products__field">
            <span>Section boisson *</span>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleFormChange}
              required
              disabled={categoriesLoading || !categories.length}
            >
              <option value="">
                {categoriesLoading
                  ? "Chargement…"
                  : categories.length
                    ? "Sélectionnez une section (ex. Cocktails)"
                    : "Créez d'abord une section dans l'onglet Boissons"}
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
              placeholder="Spritz, Mojito…"
            />
          </label>

          <label className="tst-admin-products__field">
            <span>Description / ingrédients</span>
            <textarea
              name="short"
              value={form.short}
              onChange={handleFormChange}
              rows={3}
              placeholder="Aperol, Eau pétillante, Prosecco"
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
              placeholder="9"
            />
          </label>

          <div className="tst-admin-products__preview-card">
            <span className="tst-admin-products__section-label">
              Aperçu (même affichage que la commande)
            </span>
            <MenuItemCard
              className="menu-item-card--preview"
              name={form.title.trim() || "Titre"}
              description={
                form.short.trim() || "Description / ingrédients"
              }
              priceLabel={formatPreviewPrice(form.price)}
            />
          </div>

          <div className="tst-admin-products__image-section">
            <span className="tst-admin-products__section-label">
              Image (optionnelle)
            </span>

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
                  : form.image
                    ? "Image déjà enregistrée — cliquez pour en choisir une autre"
                    : "Cliquez pour choisir une image (JPG, PNG, WEBP, GIF — max. 4 Mo)"}
              </span>
            </label>

            {(imagePreview || form.image) && (
              <div className="tst-admin-products__preview">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Aperçu" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image} alt="Image enregistrée" />
                )}
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
              disabled={submitting || !categories.length}
            >
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
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
    </div>
  );
};

export default ProductsTable;
