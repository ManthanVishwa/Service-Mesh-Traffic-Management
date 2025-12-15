import { Router, Request, Response } from "express";
import { register, collectDefaultMetrics } from "prom-client";

const router = Router();

// Collect default metrics
collectDefaultMetrics({ register });

// GET /api/metrics - Prometheus metrics endpoint
router.get("/", async (req: Request, res: Response) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

export { router as metricsRouter };
