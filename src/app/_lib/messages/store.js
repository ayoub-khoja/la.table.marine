import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(MESSAGES_FILE);
  } catch {
    await fs.writeFile(MESSAGES_FILE, "[]", "utf8");
  }
}

async function readAll() {
  await ensureStore();
  const raw = await fs.readFile(MESSAGES_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeAll(messages) {
  await ensureStore();
  const tmp = `${MESSAGES_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(messages, null, 2), "utf8");
  await fs.rename(tmp, MESSAGES_FILE);
}

function parsePagination(searchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("limit") || "10", 10) || 10)
  );
  return { page, limit };
}

/**
 * @param {object} payload
 */
export async function createMessage(payload) {
  const message = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    first_name: payload.first_name,
    last_name: payload.last_name,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone || "",
    message: payload.message,
    preview:
      payload.message.length > 120
        ? `${payload.message.slice(0, 120)}…`
        : payload.message,
  };

  const all = await readAll();
  all.unshift(message);
  await writeAll(all);

  return message;
}

/**
 * @param {URLSearchParams} searchParams
 */
export async function listMessages(searchParams) {
  const { page, limit } = parsePagination(searchParams);
  const all = await readAll();
  const sorted = [...all].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return {
    messages: sorted.slice(start, start + limit),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}
