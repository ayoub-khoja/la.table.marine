import { NextResponse } from "next/server";
import { getOnlineOrderMenu } from "@library/online-order/menu";
import {
  groupTabItemsBySection,
  listAllTabItems,
} from "@library/menu-tabs/items-store";
import { listMenuTabs } from "@library/menu-tabs/store";
import { listPublishedSpecialMenus } from "@library/special-menus/store";
import { groupWinesBySection, listAllWines } from "@library/wines/store";

function toCartItem(item) {
  return {
    id: item.id,
    name: item.title || item.name || "",
    description: item.short || item.description || "",
    price: Number(String(item.price || "0").replace(",", ".")) || 0,
    priceFormatted: item.priceFormatted,
  };
}

export async function GET() {
  try {
    const [tabs, menu, wines, specialMenus] = await Promise.all([
      listMenuTabs(),
      getOnlineOrderMenu(),
      listAllWines(),
      listPublishedSpecialMenus(),
    ]);

    const customTabs = tabs.filter((tab) => tab.kind === "custom");
    const custom = {};

    await Promise.all(
      customTabs.map(async (tab) => {
        const items = await listAllTabItems(tab.id);
        custom[tab.id] = {
          sections: groupTabItemsBySection(items).map((section) => ({
            id: section.id,
            name: section.name,
            items: section.items.map(toCartItem),
          })),
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        tabs,
        products: {
          categories: menu.categories,
          sections: menu.sections,
        },
        wines: {
          sections: groupWinesBySection(wines).map((section) => ({
            id: section.id,
            name: section.name,
            items: section.items.map(toCartItem),
          })),
        },
        specialMenus,
        custom,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[api/menu-tabs]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger le menu." },
      { status: 500 }
    );
  }
}
