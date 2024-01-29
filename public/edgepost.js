let data;

async function pullNodes() {
  const nodedropdown1 = document.getElementById("nodedropdown1");
  const nodedropdown2 = document.getElementById("nodedropdown2");

  const fifteenMinutes = 15 * 60 * 1000;

  try {
    const cachedData = localStorage.getItem("nodeData");
    const lastFetch = localStorage.getItem("lastFetch");

    const now = new Date().getTime();

    if (cachedData && lastFetch && now - parseInt(lastFetch) < fifteenMinutes) {
      data = JSON.parse(cachedData);
    } else {
      const response = await fetch("/nodes");
      data = await response.json();

      localStorage.setItem("nodeData", JSON.stringify(data));
      localStorage.setItem("lastFetch", now.toString());
    }

    data.map((node, i) => {
      let option1 = document.createElement("option");
      let option2 = document.createElement("option");

      option1.value = node.NodeID;
      option1.text =
        "Name: " +
        node.Name +
        " | ID: " +
        node.NodeID +
        " | Section: " +
        node.SectionID;

      option2.value = node.NodeID;
      option2.text =
        "Name: " +
        node.Name +
        " | ID: " +
        node.NodeID +
        " | Section: " +
        node.SectionID;

      nodedropdown1.append(option1);
      nodedropdown2.append(option2);
    });
  } catch (error) {
    console.error("Error pulling nodes:", error.message);
  }
}

window.onload = pullNodes;

async function calculateDistance(formEntries) {
  console.log(formEntries);
  let startingNode;
  let endingNodes = [];

  for (var key in formEntries) {
    if (key === "node1") {
      startingNode = data[formEntries[key] - 1];
      continue;
    }

    endingNodes.push(data[formEntries[key] - 1]);
  }

  try {
    const response = await fetch("/calculateEdge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startingNode, endingNodes }),
    });

    if (!response.ok) {
      throw new Error();
    } else {
      alert("Edge post worked!");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while processing your request.");
  }
}

function isFormUnique(form) {
  let formData = new FormData(form);
  let valueSet = new Set();

  for (let [key, value] of formData) {
    if (valueSet.has(value)) {
      return false;
    }
    valueSet.add(value);
  }

  return true;
}

function getFormData(form) {
  if (!isFormUnique(form)) {
    alert("Nodes cannot be the same ARE YOU TRYING TO DESTROY THE MAP");
    throw new Error(
      "Nodes cannot be the same ARE YOU TRYING TO DESTROY THE MAP"
    );
  }

  let formData = new FormData(form);
  let fromEntries = Object.fromEntries(formData);

  calculateDistance(fromEntries);
}

document.getElementById("nodeform").addEventListener("submit", (e) => {
  e.preventDefault();
  getFormData(e.target);
});

function addEndNode() {
  const copySelect = document.getElementById("nodedropdown2");
  let newSelect = copySelect.cloneNode(true); // Clone node to clone og selection
  let element = document.getElementById("new-nodes");
  let selectAmount = element.children.length;

  newSelect.id = "nodedropdown" + (selectAmount + 3);
  newSelect.name = "node" + (selectAmount + 3); // For forms each bit of information needs a unique name.

  document.getElementById("new-nodes").appendChild(newSelect);
}

document.getElementById("add-selection-node").addEventListener("click", () => {
  addEndNode();
});
