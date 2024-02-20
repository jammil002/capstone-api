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

  console.log(nodesData);

  // Populate the dropdowns with nodes data
  nodesData.forEach((node) => {
    let option1 = document.createElement("option");
    let option2 = document.createElement("option");

    option1.value = node.id; // Adjust according to your data attributes
    option1.text = `Name: ${node.Name} | ID: ${node.NodeID}`; // Customize as needed

    option2.value = node.id;
    option2.text = `Name: ${node.Name} | ID: ${node.NodeID}`;

    nodedropdown1.appendChild(option1);
    nodedropdown2.appendChild(option2);
  });
}

window.onload = pullNodes;

async function findPath(startNode, endNode) {
  try {
    const response = await fetch("/navigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startId: startNode, goalId: endNode }),
    });

    if (!response.ok) {
      throw new Error("Failed to find path");
    } else {
      const path = await response.json();
      alert(`Path found: ${JSON.stringify(path)}`);
    }
  } catch (error) {
    console.error("Error finding path:", error);
    alert("An error occurred while finding the path.");
  }
}

document.getElementById("nodeform").addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const startNode = formData.get("startNode");
  const endNode = formData.get("endNode");
  findPath(startNode, endNode);
});
