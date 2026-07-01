import { redirect } from "next/navigation";

import { withMenuPdfViewOptions } from "@library/menu/pdf-url";
import { getActiveCarteMenu } from "@library/menu/store";

export default async function MenuPage() {
  const menu = await getActiveCarteMenu();

  if (menu?.fileUrl) {
    const fileUrl = withMenuPdfViewOptions(menu.fileUrl, process.env.SITE_URL || "http://localhost");
    redirect(`${fileUrl.pathname}${fileUrl.search}${fileUrl.hash}`);
  }

  redirect("/");
}