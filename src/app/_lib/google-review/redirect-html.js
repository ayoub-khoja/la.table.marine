/**
 * Redirection HTML + JS.
 * Nécessaire car les redirections HTTP 302 perdent le fragment (#lrd=...,3)
 * qui ouvre la fenêtre Google « écrire un avis ».
 *
 * @param {string} targetUrl
 * @returns {string}
 */
export function renderGoogleReviewRedirectHtml(targetUrl) {
  const safeJson = JSON.stringify(targetUrl);
  const safeAttr = String(targetUrl)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta http-equiv="Cache-Control" content="no-store"/>
  <title>Redirection avis Google — La Table Marine</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, Helvetica, sans-serif;
      background: #041e31;
      color: #f7f4ef;
      text-align: center;
      padding: 24px;
    }
    a { color: #7ec8ef; }
  </style>
</head>
<body>
  <main>
    <p>Redirection vers Google Avis…</p>
    <p><a id="fallback" href="${safeAttr}">Cliquez ici si la redirection ne démarre pas</a></p>
  </main>
  <script>
    (function () {
      var url = ${safeJson};
      try {
        window.location.replace(url);
      } catch (e) {
        window.location.href = url;
      }
    })();
  </script>
</body>
</html>`;
}
