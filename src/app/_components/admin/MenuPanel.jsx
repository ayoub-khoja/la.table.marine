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
  const [permanentUrl, setPermanentUrl] = useState("https://latablemarine.com/menu");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const formRef = useRef(null);
  const uploadLockRef = useRef(false);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/menu", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement.");
      }

      setMenu(data.menu || null);
      if (data.permanentUrl) {
        setPermanentUrl(data.permanentUrl);
      }
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

    if (selected.size <= 0) {
      setUploadError("Le fichier PDF est vide.");
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

    if (uploadLockRef.current || uploading) {
      return;
    }

    if (!file) {
      setUploadError("Sélectionnez un fichier PDF.");
      return;
    }

    if (menu) {
      const confirmed = window.confirm(
        "Remplacer le menu PDF actuel ?\n\n" +
          "Le QR code et l'URL publique /menu resteront identiques.\n" +
          "Les clients verront immédiatement le nouveau fichier."
      );
      if (!confirmed) {
        return;
      }
    }

    uploadLockRef.current = true;
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
      if (data.permanentUrl) {
        setPermanentUrl(data.permanentUrl);
      }
      setFile(null);
      setUploadSuccess(
        menu
          ? "Menu PDF remplacé avec succès. L'URL /menu et le QR code sont inchangés."
          : "Premier menu PDF publié avec succès."
      );
      formRef.current?.reset();
    } catch (err) {
      setUploadError(err.message || "Erreur réseau.");
    } finally {
      setUploading(false);
      uploadLockRef.current = false;
    }
  };

  const handleToggleActive = async () => {
    if (!menu || toggling) return;

    const nextActive = !menu.active;
    const confirmed = window.confirm(
      nextActive
        ? "Republier le menu ? Les clients pourront à nouveau l'ouvrir via /menu et le QR code."
        : "Désactiver temporairement le menu ? L'URL /menu et le QR resteront identiques, mais le PDF ne sera plus accessible."
    );
    if (!confirmed) return;

    setToggling(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de mettre à jour le statut.");
      }

      setMenu(data.menu || null);
      setUploadSuccess(
        nextActive ? "Menu publié." : "Menu désactivé temporairement."
      );
    } catch (err) {
      setUploadError(err.message || "Erreur réseau.");
    } finally {
      setToggling(false);
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

  const previewUrl = menu
    ? `/api/admin/menu/file?download=0&v=${encodeURIComponent(
        String(menu.updatedAt || menu.version || menu.id)
      )}`
    : null;
  const statusLabel = menu?.active ? "Publié" : "Désactivé";

  return (
    <div className="tst-admin-orders tst-admin-menu">
      <div className="tst-admin-menu__permanent">
        <div className="tst-admin-menu__permanent-main">
          <div>
            <strong>QR code permanent — prêt à imprimer</strong>
            <p>
              <code>{permanentUrl}</code>
            </p>
            <p className="tst-admin-menu__meta">
              Format affiche/table (SCANNEZ, cadre viewfinder, fond marine).
              L&apos;URL encodée ne change jamais lors du remplacement du PDF.
            </p>
            <div className="tst-admin-menu__qr-actions">
              <a
                href="/api/admin/menu/qr?format=png&variant=branded"
                className="tst-admin-products__btn"
                download
              >
                <i className="fas fa-qrcode" aria-hidden="true" />
                Télécharger le carton PNG
              </a>
              <a
                href="/api/admin/menu/qr?format=svg"
                className="tst-admin-products__btn tst-admin-products__btn--ghost"
                download
              >
                <i className="fas fa-download" aria-hidden="true" />
                SVG
              </a>
              <a
                href="/api/admin/menu/qr?format=png&variant=compact"
                className="tst-admin-products__btn tst-admin-products__btn--ghost"
                download
              >
                PNG compact
              </a>
            </div>
          </div>
          <div className="tst-admin-menu__qr-preview">
            <img
              src="/api/admin/menu/qr?format=png&variant=branded&download=0"
              alt="Aperçu du QR code La Table Marine"
              width={180}
              height={255}
            />
          </div>
        </div>
      </div>

      {menu ? (
        <>
          <div className="tst-admin-menu__current">
            <div className="tst-admin-menu__info">
              <i className="fas fa-file-pdf" aria-hidden="true" />
              <div>
                <strong>{menu.title || "Carte Menu"}</strong>
                <p>{menu.originalFileName || menu.fileName}</p>
                <p className="tst-admin-menu__meta">
                  Mis à jour le {formatDate(menu.updatedAt)} · {formatSize(menu.fileSize)}
                  {menu.version ? ` · v${menu.version}` : ""}
                </p>
                <p className="tst-admin-menu__status">
                  Statut :{" "}
                  <span
                    className={`tst-admin-menu__badge${
                      menu.active ? " is-active" : " is-inactive"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </p>
              </div>
            </div>
            <div className="tst-admin-menu__actions">
              <a
                href={`/api/admin/menu/file?download=0&v=${encodeURIComponent(
                  String(menu.updatedAt || menu.version || menu.id)
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tst-admin-products__btn tst-admin-products__btn--ghost"
              >
                <i className="fas fa-external-link-alt" aria-hidden="true" />
                Prévisualiser
              </a>
              <a
                href="/api/admin/menu/file?download=1"
                className="tst-admin-products__btn tst-admin-products__btn--ghost"
                download
              >
                <i className="fas fa-download" aria-hidden="true" />
                Télécharger
              </a>
              <button
                type="button"
                className="tst-admin-products__btn"
                onClick={handleToggleActive}
                disabled={toggling}
              >
                {toggling
                  ? "Mise à jour…"
                  : menu.active
                    ? "Désactiver"
                    : "Publier"}
              </button>
            </div>
          </div>

          <div className="tst-admin-menu__preview">
            {!menu.active ? (
              <p className="tst-admin-menu__preview-note">
                Menu désactivé pour le public — aperçu administrateur uniquement.
              </p>
            ) : null}
            <iframe
              key={`${menu.updatedAt || menu.id}-${menu.version || 0}`}
              src={previewUrl}
              title="Aperçu de la carte menu"
              className="tst-admin-menu__preview-frame"
            />
          </div>
        </>
      ) : (
        <div className="tst-admin-orders__state">
          <i className="fas fa-file-pdf" aria-hidden="true" />
          <p>Aucun menu PDF pour le moment.</p>
          <span className="tst-admin-orders__hint">
            Importez un premier fichier PDF ci-dessous. Le QR code pointera toujours vers /menu.
          </span>
        </div>
      )}

      <div className="tst-admin-menu__upload">
        <h2>{menu ? "Remplacer la carte menu (PDF)" : "Importer la carte menu (PDF)"}</h2>
        <p>
          Le nouveau fichier remplace le menu actif. L&apos;URL publique{" "}
          <code>/menu</code> et le QR code restent strictement identiques.
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
              disabled={uploading}
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

          {uploading ? (
            <div className="tst-admin-menu__progress" role="status" aria-live="polite">
              <div className="tst-admin-menu__progress-bar" />
              <span>Envoi et publication du PDF…</span>
            </div>
          ) : null}

          <div className="tst-admin-products__actions">
            <button
              type="submit"
              className="tst-admin-products__btn"
              disabled={uploading || !file}
            >
              {uploading
                ? "Enregistrement…"
                : menu
                  ? "Remplacer le menu PDF"
                  : "Publier le menu PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuPanel;
