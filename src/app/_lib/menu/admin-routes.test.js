import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readRoute(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("routes admin menu — protection", () => {
  it("protège GET/POST/PATCH /api/admin/menu", () => {
    const source = readRoute("src/app/api/admin/menu/route.js");
    expect(source).toContain("requireAdminSession");
    expect(source).toContain("export async function GET");
    expect(source).toContain("export async function POST");
    expect(source).toContain("export async function PATCH");
    expect(source).toContain("replaceCarteMenuPdf");
    expect(source).toContain("setCarteMenuActive");
  });

  it("protège le téléchargement QR", () => {
    const source = readRoute("src/app/api/admin/menu/qr/route.js");
    expect(source).toContain("requireAdminSession");
    expect(source).toContain("generateMenuQrPng");
    expect(source).toContain("generateMenuQrSvg");
    expect(source).toContain("getMenuQrPayload");
  });

  it("protège le fichier admin", () => {
    const source = readRoute("src/app/api/admin/menu/file/route.js");
    expect(source).toContain("requireAdminSession");
    expect(source).toContain("getLatestCarteMenu");
  });

  it("laisse /menu et /api/menu/file publics", () => {
    const publicMenu = readRoute("src/app/(pages)/menu/page.jsx");
    const publicFile = readRoute("src/app/api/menu/file/route.js");

    expect(publicMenu).not.toContain("requireAdminSession");
    expect(publicFile).not.toContain("requireAdminSession");
    expect(publicFile).toContain('Cache-Control": NO_STORE');
  });
});
