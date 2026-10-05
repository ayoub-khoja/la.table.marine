import fs from "fs";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";

import { GET as getAvisGoogleRoute } from "../../avis-google/route";
import { GET as getQrRoute } from "../../api/qr-code/avis-google/route";
import { renderGoogleReviewErrorHtml } from "./error-html";

const projectRoot = process.cwd();

const ORIGINAL_GOOGLE = process.env.GOOGLE_REVIEW_URL;
const ORIGINAL_SITE = process.env.SITE_URL;
const ORIGINAL_PUBLIC = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL_GOOGLE === undefined) delete process.env.GOOGLE_REVIEW_URL;
  else process.env.GOOGLE_REVIEW_URL = ORIGINAL_GOOGLE;

  if (ORIGINAL_SITE === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = ORIGINAL_SITE;

  if (ORIGINAL_PUBLIC === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_PUBLIC;
});

function readRoute(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("routes avis Google", () => {
  it("ne dépend pas de l'administration", () => {
    const avisRoute = readRoute("src/app/avis-google/route.js");
    const qrRoute = readRoute("src/app/api/qr-code/avis-google/route.js");

    expect(avisRoute).not.toContain("requireAdminSession");
    expect(qrRoute).not.toContain("requireAdminSession");
    expect(qrRoute).not.toContain("process.env.GOOGLE_REVIEW_URL");
    expect(qrRoute).not.toContain("getGoogleReviewRedirectTarget");
    expect(qrRoute).toContain("getGoogleReviewQrPayload");
  });

  it("redirige vers une URL Google valide avec statut temporaire 302", async () => {
    process.env.GOOGLE_REVIEW_URL =
      "https://search.google.com/local/writereview?placeid=ChIJTEST";

    const response = await getAvisGoogleRoute();
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(process.env.GOOGLE_REVIEW_URL);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("normalise Search+#lrd vers writereview Place ID (302, sans #)", async () => {
    process.env.GOOGLE_REVIEW_URL =
      "https://www.google.com/search?q=La+Table+Marine+Plaisir&ludocid=14858346325559884970#lrd=0x47e685d4a2e5dfbf:0xce3373429cba3caa,3";

    const response = await getAvisGoogleRoute();

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain(
      "search.google.com/local/writereview?placeid=ChIJ"
    );
    expect(response.headers.get("location")).not.toContain("#");
  });

  it("utilise une redirection HTML/JS si une URL avec # est fournie telle quelle", async () => {
    process.env.GOOGLE_REVIEW_URL =
      "https://www.google.com/maps/place/Test/@48,2,17z#lrd=0xabc:0xdef,3";

    const response = await getAvisGoogleRoute();
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("location.replace");
    expect(html).toContain("#lrd=");
  });

  it("affiche la page d'erreur si GOOGLE_REVIEW_URL est absente", async () => {
    delete process.env.GOOGLE_REVIEW_URL;

    const response = await getAvisGoogleRoute();
    const html = await response.text();

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(html).toContain("Avis Google");
    expect(html).toContain("temporairement indisponible");
    expect(html).toContain('href="/"');
    expect(html).not.toContain("stack");
    expect(html).not.toContain("Error:");
  });

  it("affiche la page d'erreur si GOOGLE_REVIEW_URL est invalide", async () => {
    process.env.GOOGLE_REVIEW_URL = "javascript:alert(1)";

    const response = await getAvisGoogleRoute();
    const html = await response.text();

    expect(response.status).toBe(503);
    expect(html).toContain("Avis Google");
  });

  it("génère le QR PNG avec le bon type MIME et nom de fichier", async () => {
    process.env.SITE_URL = "https://latablemarine.com";

    const request = new Request(
      "http://localhost:3000/api/qr-code/avis-google?format=png"
    );
    const response = await getQrRoute(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
    expect(response.headers.get("content-disposition")).toContain(
      "qr-avis-google-la-table-marine.png"
    );
    expect(response.headers.get("cache-control")).toContain("no-store");

    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
  }, 20000);

  it("génère le QR SVG avec le bon type MIME et nom de fichier", async () => {
    process.env.SITE_URL = "https://latablemarine.com";

    const request = new Request(
      "http://localhost:3000/api/qr-code/avis-google?format=svg"
    );
    const response = await getQrRoute(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(response.headers.get("content-disposition")).toContain(
      "qr-avis-google-la-table-marine.svg"
    );

    const svg = await response.text();
    expect(svg).toContain("<svg");
  }, 20000);

  it("encode uniquement /avis-google dans le QR (pas le lien Google)", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://latablemarine.com";
    process.env.GOOGLE_REVIEW_URL =
      "https://search.google.com/local/writereview?placeid=SECRET";

    const request = new Request(
      "http://localhost:3000/api/qr-code/avis-google?format=svg"
    );
    const response = await getQrRoute(request);
    const svg = await response.text();

    expect(svg).not.toContain("SECRET");
    expect(svg).not.toContain("writereview");
  }, 20000);

  it("expose une page d'erreur HTML professionnelle", () => {
    const html = renderGoogleReviewErrorHtml();
    expect(html).toContain("<title>Avis Google");
    expect(html).toContain("Retour à l&apos;accueil");
  });
});
