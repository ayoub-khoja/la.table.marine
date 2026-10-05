import { getDb } from "@library/mongodb/client";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function isOnOrAfter(iso, boundary) {
  return new Date(iso) >= boundary;
}

function sumRevenue(orders) {
  return orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
}

const ESTIMATED_GUESTS_PER_ORDER = 2;
const DEFAULT_TICKET_PER_GUEST = 35;
const DEFAULT_CURRENCY = "€";
const ESTIMATED_DISHES_PER_GUEST = 2;

function parseProductPrice(price) {
  const raw = String(price ?? "")
    .trim()
    .replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getAverageProductPrice(products) {
  const prices = products
    .map((product) => parseProductPrice(product.price))
    .filter((price) => price > 0);

  if (!prices.length) return 0;

  return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}

function parseReservationPersonCount(person) {
  const parsed = Number.parseInt(String(person || ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 0;
  return parsed;
}

function sumReservationGuests(reservations) {
  return reservations.reduce(
    (sum, reservation) => sum + parseReservationPersonCount(reservation.person),
    0
  );
}

function getEstimatedTicketPerGuest(orders, revenueTotal, products) {
  if (orders.length > 0 && revenueTotal > 0) {
    return {
      value: revenueTotal / (orders.length * ESTIMATED_GUESTS_PER_ORDER),
      source: "orders",
    };
  }

  const averageProductPrice = getAverageProductPrice(products);
  if (averageProductPrice > 0) {
    return {
      value: averageProductPrice * ESTIMATED_DISHES_PER_GUEST,
      source: "menu",
    };
  }

  return {
    value: DEFAULT_TICKET_PER_GUEST,
    source: "default",
  };
}

function computeApproximateRevenue(guestCount, ticketPerGuest) {
  if (!guestCount || !ticketPerGuest) return 0;
  return guestCount * ticketPerGuest;
}

function formatRevenue(amount, currency = "$") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${currency}0.00`;
  return `${currency}${n.toFixed(2)}`;
}

function buildLast7DaysActivity(orders, reservations, messages) {
  const days = [];
  const now = startOfDay(new Date());

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);

    const label = new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
    }).format(day);

    const inDay = (iso) => {
      const t = new Date(iso);
      return t >= day && t < next;
    };

    const ordersCount = orders.filter((o) => inDay(o.createdAt)).length;
    const reservationsCount = reservations.filter((r) =>
      inDay(r.createdAt)
    ).length;
    const messagesCount = messages.filter((m) => inDay(m.createdAt)).length;

    days.push({
      key: day.toISOString().slice(0, 10),
      label,
      orders: ordersCount,
      reservations: reservationsCount,
      messages: messagesCount,
      total: ordersCount + reservationsCount + messagesCount,
    });
  }

  const max = Math.max(1, ...days.map((d) => d.total));
  return days.map((d) => ({ ...d, max }));
}

function buildRecentActivity(orders, reservations, messages, limit = 6) {
  const items = [
    ...orders.map((o) => ({
      id: o.id,
      type: "order",
      typeLabel: "Commande",
      title: o.fullName,
      subtitle: o.totalFormatted || formatRevenue(o.total, o.currency),
      createdAt: o.createdAt,
      href: "/admin/commandes",
    })),
    ...reservations.map((r) => ({
      id: r.id,
      type: "reservation",
      typeLabel: "Réservation",
      title: r.fullName,
      subtitle: `${r.dateFormatted || r.date} · ${r.time}`,
      createdAt: r.createdAt,
      href: "/admin/reservations",
    })),
    ...messages.map((m) => ({
      id: m.id,
      type: "message",
      typeLabel: "Message",
      title: m.fullName,
      subtitle: m.preview || m.message,
      createdAt: m.createdAt,
      href: "/admin/messages",
    })),
  ];

  return items
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export async function getDashboardStats() {
  const db = await getDb();

  const [orders, reservations, messages, products] = await Promise.all([
    db.collection("orders").find({}).sort({ createdAt: -1 }).toArray(),
    db.collection("reservations").find({}).sort({ createdAt: -1 }).toArray(),
    db.collection("messages").find({}).sort({ createdAt: -1 }).toArray(),
    db.collection("products").find({}).toArray(),
  ]);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const weekStart = startOfWeek(now);

  const ordersThisMonth = orders.filter((o) =>
    isOnOrAfter(o.createdAt, monthStart)
  );
  const ordersThisWeek = orders.filter((o) =>
    isOnOrAfter(o.createdAt, weekStart)
  );
  const reservationsThisMonth = reservations.filter((r) =>
    isOnOrAfter(r.createdAt, monthStart)
  );
  const reservationsThisWeek = reservations.filter((r) =>
    isOnOrAfter(r.createdAt, weekStart)
  );
  const messagesThisMonth = messages.filter((m) =>
    isOnOrAfter(m.createdAt, monthStart)
  );
  const messagesThisWeek = messages.filter((m) =>
    isOnOrAfter(m.createdAt, weekStart)
  );

  const currency = orders[0]?.currency || DEFAULT_CURRENCY;
  const revenueTotal = sumRevenue(orders);
  const revenueMonth = sumRevenue(ordersThisMonth);
  const ticketEstimate = getEstimatedTicketPerGuest(
    orders,
    revenueTotal,
    products
  );
  const ticketPerGuest = ticketEstimate.value;
  const guestsTotal = sumReservationGuests(reservations);
  const guestsMonth = sumReservationGuests(reservationsThisMonth);
  const guestsWeek = sumReservationGuests(reservationsThisWeek);
  const approximateRevenueTotal = computeApproximateRevenue(
    guestsTotal,
    ticketPerGuest
  );
  const approximateRevenueMonth = computeApproximateRevenue(
    guestsMonth,
    ticketPerGuest
  );

  const activityLast7Days = buildLast7DaysActivity(
    orders,
    reservations,
    messages
  );
  const activityWeekTotal = activityLast7Days.reduce((s, d) => s + d.total, 0);

  return {
    orders: {
      total: orders.length,
      thisMonth: ordersThisMonth.length,
      thisWeek: ordersThisWeek.length,
    },
    reservations: {
      total: reservations.length,
      thisMonth: reservationsThisMonth.length,
      thisWeek: reservationsThisWeek.length,
      guests: {
        total: guestsTotal,
        thisMonth: guestsMonth,
        thisWeek: guestsWeek,
      },
    },
    messages: {
      total: messages.length,
      thisMonth: messagesThisMonth.length,
      thisWeek: messagesThisWeek.length,
    },
    revenue: {
      total: revenueTotal,
      thisMonth: revenueMonth,
      formattedTotal: formatRevenue(revenueTotal, currency),
      formattedMonth: formatRevenue(revenueMonth, currency),
      currency,
    },
    approximateRevenue: {
      total: approximateRevenueTotal,
      thisMonth: approximateRevenueMonth,
      formattedTotal: formatRevenue(approximateRevenueTotal, currency),
      formattedMonth: formatRevenue(approximateRevenueMonth, currency),
      ticketPerGuest,
      formattedTicketPerGuest: formatRevenue(ticketPerGuest, currency),
      ticketSource: ticketEstimate.source,
    },
    activity: {
      last7Days: activityLast7Days,
      weekTotal: activityWeekTotal,
    },
    recentActivity: buildRecentActivity(orders, reservations, messages),
  };
}
