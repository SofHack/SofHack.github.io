let customBackendUrl = localStorage.getItem("nettrace_backend_url") || "";

function getApiBase() {
    if (customBackendUrl) {
        return customBackendUrl.replace(/\/+$/, "");
    }
    // On GitHub Pages without custom backend, return null to use simulation mode
    if (location.hostname.endsWith("github.io")) {
        return null;
    }
    return "";
}

let map;
let routeLine = null;

let hopMarkers = [];
let hops = [];

const targetInput = document.getElementById("targetInput");
const traceButton = document.getElementById("traceButton");

const statusEl = document.getElementById("status");
const routeList = document.getElementById("routeList");

const targetValue = document.getElementById("targetValue");
const resolvedValue = document.getElementById("resolvedValue");

const hopCount = document.getElementById("hopCount");
const lastLatency = document.getElementById("lastLatency");

const toggleConfigBtn = document.getElementById("toggleConfigBtn");
const backendConfigPanel = document.getElementById("backendConfigPanel");
const backendUrlInput = document.getElementById("backendUrlInput");
const saveBackendUrlBtn = document.getElementById("saveBackendUrlBtn");
const resetBackendUrlBtn = document.getElementById("resetBackendUrlBtn");
const currentBackendLabel = document.getElementById("currentBackendLabel");
const demoNoticeBanner = document.getElementById("demoNoticeBanner");
const dismissNoticeBtn = document.getElementById("dismissNoticeBtn");


function updateBackendLabel() {
    if (currentBackendLabel) {
        if (customBackendUrl) {
            currentBackendLabel.textContent = customBackendUrl.replace(/^https?:\/\//i, "").slice(0, 16);
            currentBackendLabel.title = customBackendUrl;
            if (demoNoticeBanner) demoNoticeBanner.classList.add("hidden");
        } else {
            const isGh = location.hostname.endsWith("github.io");
            currentBackendLabel.textContent = isGh ? "Demo Mode" : "Local API";
            if (demoNoticeBanner && isGh) {
                demoNoticeBanner.classList.remove("hidden");
            }
        }
    }
}


function initMap() {

    map = L.map("map", {
        worldCopyJump: true,
        minZoom: 2
    }).setView([20, 0], 2);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);
}


function setStatus(text, state = "idle") {

    statusEl.textContent = text;

    statusEl.className =
        `status ${state}`;
}


function resetMap() {

    hopMarkers.forEach(marker => {
        map.removeLayer(marker);
    });

    hopMarkers = [];
    hops = [];

    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }

    map.setView([20, 0], 2);
}


function resetUI() {

    targetValue.textContent = "—";
    resolvedValue.textContent = "—";

    hopCount.textContent = "0";
    lastLatency.textContent = "—";

    routeList.innerHTML = `
        <div class="empty">
            Starting traceroute...
        </div>
    `;
}


function addHopToList(hop) {

    if (hop.hop === 1) {
        routeList.innerHTML = "";
    }

    const item = document.createElement("div");

    item.className = "route-item";

    const location =
        hop.city && hop.country
            ? `${hop.city}, ${hop.country}`
            : "Location unavailable";

    const latency =
        hop.latency_ms !== null &&
        hop.latency_ms !== undefined
            ? `${hop.latency_ms.toFixed(2)} ms`
            : "Timeout";

    item.innerHTML = `
        <div class="hop-number">
            ${escapeHtml(hop.hop)}
        </div>

        <div class="hop-main">

            <strong>
                ${escapeHtml(hop.ip || "*")}
            </strong>

            <span>
                ${escapeHtml(hop.asn || hop.isp || "Network information unavailable")}
            </span>

        </div>

        <div class="hop-location">
            ${escapeHtml(location)}
        </div>

        <div class="hop-latency ${
            hop.timeout ? "timeout" : ""
        }">
            ${escapeHtml(latency)}
        </div>
    `;

    routeList.appendChild(item);

    routeList.scrollTop =
        routeList.scrollHeight;
}


function markerForHop(hop) {

    if (
        !hop.geolocatable ||
        hop.lat === null ||
        hop.lon === null
    ) {
        return null;
    }

    const marker = L.circleMarker(
        [hop.lat, hop.lon],
        {
            radius: 6,
            weight: 2,
            fillOpacity: 0.85
        }
    );

    const locationStr = [hop.city, hop.country]
        .filter(Boolean)
        .map(escapeHtml)
        .join(", ");

    marker.bindPopup(`
        <strong>Hop ${escapeHtml(hop.hop)}</strong><br>
        ${escapeHtml(hop.ip)}<br>
        ${locationStr ? `${locationStr}<br>` : ""}
        ${
            hop.latency_ms !== null
                ? escapeHtml(hop.latency_ms.toFixed(2)) + " ms"
                : "Timeout"
        }
    `);

    marker.addTo(map);

    return marker;
}


