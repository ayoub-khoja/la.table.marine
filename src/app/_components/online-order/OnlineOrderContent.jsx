"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import menuConfig from "@data/online-order/menu.json";
import OnlineOrderCheckoutModal from "@components/online-order/OnlineOrderCheckoutModal";
import MenuItemCard from "@components/menu/MenuItemCard";
import { formatPrice } from "@library/online-order/format-price";
import {
  isChildSpecialMenu,
  sortPublishedSpecialMenus,
} from "@library/special-menus/sort";

function getAccompanimentTags(accompaniments) {
  if (!Array.isArray(accompaniments) || !accompaniments.length) return [];

  const labelPrefix = /^accompagnement au choix\s*:?\s*/i;

  return accompaniments.flatMap((entry) => {
    const text = entry.toString().trim().replace(labelPrefix, "");
    if (!text) return [];

    return text
      .split(/,|\s+ou\s+/i)
      .map((part) => part.replace(labelPrefix, "").replace(/\.+$/g, "").trim())
      .filter(Boolean);
  });
}

function isCompactSpecialMenu(menu) {
  const hasImage = Boolean(menu?.image);
  const hasSubtitle = Boolean(menu?.subtitle?.trim());
  const hasAccompaniments = getAccompanimentTags(menu?.accompaniments).length > 0;

  return !hasImage || (!hasSubtitle && !hasAccompaniments);
}

function DeliveryIcon({ type }) {
  if (type === "truck") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h11v8H3V6zm11 2h3l3 4v2h-6V8zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      </svg>
    );
  }
  if (type === "euro") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 5a7 7 0 1 0 0 14h-1v-2h1a5 5 0 1 1 0-10H9V7h9V5zM7 11h8v2H7v-2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V2zm1 4v5l4 2-.9 1.8L11 13V6h2z" />
    </svg>
  );
}

