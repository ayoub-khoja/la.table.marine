export const REQUEST_TYPE_LABELS = {
  reservation: "Réservation",
  autre: "Autre",
};

export const OCCASION_LABELS = {
  "diner-prive": "Dîner Privé",
  soiree: "Soirée",
  anniversaire: "Anniversaire",
  autre: "Autre",
};

export const SERVICE_TYPE_LABELS = {
  dejeuner: "Déjeuner",
  diner: "Dîner",
};

export function requestTypeLabel(value) {
  return REQUEST_TYPE_LABELS[value] || value || "";
}

export function occasionLabel(value) {
  return OCCASION_LABELS[value] || value || "";
}

export function serviceTypeLabel(value) {
  return SERVICE_TYPE_LABELS[value] || value || "";
}
