import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { deployTrafficRule } from "../services/k8sService";
import { logger } from "../utils/logger";

const router = Router();

// Validation schema
const TrafficRuleSchema = z
  .object({
    serviceName: z.string().min(1),
    version1Name: z.string().min(1),
    version2Name: z.string().min(1),
    version1Weight: z.number().min(0).max(100),
    version2Weight: z.number().min(0).max(100),
    ruleType: z
      .enum(["WEIGHTED", "HEADER_MATCH", "PATH_BASED"])
      .default("WEIGHTED"),
  })
  .refine((data) => data.version1Weight + data.version2Weight === 100, {
    message: "Weights must sum to 100",
  });

// GET /api/rules - Get all traffic rules
router.get("/", async (req: Request, res: Response) => {
  try {
    const rules = await prisma.trafficRule.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: rules });
  } catch (error) {
    logger.error("Error fetching rules:", error);
    res.status(500).json({ success: false, error: "Failed to fetch rules" });
  }
});

// GET /api/rules/:id - Get single rule
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = await prisma.trafficRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error("Error fetching rule:", error);
    res.status(500).json({ success: false, error: "Failed to fetch rule" });
  }
});

// POST /api/rules - Create or update a traffic rule
router.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = TrafficRuleSchema.parse(req.body);

    const rule = await prisma.trafficRule.create({
      data: validatedData,
    });

    logger.info(`Created traffic rule: ${rule.id}`);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error("Error creating rule:", error);
    res.status(500).json({ success: false, error: "Failed to create rule" });
  }
});

// PUT /api/rules/:id - Update a traffic rule
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = TrafficRuleSchema.parse(req.body);

    const rule = await prisma.trafficRule.update({
      where: { id },
      data: validatedData,
    });

    logger.info(`Updated traffic rule: ${rule.id}`);
    res.json({ success: true, data: rule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error("Error updating rule:", error);
    res.status(500).json({ success: false, error: "Failed to update rule" });
  }
});

// POST /api/rules/deploy/:id - Deploy rule to Kubernetes
router.post("/deploy/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rule = await prisma.trafficRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    logger.info(`Deploying traffic rule: ${rule.id} to Kubernetes`);

    // Deploy to Kubernetes
    const result = await deployTrafficRule(rule);

    // Update deployment timestamp
    await prisma.trafficRule.update({
      where: { id },
      data: { deployedAt: new Date() },
    });

    logger.info(`Successfully deployed rule: ${rule.id}`);
    res.json({
      success: true,
      message: "Traffic rule deployed successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error deploying rule:", error);
    res.status(500).json({
      success: false,
      error: "Failed to deploy rule to Kubernetes",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE /api/rules/:id - Delete a traffic rule
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.trafficRule.delete({
      where: { id },
    });

    logger.info(`Deleted traffic rule: ${id}`);
    res.json({ success: true, message: "Rule deleted successfully" });
  } catch (error) {
    logger.error("Error deleting rule:", error);
    res.status(500).json({ success: false, error: "Failed to delete rule" });
  }
});

export { router as rulesRouter };
