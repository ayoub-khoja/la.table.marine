import MenuPageClient from "@components/menu/MenuPageClient";
import SeoPageJsonLd from "@components/seo/SeoPageJsonLd";
import { withMenuPdfViewOptions } from "@library/menu/pdf-url";
import { getActiveCarteMenu } from "@library/menu/store";
import { getPageMetadata } from "@library/seo/page-metadata";

export const dynamic = "force-dynamic";
export const metadata = getPageMetadata("menu");

export default async function MenuPage() {
  let redirectUrl = "/api/menu/file";

  try {
    const menu = await getActiveCarteMenu();

    if (!menu) {
      redirectUrl = "/";
    } else if (menu.fileUrl) {
      const fileUrl = withMenuPdfViewOptions(
        menu.fileUrl,
        process.env.SITE_URL || "http://localhost",
        {
          updatedAt: menu.updatedAt,
          gridFsId: menu.gridFsId,
        }
      );
      redirectUrl = `${fileUrl.pathname}${fileUrl.search}${fileUrl.hash}`;
    }
  } catch (error) {
    console.error("[menu/page]", error);
    redirectUrl = "/";
  }

  return (
    <>
      <SeoPageJsonLd pageKey="menu" />
      <main>
        <MenuPageClient redirectUrl={redirectUrl} />
      </main>
    </>
  );
}
