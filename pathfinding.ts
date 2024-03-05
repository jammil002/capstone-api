import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

interface Node {
  id: number;
  latitude: number;
  longitude: number;
}

interface Edge {
  startNodeId: number;
  endNodeId: number;
  distance: number;
}

class PriorityQueue<T> {
  private qElements: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number): void {
    this.qElements.push({ item, priority });
    this.qElements.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.qElements.shift()?.item;
  }

  isEmpty(): boolean {
    return this.qElements.length === 0;
  }
}

function haversineDistance(a: Node, b: Node): number {
  const earthRadius = 3958.8;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const aVal =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return earthRadius * c;
}

function aStarPathfinding(
  nodes: Node[],
  edges: Edge[],
  startId: number,
  goalId: number
): Node[] | null {
  const startNode = nodes.find((node) => node.id == startId);
  const goalNode = nodes.find((node) => node.id == goalId);

  if (!startNode || !goalNode) return null;

  const frontier = new PriorityQueue<Node>();
  frontier.enqueue(startNode, 0);

  const cameFrom: Map<number, Node | null> = new Map();
  const costSoFar: Map<number, number> = new Map();

  while (!frontier.isEmpty()) {
    const currentNode = frontier.dequeue();

    if (currentNode === undefined) continue;
    if (currentNode.id === goalNode.id) {
      return reconstructPath(cameFrom, nodes, startId, goalId);
    }
    const currentEdges = edges.filter(
      (edge) => edge.startNodeId === currentNode.id
    );

    for (const edge of currentEdges) {
      const nextNode = nodes.find((node) => node.id === edge.endNodeId);
      if (!nextNode) continue;

      const newCost = costSoFar.get(currentNode.id) || 0 + edge.distance;
      if (
        !costSoFar.has(nextNode.id) ||
        newCost < (costSoFar.get(nextNode.id) || Infinity)
      ) {
        costSoFar.set(nextNode.id, newCost);
        const priority = newCost + haversineDistance(nextNode, goalNode);

        frontier.enqueue(nextNode, priority);
        cameFrom.set(nextNode.id, currentNode);
      }
    }
  }

  return null;
}

function reconstructPath(
  cameFrom: Map<number, Node | null>,
  nodes: Node[],
  startId: number,
  goalId: number
): Node[] {
  let currentId = goalId;
  const path: Node[] = [];
  while (currentId !== startId) {
    const currentNode = nodes.find((node) => node.id === currentId);
    if (currentNode) {
      path.unshift(currentNode); // Add to the beginning of the path
      const prevNode = cameFrom.get(currentId);
      currentId = prevNode ? prevNode.id : startId; // Move to the previous node in the path
    } else {
      break; // This should not happen if the path is correct
    }
  }
  // Add the start node at the beginning of the path if it's missing
  if (path[0]?.id !== startId) {
    const startNode = nodes.find((node) => node.id === startId);
    if (startNode) {
      path.unshift(startNode);
    }
  }
  return path;
}

async function findRelevantSections(
  startSectionId: number,
  goalSectionId: number
): Promise<Set<number>> {
  const sectionsToVisit = [startSectionId]; // Start with the starting section
  const visitedSections = new Set<number>(); // Keep track of visited sections

  while (sectionsToVisit.length > 0) {
    const currentSectionId = sectionsToVisit.shift(); // Get the current section to process

    if (currentSectionId === undefined) continue; // Skip if undefined for some reason
    if (visitedSections.has(currentSectionId)) continue; // Skip already visited sections

    visitedSections.add(currentSectionId); // Mark this section as visited

    // Fetch all adjacent sections from the database
    const adjacentSections = await prisma.adjacentSections.findMany({
      where: {
        OR: [
          { SectionID1: currentSectionId },
          { SectionID2: currentSectionId },
        ],
      },
    });

    // Add the new adjacent sections to the list for visiting
    for (const section of adjacentSections) {
      const nextSectionId =
        section.SectionID1 === currentSectionId
          ? section.SectionID2
          : section.SectionID1;
      sectionsToVisit.push(nextSectionId);
    }

    if (visitedSections.has(goalSectionId)) {
      break;
    }
  }

  return visitedSections; // Return all visited (relevant) sections
}

export {
  aStarPathfinding,
  haversineDistance,
  reconstructPath,
  findRelevantSections,
  Node,
  Edge,
};
