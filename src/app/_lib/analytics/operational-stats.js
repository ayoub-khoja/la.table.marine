import { getDb } from "@library/mongodb/client";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 */
export async function getOperationalStats() {
  const db = await getDb();
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    reservationsTotal,
    reservationsToday,
    reservationsByStatus,
    messagesTotal,
    reviewsTotal,
    productsTotal,
    reservationsTimeline,
  ] = await Promise.all([
    db.collection("reservations").countDocuments({}),
    db.collection("reservations").countDocuments({
      createdAt: {
        $gte: today.toISOString(),
        $lt: tomorrow.toISOString(),
      },
    }),
    db
      .collection("reservations")
      .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      .toArray(),
    db.collection("messages").countDocuments({}),
    db.collection("reviews").countDocuments({}),
    db.collection("products").countDocuments({}),
    db
      .collection("reservations")
      .aggregate([
        {
          $project: {
            day: { $substr: ["$createdAt", 0, 10] },
          },
        },
        { $group: { _id: "$day", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ])
      .toArray(),
  ]);

  const statusMap = {};
  reservationsByStatus.forEach((row) => {
    statusMap[row._id || "unknown"] = row.count;
  });

  return {
    reservations: {
      total: reservationsTotal,
      today: reservationsToday,
      pending: statusMap.new || 0,
      confirmed: statusMap.confirmed || 0,
      byStatus: statusMap,
      timeline: reservationsTimeline.map((row) => ({
        date: row._id,
        count: row.count,
      })),
    },
    messages: { total: messagesTotal },
    reviews: { total: reviewsTotal },
    products: { total: productsTotal },
  };
}
