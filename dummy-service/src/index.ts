import express, { Request, Response } from "express";
import {
  register,
  collectDefaultMetrics,
  Counter,
  Histogram,
} from "prom-client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const VERSION = process.env.VERSION || "v1";

// Prometheus metrics
collectDefaultMetrics({ register });

const requestCounter = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status", "version"],
});

const requestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "version"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

// Middleware to track metrics
app.use((req: Request, res: Response, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    requestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode,
      version: VERSION,
    });
    requestDuration.observe(
      {
        method: req.method,
        route: req.path,
        version: VERSION,
      },
      duration
    );
  });

  next();
});

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: `Hello from ${VERSION}!`,
    version: VERSION,
    timestamp: new Date().toISOString(),
    service: "dummy-service",
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    version: VERSION,
    uptime: process.uptime(),
  });
});

app.get("/metrics", async (req: Request, res: Response) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Simulate different response times for canary testing
app.get("/api/data", (req: Request, res: Response) => {
  const delay = VERSION === "v2" ? 50 : 100; // v2 is faster

  setTimeout(() => {
    res.json({
      data: [
        { id: 1, value: "Sample data from " + VERSION },
        { id: 2, value: "Another entry from " + VERSION },
      ],
      version: VERSION,
      processingTime: delay,
    });
  }, delay);
});

// Error endpoint for testing error rates
app.get("/api/error", (req: Request, res: Response) => {
  const errorRate = VERSION === "v2" ? 0.1 : 0.3; // v2 has lower error rate

  if (Math.random() < errorRate) {
    res.status(500).json({
      error: "Internal server error",
      version: VERSION,
    });
  } else {
    res.json({
      message: "Success",
      version: VERSION,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Dummy Service ${VERSION} running on port ${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
});

export default app;