function CartModal({ isOpen, lines, onClose, onUpdateQty, onRemove, total, onCheckout }) {
  if (!isOpen) return null;

  return (
    <div className="online-order-cart" role="dialog" aria-modal="true" aria-labelledby="online-order-cart-title">
      <button type="button" className="online-order-cart__backdrop" aria-label="Fermer le panier" onClick={onClose} />
      <div className="online-order-cart__panel">
        <div className="online-order-cart__header">
          <h2 id="online-order-cart-title">Votre panier</h2>
          <button type="button" className="online-order-cart__close" aria-label="Fermer" onClick={onClose}>
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="online-order-cart__empty">Votre panier est vide.</p>
        ) : (
          <ul className="online-order-cart__list">
            {lines.map((line) => (
              <li key={line.id} className="online-order-cart__item">
                <div className="online-order-cart__item-main">
                  <strong>{line.name}</strong>
                  <span>{formatPrice(line.price)}</span>
                </div>
                <div className="online-order-cart__item-actions">
                  <div className="online-order-cart__qty">
                    <button
                      type="button"
                      aria-label="Diminuer la quantité"
                      onClick={() => onUpdateQty(line.id, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Augmenter la quantité"
                      onClick={() => onUpdateQty(line.id, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="online-order-cart__remove"
                    onClick={() => onRemove(line.id)}
                  >
                    Retirer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="online-order-cart__footer">
          <div className="online-order-cart__row">
            <span>Livraison</span>
            <span>Gratuite</span>
          </div>
          <div className="online-order-cart__row online-order-cart__row--total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <button
            type="button"
            className="online-order-cart__submit tst-btn"
            onClick={onCheckout}
          >
            Commander
          </button>
        </div>
      </div>
    </div>
  );
}

function getBrowseSectionId(tab) {
  if (tab.kind === "products" || tab.kind === "categories") {
    return "tab-catalog";
  }
  return `tab-${tab.id}`;
}

function sectionKey(prefix, id) {
  return `${prefix}:${id}`;
}

const OnlineOrderContent = () => {
  const contentRefs = useRef({});
  const [tabs, setTabs] = useState([]);
  const [menuSections, setMenuSections] = useState([]);
  const [wineSections, setWineSections] = useState([]);
  const [specialMenus, setSpecialMenus] = useState([]);
  const [customByTab, setCustomByTab] = useState({});
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});
  const [cartLines, setCartLines] = useState(/** @type {Array<{ id: string, name: string, description?: string, price: number, quantity: number }>} */ ([]));
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchMenuTabs = async () => {
      try {
        const res = await fetch("/api/menu-tabs", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Erreur lors du chargement.");
        }

        if (!cancelled) {
          const nextTabs = Array.isArray(data.tabs) ? data.tabs : [];
          const productSections = data.products?.sections || [];
          const nextWineSections = data.wines?.sections || [];
          const nextCustom = data.custom && typeof data.custom === "object" ? data.custom : {};

          setTabs(nextTabs);
          setMenuSections(productSections);
          setWineSections(nextWineSections);
          setSpecialMenus(data.specialMenus || []);
          setCustomByTab(nextCustom);

          const openMap = {};
          const firstProductWithItems = productSections.find(
            (section) => Array.isArray(section.items) && section.items.length > 0
          );
          if (firstProductWithItems) {
            openMap[sectionKey("product", firstProductWithItems.id)] = true;
          }
          nextWineSections.forEach((section, index) => {
            if (!Array.isArray(section.items) || !section.items.length) return;
            openMap[sectionKey("wine", section.id)] = index === 0;
          });
          Object.entries(nextCustom).forEach(([tabId, payload]) => {
            (payload?.sections || []).forEach((section, index) => {
              if (!Array.isArray(section.items) || !section.items.length) return;
              openMap[sectionKey(`custom:${tabId}`, section.id)] = index === 0;
            });
          });
          setOpenSections(openMap);
        }
      } catch {
        if (!cancelled) {
          setTabs([]);
          setMenuSections([]);
          setWineSections([]);
          setSpecialMenus([]);
          setCustomByTab({});
          setOpenSections({});
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMenuTabs();

    return () => {
      cancelled = true;
    };
  }, []);

  const cartCount = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.quantity, 0),
    [cartLines]
  );

  const cartTotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [cartLines]
  );

  const displaySpecialMenus = useMemo(
    () => sortPublishedSpecialMenus(specialMenus),
    [specialMenus]
  );

  const centerChildMenu = useMemo(() => {
    if (displaySpecialMenus.length !== 3) return false;
    return displaySpecialMenus.some(isChildSpecialMenu);
  }, [displaySpecialMenus]);

  const [activeBrowseId, setActiveBrowseId] = useState(null);

  const visibleTabs = useMemo(
    () => tabs.filter((tab) => tab.kind !== "wines"),
    [tabs]
  );

  useEffect(() => {
    if (!visibleTabs.length) {
      setActiveBrowseId(null);
      return;
    }
    setActiveBrowseId((current) => {
      if (current && visibleTabs.some((tab) => tab.id === current)) return current;
      return visibleTabs[0].id;
    });
  }, [visibleTabs]);

  const catalogTitle = useMemo(() => {
    const catalogTab = visibleTabs.find(
      (tab) => tab.kind === "products" || tab.kind === "categories"
    );
    return catalogTab?.label || "Notre carte";
  }, [visibleTabs]);

  const addToCart = useCallback((item) => {
    setCartLines((prev) => {
      const existing = prev.find((line) => line.id === item.id);
      if (existing) {
        return prev.map((line) =>
          line.id === item.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const updateQty = useCallback((id, quantity) => {
    if (quantity <= 0) {
      setCartLines((prev) => prev.filter((line) => line.id !== id));
      return;
    }
    setCartLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, quantity } : line))
    );
  }, []);

  const removeLine = useCallback((id) => {
    setCartLines((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const scrollToTab = useCallback((tab) => {
    setActiveBrowseId(tab.id);
    const sectionId = getBrowseSectionId(tab);
    const el = contentRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const toggleSection = useCallback((key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const getItemQuantity = useCallback(
    (id) => cartLines.find((line) => line.id === id)?.quantity ?? 0,
    [cartLines]
  );

  const renderItemCards = useCallback(
    (items) => {
      if (!items.length) return null;

      return (
        <div className="menu-item-cards">
          {items.map((item) => {
            const quantity = getItemQuantity(item.id);
            const price = Number(item.price) || 0;
            const cartItem = {
              id: item.id,
              name: item.name,
              description: item.description || "",
              price,
            };

            return (
              <MenuItemCard
                key={item.id}
                name={item.name}
                description={item.description}
                priceLabel={item.priceFormatted || formatPrice(price)}
                quantity={quantity}
                interactive
                onAdd={() => addToCart(cartItem)}
                onRemove={() => updateQty(item.id, quantity - 1)}
              />
            );
          })}
        </div>
      );
    },
    [addToCart, getItemQuantity, updateQty]
  );

  const renderProductAccordion = () => {
    const sectionsWithItems = menuSections.filter(
      (section) => Array.isArray(section.items) && section.items.length > 0
    );

    if (!sectionsWithItems.length) {
      return null;
    }

    return (
      <div className="online-order__accordion">
        {sectionsWithItems.map((section) => {
          const key = sectionKey("product", section.id);
          const isOpen = Boolean(openSections[key]);

          return (
            <article
              key={section.id}
              className={`online-order__accordion-item${isOpen ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="online-order__accordion-trigger"
                aria-expanded={isOpen}
                onClick={(event) => {
                  toggleSection(key);
                  event.currentTarget.blur();
                }}
              >
                <span className="online-order__accordion-thumb">
                  {section.image ? (
                    <Image
                      src={section.image}
                      alt=""
                      width={80}
                      height={80}
                      sizes="40px"
                    />
                  ) : null}
                </span>
                <span className="online-order__accordion-name">{section.name}</span>
                <i className={`fas fa-chevron-${isOpen ? "up" : "down"}`} aria-hidden="true" />
              </button>

              {isOpen ? (
                <div className="online-order__accordion-panel">
                  {section.accompaniments?.length ? (
                    <div className="online-order__accompaniments">
                      <span>Accompagnements :</span>
                      <div className="online-order__tags">
                        {section.accompaniments.map((tag) => (
                          <span key={tag} className="online-order__tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {renderItemCards(section.items || [])}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  };

  const renderSimpleAccordion = (sections, prefix, emptyThumbIcon = "fa-utensils") => {
    const sectionsWithItems = (sections || []).filter(
      (section) => Array.isArray(section.items) && section.items.length > 0
    );

    if (!sectionsWithItems.length) {
      return null;
    }

    return (
      <div className="menu-accordion online-order__accordion">
        {sectionsWithItems.map((section) => {
          const key = sectionKey(prefix, section.id);
          const isOpen = Boolean(openSections[key]);

          return (
            <article
              key={section.id}
              className={`menu-accordion__item online-order__accordion-item${
                isOpen ? " is-open" : ""
              }`}
            >
              <button
                type="button"
                className="menu-accordion__trigger online-order__accordion-trigger"
                aria-expanded={isOpen}
                onClick={(event) => {
                  toggleSection(key);
                  event.currentTarget.blur();
                }}
              >
                <span className="menu-accordion__thumb menu-accordion__thumb--wine">
                  <i className={`fas ${emptyThumbIcon}`} aria-hidden="true" />
                </span>
                <span className="menu-accordion__name online-order__accordion-name">
                  {section.name}
                </span>
                <i
                  className={`fas fa-chevron-${isOpen ? "up" : "down"}`}
                  aria-hidden="true"
                />
              </button>

              {isOpen ? (
                <div className="menu-accordion__panel online-order__accordion-panel">
                  {renderItemCards(section.items || [])}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  };

  const renderSpecialMenus = () => (
    <div className="online-order__specials online-order__specials--inline">
      {displaySpecialMenus.length ? (
        <div
          className={`online-order__specials-grid${
            centerChildMenu ? " online-order__specials-grid--three" : ""
          }`}
        >
          {displaySpecialMenus.map((menu) => {
            const isChild = isChildSpecialMenu(menu);
            const isCompact = isCompactSpecialMenu(menu);

            return (
              <article
                key={menu.id}
                className={`online-order__special-card${
                  isChild ? " online-order__special-card--child" : ""
                }${isCompact ? " online-order__special-card--compact" : ""}`}
              >
                {menu.image ? (
                  <div className="online-order__special-media">
                    <Image
                      src={menu.image}
                      alt=""
                      fill
                      sizes="(max-width: 767px) 100vw, 50vw"
                      className="online-order__special-image"
                    />
                  </div>
                ) : null}
                <div className="online-order__special-body">
                  <div className="online-order__special-head">
                    <h4>{menu.name}</h4>
                    <strong>{formatPrice(menu.price)}</strong>
                  </div>
                  {menu.subtitle ? (
                    <p className="online-order__special-sub">{menu.subtitle}</p>
                  ) : null}
                  {menu.courses?.map((course) => (
                    <div key={`${menu.id}-${course.title}`} className="online-order__special-course">
                      <h5>{course.title}</h5>
                      <ul>
                        {course.items.map((entry) => (
                          <li key={entry}>{entry}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {getAccompanimentTags(menu.accompaniments).length ? (
                    <div className="online-order__special-accompaniments">
                      <span className="online-order__special-accompaniments-label">
                        Accompagnement au choix
                      </span>
                      <div className="online-order__special-tags">
                        {getAccompanimentTags(menu.accompaniments).map((tag) => (
                          <span key={tag} className="online-order__special-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="online-order__special-btn tst-btn"
                    onClick={() =>
                      addToCart({
                        id: menu.id,
                        name: menu.name,
                        description: menu.subtitle || "Menu spécial",
                        price: menu.price,
                      })
                    }
                  >
                    Commander
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="online-order__specials-empty">Aucun menu spécial pour le moment.</p>
      )}
    </div>
  );

  const renderTabContent = () => {
    let catalogRendered = false;

    return visibleTabs.map((tab) => {
      if (tab.kind === "products" || tab.kind === "categories") {
        if (catalogRendered) return null;
        catalogRendered = true;

        const hasCatalogItems = menuSections.some(
          (section) => Array.isArray(section.items) && section.items.length > 0
        );
        if (!hasCatalogItems) return null;

        return (
          <section
            key="tab-catalog"
            id="tab-catalog"
            ref={(node) => {
              contentRefs.current["tab-catalog"] = node;
            }}
            className="online-order__menu"
            aria-label={catalogTitle}
          >
            <h3 className="online-order__section-title">{catalogTitle}</h3>
            {renderProductAccordion()}
          </section>
        );
      }

      if (tab.kind === "special-menus") {
        const sectionId = getBrowseSectionId(tab);
        return (
          <section
            key={tab.id}
            id={sectionId}
            ref={(node) => {
              contentRefs.current[sectionId] = node;
            }}
            className="online-order__menu"
            aria-label={tab.label}
          >
            <h3 className="online-order__section-title">{tab.label}</h3>
            {renderSpecialMenus()}
          </section>
        );
      }

      if (tab.kind === "custom") {
        const sectionId = getBrowseSectionId(tab);
        const sections = customByTab[tab.id]?.sections || [];
        const hasItems = sections.some(
          (section) => Array.isArray(section.items) && section.items.length > 0
        );
        if (!hasItems) return null;

        return (
          <section
            key={tab.id}
            id={sectionId}
            ref={(node) => {
              contentRefs.current[sectionId] = node;
            }}
            className="online-order__menu"
            aria-label={tab.label}
          >
            <h3 className="online-order__section-title">{tab.label}</h3>
            {renderSimpleAccordion(
              sections,
              `custom:${tab.id}`,
              tab.icon || "fa-utensils"
            )}
          </section>
        );
      }

      return null;
    });
  };

  return (
    <div className={`online-order${cartCount > 0 ? " online-order--has-summary" : ""}`}>
      <header className="online-order__page-header">
        <h1 className="online-order__page-title">
          Commandez vos poissons frais et fruits de mer à Plaisir
        </h1>
        <p className="online-order__page-subtitle">
          Composez votre commande en ligne parmi nos entrées, poissons du jour, fruits de mer
          et desserts préparés par le restaurant La Table Marine. Livraison gratuite à Plaisir
          et alentours — minimum de commande 28&nbsp;€.
        </p>
      </header>

      <section className="online-order__delivery" aria-label="Informations de livraison">
        <h3 className="online-order__delivery-title">{menuConfig.delivery.title}</h3>
        <div className="online-order__delivery-grid">
          {menuConfig.delivery.items.map((item) => (
            <div key={item.title} className="online-order__delivery-item">
              <span className="online-order__delivery-icon">
                <DeliveryIcon type={item.icon} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="online-order__categories" aria-label="Parcourir la carte">
        {loading ? (
          <p className="online-order__specials-empty">Chargement du menu…</p>
        ) : visibleTabs.length ? (
          <nav className="online-order__title-nav" aria-label="Sections de la carte">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`online-order__section-title online-order__section-title--nav${
                  activeBrowseId === tab.id ? " is-active" : ""
                }`}
                onClick={() => scrollToTab(tab)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        ) : null}
      </section>

      {loading ? (
        <p className="online-order__specials-empty">Chargement de la carte…</p>
      ) : (
        renderTabContent()
      )}

      <p className="online-order__footer-note">
        {menuConfig.contact.address} — {menuConfig.contact.phone}
      </p>

      {cartCount > 0 ? (
        <button
          type="button"
          className="online-order__summary-bar"
          onClick={() => setCartOpen(true)}
          aria-label={`Voir le panier : ${cartCount} article${cartCount > 1 ? "s" : ""}, ${formatPrice(cartTotal)}`}
        >
          <span className="online-order__summary-count">
            {cartCount} article{cartCount > 1 ? "s" : ""}
          </span>
          <span className="online-order__summary-divider" aria-hidden="true" />
          <strong className="online-order__summary-total">{formatPrice(cartTotal)}</strong>
        </button>
      ) : null}

      <CartModal
        isOpen={cartOpen}
        lines={cartLines}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateQty}
        onRemove={removeLine}
        total={cartTotal}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <OnlineOrderCheckoutModal
        isOpen={checkoutOpen}
        lines={cartLines}
        total={cartTotal}
        restaurantAddress={menuConfig.contact.address}
        onClose={(result) => {
          setCheckoutOpen(false);
          if (result?.success) {
            setCartLines([]);
          }
        }}
      />
    </div>
  );
};

export default OnlineOrderContent;
