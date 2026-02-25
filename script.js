const defaultCenter = [-0.0236, 37.9062];
const defaultZoom = 6;

// Sidebar elements
const sidebar = document.getElementById("sidebar");
const infoContent = document.getElementById("info-content");
const closeBtn = document.getElementById("close-sidebar");
const toggleBtn = document.getElementById("toggle-sidebar");

let popChart = null;
let selectedLayer = null;

let compareCounty = null;
let comparingMode = false;

// =============================
// SIDEBAR CONTROL FUNCTIONS
// =============================

function openSidebar() {
  sidebar.classList.add("show");
  toggleBtn.style.left = "300px";
}

function closeSidebar() {
  sidebar.classList.remove("show");
  toggleBtn.style.left = "0";
  if (selectedLayer) {
    geoLayer.resetStyle(selectedLayer);
    selectedLayer = null;
  }
  map.setView(defaultCenter, defaultZoom, {
    animate: true,
    duration: 0.5,
  });
}

toggleBtn.addEventListener("click", openSidebar);
closeBtn.addEventListener("click", closeSidebar);

// =============================
// MAP INITIALIZATION
// =============================

const map = L.map("map", {
  center: defaultCenter,
  zoom: defaultZoom,
  zoomControl: false,
});

L.control.zoom({ position: "topright" }).addTo(map);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let geoLayer;
let colorMode = "area";

// =============================
// COLOR CLASSIFICATION
// =============================

function getColor(value, mode) {
  if (mode === "population") {
    return value > 3000000
      ? "#050E70"
      : value > 2000000
        ? "#07149C"
        : value > 1000000
          ? "#0919C8"
          : value > 500000
            ? "#0B1FF4"
            : value > 300000
              ? "#2738F5"
              : value > 200000
                ? "#8F98FA"
                : value > 100000
                  ? "#BBC0FC"
                  : "#E7E9FE";
  } else if (mode === "density") {
    return value > 1000
      ? "#050E70"
      : value > 500
        ? "#07149C"
        : value > 200
          ? "#0919C8"
          : value > 100
            ? "#0B1FF4"
            : value > 50
              ? "#2738F5"
              : value > 20
                ? "#8F98FA"
                : value > 10
                  ? "#BBC0FC"
                  : "#E7E9FE";
  } else {
    return value > 80000
      ? "#050E70"
      : value > 60000
        ? "#07149C"
        : value > 40000
          ? "#0919C8"
          : value > 20000
            ? "#0B1FF4"
            : value > 10000
              ? "#2738F5"
              : value > 5000
                ? "#8F98FA"
                : value > 1000
                  ? "#BBC0FC"
                  : "#E7E9FE";
  }
}

function style(feature) {
  const p = feature.properties;
  const value =
    colorMode === "population"
      ? p.total_population19
      : colorMode === "density"
        ? p.population_density
        : p.area_sqkm;
  return {
    fillColor: getColor(value, colorMode),
    weight: 2,
    color: "white",
    opacity: 1,
    fillOpacity: 0.7,
  };
}

function highlightFeature(e) {
  e.target.setStyle({
    weight: 5,
    color: "#1A50FF",
    fillOpacity: 0.9,
  });
}

function resetHighlight(e) {
  geoLayer.resetStyle(e.target);
}

// =============================
// COLOR TOGGLE BUTTONS
// =============================

document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    colorMode = btn.dataset.mode;
    document
      .querySelectorAll(".toggle-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    if (geoLayer) {
      geoLayer.setStyle(style);
    }
  });
});

// =============================
// STATS BAR
// =============================