function rebuildRoute() {

    const coordinates = hops
        .filter(
            hop =>
                hop.geolocatable &&
                hop.lat !== null &&
                hop.lon !== null
        )
        .map(
            hop => [hop.lat, hop.lon]
        );

    if (routeLine) {
        map.removeLayer(routeLine);
    }

    if (coordinates.length < 2) {
        return;
    }

    routeLine = L.polyline(
        coordinates,
        {
            weight: 3,
            opacity: 0.8
        }
    ).addTo(map);

    map.fitBounds(
        routeLine.getBounds(),
        {
            padding: [50, 50]
        }
    );
}


function addHop(hop) {

    hops.push(hop);

    addHopToList(hop);

    hopCount.textContent =
        hops.length;

    if (hop.latency_ms !== null) {

        lastLatency.textContent =
            `${hop.latency_ms.toFixed(2)} ms`;
    }

    const marker =
        markerForHop(hop);

    if (marker) {
        hopMarkers.push(marker);
    }

    rebuildRoute();
}


/* =========================================================
   CLIENT SIMULATION FOR GITHUB PAGES (ZERO 404 ERRORS)
   ========================================================= */

async function runClientSimulation(rawTarget) {

    const cleanTarget = rawTarget
        .trim()
        .replace(/^https?:\/\//i, "")
        .split("/")[0];

    let resolvedIp = cleanTarget;
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanTarget);

    if (!isIp) {
        setStatus(`Resolving ${cleanTarget} via DNS...`, "running");
        try {
            const dohRes = await fetch(
                `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanTarget)}&type=A`,
                { headers: { accept: "application/dns-json" } }
            );

            if (dohRes.ok) {
                const dohData = await dohRes.json();
                if (dohData.Answer && dohData.Answer.length > 0) {
                    const answer = dohData.Answer.find(a => a.type === 1) || dohData.Answer[0];
                    if (answer && answer.data) {
                        resolvedIp = answer.data;
                    }
                }
            }
        } catch (dohErr) {
            console.warn("DNS query failed, falling back to simulated IP:", dohErr);
            resolvedIp = "142.250.190.46";
        }
    }

    handleEvent({
        type: "start",
        target: cleanTarget,
        resolved_ip: resolvedIp
    });

    let destGeo = {
        city: "Edge Location",
        country: "Internet",
        country_code: "",
        lat: 37.7749,
        lon: -122.4194,
        isp: "Cloud Infrastructure",
        asn: "AS15169"
    };

    try {
        const geoRes = await fetch(`https://ipwho.is/${encodeURIComponent(resolvedIp)}`);
        if (geoRes.ok) {
            const data = await geoRes.json();
            if (data.success) {
                destGeo = {
                    city: data.city || "Edge POP",
                    country: data.country || "Network",
                    country_code: data.country_code || "",
                    lat: data.latitude,
                    lon: data.longitude,
                    isp: data.connection?.isp || data.connection?.org || "Network ISP",
                    asn: data.connection?.asn ? `AS${data.connection.asn}` : "AS-Transit"
                };
            }
        }
    } catch (geoErr) {
        console.warn("Geo lookup failed, using fallback:", geoErr);
    }

    const simulatedHops = [
        {
            hop: 1,
            ip: "192.168.1.1",
            latency_ms: 1.12,
            geolocatable: false,
            timeout: false
        },
        {
            hop: 2,
            ip: "10.240.170.81",
            latency_ms: 14.35,
            geolocatable: false,
            timeout: false
        },
        {
            hop: 3,
            ip: "182.79.245.18",
            latency_ms: 28.19,
            geolocatable: true,
            city: "Delhi",
            country: "India",
            country_code: "IN",
            lat: 28.6139,
            lon: 77.2090,
            isp: "National IXP Aggregation",
            asn: "AS9498",
            timeout: false
        },
        {
            hop: 4,
            ip: "203.190.230.12",
            latency_ms: 44.82,
            geolocatable: true,
            city: "Mumbai",
            country: "India",
            country_code: "IN",
            lat: 19.0760,
            lon: 72.8777,
            isp: "International Subsea Gateway",
            asn: "AS4755",
            timeout: false
        },
        {
            hop: 5,
            ip: null,
            latency_ms: null,
            geolocatable: false,
            timeout: true
        },
        {
            hop: 6,
            ip: resolvedIp,
            latency_ms: 68.42,
            geolocatable: true,
            ...destGeo,
            timeout: false
        }
    ];

    for (const hop of simulatedHops) {
        await new Promise(resolve => setTimeout(resolve, 380));
        handleEvent({
            type: "hop",
            ...hop
        });
    }

    await new Promise(resolve => setTimeout(resolve, 200));
    handleEvent({
        type: "complete",
        return_code: 0
    });

    setStatus("Trace complete (Demo Mode)", "success");
}


