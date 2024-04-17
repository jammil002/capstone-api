import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

interface Node {
  id: number;
  latitude: number;
  longitude: number;
  isPOI: number;
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
      console.log("aStarPathfinding found");
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

  console.log(cameFrom);
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
  const queue: Array<{ sectionId: number; path: number[] }> = [
    { sectionId: startSectionId, path: [startSectionId] },
  ];
  const visitedSections = new Set<number>();

  while (queue.length > 0) {
    const { sectionId, path } = queue.shift()!; // Safely assumed as non-null because of the while check

    if (visitedSections.has(sectionId)) continue;
    visitedSections.add(sectionId);

    // Stop if we reach the goal
    if (sectionId === goalSectionId) {
      return new Set(path); // Return the path that led to the goal
    }

    // Fetch adjacent sections
    const adjacentSections = await prisma.adjacentSections.findMany({
      where: {
        OR: [{ SectionID1: sectionId }, { SectionID2: sectionId }],
      },
    });

    // Enqueue adjacent sections
    for (const section of adjacentSections) {
      const nextSectionId =
        section.SectionID1 === sectionId
          ? section.SectionID2
          : section.SectionID1;
      if (!visitedSections.has(nextSectionId)) {
        queue.push({
          sectionId: nextSectionId,
          path: [...path, nextSectionId],
        }); // Push new section with updated path
      }
    }
  }

  return visitedSections; // In case the goalSectionId is not found
}

export {
  aStarPathfinding,
  haversineDistance,
  reconstructPath,
  findRelevantSections,
  Node,
  Edge,
};