function populateStats(data) {
  const features = data.features;

  const totalPop = features.reduce(
    (sum, f) => sum + (f.properties.total_population19 || 0),
    0,
  );

  const mostPop = features.reduce((a, b) =>
    (a.properties.total_population19 || 0) >
    (b.properties.total_population19 || 0)
      ? a
      : b,
  );

  const leastPop = features.reduce((a, b) =>
    (a.properties.total_population19 || 0) <
    (b.properties.total_population19 || 0)
      ? a
      : b,
  );

  const highestDensity = features.reduce((a, b) =>
    (a.properties.population_density || 0) >
    (b.properties.population_density || 0)
      ? a
      : b,
  );

  document.getElementById("stat-total-pop").textContent =
    totalPop.toLocaleString();
  document.getElementById("stat-counties").textContent = features.length;
  document.getElementById("stat-most-pop").textContent =
    mostPop.properties.adm1_name;
  document.getElementById("stat-least-pop").textContent =
    leastPop.properties.adm1_name;
  document.getElementById("stat-density").textContent =
    highestDensity.properties.adm1_name;
}

// =============================
// COUNTY RANKINGS DRAWER
// =============================

let rankingsData = [];
let currentSort = "population";

function buildRankings(sortBy) {
  currentSort = sortBy;

  const sorted = [...rankingsData].sort((a, b) => {
    const p = a.properties;
    const q = b.properties;
    if (sortBy === "population")
      return (q.total_population19 || 0) - (p.total_population19 || 0);
    if (sortBy === "area") return (q.area_sqkm || 0) - (p.area_sqkm || 0);
    if (sortBy === "density")
      return (q.population_density || 0) - (p.population_density || 0);
  });

  const tbody = document.getElementById("rankings-body");
  tbody.innerHTML = "";

  sorted.forEach((feature, index) => {
    const p = feature.properties;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="county-name-cell">${p.adm1_name}</td>
      <td>${p.total_population19 ? p.total_population19.toLocaleString() : "N/A"}</td>
      <td>${p.area_sqkm ? Number(p.area_sqkm).toLocaleString() : "N/A"}</td>
      <td>${p.population_density ? p.population_density.toLocaleString() : "N/A"}</td>
    `;

    tr.addEventListener("click", () => {
      if (geoLayer) {
        geoLayer.eachLayer((layer) => {
          if (layer.feature.properties.adm1_name === p.adm1_name) {
            map.fitBounds(layer.getBounds(), {
              padding: [20, 20],
              maxZoom: 8,
              animate: true,
              duration: 0.5,
            });
            layer.fire("click");
          }
        });
      }
      document.getElementById("rankings-drawer").classList.remove("open");
    });

    tbody.appendChild(tr);
  });

  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.sort === sortBy);
  });
}

document.getElementById("rankings-toggle").addEventListener("click", () => {
  document.getElementById("rankings-drawer").classList.add("open");
});

document.getElementById("rankings-close").addEventListener("click", () => {
  document.getElementById("rankings-drawer").classList.remove("open");
});

document.querySelectorAll(".sort-btn").forEach((btn) => {
  btn.addEventListener("click", () => buildRankings(btn.dataset.sort));
});

// =============================
// COUNTY INTERACTION
// =============================
function onEachCounty(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: (e) => {
      const props = feature.properties;

      const popChange = props.pop_change || 0;
      const pop2009 = props.population_in_2009 || 0;
      const pop2019 = props.total_population19 || 0;
      const changePct =
        pop2009 > 0 ? (((pop2019 - pop2009) / pop2009) * 100).toFixed(1) : null;
      const isPositive = popChange >= 0;

      // Reset previously selected layer
      if (selectedLayer) {
        geoLayer.resetStyle(selectedLayer);
      }

      // Highlight selected county in red
      e.target.setStyle({
        weight: 3,
        color: "white",
        fillColor: "#e63946",
        fillOpacity: 0.85,
      });

      selectedLayer = e.target;

      // If in comparing mode, show modal immediately and stop
      if (comparingMode && compareCounty) {
        document.getElementById("compare-left").innerHTML =
          buildCompareCard(compareCounty);
        document.getElementById("compare-right").innerHTML =
          buildCompareCard(props);
        openCompareModal();
        comparingMode = false;
        return;
      }

      // Normal click — zoom and show sidebar
      const bounds = e.target.getBounds();
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 8,
        animate: true,
        duration: 0.5,
      });

      infoContent.innerHTML = `
        <h6 style="color:#495DCC; font-weight:700; margin-bottom:10px;">${props.adm1_name}</h6>
        <hr/>
        <p><strong>Area:</strong> ${props.area_sqkm.toLocaleString()} km²</p>
        <p><strong>Total Population:</strong> ${pop2019 ? pop2019.toLocaleString() : "N/A"}</p>
        <p><strong>Male Population:</strong> ${props.male_population_2019 ? props.male_population_2019.toLocaleString() : "N/A"}</p>
        <p><strong>Female Population:</strong> ${props.female_population_2019 ? props.female_population_2019.toLocaleString() : "N/A"}</p>
        <p><strong>Households:</strong> ${props.households ? props.households.toLocaleString() : "N/A"}</p>
        <p><strong>Population Density:</strong> ${props.population_density ? props.population_density.toLocaleString() : "N/A"} /km²</p>
        <hr/>
        <div id="pop-change-box" class="${isPositive ? "change-positive" : "change-negative"}">
          <div class="change-title">Population Change Since 2009</div>
          <div class="change-row">
            <span class="change-arrow">${isPositive ? "▲" : "▼"}</span>
            <span class="change-number">${Math.abs(popChange).toLocaleString()} people</span>
          </div>
          <div class="change-pct">${changePct !== null ? `${isPositive ? "+" : "-"}${Math.abs(changePct)}% growth` : "N/A"}</div>
          <div class="change-sub">2009: ${pop2009.toLocaleString()} → 2019: ${pop2019.toLocaleString()}</div>
        </div>
      `;

      const canvas = document.getElementById("pop-chart");
      canvas.style.display = "block";

      const male = props.male_population_2019 || 0;
      const female = props.female_population_2019 || 0;

      if (popChart) popChart.destroy();

      popChart = new Chart(canvas, {
        type: "doughnut",
        data: {
          labels: ["Male", "Female"],
          datasets: [
            {
              data: [male, female],
              backgroundColor: ["#495DCC", "#a8b4f0"],
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom",
              labels: { font: { size: 12 }, padding: 16 },
            },
            title: {
              display: true,
              text: "Population by Gender",
              font: { size: 13, weight: "600" },
              color: "#495DCC",
              padding: { bottom: 10 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const total = male + female;
                  const pct = ((ctx.raw / total) * 100).toFixed(1);
                  return ` ${ctx.raw.toLocaleString()} (${pct}%)`;
                },
              },
            },
          },
        },
      });

      // Store county for comparison and show compare button
      compareCounty = props;
      document.getElementById("compare-btn").style.display = "block";

      openSidebar();
    },
  });
}

// =============================
// SEARCH BOX
// =============================

const searchInput = document.getElementById("search-input");
const searchSuggestions = document.getElementById("search-suggestions");

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  searchSuggestions.innerHTML = "";

  if (!query) {
    searchSuggestions.style.display = "none";
    return;
  }

  const matches = rankingsData.filter((f) =>
    f.properties.adm1_name.toLowerCase().includes(query),
  );

  if (matches.length === 0) {
    searchSuggestions.style.display = "none";
    return;
  }

  matches.forEach((feature) => {
    const li = document.createElement("li");
    li.textContent = feature.properties.adm1_name;
    li.addEventListener("click", () => {
      searchInput.value = feature.properties.adm1_name;
      searchSuggestions.style.display = "none";

      if (geoLayer) {
        geoLayer.eachLayer((layer) => {
          if (
            layer.feature.properties.adm1_name === feature.properties.adm1_name
          ) {
            map.fitBounds(layer.getBounds(), {
              padding: [20, 20],
              maxZoom: 8,
              animate: true,
              duration: 0.5,
            });
            layer.fire("click");
          }
        });
      }
    });
    searchSuggestions.appendChild(li);
  });

  searchSuggestions.style.display = "block";
});

document.addEventListener("click", (e) => {
  if (!document.getElementById("search-container").contains(e.target)) {
    searchSuggestions.style.display = "none";
  }
});

// =============================
// COMPARISON TOOL
// =============================

function buildCompareCard(props) {
  const popChange = props.pop_change || 0;
  const pop2009 = props.population_in_2009 || 0;
  const pop2019 = props.total_population19 || 0;
  const changePct =
    pop2009 > 0 ? (((pop2019 - pop2009) / pop2009) * 100).toFixed(1) : null;
  const isPositive = popChange >= 0;

  return `
    <h3 class="compare-name">${props.adm1_name}</h3>
    <hr/>
    <div class="compare-stat">
      <span class="compare-label">Area</span>
      <span class="compare-value">${props.area_sqkm ? Number(props.area_sqkm).toLocaleString() : "N/A"} km²</span>
    </div>
    <div class="compare-stat">
      <span class="compare-label">Total Population</span>
      <span class="compare-value">${pop2019 ? pop2019.toLocaleString() : "N/A"}</span>
    </div>
    <div class="compare-stat">
      <span class="compare-label">Male Population</span>
      <span class="compare-value">${props.male_population_2019 ? props.male_population_2019.toLocaleString() : "N/A"}</span>
    </div>
    <div class="compare-stat">
      <span class="compare-label">Female Population</span>
      <span class="compare-value">${props.female_population_2019 ? props.female_population_2019.toLocaleString() : "N/A"}</span>
    </div>
    <div class="compare-stat">
      <span class="compare-label">Households</span>
      <span class="compare-value">${props.households ? props.households.toLocaleString() : "N/A"}</span>
    </div>
    <div class="compare-stat">
      <span class="compare-label">Population Density</span>
      <span class="compare-value">${props.population_density ? props.population_density.toLocaleString() : "N/A"} /km²</span>
    </div>
    <div class="compare-stat">
      <span class="compare-label">2009 Population</span>
      <span class="compare-value">${pop2009 ? pop2009.toLocaleString() : "N/A"}</span>
    </div>
    <div class="compare-change ${isPositive ? "change-positive" : "change-negative"}">
      <div class="change-title">Population Change Since 2009</div>
      <div class="change-row">
        <span class="change-arrow">${isPositive ? "▲" : "▼"}</span>
        <span class="change-number">${Math.abs(popChange).toLocaleString()} people</span>
      </div>
      <div class="change-pct">${changePct !== null ? `${isPositive ? "+" : "-"}${Math.abs(changePct)}% growth` : "N/A"}</div>
    </div>
  `;
}

function openCompareModal() {
  document.getElementById("compare-overlay").style.display = "block";
  document.getElementById("compare-modal").style.display = "flex";
}

function closeCompareModal() {
  document.getElementById("compare-overlay").style.display = "none";
  document.getElementById("compare-modal").style.display = "none";
  comparingMode = false;
  compareCounty = null;
  document.getElementById("compare-btn").textContent =
    "⚖ Compare with another county";
}

document
  .getElementById("compare-close")
  .addEventListener("click", closeCompareModal);
document
  .getElementById("compare-overlay")
  .addEventListener("click", closeCompareModal);

document.getElementById("compare-btn").addEventListener("click", () => {
  comparingMode = true;
  document.getElementById("compare-btn").textContent =
    "🗺 Now click another county on the map...";
  closeSidebar();
});

// =============================
// LOAD DATA
// =============================

fetch("http://localhost:3000/api/geojson")
  .then((res) => res.json())
  .then((data) => {
    populateStats(data);
    rankingsData = data.features;
    buildRankings("population");

    geoLayer = L.geoJSON(data, {
      style: style,
      onEachFeature: onEachCounty,
    }).addTo(map);

    map.fitBounds(geoLayer.getBounds());
  })
  .catch((err) => console.error("Failed to load GeoJSON:", err));
