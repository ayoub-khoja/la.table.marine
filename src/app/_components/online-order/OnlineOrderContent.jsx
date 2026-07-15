"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import menuConfig from "@data/online-order/menu.json";
import OnlineOrderCheckoutModal from "@components/online-order/OnlineOrderCheckoutModal";
import { formatPrice } from "@library/online-order/format-price";

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

const OnlineOrderContent = () => {
  const sectionRefs = useRef({});
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuSections, setMenuSections] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});
  const [cartLines, setCartLines] = useState(/** @type {Array<CartLine & { quantity: number }>} */ ([]));
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [specialMenus, setSpecialMenus] = useState([]);
  const [specialMenusLoading, setSpecialMenusLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/online-order/menu");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erreur lors du chargement.");
        }

        if (!cancelled) {
          const sections = data.sections || [];
          setMenuCategories(data.categories || []);
          setMenuSections(sections);
          setOpenSections(
            Object.fromEntries(sections.map((section) => [section.id, Boolean(section.defaultOpen)]))
          );
        }
      } catch {
        if (!cancelled) {
          setMenuCategories([]);
          setMenuSections([]);
          setOpenSections({});
        }
      } finally {
        if (!cancelled) {
          setMenuLoading(false);
        }
      }
    };

    fetchMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchSpecialMenus = async () => {
      try {
        const res = await fetch("/api/special-menus");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erreur lors du chargement.");
        }

        if (!cancelled) {
          setSpecialMenus(data.menus || []);
        }
      } catch {
        if (!cancelled) {
          setSpecialMenus([]);
        }
      } finally {
        if (!cancelled) {
          setSpecialMenusLoading(false);
        }
      }
    };

    fetchSpecialMenus();

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

  const scrollToSection = useCallback((sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: true }));
    const el = sectionRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const toggleSection = useCallback((sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  const getItemQuantity = useCallback(
    (id) => cartLines.find((line) => line.id === id)?.quantity ?? 0,
    [cartLines]
  );

  return (
    <div className={`online-order${cartCount > 0 ? " online-order--has-summary" : ""}`}>
      <div className="online-order__toolbar">
        <p className="online-order__intro">
          Composez votre commande et finalisez par téléphone. Produits affichés à titre indicatif.
        </p>
      </div>

      <section className="online-order__categories" aria-label="Catégories du menu">
        <h2 className="online-order__section-title">Menu</h2>
        {menuLoading ? (
          <p className="online-order__specials-empty">Chargement du menu…</p>
        ) : menuCategories.length ? (
          <div className="online-order__categories-track">
            {menuCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="online-order__category-card"
                onClick={() => scrollToSection(category.id)}
              >
                {category.image ? (
                  <span className="online-order__category-media">
                    <Image
                      src={category.image}
                      alt=""
                      width={320}
                      height={240}
                      sizes="160px"
                      className="online-order__category-image"
                    />
                  </span>
                ) : null}
                <span className="online-order__category-label">{category.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="online-order__specials-empty">Aucune catégorie disponible pour le moment.</p>
        )}
      </section>

      <section className="online-order__delivery" aria-label="Informations de livraison">
        <h2 className="online-order__delivery-title">{menuConfig.delivery.title}</h2>
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

      <section className="online-order__menu" aria-label="Notre carte">
        <h2 className="online-order__section-title">Notre carte</h2>
        {menuLoading ? (
          <p className="online-order__specials-empty">Chargement de la carte…</p>
        ) : menuSections.length ? (
        <div className="online-order__accordion">
          {menuSections.map((section) => {
            const isOpen = openSections[section.id];
            return (
              <article
                key={section.id}
                ref={(node) => {
                  sectionRefs.current[section.id] = node;
                }}
                className={`online-order__accordion-item${isOpen ? " is-open" : ""}`}
              >
                <button
                  type="button"
                  className="online-order__accordion-trigger"
                  aria-expanded={isOpen}
                  onClick={(event) => {
                    toggleSection(section.id);
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

                    <div className="online-order__products">
                      {section.items.length ? (
                        section.items.map((item) => {
                        const quantity = getItemQuantity(item.id);
                        return (
                        <div key={item.id} className="online-order__product">
                          <div className="online-order__product-text">
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                          </div>
                          <div className="online-order__product-actions">
                            {quantity > 0 ? (
                              <div className="online-order__product-qty">
                                <button
                                  type="button"
                                  aria-label={`Retirer un ${item.name}`}
                                  onClick={() => updateQty(item.id, quantity - 1)}
                                >
                                  −
                                </button>
                                <span>{quantity}</span>
                                <button
                                  type="button"
                                  aria-label={`Ajouter un ${item.name}`}
                                  onClick={() => addToCart(item)}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="online-order__product-add"
                                aria-label={`Ajouter ${item.name} au panier`}
                                onClick={() => addToCart(item)}
                              >
                                +
                              </button>
                            )}
                            <span className="online-order__product-price">{formatPrice(item.price)}</span>
                          </div>
                        </div>
                        );
                      })
                      ) : (
                        <p className="online-order__specials-empty">Aucun produit dans cette catégorie.</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        ) : (
          <p className="online-order__specials-empty">Aucun produit disponible pour le moment.</p>
        )}

        <div className="online-order__specials online-order__specials--inline" aria-label="Menus spéciaux">
          <h3 className="online-order__specials-title">Nos menus spéciaux</h3>

          {specialMenusLoading ? (
            <p className="online-order__specials-empty">Chargement des menus spéciaux…</p>
          ) : specialMenus.length ? (
            <div className="online-order__specials-grid">
              {specialMenus.map((menu) => (
                <article key={menu.id} className="online-order__special-card">
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
              ))}
            </div>
          ) : (
            <p className="online-order__specials-empty">Aucun menu spécial disponible pour le moment.</p>
          )}
        </div>
      </section>

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
