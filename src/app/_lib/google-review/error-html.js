/**
 * Page d'erreur professionnelle lorsque la redirection Google est indisponible.
 * @returns {string}
 */
export function renderGoogleReviewErrorHtml() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Avis Google — La Table Marine</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: Georgia, "Times New Roman", serif;
      background: #041e31;
      color: #f7f4ef;
    }
    main {
      max-width: 520px;
      text-align: center;
    }
    h1 {
      margin: 0 0 16px;
      font-size: 2rem;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    p {
      margin: 0 0 28px;
      line-height: 1.6;
      color: #8bafc4;
      font-size: 1.05rem;
    }
    a {
      display: inline-block;
      padding: 12px 28px;
      border-radius: 4px;
      background: #0b4f7a;
      color: #fff;
      text-decoration: none;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    a:hover { background: #1e7aad; }
  </style>
</head>
<body>
  <main>
    <h1>Avis Google</h1>
    <p>Le service permettant de laisser un avis est temporairement indisponible. Merci de réessayer ultérieurement.</p>
    <a href="/">Retour à l&apos;accueil</a>
  </main>
</body>
</html>`;
}
