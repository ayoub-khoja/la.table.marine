"use client";

import { useEffect } from "react";

const Popup = ({
  open,
  title,
  children,
  onClose,
  closeLabel = "Fermer",
}) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div className={`tst-popup-bg ${open ? "tst-active" : ""}`}>
      <div
        style={{ position: "fixed", inset: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="tst-popup-frame"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Popup"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tst-popup-body">
          <div
            className="tst-close-popup"
            onClick={onClose}
            role="button"
            tabIndex={0}
          >
            <i className="fas fa-times" aria-hidden="true"></i>
            <span className="sr-only">{closeLabel}</span>
          </div>

          {title ? <h4 className="tst-mb-30">{title}</h4> : null}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Popup;