/* =========================================================
   MAIN TRACE ROUTE (CONNECTS TO BACKEND OR SIMULATION)
   ========================================================= */

async function traceRoute() {

    const target =
        targetInput.value.trim();

    if (!target) {
        return;
    }

    traceButton.disabled = true;

    resetUI();
    resetMap();

    const apiBase = getApiBase();

    if (apiBase === null) {
        // Direct simulation on GitHub Pages without custom backend
        setStatus("Running Demo Trace (GitHub Pages)...", "running");
        try {
            await runClientSimulation(target);
        } catch (simError) {
            console.error(simError);
            setStatus("Simulation failed: " + simError.message, "error");
        } finally {
            traceButton.disabled = false;
        }
        return;
    }

    // Connect to real FastAPI backend
    setStatus("Connecting to backend...", "running");
    const url = `${apiBase}/api/traceroute?target=` + encodeURIComponent(target);

    try {

        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404 && location.hostname.endsWith("github.io")) {
                console.warn("Backend returned 404 on GitHub Pages. Falling back to Demo Mode.");
                setStatus("GitHub Pages detected → Running Demo Trace...", "running");
                await runClientSimulation(target);
                return;
            }
            throw new Error(`Backend returned ${response.status}`);
        }

        if (!response.body) {
            throw new Error("Streaming is not supported by this browser");
        }

        setStatus("Tracing (Live Backend)...", "running");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {

            const { value, done } = await reader.read();

            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() || "";

            for (const event of events) {

                const line = event.split("\n").find(l => l.startsWith("data:"));

                if (!line) {
                    continue;
                }

                try {
                    const data = JSON.parse(line.slice(5).trim());
                    handleEvent(data);
                } catch (parseErr) {
                    console.warn("Failed to parse SSE payload:", line, parseErr);
                }
            }
        }

    } catch (error) {

        console.error(error);

        if (location.hostname.endsWith("github.io") || !customBackendUrl) {
            console.warn("Backend unavailable, starting demo trace:", error);
            setStatus("Backend unavailable → Running Demo Trace...", "running");
            try {
                await runClientSimulation(target);
                return;
            } catch (simErr) {
                console.error(simErr);
            }
        }

        setStatus(error.message, "error");
        routeList.innerHTML = `
            <div class="empty text-red-400">
                ${escapeHtml(error.message)}
            </div>
        `;

    } finally {

        traceButton.disabled = false;
    }
}


function handleEvent(event) {

    switch (event.type) {

        case "start":

            targetValue.textContent =
                event.target;

            resolvedValue.textContent =
                event.resolved_ip;

            break;


        case "hop":

            addHop(event);

            break;


        case "complete":

            setStatus(
                "Trace complete",
                "success"
            );

            break;


        case "error":

            setStatus(
                event.message,
                "error"
            );

            break;
    }
}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// Event listeners
traceButton.addEventListener(
    "click",
    traceRoute
);


targetInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            traceRoute();
        }
    }
);


document
    .querySelectorAll(".quick-targets button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                targetInput.value =
                    button.dataset.target;

                traceRoute();
            }
        );
    });


if (toggleConfigBtn && backendConfigPanel) {
    toggleConfigBtn.addEventListener("click", () => {
        backendConfigPanel.classList.toggle("hidden");
        if (backendUrlInput) {
            backendUrlInput.value = customBackendUrl;
        }
    });
}

if (saveBackendUrlBtn && backendUrlInput) {
    saveBackendUrlBtn.addEventListener("click", () => {
        const val = backendUrlInput.value.trim();
        customBackendUrl = val;
        if (val) {
            localStorage.setItem("nettrace_backend_url", val);
        } else {
            localStorage.removeItem("nettrace_backend_url");
        }
        updateBackendLabel();
        if (backendConfigPanel) backendConfigPanel.classList.add("hidden");
    });
}

if (resetBackendUrlBtn) {
    resetBackendUrlBtn.addEventListener("click", () => {
        customBackendUrl = "";
        localStorage.removeItem("nettrace_backend_url");
        if (backendUrlInput) backendUrlInput.value = "";
        updateBackendLabel();
        if (backendConfigPanel) backendConfigPanel.classList.add("hidden");
    });
}

if (dismissNoticeBtn && demoNoticeBanner) {
    dismissNoticeBtn.addEventListener("click", () => {
        demoNoticeBanner.classList.add("hidden");
    });
}


initMap();
updateBackendLabel();
