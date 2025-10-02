import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// --- Utilidad CORS ---
function setCors(res) {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
  });
}

// --- Salud / Información (para probar fácil en el navegador) ---
app.get("/", (_req, res) => {
  setCors(res);
  res
    .type("text/plain")
    .send("✅ Proxy Sofascore OK. Usa /sofa?path=/api/v1/...  (ej.: /sofa?path=/api/v1/search/all?q=barcelona)");
});

// --- Preflight CORS (por si el navegador hace OPTIONS) ---
app.options("*", (_req, res) => {
  setCors(res);
  res.sendStatus(204);
});

// --- Proxy principal: /sofa?path=/api/v1/... ---
app.get("/sofa", async (req, res) => {
  setCors(res);
  try {
    const path = String(req.query.path || "");

    // Validación: solo permitimos rutas API de Sofascore
    if (!path || !path.startsWith("/api/")) {
      return res.status(400).json({
        error: "Parámetro 'path' inválido. Debe iniciar con /api/ (ej.: /api/v1/search/all?q=barcelona)"
      });
    }

    // Construye la URL de Sofascore correctamente (¡sin /sofa! solo el path)
    const upstream = "https://api.sofascore.com" + path;

    // fetch nativo de Node 18+ (Render usa Node moderno)
    const upstreamRes = await fetch(upstream, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
      }
    });

    // Leemos como binario para devolver tal cual (JSON o lo que sea)
    const buf = Buffer.from(await upstreamRes.arrayBuffer());

    // Content-Type del upstream (si no, json por defecto)
    const contentType =
      upstreamRes.headers.get("content-type") || "application/json; charset=utf-8";

    res.set({
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });

    return res.status(upstreamRes.status).send(buf);
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

// --- Arranque ---
app.listen(PORT, () => {
  console.log(`Proxy Sofascore escuchando en http://localhost:${PORT}`);
});
