import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const MENU_FILE = path.join(DATA_DIR, "menu-upload.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(MENU_FILE);
  } catch {
    await fs.writeFile(MENU_FILE, "null", "utf8");
  }
}

export async function getMenuUpload() {
  await ensureStore();
  const raw = await fs.readFile(MENU_FILE, "utf8");

  if (!raw || raw.trim() === "null") {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * @param {object} payload
 */
export async function saveMenuUpload(payload) {
  await ensureStore();

  const record = {
    url: payload.url,
    filename: payload.filename,
    size: payload.size,
    uploadedAt: new Date().toISOString(),
  };

  const tmp = `${MENU_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(record, null, 2), "utf8");
  await fs.rename(tmp, MENU_FILE);

  return record;
}
