/**
 * @param {number} value
 */
export function formatPrice(value) {
  return `${value.toFixed(2).replace(".", ",")}€`;
}
