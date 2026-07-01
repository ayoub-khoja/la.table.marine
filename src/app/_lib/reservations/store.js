import { randomUUID } from "crypto";
import {
  formatReservationDate,
  personLabel,
} from "@library/email/reservation";
import { getDb } from "@library/mongodb/client";
import { buildPagination, parsePagination } from "@library/mongodb/pagination";

const COLLECTION = "reservations";

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
    person: payload.person,
    personLabel: personLabel(payload.person),
    date: payload.date,
    dateFormatted: formatReservationDate(payload.date),
    time: payload.time,
    message: payload.message || "",
  };

  const db = await getDb();
  await db.collection(COLLECTION).insertOne(reservation);

  return reservation;
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listReservations(searchParams) {
  const { page, limit } = parsePagination(searchParams);
  const db = await getDb();
  const collection = db.collection(COLLECTION);

  const total = await collection.countDocuments();
  const pagination = buildPagination(page, limit, total);

  const reservations = await collection
    .find({})
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
