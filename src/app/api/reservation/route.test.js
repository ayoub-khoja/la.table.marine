import { beforeEach, describe, expect, it, vi } from "vitest";

const { createReservation, getMailConfig, sendMailBatch } = vi.hoisted(() => ({
  createReservation: vi.fn(),
  getMailConfig: vi.fn(() => null),
  sendMailBatch: vi.fn(),
}));

vi.mock("@library/reservations/store", () => ({
  createReservation: (...args) => createReservation(...args),
}));
vi.mock("@library/email/mail-config", () => ({
  getMailConfig: (...args) => getMailConfig(...args),
  createMailTransporter: vi.fn(async () => ({})),
  sendMailBatch: (...args) => sendMailBatch(...args),
}));
vi.mock("@library/email/order", () => ({ getEmailHeaderAttachments: () => [] }));
vi.mock("@library/email/reservation", () => ({ renderReservationEmailHtml: () => "" }));

const { POST } = await import("./route");
const { getReservationLeadEventId } = await import("@library/cookies/meta-pixel");

const TRACKING_ID = "3f2b8c1e-6a4d-4e2f-9b7a-1c2d3e4f5a6b";
let ipCounter = 0;

const VALID_BODY = {
  first_name: "Jean",
  last_name: "Dupont",
  email: "jean.dupont@example.com",
  phone: "0612345678",
  person: "2",
  date: "2026-11-02",
  time: "20:00",
  requestType: "reservation",
  occasion: "soiree",
  serviceType: "diner",
  message: "Allergie aux crustacés",
  website: "",
};

async function post(body) {
  ipCounter += 1;
  const request = new Request("http://localhost/api/reservation", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${ipCounter}` },
    body: JSON.stringify(body),
  });
  const res = await POST(request);
  return { res, data: await res.json() };
}

describe("POST /api/reservation — signal de succès pour le Lead", () => {
  beforeEach(() => {
    createReservation.mockReset();
    getMailConfig.mockReset();
    getMailConfig.mockReturnValue(null);
    sendMailBatch.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renvoie reservationSaved + trackingEventId après enregistrement", async () => {
    createReservation.mockResolvedValue({ id: "db-id", trackingEventId: TRACKING_ID });

    const { res, data } = await post(VALID_BODY);

    expect(createReservation).toHaveBeenCalledTimes(1);
    expect(data).toMatchObject({ success: true, reservationSaved: true, trackingEventId: TRACKING_ID });
    expect(data.email).toBeUndefined();
    expect(data.first_name).toBeUndefined();
    expect(data.phone).toBeUndefined();
    expect(data.message).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain("jean.dupont");
    expect(JSON.stringify(data)).not.toContain("Allergie");
    expect(getReservationLeadEventId(res.ok, data)).toBe(TRACKING_ID);
  });

  it("confirme l'enregistrement même si l'envoi d'e-mail échoue", async () => {
    createReservation.mockResolvedValue({ id: "db-id", trackingEventId: TRACKING_ID });
    getMailConfig.mockReturnValue({ from: "reservations@latablemarine.com", to: "contact@latablemarine.com" });
    sendMailBatch.mockRejectedValue(new Error("smtp down"));

    const { res, data } = await post(VALID_BODY);

    expect(res.status).toBe(200);
    expect(data.emailSent).toBe(false);
    expect(getReservationLeadEventId(res.ok, data)).toBe(TRACKING_ID);
  });

  it("ne renvoie aucun identifiant si la validation échoue", async () => {
    const { res, data } = await post({ ...VALID_BODY, phone: "" });

    expect(res.status).toBe(400);
    expect(createReservation).not.toHaveBeenCalled();
    expect(getReservationLeadEventId(res.ok, data)).toBeNull();
  });

  it("ne renvoie aucun identifiant si l'écriture en base échoue", async () => {
    createReservation.mockRejectedValue(new Error("Mongo down"));

    const { res, data } = await post(VALID_BODY);

    expect(res.status).toBe(500);
    expect(getReservationLeadEventId(res.ok, data)).toBeNull();
  });

  it("ne confirme pas d'enregistrement pour le honeypot anti-spam", async () => {
    const { res, data } = await post({ ...VALID_BODY, website: "spam" });

    expect(createReservation).not.toHaveBeenCalled();
    expect(data.success).toBe(true);
    expect(getReservationLeadEventId(res.ok, data)).toBeNull();
  });
});
