async function pullSections() {
  const sectionDropdown1 = document.getElementById("sectionDropdown1");
  const sectionDropdown2 = document.getElementById("sectionDropdown2");

  const CACHE_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
  const now = new Date().getTime();

  try {
    const cachedData = localStorage.getItem("sectionData");
    const lastFetch = localStorage.getItem("sectionLastFetch");

    let sections;
    if (cachedData && lastFetch && now - parseInt(lastFetch) < CACHE_TIME) {
      sections = JSON.parse(cachedData);
      console.log("Serving sections from cache");
    } else {
      const response = await fetch("/sections");
      sections = await response.json();
      localStorage.setItem("sectionData", JSON.stringify(sections));
      localStorage.setItem("sectionLastFetch", now.toString());
      console.log("Serving sections from database");
    }

    sections.forEach((section) => {
      let option1 = document.createElement("option");
      let option2 = document.createElement("option");

      option1.value = section.SectionID;
      option1.text = "ID: " + section.SectionID + " | Name: " + section.Name;
      option2.value = section.SectionID;
      option2.text = "ID: " + section.SectionID + " | Name: " + section.Name;

      sectionDropdown1.appendChild(option1);
      sectionDropdown2.appendChild(option2);
    });
  } catch (error) {
    console.error("Error pulling sections:", error.message);
  }
}

async function defineAdjacentSections(section1, section2) {
  try {
    const response = await fetch("/defineAdjacent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section1, section2 }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to define adjacent sections");
    }

    alert("Adjacent sections defined successfully.");
  } catch (error) {
    console.error("Error defining adjacent sections:", error);
    alert(`An error occurred: ${error.message}`);
  }
}

document.getElementById("sectionForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const section1 = formData.get("section1");
  const section2 = formData.get("section2");

  if (section1 === section2) {
    alert("Sections must be different.");
    return;
  }

  defineAdjacentSections(section1, section2);
});

window.onload = pullSections;
