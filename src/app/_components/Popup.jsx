"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Popup = ({
  open,
  title,
  children,
  onClose,
  closeLabel = "Fermer",
  className = "",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={`tst-popup-bg ${open ? "tst-active" : ""} ${className}`.trim()}>
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
    </div>,
    document.body
  );
};

export default Popup;

