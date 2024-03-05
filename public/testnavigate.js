// Define a duration for cache validity
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

async function pullNodes() {
  const nodedropdown1 = document.getElementById("nodedropdown1");
  const nodedropdown2 = document.getElementById("nodedropdown2");
  const now = new Date().getTime();

  // Check if we have cached data and it's still valid
  const cachedNodes = localStorage.getItem("nodesData");
  const lastFetch = localStorage.getItem("nodesLastFetch");

  let nodesData;

  if (cachedNodes && lastFetch && now - parseInt(lastFetch) < CACHE_DURATION) {
    // Use cached data
    nodesData = JSON.parse(cachedNodes);
  } else {
    // Fetch new data and update the cache
    try {
      const response = await fetch("/nodes");
      nodesData = await response.json();
      localStorage.setItem("nodesData", JSON.stringify(nodesData));
      localStorage.setItem("nodesLastFetch", now.toString());
    } catch (error) {
      console.error("Error pulling nodes:", error);
      return; // Exit if fetch fails
    }
  }

  // Populate the dropdowns with nodes data
  nodesData.forEach((node) => {
    let option1 = document.createElement("option");
    let option2 = document.createElement("option");

    option1.value = node.NodeID; // Adjust according to your data attributes
    option1.text = `Name: ${node.Name} | ID: ${node.NodeID}`; // Customize as needed

    option2.value = node.NodeID;
    option2.text = `Name: ${node.Name} | ID: ${node.NodeID}`;

    nodedropdown1.appendChild(option1);
    nodedropdown2.appendChild(option2);
  });
}

async function findPath(startNode, endNode) {
  if (!startNode || !endNode || isNaN(startNode) || isNaN(endNode)) {
    alert("Please enter valid start and end node IDs.");
    return;
  }

  const startId = Number(startNode);
  const goalId = Number(endNode);

  try {
    const response = await fetch("/navigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startId, goalId }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to find path");
    } else {
      const path = await response.json();

      if (path && Array.isArray(path.path)) {
        alert(`Path found: ${path.path.map((node) => node.id).join(" -> ")}`);
      } else {
        alert("Path not found or invalid path structure");
      }
    }
  } catch (error) {
    console.error("Error finding path:", error);
    alert(`An error occurred while finding the path: ${error.message}`);
  }
}

document.getElementById("nodeform").addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const startNode = formData.get("startNode");
  const endNode = formData.get("endNode");
  findPath(startNode, endNode);
});

window.onload = pullNodes;
