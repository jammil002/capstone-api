import * as dotenv from "dotenv";
import CORS from "cors";
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
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(CORS());
app.use(limiter);

function getDistance(latitude1, longitude1, latitude2, longitude2) {
  const earthRadiusMiles = 3958.8; // Radius of the Earth in miles
  const deltaLatitudeRadians = degreesToRadians(latitude2 - latitude1);
  const deltaLongitudeRadians = degreesToRadians(longitude2 - longitude1);

  const a =
    Math.sin(deltaLatitudeRadians / 2) * Math.sin(deltaLatitudeRadians / 2) +
    Math.cos(degreesToRadians(latitude1)) *
      Math.cos(degreesToRadians(latitude2)) *
      Math.sin(deltaLongitudeRadians / 2) *
      Math.sin(deltaLongitudeRadians / 2);

  const centralAngleRadians = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusMiles * centralAngleRadians; // Distance in miles

  return distance;
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Add this to server static files. This will allows for a landing page.
app.use(express.static("public"));

app.get("/", (req: Request, res: Response) => {
  res.sendFile("index.html", { root: path.join(__dirname, "public") });
});

app.get("/edgepost", (req: Request, res: Response) => {
  res.sendFile("edgepost.html", { root: path.join(__dirname, "public") });
});

app.post("/calculateEdge", async (req: Request, res: Response) => {
  const { startingNode, endingNodes } = req.body;

  if (!startingNode || !endingNodes) {
    return res.status(400).send("Invalid node input.");
  }

  const edgeData = [];

  try {
    for (const endingNode of endingNodes) {
      const distance = getDistance(
        parseFloat(startingNode.Latitude),
        parseFloat(startingNode.Longitude),
        parseFloat(endingNode.Latitude),
        parseFloat(endingNode.Longitude)
      );

      edgeData.push({
        StartNodeID: startingNode.NodeID,
        EndNodeID: endingNode.NodeID,
        Distance: distance,
        Description: startingNode.Name + " to " + endingNode.Name,
      });
    }

    console.log(edgeData);

    // Bulk insert
    await prisma.edges.createMany({
      data: edgeData,
      skipDuplicates: true, // Optional: skip duplicates if needed
    });

    res.status(200).send("Distances calculated and stored successfully");
  } catch (error) {
    res.status(400).send("Error: " + error.message);
  }
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
