import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import path from "path";

const prisma = new PrismaClient();
dotenv.config();
const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use(express.json());
app.use(helmet());
app.use(limiter);

// Add this to server static files. This will allows for a landing page.
app.use(express.static("public"));

app.get("/", (req: Request, res: Response) => {
  res.sendFile("index.html", { root: path.join(__dirname, "public") });
});

// Sections
app.get("/sections", async (req: Request, res: Response) => {
  const sections = await prisma.section.findMany();
  res.json(sections);
});

// Get section by ID. Example: /section?sectionID=1
app.get("/section", async (req: Request, res: Response) => {
  const sectionID = parseInt(req.query.sectionID as string);

  if (!sectionID) {
    console.log("Section ID is required");
    return res.status(400).send("Section ID is required");
  }

  try {
    const node = await prisma.section.findUnique({
      where: {
        SectionID: sectionID,
      },
    });

    if (node) {
      res.json(node);
    } else {
      console.log("Section not found");
      res.status(404).send("Section not found");
    }
  } catch (error) {
    res
      .status(500)
      .send("An error occurred while fetching the section: " + error);
  }
});

// Nodes
app.get("/nodes", async (req: Request, res: Response) => {
  const nodes = await prisma.nodes.findMany();
  res.json(nodes);
});

// Get node by ID. Example: /node?nodeId=1
app.get("/node", async (req: Request, res: Response) => {
  const nodeId = parseInt(req.query.nodeId as string);

  if (!nodeId) {
    console.log("Node ID is required");
    return res.status(400).send("Node ID is required");
  }

  try {
    const node = await prisma.nodes.findUnique({
      where: {
        NodeID: nodeId,
      },
    });

    if (node) {
      res.json(node);
    } else {
      console.log("Node not found");
      res.status(404).send("Node not found");
    }
  } catch (error) {
    res.status(500).send("An error occurred while fetching the node: " + error);
  }
});

// Get all edges
app.get("/edges", async (req: Request, res: Response) => {
  const edges = await prisma.edges.findMany();
  res.json(edges);
});

// Get edge by ID. Example: /edge?edgeID=1
app.get("/edge", async (req: Request, res: Response) => {
  const edgeID = parseInt(req.query.edgeID as string);

  if (!edgeID) {
    console.log("Edge ID is required");
    return res.status(400).send("Edge ID is required");
  }

  try {
    const node = await prisma.edges.findUnique({
      where: {
        EdgeID: edgeID,
      },
    });

    if (node) {
      res.json(node);
    } else {
      console.log("Edge not found");
      res.status(404).send("Edge not found");
    }
  } catch (error) {
    res.status(500).send("An error occurred while fetching the edge: " + error);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
