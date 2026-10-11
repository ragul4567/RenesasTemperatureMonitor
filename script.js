
const sampleReadings = [
  { device_id: "RENESAS_01", temperature: 27.8, recorded_at: "2026-10-11T10:00:00Z" },
  { device_id: "RENESAS_01", temperature: 28.1, recorded_at: "2026-10-11T10:05:00Z" },
  { device_id: "RENESAS_01", temperature: 28.4, recorded_at: "2026-10-11T10:10:00Z" },
  { device_id: "RENESAS_01", temperature: 28.0, recorded_at: "2026-10-11T10:15:00Z" },
  { device_id: "RENESAS_01", temperature: 28.6, recorded_at: "2026-10-11T10:20:00Z" }
];

const SUPABASE_URL = "https://jdaevosocohbyihqbncy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_SfeIfuWctJVeEdVof_OQ0Q_SoTyv3ha";

let chart;
let supabaseClient = null;

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderDashboard(readings) {
  if (!readings.length) {
    document.getElementById("currentTemp").textContent = "--.-";
    document.getElementById("maxTemp").textContent = "--.- °C";
    document.getElementById("minTemp").textContent = "--.- °C";
    document.getElementById("readingCount").textContent = "0";
    document.getElementById("status").textContent = "No readings available";
    document.getElementById("readingTable").innerHTML =
      '<tr><td colspan="3">No readings found.</td></tr>';

    if (chart) {
      chart.data.labels = [];
      chart.data.datasets[0].data = [];
      chart.update();
    }
    return;
  }

  const latest = readings[readings.length - 1];
  const values = readings.map(r => Number(r.temperature));

  document.getElementById("currentTemp").textContent =
    latest.temperature.toFixed(1);

  document.getElementById("maxTemp").textContent =
    `${Math.max(...values).toFixed(1)} °C`;

  document.getElementById("minTemp").textContent =
    `${Math.min(...values).toFixed(1)} °C`;

  document.getElementById("readingCount").textContent = readings.length;

  document.getElementById("status").textContent =
    latest.temperature >= 40 ? "High temperature — check device" : "Normal";

  document.getElementById("readingTable").innerHTML =
    [...readings].reverse().slice(0, 10).map(r => `
      <tr>
        <td>${formatTime(r.recorded_at)}</td>
        <td>${r.device_id}</td>
        <td>${Number(r.temperature).toFixed(1)} °C</td>
      </tr>
    `).join("");

  const labels = readings.map(r => formatTime(r.recorded_at));

  if (!chart) {
    chart = new Chart(document.getElementById("temperatureChart"), {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Temperature (°C)",
          data: values,
          borderColor: "#5cb8ff",
          backgroundColor: "rgba(92, 184, 255, 0.12)",
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { title: { display: true, text: "°C" } }
        }
      }
    });
    document.getElementById("temperatureChart").parentElement.style.height =
      "300px";
  } else {
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update();
  }
}

async function loadReadings() {
  if (!supabaseClient) {
    renderDashboard(sampleReadings);
    return;
  }

  const { data, error } = await supabaseClient
    .from("temperature_readings")
    .select("device_id, temperature, recorded_at")
    .order("recorded_at", { ascending: true })
    .limit(100);

  if (error) {
    document.getElementById("status").textContent =
      "Could not load cloud readings";
    console.error(error.message);
    return;
  }

  renderDashboard(data || []);
}

function initialize() {
  if (
    SUPABASE_URL &&
    SUPABASE_PUBLISHABLE_KEY &&
    window.supabase
  ) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    document.getElementById("connection").textContent = "CLOUD MODE";
  }

  loadReadings();
}

initialize();
