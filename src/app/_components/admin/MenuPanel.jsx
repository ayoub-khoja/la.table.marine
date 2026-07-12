"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

function isPdfFile(file) {
  return file && (file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf"));
}

const MenuPanel = () => {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const formRef = useRef(null);

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

  const selectFile = (selected) => {
    if (!selected) {
      setFile(null);
      return;
    }

    if (!isPdfFile(selected)) {
      setUploadError("Seuls les fichiers PDF sont acceptés.");
      setFile(null);
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      setUploadError("Fichier trop volumineux (max. 15 Mo).");
      setFile(null);
      return;
    }

    setFile(selected);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleFileChange = (e) => {
    selectFile(e.target.files?.[0] || null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    selectFile(e.dataTransfer.files?.[0] || null);
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
      formData.append("title", "Carte Menu");

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
      formRef.current?.reset();
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

  const previewUrl = menu?.fileUrl;

  return (
    <div className="tst-admin-orders tst-admin-menu">
      {menu ? (
        <>
          <div className="tst-admin-menu__current">
            <div className="tst-admin-menu__info">
              <i className="fas fa-file-pdf" aria-hidden="true" />
              <div>
                <strong>{menu.title || "Carte Menu"}</strong>
                <p>{menu.fileName}</p>
                <p className="tst-admin-menu__meta">
                  Mis à jour le {formatDate(menu.updatedAt)} · {formatSize(menu.fileSize)}
                </p>
              </div>
            </div>
            <a
              href={menu.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tst-admin-products__btn"
            >
              <i className="fas fa-external-link-alt" aria-hidden="true" />
              Ouvrir le PDF
            </a>
          </div>

          {previewUrl ? (
            <div className="tst-admin-menu__preview">
              <iframe
                key={menu.updatedAt || menu.id}
                src={previewUrl}
                title="Aperçu de la carte menu"
                className="tst-admin-menu__preview-frame"
              />
            </div>
          ) : null}
        </>
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
        <h2>Joindre la carte menu (PDF)</h2>
        <p>
          Le nouveau fichier remplace automatiquement le menu actif sur le site.
        </p>

        <form ref={formRef} className="tst-admin-products__form" onSubmit={handleUpload}>
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

          <label
            className={`tst-admin-upload__dropzone${dragOver ? " is-dragover" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              name="pdf"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
            />
            <i className="fas fa-cloud-upload-alt" aria-hidden="true" />
            <span className="tst-admin-upload__dropzone-title">
              {file ? "Fichier sélectionné" : "Glissez-déposez votre PDF ici"}
            </span>
            <span className="tst-admin-upload__dropzone-hint">
              {file
                ? file.name
                : "ou cliquez pour parcourir · PDF uniquement · max. 15 Mo"}
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
