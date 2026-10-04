const API_BASE = "";

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


async function traceRoute() {

    const target =
        targetInput.value.trim();

    if (!target) {
        return;
    }

    traceButton.disabled = true;

    resetUI();
    resetMap();

    setStatus(
        "Tracing...",
        "running"
    );

    const url =
        `${API_BASE}/api/traceroute?target=` +
        encodeURIComponent(target);

    try {

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Backend returned ${response.status}`
            );
        }

        if (!response.body) {
            throw new Error(
                "Streaming is not supported by this browser"
            );
        }

        const reader =
            response.body.getReader();

        const decoder =
            new TextDecoder();

        let buffer = "";

        while (true) {

            const {
                value,
                done
            } = await reader.read();

            if (done) {
                break;
            }

            buffer +=
                decoder.decode(
                    value,
                    { stream: true }
                );

            const events =
                buffer.split("\n\n");

            buffer =
                events.pop() || "";

            for (const event of events) {

                const line =
                    event
                        .split("\n")
                        .find(
                            line =>
                                line.startsWith("data:")
                        );

                if (!line) {
                    continue;
                }

                try {
                    const data =
                        JSON.parse(
                            line.slice(5).trim()
                        );

                    handleEvent(data);
                } catch (parseErr) {
                    console.warn("Failed to parse SSE JSON payload:", line, parseErr);
                }
            }
        }

    } catch (error) {

        console.error(error);

        setStatus(
            error.message,
            "error"
        );

        routeList.innerHTML = `
            <div class="empty">
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


initMap();
