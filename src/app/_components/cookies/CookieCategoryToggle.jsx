"use client";

const CookieCategoryToggle = ({
  id,
  label,
  description,
  checked = false,
  disabled = false,
  onChange,
}) => {
  const switchId = `ltm-cookie-switch-${id}`;

  return (
    <div className="ltm-cookie-category">
      <div className="ltm-cookie-category__header">
        <label htmlFor={switchId} className="ltm-cookie-category__label">
          {label}
        </label>

        {disabled ? (
          <span className="ltm-cookie-category__status" aria-live="polite">
            Toujours actif
          </span>
        ) : (
          <button
            id={switchId}
            type="button"
            role="switch"
            className={`ltm-cookie-switch${checked ? " is-on" : ""}`}
            aria-checked={checked}
            aria-labelledby={`${switchId}-label`}
            aria-describedby={`${switchId}-desc`}
            onClick={() => onChange?.(!checked)}
          >
            <span className="ltm-cookie-switch__thumb" aria-hidden="true" />
            <span id={`${switchId}-label`} className="sr-only">
              {label}
            </span>
          </button>
        )}
      </div>

      <p id={`${switchId}-desc`} className="ltm-cookie-category__description">
        {description}
      </p>
    </div>
  );
};

export default CookieCategoryToggle;
