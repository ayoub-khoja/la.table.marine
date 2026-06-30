"use client";

import { useCallback, useEffect, useState } from "react";

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const MenuPanel = () => {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/menu");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement.");
      }

      setMenu(data.menu || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
      setMenu(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setUploadError("Sélectionnez un fichier PDF.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/admin/menu", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'enregistrer le menu.");
      }

      setMenu(data.menu || null);
      setFile(null);
      setUploadSuccess("Menu PDF enregistré avec succès.");
      e.currentTarget.reset();
    } catch (err) {
      setUploadError(err.message || "Erreur réseau.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="tst-admin-orders__state" role="status">
        <i className="fas fa-spinner fa-spin" aria-hidden="true" />
        <p>Chargement du menu…</p>
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
          onClick={fetchMenu}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="tst-admin-orders tst-admin-menu">
      {menu ? (
        <div className="tst-admin-menu__current">
          <div className="tst-admin-menu__info">
            <i className="fas fa-file-pdf" aria-hidden="true" />
            <div>
              <strong>{menu.filename || "menu.pdf"}</strong>
              <p>
                Ajouté le {formatDate(menu.uploadedAt)} · {formatSize(menu.size)}
              </p>
            </div>
          </div>
          <a
            href={menu.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tst-admin-products__btn"
          >
            <i className="fas fa-external-link-alt" aria-hidden="true" />
            Voir le PDF
          </a>
        </div>
      ) : (
        <div className="tst-admin-orders__state">
          <i className="fas fa-file-pdf" aria-hidden="true" />
          <p>Aucun menu PDF pour le moment.</p>
          <span className="tst-admin-orders__hint">
            Téléversez un fichier PDF ci-dessous.
          </span>
        </div>
      )}

      <div className="tst-admin-menu__upload">
        <h2>Joindre le menu (PDF)</h2>
        <p>Remplace le menu PDF actuel s&apos;il existe déjà.</p>

        <form className="tst-admin-products__form" onSubmit={handleUpload}>
          {uploadError ? (
            <p className="tst-admin-products__form-error" role="alert">
              {uploadError}
            </p>
          ) : null}

          {uploadSuccess ? (
            <p className="tst-admin-products__form-success" role="status">
              {uploadSuccess}
            </p>
          ) : null}

          <label className="tst-admin-upload__dropzone">
            <input
              type="file"
              name="pdf"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
            />
            <i className="fas fa-cloud-upload-alt" aria-hidden="true" />
            <span>
              {file
                ? file.name
                : "Cliquez ou déposez un fichier PDF ici (max. 15 Mo)"}
            </span>
          </label>

          <div className="tst-admin-products__actions">
            <button
              type="submit"
              className="tst-admin-products__btn"
              disabled={uploading || !file}
            >
              {uploading ? "Enregistrement…" : "Enregistrer le menu PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuPanel;
