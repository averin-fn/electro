/**
 * Электро — сервер на Express.
 *
 * Поднимает HTTP API для управления каталогом видов работ и
 * (в production) отдаёт собранный SPA-клиент из `client/dist`.
 *
 * ENV:
 *   PORT            — порт (по умолчанию 4000)
 *   DATA_FILE       — путь до JSON-хранилища (по умолчанию ./data/works.json)
 *   CLIENT_DIST     — путь до собранного клиента (по умолчанию ../client/dist)
 */
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import worksRouter from "./routes/works.js";
import estimatesRouter from "./routes/estimates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PORT = process.env.PORT || 4000;
const CLIENT_DIST =
  process.env.CLIENT_DIST || path.resolve(ROOT, "../client/dist");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Простая проверка живости — пригодится в пайплайнах деплоя.
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/api/works", worksRouter);
app.use("/api/estimates", estimatesRouter);

// В production отдаём собранный фронт.
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Electro server listening on http://localhost:${PORT}`);
});
