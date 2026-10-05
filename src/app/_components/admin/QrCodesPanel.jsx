const QR_CODES = [
  {
    id: "site",
    title: "QR code site web",
    description:
      "Redirige vers la page d'accueil du site. L'URL s'adapte automatiquement au domaine configuré.",
    urlKey: "site",
    previewSrc: "/api/admin/site/qr?format=png&download=0",
    downloads: [
      {
        href: "/api/admin/site/qr?format=png",
        label: "Télécharger le PNG",
        icon: "fa-qrcode",
        primary: true,
      },
    ],
  },
  {
    id: "menu",
    title: "QR code menu",
    description:
      "Redirige vers la carte PDF publique /menu. L'URL encodée reste identique lors du remplacement du fichier.",
    urlKey: "menu",
    previewSrc:
      "/api/admin/menu/qr?format=png&variant=branded&download=0&v=branded3",
    downloads: [
      {
        href: "/api/admin/menu/qr?format=png&variant=branded",
        label: "Télécharger le carton PNG",
        icon: "fa-qrcode",
        primary: true,
      },
      {
        href: "/api/admin/menu/qr?format=svg",
        label: "SVG",
        icon: "fa-download",
      },
      {
        href: "/api/admin/menu/qr?format=png&variant=compact",
        label: "PNG compact",
        icon: "fa-download",
      },
    ],
  },
  {
    id: "reviews",
    title: "QR code avis Google",
    description:
      "Redirige vers /avis-google puis vers la page Google. L'URL encodée ne change jamais.",
    urlKey: "reviews",
    previewSrc:
      "/api/qr-code/avis-google?format=png&variant=branded&download=0&v=branded3",
    downloads: [
      {
        href: "/api/qr-code/avis-google?format=png&variant=branded",
        label: "Télécharger le carton PNG",
        icon: "fa-qrcode",
        primary: true,
      },
      {
        href: "/api/qr-code/avis-google?format=svg&variant=branded",
        label: "SVG",
        icon: "fa-download",
      },
      {
        href: "/api/qr-code/avis-google?format=png&variant=compact",
        label: "PNG compact",
        icon: "fa-download",
      },
    ],
  },
];

const QrCodesPanel = () => {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://latablemarine.com"
  ).replace(/\/$/, "");

  const urls = {
    site: siteUrl,
    menu: `${siteUrl}/menu`,
    reviews: `${siteUrl}/avis-google`,
  };

  return (
    <div className="tst-admin-orders tst-admin-qrcodes">
      {QR_CODES.map((item) => (
        <section key={item.id} className="tst-admin-menu__permanent">
          <div className="tst-admin-menu__permanent-main">
            <div>
              <strong>{item.title}</strong>
              <p>
                <code>{urls[item.urlKey]}</code>
              </p>
              <p className="tst-admin-menu__meta">{item.description}</p>
              <div className="tst-admin-menu__qr-actions">
                {item.downloads.map((download) => (
                  <a
                    key={download.href}
                    href={download.href}
                    className={`tst-admin-products__btn${
                      download.primary ? "" : " tst-admin-products__btn--ghost"
                    }`}
                    download
                  >
                    <i className={`fas ${download.icon}`} aria-hidden="true" />
                    {download.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="tst-admin-menu__qr-preview">
              <img
                src={item.previewSrc}
                alt={`Aperçu ${item.title}`}
                width={item.id === "site" ? 180 : 180}
                height={item.id === "site" ? 180 : 255}
              />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default QrCodesPanel;
