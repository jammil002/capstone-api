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
  let startId;

  if (startNode === "closestPOI") {
    // Request the user's current location
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        // Fetch the closest POI using the user's current location
        const response = await fetch(`/closestPOI?latitude=${latitude}&longitude=${longitude}`);
        if (!response.ok) throw new Error('Failed to fetch closest POI');
        
        const closestPOI = await response.json();
        startId = closestPOI.id;

        // Continue with path finding using the closest POI as the start node
        proceedWithFindingPath(startId, endNode);
      } catch (error) {
        alert(`An error occurred while fetching the closest POI: ${error.message}`);
        console.error("Error fetching closest POI:", error);
      }
    }, (error) => {
      alert("Unable to retrieve your location");
      console.error("Geolocation error:", error);
    });
  } else {
    // If a specific start node is chosen, not the closest POI
    console.error("Invalid start node:", startNode);
    proceedWithFindingPath(Number(startNode), endNode);
  }
}

async function proceedWithFindingPath(startId, endNode) {
  const goalId = Number(endNode);
  
  if (isNaN(startId) || isNaN(goalId)) {
    alert("Please enter valid node IDs.");
    return;
  }

  try {
    const response = await fetch("/navigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startId, goalId }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to find path");
    }

    const path = await response.json();
    if (path && Array.isArray(path.path)) {
      alert(`Path found: ${path.path.map((node) => node.id).join(" -> ")}`);
    } else {
      alert("Path not found or invalid path structure");
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
