import { randomUUID } from "crypto";
import {
  formatReservationDate,
  personLabel,
} from "@library/email/reservation";
import {
  occasionLabel,
  requestTypeLabel,
  serviceTypeLabel,
} from "@library/reservations/labels";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";

const COLLECTION = "reservations";

let indexesReady = false;

async function ensureIndexes(db) {
  if (indexesReady) return;
  const collection = db.collection(COLLECTION);

  await Promise.all([
    collection.createIndex({ createdAt: -1 }),
    collection.createIndex({ email: 1, createdAt: -1 }),
    collection.createIndex({ status: 1, createdAt: -1 }),
    collection.createIndex({ date: 1, time: 1 }),
  ]);

  indexesReady = true;
}

/**
 * @param {object} payload
 */
export async function createReservation(payload) {
  const reservation = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    first_name: payload.first_name,
    last_name: payload.last_name,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone || "",
    person: payload.person,
    personLabel: personLabel(payload.person),
    date: payload.date,
    dateFormatted: formatReservationDate(payload.date),
    time: payload.time,
    requestType: payload.requestType || "",
    requestTypeLabel: requestTypeLabel(payload.requestType),
    occasion: payload.occasion || "",
    occasionLabel: occasionLabel(payload.occasion),
    serviceType: payload.serviceType || "",
    serviceTypeLabel: serviceTypeLabel(payload.serviceType),
    message: payload.message || "",
    status: "new",
    readAt: null,
    archivedAt: null,
  };

  const db = await getDb();
  await ensureIndexes(db);
  await db.collection(COLLECTION).insertOne(reservation);

  return reservation;
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listReservations(searchParams) {
  const { page, limit } = parsePagination(searchParams);
  const filter = buildReservationFilter(searchParams);
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const total = await collection.countDocuments(filter);
  const pagination = buildPagination(page, limit, total);

  const reservations = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(limit)
    .toArray();

  return {
    reservations,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages,
      hasNext: pagination.hasNext,
      hasPrev: pagination.hasPrev,
    },
  };
}

export async function deleteReservation(id) {
  const normalizedId = String(id || "").trim();
  if (!normalizedId) return false;

  const db = await getDb();
  const result = await db.collection(COLLECTION).deleteOne({ id: normalizedId });

  return result.deletedCount > 0;
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildReservationFilter(searchParams) {
  const filter = {};

  const service = (searchParams.get("service") || "all").trim();
  if (service && service !== "all") {
    filter.serviceType = service;
  }

  const occasion = (searchParams.get("occasion") || "all").trim();
  if (occasion && occasion !== "all") {
    filter.occasion = occasion;
  }

  const requestType = (searchParams.get("requestType") || "all").trim();
  if (requestType && requestType !== "all") {
    filter.requestType = requestType;
  }

  const period = (searchParams.get("period") || "all").trim();
  const periodRange = getPeriodDateRange(period);
  if (periodRange) {
    filter.date = {};
    if (periodRange.from) filter.date.$gte = periodRange.from;
    if (periodRange.to) filter.date.$lte = periodRange.to;
  }

  const q = (searchParams.get("q") || "").trim();
  if (q) {
    const re = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { fullName: re },
      { email: re },
      { phone: re },
      { message: re },
    ];
  }

  return filter;
}

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getPeriodDateRange(period) {
  if (!period || period === "all") {
    return null;
  }

  const now = new Date();
  const today = formatDateLocal(now);

  if (period === "today") {
    return { from: today, to: today };
  }

  if (period === "week") {
    const current = new Date(now);
    const weekday = current.getDay();
    const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: formatDateLocal(monday), to: formatDateLocal(sunday) };
  }

  if (period === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: formatDateLocal(first), to: formatDateLocal(last) };
  }

  if (period === "upcoming") {
    return { from: today, to: null };
  }

  return null;
}
