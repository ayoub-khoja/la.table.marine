export function isChildSpecialMenu(menu) {
  return /enfant/i.test(menu?.name || "");
}

export function sortPublishedSpecialMenus(menus) {
  return [...menus].sort((a, b) => {
    const aChild = isChildSpecialMenu(a);
    const bChild = isChildSpecialMenu(b);

    if (aChild && !bChild) return 1;
    if (!aChild && bChild) return -1;

    return Number(b.price) - Number(a.price);
  });
}
