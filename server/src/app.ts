import cors from "cors";
import express from "express";

import { HttpError } from "./errors";
import exchangeRateRouter from "./routes/exchangeRate";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/exchange-rate", exchangeRateRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const statusCode = err instanceof HttpError ? err.statusCode : 500;
    const message =
      err instanceof HttpError ? err.message : "Internal server error";
    res.status(statusCode).json({ error: message });
  }
);

export default app;
