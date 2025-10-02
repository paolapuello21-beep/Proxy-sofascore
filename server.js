const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/proxy", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Falta parámetro ?url=" });

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy corriendo en http://localhost:${PORT}`);
});
