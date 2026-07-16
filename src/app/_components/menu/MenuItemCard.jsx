"use client";

/**
 * Carte plat/boisson — même rendu admin + commande en ligne.
 */
export default function MenuItemCard({
  name,
  description,
  priceLabel,
  quantity = 0,
  interactive = false,
  onAdd,
  onRemove,
  className = "",
}) {
  const title = name?.trim() || "Titre";
  const text = description?.trim() || "";

  return (
    <div className={`menu-item-card ${className}`.trim()}>
      <div className="menu-item-card__text">
        <h3>{title}</h3>
        {text ? <p>{text}</p> : null}
      </div>

      <div className="menu-item-card__side">
        <span className="menu-item-card__price">{priceLabel}</span>

        {interactive ? (
          quantity > 0 ? (
            <div className="menu-item-card__qty">
              <button
                type="button"
                aria-label={`Retirer un ${title}`}
                onClick={onRemove}
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                aria-label={`Ajouter un ${title}`}
                onClick={onAdd}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="menu-item-card__add"
              aria-label={`Ajouter ${title} au panier`}
              onClick={onAdd}
            >
              +
            </button>
          )
        ) : (
          <span className="menu-item-card__add" aria-hidden="true">
            +
          </span>
        )}
      </div>
    </div>
  );
}
