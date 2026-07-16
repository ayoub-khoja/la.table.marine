import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findOneMock,
  updateManyMock,
  updateOneMock,
  insertOneMock,
  collectionMock,
  getDbMock,
  saveMenuPdfForStoreMock,
  deleteStoredMenuPdfMock,
} = vi.hoisted(() => {
  const findOneMock = vi.fn();
  const updateManyMock = vi.fn();
  const updateOneMock = vi.fn();
  const insertOneMock = vi.fn();
  const collectionMock = vi.fn(() => ({
    findOne: findOneMock,
    updateMany: updateManyMock,
    updateOne: updateOneMock,
    insertOne: insertOneMock,
  }));
  const getDbMock = vi.fn(async () => ({ collection: collectionMock }));
  const saveMenuPdfForStoreMock = vi.fn();
  const deleteStoredMenuPdfMock = vi.fn();

  return {
    findOneMock,
    updateManyMock,
    updateOneMock,
    insertOneMock,
    collectionMock,
    getDbMock,
    saveMenuPdfForStoreMock,
    deleteStoredMenuPdfMock,
  };
});

vi.mock("@library/mongodb/client", () => ({
  getDb: getDbMock,
}));

vi.mock("@library/menu/pdf-storage", () => ({
  saveMenuPdfForStore: saveMenuPdfForStoreMock,
  deleteStoredMenuPdf: deleteStoredMenuPdfMock,
}));

import {
  createActiveCarteMenu,
  getActiveCarteMenu,
  replaceCarteMenuPdf,
  setCarteMenuActive,
} from "./store";

describe("menu store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateManyMock.mockResolvedValue({ modifiedCount: 1 });
    updateOneMock.mockResolvedValue({ modifiedCount: 1 });
    insertOneMock.mockResolvedValue({ insertedId: { toString: () => "new-id" } });
  });

  it("récupère uniquement le menu actif", async () => {
    findOneMock.mockResolvedValueOnce({
      _id: { toString: () => "active-1" },
      title: "Carte Menu",
      fileName: "menu.pdf",
      fileUrl: "/api/menu/file",
      fileSize: 100,
      mimeType: "application/pdf",
      active: true,
      version: 2,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-16T00:00:00.000Z"),
    });

    const menu = await getActiveCarteMenu();
    expect(menu?.id).toBe("active-1");
    expect(menu?.active).toBe(true);
    expect(findOneMock).toHaveBeenCalledWith(
      { active: true },
      expect.objectContaining({ sort: { updatedAt: -1 } })
    );
  });

  it("n'active qu'un seul menu à la création", async () => {
    findOneMock.mockResolvedValueOnce({ version: 4 });

    const menu = await createActiveCarteMenu({
      title: "Carte Menu",
      fileName: "menu-aout-2026.pdf",
      fileUrl: "/api/menu/file",
      fileSize: 2048,
      storage: "gridfs",
      gridFsId: "abc123",
      storageKey: "abc123",
    });

    expect(updateManyMock).toHaveBeenCalledWith(
      { active: true },
      expect.objectContaining({
        $set: expect.objectContaining({ active: false }),
      })
    );
    expect(menu?.version).toBe(5);
    expect(menu?.active).toBe(true);
  });

  it("remplace le PDF et conserve l'accès via la même URL logique", async () => {
    findOneMock
      .mockResolvedValueOnce({
        _id: { toString: () => "old-id" },
        title: "Carte Menu",
        fileName: "menu-juillet-2026.pdf",
        fileUrl: "/api/menu/file",
        fileSize: 1000,
        mimeType: "application/pdf",
        active: true,
        version: 1,
        gridFsId: "old-grid",
        storageKey: "old-grid",
        storage: "gridfs",
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-01T00:00:00.000Z"),
      })
      .mockResolvedValueOnce({ version: 1 });

    saveMenuPdfForStoreMock.mockResolvedValue({
      fileName: "menu-aout-2026.pdf",
      originalFileName: "menu-aout-2026.pdf",
      fileUrl: "/api/menu/file",
      fileSize: 2000,
      mimeType: "application/pdf",
      storage: "gridfs",
      gridFsId: "new-grid",
      storageKey: "new-grid",
    });

    const { menu } = await replaceCarteMenuPdf({ name: "menu-aout-2026.pdf" });

    expect(menu.originalFileName).toBe("menu-aout-2026.pdf");
    expect(menu.fileUrl.startsWith("/api/menu/file")).toBe(true);
    expect(menu.publicPath).toBe("/menu");
    expect(deleteStoredMenuPdfMock).toHaveBeenCalledWith(
      expect.objectContaining({ gridFsId: "old-grid" })
    );
  });

  it("conserve l'ancien menu si l'import échoue", async () => {
    findOneMock.mockResolvedValueOnce({
      _id: { toString: () => "old-id" },
      title: "Carte Menu",
      fileName: "menu-juillet-2026.pdf",
      fileUrl: "/api/menu/file",
      fileSize: 1000,
      mimeType: "application/pdf",
      active: true,
      version: 1,
      gridFsId: "old-grid",
      storage: "gridfs",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    saveMenuPdfForStoreMock.mockRejectedValue(new Error("INVALID_TYPE"));

    await expect(
      replaceCarteMenuPdf({ name: "bad.pdf" })
    ).rejects.toThrow("INVALID_TYPE");

    expect(insertOneMock).not.toHaveBeenCalled();
    expect(deleteStoredMenuPdfMock).not.toHaveBeenCalled();
  });

  it("désactive puis réactive le menu courant", async () => {
    const doc = {
      _id: { toString: () => "menu-1" },
      title: "Carte Menu",
      fileName: "menu.pdf",
      fileUrl: "/api/menu/file",
      fileSize: 100,
      mimeType: "application/pdf",
      active: true,
      version: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    findOneMock
      .mockResolvedValueOnce(doc)
      .mockResolvedValueOnce({ ...doc, active: false })
      .mockResolvedValueOnce({ ...doc, active: false })
      .mockResolvedValueOnce({ ...doc, active: true });

    const disabled = await setCarteMenuActive(false);
    expect(disabled?.active).toBe(false);

    const enabled = await setCarteMenuActive(true);
    expect(enabled?.active).toBe(true);
    expect(updateManyMock).toHaveBeenCalled();
  });
});
