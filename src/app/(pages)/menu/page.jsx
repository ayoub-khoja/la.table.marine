import { redirect } from "next/navigation";

import { withMenuPdfViewOptions } from "@library/menu/pdf-url";
import { getActiveCarteMenu } from "@library/menu/store";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  try {
    const menu = await getActiveCarteMenu();

    if (menu?.fileUrl) {
      const fileUrl = withMenuPdfViewOptions(menu.fileUrl, process.env.SITE_URL || "http://localhost");
      redirect(`${fileUrl.pathname}${fileUrl.search}${fileUrl.hash}`);
    }
  } catch (error) {
    console.error("[menu/page]", error);
  }

  redirect("/");
}