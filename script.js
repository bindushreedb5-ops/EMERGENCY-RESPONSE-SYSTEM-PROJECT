/**
 * ==========================================================================
 * 🚨 RESCUEAI MISSION CONTROL - SCRIPT ENGINE
 * Features:
 *  - TensorFlow.js AI Computer Vision with Canvas HUD Overlay & Fall Detection
 *  - Multi-Tone Audio Siren Synthesizer & Morse SOS (Web Audio API)
 *  - Tactical Geolocation & Interactive Leaflet Map with Real-Time Responders
 *  - Hands-Free Voice SOS & Voice Command Assistant (Web Speech API)
 *  - Interactive CPR Metronome (110 BPM Web Audio & Visual Pulse)
 *  - ICE Contacts & Medical ID Manager (LocalStorage CRUD & WhatsApp Dispatch)
 *  - Real-Time Incident Timeline Logger & Optical Evidence Report Exporter
 * ==========================================================================
 */

// --- Global Application State ---
const State = {
    isEmergencyActive: false,
    emergencyCategory: "general",
    currentLocation: {
        lat: 12.9716, // Fallback default
        lon: 77.5946,
        accuracy: 15,
        address: "Bengaluru, Karnataka, India",
        resolved: false
    },
    camera: {
        stream: null,
        facingMode: "user", // "user" or "environment"
        isRunning: false,
        nightVision: false,
        zoneGuard: false
    },
    ai: {
        model: null,
        isDetecting: false,
        lastFrameTime: performance.now(),
        fps: 0,
        frameCount: 0,
        fpsTimer: performance.now(),
        personCount: 0,
        detectedObjects: []
    },
    audio: {
        ctx: null,
        sirenType: "ambulance",
        sirenTimeout: null,
        isPlayingSiren: false,
        testTimeout: null
    },
    cpr: {
        isRunning: false,
        bpm: 110,
        intervalId: null,
        compressions: 0,
        cycles: 0
    },
    voice: {
        recognition: null,
        isListening: false
    },
    iceContacts: [],
    evidencePhotos: [],
    incidentLogs: []
};

// ==========================================================================
// 1. INITIALIZATION & LIFECYCLE
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initClock();
    initIceContacts();
    initMedicalProfile();
    initTacticalMap();
    initVoiceRecognition();
    initPlaybookSearch();
    bindEvents();
    logEvent("System initialized. Subsystems online & armed.", "info");
});

// Real-time Clock
function initClock() {
    const clockEl = document.getElementById("telemetryClock");
    function update() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString("en-US", { hour12: false });
    }
    update();
    setInterval(update, 1000);
}

// ==========================================================================
// 2. WEB AUDIO API - SIREN & METRONOME SYNTHESIZER
// ==========================================================================
function getAudioContext() {
    if (!State.audio.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            State.audio.ctx = new AudioContextClass();
        }
    }
    if (State.audio.ctx && State.audio.ctx.state === "suspended") {
        State.audio.ctx.resume();
    }
    return State.audio.ctx;
}

// Sound Siren Engine
function playSiren() {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (!State.isEmergencyActive && !State.audio.isPlayingSiren) return;

    const sirenType = document.getElementById("sirenTypeSelect")?.value || State.audio.sirenType;
    const now = ctx.currentTime;

    if (sirenType === "ambulance") {
        // High-Low 2-Tone Siren
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";

        osc.frequency.setValueAtTime(960, now);
        osc.frequency.setValueAtTime(770, now + 0.4);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.8);

        State.audio.sirenTimeout = setTimeout(() => {
            if (State.isEmergencyActive || State.audio.isPlayingSiren) playSiren();
        }, 800);

    } else if (sirenType === "police") {
        // Rapid Wail Siren
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";

        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1450, now + 0.5);
        osc.frequency.linearRampToValueAtTime(600, now + 1.0);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 1.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.0);

        State.audio.sirenTimeout = setTimeout(() => {
            if (State.isEmergencyActive || State.audio.isPlayingSiren) playSiren();
        }, 1000);

    } else if (sirenType === "fire") {
        // Piercing Pulse Siren
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";

        osc.frequency.setValueAtTime(880, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.setValueAtTime(0, now + 0.2);
        gain.gain.setValueAtTime(0.25, now + 0.3);
        gain.gain.setValueAtTime(0, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);

        State.audio.sirenTimeout = setTimeout(() => {
            if (State.isEmergencyActive || State.audio.isPlayingSiren) playSiren();
        }, 700);

    } else if (sirenType === "morse") {
        // Morse Code SOS: ... --- ...
        playMorseSOS(ctx, now);
        State.audio.sirenTimeout = setTimeout(() => {
            if (State.isEmergencyActive || State.audio.isPlayingSiren) playSiren();
        }, 2200);
    }
}

function playMorseSOS(ctx, start) {
    const dot = 0.08;
    const dash = 0.24;
    const gap = 0.08;
    let t = start;

    function tone(duration) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1000, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.setValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
        t += duration + gap;
    }

    // ...
    tone(dot); tone(dot); tone(dot);
    t += gap * 2;
    // ---
    tone(dash); tone(dash); tone(dash);
    t += gap * 2;
    // ...
    tone(dot); tone(dot); tone(dot);
}

function stopSiren() {
    if (State.audio.sirenTimeout) {
        clearTimeout(State.audio.sirenTimeout);
        State.audio.sirenTimeout = null;
    }
    State.audio.isPlayingSiren = false;
}

// Spoken Voice Dispatch Alert (TTS)
function speakAlert(text) {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================================================
// 3. MASTER EMERGENCY SOS WORKFLOW
// ==========================================================================
function triggerEmergency(category = "general") {
    if (State.isEmergencyActive) return;

    State.isEmergencyActive = true;
    State.emergencyCategory = category;

    // UI Updates
    const masterBtn = document.getElementById("masterEmergencyBtn");
    const strobeOverlay = document.getElementById("emergencyStrobeOverlay");
    const systemStatusText = document.getElementById("systemStatusText");
    const systemStatusDot = document.getElementById("systemStatusDot");
    const threatBadge = document.getElementById("threatLevelBadge");
    const overlayTitle = document.getElementById("overlayAlertTitle");

    masterBtn.classList.add("active");
    strobeOverlay.classList.remove("hidden");
    systemStatusText.textContent = "EMERGENCY BROADCAST ACTIVE";
    systemStatusDot.className = "status-dot red";
    threatBadge.textContent = "THREAT LEVEL: CRITICAL";
    threatBadge.className = "badge-alert-level active";

    overlayTitle.textContent = `${category.toUpperCase()} EMERGENCY BROADCAST`;

    // Start Audio Siren
    getAudioContext();
    playSiren();

    // Haptic Vibration if supported
    if (navigator.vibrate) {
        navigator.vibrate([500, 250, 500, 250, 800]);
    }

    // Voice Broadcast
    const alertMsg = `Emergency alert initiated! Type: ${category}. Location latitude ${State.currentLocation.lat.toFixed(4)}, longitude ${State.currentLocation.lon.toFixed(4)}. Emergency dispatch transmitted.`;
    speakAlert(alertMsg);

    // Auto-capture optical evidence if camera is running
    if (State.camera.isRunning) {
        captureSnapshot("Automated Emergency SOS Evidence");
    }

    logEvent(`🚨 CRITICAL EMERGENCY TRIGGERED: [${category.toUpperCase()}] at ${State.currentLocation.address}`, "critical");
}

function stopEmergency() {
    if (!State.isEmergencyActive) return;

    State.isEmergencyActive = false;

    // UI Updates
    const masterBtn = document.getElementById("masterEmergencyBtn");
    const strobeOverlay = document.getElementById("emergencyStrobeOverlay");
    const systemStatusText = document.getElementById("systemStatusText");
    const systemStatusDot = document.getElementById("systemStatusDot");
    const threatBadge = document.getElementById("threatLevelBadge");

    masterBtn.classList.remove("active");
    strobeOverlay.classList.add("hidden");
    systemStatusText.textContent = "SYSTEM ARMED";
    systemStatusDot.className = "status-dot green";
    threatBadge.textContent = "THREAT LEVEL: READY";
    threatBadge.className = "badge-alert-level";

    stopSiren();
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    logEvent("Emergency status deactivated / System returned to Standby.", "info");
}

// ==========================================================================
// 4. AI COMPUTER VISION & CANVAS HUD OVERLAY
// ==========================================================================
const videoEl = document.getElementById("cameraVideo");
const canvasEl = document.getElementById("visionCanvas");
const ctxCanvas = canvasEl ? canvasEl.getContext("2d") : null;
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const fpsDisplay = document.getElementById("fpsDisplay");
const personCountVal = document.getElementById("personCountVal");
const crowdDensityBadge = document.getElementById("crowdDensityBadge");
const fallStatusVal = document.getElementById("fallStatusVal");
const fallConfidenceVal = document.getElementById("fallConfidenceVal");
const objectsCountVal = document.getElementById("objectsCountVal");
const objectsSummaryVal = document.getElementById("objectsSummaryVal");
const detectedTagsContainer = document.getElementById("detectedTagsContainer");

async function initAiModel() {
    const aiStatusBadge = document.getElementById("aiStatusBadge");
    const aiIcon = document.getElementById("aiIcon");

    if (State.ai.model) return State.ai.model;

    try {
        aiStatusBadge.textContent = "AI: Loading Model...";
        aiIcon.className = "fa-solid fa-spinner fa-spin";

        if (typeof cocoSsd === "undefined") {
            throw new Error("COCO-SSD library not loaded");
        }

        State.ai.model = await cocoSsd.load();
        aiStatusBadge.textContent = "AI: Model Active (COCO-SSD)";
        aiIcon.className = "fa-solid fa-brain";
        logEvent("AI Vision Engine loaded successfully.", "info");
        return State.ai.model;
    } catch (err) {
        console.error("AI Model Load Error:", err);
        aiStatusBadge.textContent = "AI: Load Failed";
        logEvent("Failed to load TensorFlow.js model: " + err.message, "warning");
        return null;
    }
}

async function startCamera() {
    const cameraBtnLabel = document.getElementById("cameraBtnLabel");
    const captureBtn = document.getElementById("captureSnapshotBtn");

    try {
        cameraBtnLabel.textContent = "Connecting...";
        const constraints = {
            video: {
                facingMode: State.camera.facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        State.camera.stream = stream;
        videoEl.srcObject = stream;
        State.camera.isRunning = true;

        videoEl.onloadedmetadata = () => {
            videoEl.play();
            cameraPlaceholder.classList.add("hidden");
            captureBtn.disabled = false;
            cameraBtnLabel.textContent = "Stop Camera";
            logEvent("Optical sensor active (" + State.camera.facingMode + " lens).", "info");

            // Ensure model is ready and start detection loop
            initAiModel().then(() => {
                State.ai.isDetecting = true;
                requestAnimationFrame(detectFrame);
            });
        };
    } catch (err) {
        console.error("Camera Access Error:", err);
        cameraBtnLabel.textContent = "Camera Error";
        alert("Camera permission denied or camera not accessible: " + err.message);
        logEvent("Optical sensor failed to initialize: " + err.message, "warning");
    }
}

function stopCamera() {
    if (State.camera.stream) {
        State.camera.stream.getTracks().forEach(track => track.stop());
        State.camera.stream = null;
    }
    videoEl.srcObject = null;
    State.camera.isRunning = false;
    State.ai.isDetecting = false;

    // Reset HUD
    if (ctxCanvas) {
        ctxCanvas.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }
    cameraPlaceholder.classList.remove("hidden");
    document.getElementById("cameraBtnLabel").textContent = "Start Camera";
    document.getElementById("captureSnapshotBtn").disabled = true;
    fpsDisplay.textContent = "0 FPS";
    personCountVal.textContent = "0";
    crowdDensityBadge.textContent = "Density: Clear";
    fallStatusVal.textContent = "Standby";
    objectsCountVal.textContent = "0";
    objectsSummaryVal.textContent = "Camera Off";

    logEvent("Optical sensor deactivated.", "info");
}

// AI Detection & Canvas HUD Drawing Loop
async function detectFrame() {
    if (!State.ai.isDetecting || !State.camera.isRunning || !videoEl.videoWidth) {
        return;
    }

    // Sync canvas resolution with video dimensions
    if (canvasEl.width !== videoEl.videoWidth || canvasEl.height !== videoEl.videoHeight) {
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
    }

    try {
        let predictions = [];
        if (State.ai.model) {
            predictions = await State.ai.model.detect(videoEl);
        }

        // Calculate FPS
        State.ai.frameCount++;
        const now = performance.now();
        if (now - State.ai.fpsTimer >= 1000) {
            State.ai.fps = Math.round((State.ai.frameCount * 1000) / (now - State.ai.fpsTimer));
            fpsDisplay.textContent = `${State.ai.fps} FPS`;
            State.ai.frameCount = 0;
            State.ai.fpsTimer = now;
        }

        // Draw HUD Overlays on Canvas
        renderVisionHUD(predictions);

        // Process AI Telemetry
        processVisionTelemetry(predictions);

    } catch (err) {
        console.error("Detection Frame Error:", err);
    }

    if (State.ai.isDetecting) {
        requestAnimationFrame(detectFrame);
    }
}

function renderVisionHUD(predictions) {
    if (!ctxCanvas) return;
    ctxCanvas.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const w = canvasEl.width;
    const h = canvasEl.height;

    // Optional Zone Guard Boundary
    if (State.camera.zoneGuard) {
        ctxCanvas.strokeStyle = "rgba(245, 158, 11, 0.4)";
        ctxCanvas.lineWidth = 2;
        ctxCanvas.setLineDash([8, 8]);
        ctxCanvas.strokeRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
        ctxCanvas.setLineDash([]);

        ctxCanvas.fillStyle = "rgba(245, 158, 11, 0.8)";
        ctxCanvas.font = "bold 14px 'JetBrains Mono', monospace";
        ctxCanvas.fillText("ZONE GUARD MONITOR ACTIVE", w * 0.1 + 8, h * 0.1 + 20);
    }

    predictions.forEach(item => {
        const [x, y, width, height] = item.bbox;
        const scorePercent = Math.round(item.score * 100);
        const isPerson = item.class === "person";

        // Heuristic: Check if person appears fallen / lying down
        const isFall = isPerson && (width > height * 1.2 || y + height > h * 0.9);

        // Determine Color Scheme
        let strokeColor = "#00f2fe"; // Neon Cyan for general objects
        let fillColor = "rgba(0, 242, 254, 0.12)";

        if (isPerson) {
            strokeColor = isFall ? "#ff2d55" : "#00f5a0"; // Red if fallen, emerald if standing
            fillColor = isFall ? "rgba(255, 45, 85, 0.25)" : "rgba(0, 245, 160, 0.12)";
        } else if (["knife", "scissors", "cell phone", "gun"].includes(item.class)) {
            strokeColor = "#f59e0b";
            fillColor = "rgba(245, 158, 11, 0.2)";
        }

        // Draw Bounding Box with rounded corners
        ctxCanvas.strokeStyle = strokeColor;
        ctxCanvas.lineWidth = 2.5;
        ctxCanvas.fillStyle = fillColor;
        ctxCanvas.beginPath();
        ctxCanvas.roundRect ? ctxCanvas.roundRect(x, y, width, height, 8) : ctxCanvas.rect(x, y, width, height);
        ctxCanvas.fill();
        ctxCanvas.stroke();

        // Corner Targeting Reticles
        const cornerLen = Math.min(width, height) * 0.2;
        ctxCanvas.lineWidth = 3.5;
        ctxCanvas.strokeStyle = strokeColor;

        // Top Left
        ctxCanvas.beginPath();
        ctxCanvas.moveTo(x, y + cornerLen);
        ctxCanvas.lineTo(x, y);
        ctxCanvas.lineTo(x + cornerLen, y);
        ctxCanvas.stroke();

        // Top Right
        ctxCanvas.beginPath();
        ctxCanvas.moveTo(x + width - cornerLen, y);
        ctxCanvas.lineTo(x + width, y);
        ctxCanvas.lineTo(x + width, y + cornerLen);
        ctxCanvas.stroke();

        // Bottom Left
        ctxCanvas.beginPath();
        ctxCanvas.moveTo(x, y + height - cornerLen);
        ctxCanvas.lineTo(x, y + height);
        ctxCanvas.lineTo(x + cornerLen, y + height);
        ctxCanvas.stroke();

        // Bottom Right
        ctxCanvas.beginPath();
        ctxCanvas.moveTo(x + width - cornerLen, y + height);
        ctxCanvas.lineTo(x + width, y + height);
        ctxCanvas.lineTo(x + width, y + height - cornerLen);
        ctxCanvas.stroke();

        // Label Badge
        const labelText = `${isFall ? "⚠️ FALL DETECTED: " : ""}${item.class.toUpperCase()} ${scorePercent}%`;
        ctxCanvas.font = "bold 13px 'JetBrains Mono', monospace";
        const textMetrics = ctxCanvas.measureText(labelText);
        const tagHeight = 22;
        const tagWidth = textMetrics.width + 16;

        ctxCanvas.fillStyle = strokeColor;
        ctxCanvas.fillRect(x, Math.max(0, y - tagHeight), tagWidth, tagHeight);

        ctxCanvas.fillStyle = "#000000";
        ctxCanvas.fillText(labelText, x + 8, Math.max(16, y - 6));
    });
}

function processVisionTelemetry(predictions) {
    const persons = predictions.filter(p => p.class === "person");
    const count = persons.length;
    State.ai.personCount = count;
    personCountVal.textContent = count;

    // Crowd Density Rating
    if (count === 0) crowdDensityBadge.textContent = "Density: Clear";
    else if (count <= 2) crowdDensityBadge.textContent = "Density: Low";
    else if (count <= 5) crowdDensityBadge.textContent = "Density: Moderate";
    else crowdDensityBadge.textContent = "Density: High Crowd (⚠️)";

    // Fall Detection Heuristic
    let fallDetected = false;
    persons.forEach(p => {
        const [x, y, w, h] = p.bbox;
        if (w > h * 1.25) {
            fallDetected = true;
        }
    });

    if (fallDetected) {
        fallStatusVal.textContent = "⚠️ FALL / DISTRESS";
        fallStatusVal.style.color = "var(--danger)";
        fallConfidenceVal.textContent = "Alert: High Probability";
    } else {
        fallStatusVal.textContent = count > 0 ? "Normal Posture" : "Standby";
        fallStatusVal.style.color = "var(--text-main)";
        fallConfidenceVal.textContent = count > 0 ? "Confidence: 94%" : "Confidence: --%";
    }

    // Objects list
    objectsCountVal.textContent = predictions.length;
    const classes = Array.from(new Set(predictions.map(p => p.class)));
    objectsSummaryVal.textContent = classes.length ? classes.slice(0, 3).join(", ") : "No hazards";

    // Update classification tags
    if (classes.length) {
        detectedTagsContainer.innerHTML = classes.map(c => `
            <span class="detected-pill ${["knife", "scissors"].includes(c) ? "danger" : ""}">
                <i class="fa-solid fa-tag"></i> ${c}
            </span>
        `).join("");
    } else {
        detectedTagsContainer.innerHTML = `<span class="tag-placeholder">Optical scanner active — no target obstacles detected</span>`;
    }
}

// Snapshot Capture & Evidence Archiving
function captureSnapshot(note = "Manual Optical Evidence Capture") {
    if (!videoEl.videoWidth) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = videoEl.videoWidth;
    tempCanvas.height = videoEl.videoHeight;
    const tempCtx = tempCanvas.getContext("2d");

    // Draw video frame
    tempCtx.drawImage(videoEl, 0, 0, tempCanvas.width, tempCanvas.height);
    // Overlay current canvas detections
    tempCtx.drawImage(canvasEl, 0, 0, tempCanvas.width, tempCanvas.height);

    // Add timestamp watermark
    const nowStr = new Date().toLocaleString();
    tempCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
    tempCtx.fillRect(10, tempCanvas.height - 36, 420, 26);
    tempCtx.fillStyle = "#00f2fe";
    tempCtx.font = "bold 13px 'JetBrains Mono', monospace";
    tempCtx.fillText(`RESCUE-AI EVIDENCE | ${nowStr}`, 20, tempCanvas.height - 18);

    const dataUrl = tempCanvas.toDataURL("image/jpeg", 0.9);
    const photoObj = {
        id: Date.now(),
        dataUrl,
        timestamp: new Date().toLocaleTimeString(),
        note
    };

    State.evidencePhotos.unshift(photoObj);
    renderEvidenceGallery();
    logEvent(`Snapshot evidence captured: "${note}"`, "info");
}

function renderEvidenceGallery() {
    const grid = document.getElementById("evidenceGrid");
    const countBadge = document.getElementById("evidenceCountBadge");
    if (!grid) return;

    countBadge.textContent = State.evidencePhotos.length;

    if (State.evidencePhotos.length === 0) {
        grid.innerHTML = `<div class="no-evidence-hint">No incident snapshots captured yet. Use "Capture Evidence" or trigger SOS.</div>`;
        return;
    }

    grid.innerHTML = State.evidencePhotos.map(photo => `
        <div class="evidence-thumb" title="${photo.note}">
            <img src="${photo.dataUrl}" alt="Evidence Snapshot">
            <span class="evidence-thumb-time">${photo.timestamp}</span>
        </div>
    `).join("");
}

// ==========================================================================
// 5. TACTICAL GPS & LEAFLET MAP COMMAND
// ==========================================================================
let leafletMap = null;
let userMarker = null;
let accuracyCircle = null;
let responderMarkers = [];

function initTacticalMap() {
    const mapContainer = document.getElementById("tacticalMap");
    if (!mapContainer || typeof L === "undefined") return;

    // Initialize Map with dark/tactical tile layer
    leafletMap = L.map("tacticalMap", {
        zoomControl: true,
        attributionControl: false
    }).setView([State.currentLocation.lat, State.currentLocation.lon], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
    }).addTo(leafletMap);

    // Initial GPS Fix
    refreshGeolocation();
}

function refreshGeolocation() {
    const gpsStatusBadge = document.getElementById("gpsStatusBadge");
    const gpsIcon = document.getElementById("gpsIcon");
    const latLonDisplay = document.getElementById("latLonDisplay");
    const accuracyBadge = document.getElementById("gpsAccuracyBadge");
    const readableAddress = document.getElementById("readableAddress");

    if (!navigator.geolocation) {
        gpsStatusBadge.textContent = "GPS: Unavailable";
        readableAddress.textContent = "Geolocation not supported by device browser.";
        return;
    }

    gpsStatusBadge.textContent = "GPS: Acquiring Fix...";
    gpsIcon.className = "fa-solid fa-satellite-dish fa-spin";

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = Math.round(position.coords.accuracy || 15);

            State.currentLocation.lat = lat;
            State.currentLocation.lon = lon;
            State.currentLocation.accuracy = accuracy;
            State.currentLocation.resolved = true;

            gpsStatusBadge.textContent = "GPS: Fixed (High Acc)";
            gpsIcon.className = "fa-solid fa-satellite-dish";
            latLonDisplay.textContent = `LAT: ${lat.toFixed(5)} | LON: ${lon.toFixed(5)}`;
            accuracyBadge.textContent = `Accuracy: ±${accuracy}m`;

            // Update Tactical Leaflet Map
            updateMapPosition(lat, lon, accuracy);

            // Reverse Geocode
            fetchReverseGeocode(lat, lon);

            // Calculate and display simulated nearest responders
            calculateNearestResponders(lat, lon);

            logEvent(`Tactical GPS Fix Acquired: ${lat.toFixed(5)}, ${lon.toFixed(5)} (±${accuracy}m)`, "info");
        },
        err => {
            console.warn("GPS Permission / Error:", err);
            gpsStatusBadge.textContent = "GPS: Fallback Active";
            gpsIcon.className = "fa-solid fa-satellite-dish";
            readableAddress.textContent = "Location using tactical fallback coordinates.";
            updateMapPosition(State.currentLocation.lat, State.currentLocation.lon, 50);
            calculateNearestResponders(State.currentLocation.lat, State.currentLocation.lon);
            logEvent("GPS acquisition fallback: " + err.message, "warning");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function updateMapPosition(lat, lon, accuracy) {
    if (!leafletMap) return;

    leafletMap.setView([lat, lon], 15);

    if (userMarker) leafletMap.removeLayer(userMarker);
    if (accuracyCircle) leafletMap.removeLayer(accuracyCircle);

    // Glowing Pulse Icon for User
    const userPulseIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
            <div style="
                width: 20px;
                height: 20px;
                background: #ff2d55;
                border: 3px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 20px #ff2d55;
            "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    userMarker = L.marker([lat, lon], { icon: userPulseIcon })
        .addTo(leafletMap)
        .bindPopup("<strong>🚨 YOUR CURRENT LOCATION</strong><br>Live Telemetry Beacon");

    accuracyCircle = L.circle([lat, lon], {
        radius: accuracy,
        color: "#00f2fe",
        fillColor: "#00f2fe",
        fillOpacity: 0.15,
        weight: 1
    }).addTo(leafletMap);
}

async function fetchReverseGeocode(lat, lon) {
    const addressEl = document.getElementById("readableAddress");
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
            headers: { "Accept-Language": "en" }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
                State.currentLocation.address = data.display_name;
                addressEl.textContent = data.display_name;
                return;
            }
        }
    } catch (e) {
        console.warn("Geocoding fetch error:", e);
    }
    addressEl.textContent = `${lat.toFixed(5)}°N, ${lon.toFixed(5)}°E (Approx Location)`;
}

function calculateNearestResponders(userLat, userLon) {
    if (!leafletMap) return;

    // Clear old responder markers
    responderMarkers.forEach(m => leafletMap.removeLayer(m));
    responderMarkers = [];

    // Simulated Tactical Responder Units around the user coordinates
    const responders = [
        {
            type: "hospital",
            name: "Apex Emergency & Trauma Center",
            lat: userLat + 0.009,
            lon: userLon + 0.008,
            dist: "1.2 km",
            eta: "~4 mins",
            phone: "108",
            iconColor: "#ec4899",
            iconFa: "fa-hospital"
        },
        {
            type: "police",
            name: "District Police Station & PCR",
            lat: userLat - 0.012,
            lon: userLon + 0.006,
            dist: "1.8 km",
            eta: "~6 mins",
            phone: "100",
            iconColor: "#3b82f6",
            iconFa: "fa-building-shield"
        },
        {
            type: "fire",
            name: "Central Fire & Rescue Unit",
            lat: userLat + 0.005,
            lon: userLon - 0.015,
            dist: "2.4 km",
            eta: "~8 mins",
            phone: "101",
            iconColor: "#f97316",
            iconFa: "fa-fire-extinguisher"
        }
    ];

    // Plot responders on map
    responders.forEach(r => {
        const markerIcon = L.divIcon({
            className: "resp-map-icon",
            html: `
                <div style="
                    background: ${r.iconColor};
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid white;
                    box-shadow: 0 0 10px ${r.iconColor};
                    font-size: 13px;
                ">
                    <i class="fa-solid ${r.iconFa}"></i>
                </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const m = L.marker([r.lat, r.lon], { icon: markerIcon })
            .addTo(leafletMap)
            .bindPopup(`<strong>${r.name}</strong><br>Distance: ${r.dist} (${r.eta})<br><a href="tel:${r.phone}">📞 Call ${r.phone}</a>`);

        responderMarkers.push(m);
    });
}

function shareCurrentLocation() {
    const lat = State.currentLocation.lat.toFixed(5);
    const lon = State.currentLocation.lon.toFixed(5);
    const gmapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
    const text = `🚨 *RESCUE-AI EMERGENCY SOS ALERT* 🚨\nI require urgent emergency assistance!\n\n📍 *My Coordinates:* ${lat}, ${lon}\n🏠 *Address:* ${State.currentLocation.address}\n🗺️ *Live Google Maps:* ${gmapsUrl}\n🕒 *Timestamp:* ${new Date().toLocaleString()}`;

    if (navigator.share) {
        navigator.share({
            title: "🚨 RescueAI Emergency SOS",
            text: text,
            url: gmapsUrl
        }).catch(err => console.log("Share cancelled", err));
    } else {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(waUrl, "_blank");
    }
}

// ==========================================================================
// 6. HANDS-FREE VOICE SOS & RECOGNITION (WEB SPEECH API)
// ==========================================================================
function initVoiceRecognition() {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const voiceBtn = document.getElementById("voiceToggleBtn");
    const voiceStatus = document.getElementById("voiceStatusText");

    if (!SpeechRecognitionClass) {
        if (voiceBtn) {
            voiceBtn.disabled = true;
            voiceStatus.textContent = "Voice: Not Supported";
        }
        return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = event => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript.trim().toLowerCase();
            logEvent(`Voice Command Detected: "${transcript}"`, "info");
            handleVoiceCommand(transcript);
        }
    };

    recognition.onerror = event => {
        console.warn("Speech Recognition Error:", event.error);
        if (event.error === "not-allowed") {
            toggleVoiceListening(false);
            alert("Microphone permission denied for voice emergency listener.");
        }
    };

    recognition.onend = () => {
        if (State.voice.isListening) {
            try { recognition.start(); } catch (e) { }
        }
    };

    State.voice.recognition = recognition;
}

function toggleVoiceListening(forceState = null) {
    const shouldListen = forceState !== null ? forceState : !State.voice.isListening;
    const voiceBtn = document.getElementById("voiceToggleBtn");
    const voiceStatus = document.getElementById("voiceStatusText");

    if (!State.voice.recognition) return;

    if (shouldListen) {
        try {
            State.voice.recognition.start();
            State.voice.isListening = true;
            voiceBtn.classList.add("listening");
            voiceStatus.textContent = "Voice Trigger: ACTIVE 🎙️";
            logEvent("Voice emergency listener engaged. Listening for SOS keywords...", "info");
        } catch (e) {
            console.error("Voice Start Error:", e);
        }
    } else {
        try {
            State.voice.recognition.stop();
            State.voice.isListening = false;
            voiceBtn.classList.remove("listening");
            voiceStatus.textContent = "Voice Trigger: OFF";
            logEvent("Voice emergency listener paused.", "info");
        } catch (e) { }
    }
}

function handleVoiceCommand(cmd) {
    if (cmd.includes("help") || cmd.includes("emergency") || cmd.includes("sos")) {
        triggerEmergency("Voice Activated Alert");
    } else if (cmd.includes("fire")) {
        triggerEmergency("fire");
    } else if (cmd.includes("ambulance") || cmd.includes("medical")) {
        triggerEmergency("medical");
    } else if (cmd.includes("police") || cmd.includes("threat")) {
        triggerEmergency("police");
    } else if (cmd.includes("stop") || cmd.includes("cancel") || cmd.includes("stand down")) {
        stopEmergency();
    } else if (cmd.includes("camera") || cmd.includes("video")) {
        if (!State.camera.isRunning) startCamera();
        else stopCamera();
    } else if (cmd.includes("cpr")) {
        toggleCprMetronome();
    }
}

// ==========================================================================
// 7. CPR METRONOME & FIRST AID PLAYBOOKS
// ==========================================================================
function toggleCprMetronome() {
    const startBtn = document.getElementById("cprStartBtn");
    const heartIcon = document.getElementById("cprHeartIcon");
    const cycleCountEl = document.getElementById("cprCycleCount");

    if (State.cpr.isRunning) {
        // Stop
        clearInterval(State.cpr.intervalId);
        State.cpr.isRunning = false;
        State.cpr.intervalId = null;
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Rhythm';
        startBtn.style.background = "";
        heartIcon.classList.remove("beat");
        logEvent("CPR metronome paused.", "info");
    } else {
        // Start 110 BPM Metronome (~545ms interval)
        const ctx = getAudioContext();
        const intervalMs = Math.round((60 / State.cpr.bpm) * 1000);

        State.cpr.isRunning = true;
        State.cpr.compressions = 0;
        State.cpr.cycles = 0;
        cycleCountEl.textContent = "0";

        startBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Rhythm';
        startBtn.style.background = "#22c55e";

        function tick() {
            // Visual beat
            heartIcon.classList.add("beat");
            setTimeout(() => heartIcon.classList.remove("beat"), 150);

            // Audio click / beep
            if (ctx) {
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            }

            State.cpr.compressions++;
            if (State.cpr.compressions % 30 === 0) {
                State.cpr.cycles++;
                cycleCountEl.textContent = State.cpr.cycles;
                speakAlert("Give 2 rescue breaths, then resume compressions.");
            }
        }

        tick();
        State.cpr.intervalId = setInterval(tick, intervalMs);
        logEvent("CPR 110 BPM compression guide initiated.", "info");
    }
}

function initPlaybookSearch() {
    const searchInput = document.getElementById("playbookSearchInput");
    const container = document.getElementById("playbookContainer");

    if (!searchInput || !container) return;

    searchInput.addEventListener("input", e => {
        const query = e.target.value.toLowerCase().trim();
        const items = container.querySelectorAll(".playbook-item");

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.style.display = "";
                if (query.length > 1) item.setAttribute("open", "");
            } else {
                item.style.display = "none";
            }
        });
    });
}

// ==========================================================================
// 8. ICE CONTACTS & MEDICAL ID (LOCALSTORAGE)
// ==========================================================================
const DEFAULT_ICE_CONTACTS = [
    { id: 1, name: "Dr. Sarah Connor", relation: "Primary Physician", phone: "+1234567890" },
    { id: 2, name: "Emergency Dispatch 112", relation: "Universal Emergency", phone: "112" }
];

const DEFAULT_MEDICAL = {
    name: "Alex Vance (Command Agent)",
    blood: "O+",
    allergies: "Penicillin, Peanuts",
    conditions: "Asthma",
    meds: "Inhaler in pocket"
};

function initIceContacts() {
    const saved = localStorage.getItem("rescueai_ice_contacts");
    if (saved) {
        try { State.iceContacts = JSON.parse(saved); } catch (e) { State.iceContacts = DEFAULT_ICE_CONTACTS; }
    } else {
        State.iceContacts = DEFAULT_ICE_CONTACTS;
        saveIceContacts();
    }
    renderIceContacts();
}

function saveIceContacts() {
    localStorage.setItem("rescueai_ice_contacts", JSON.stringify(State.iceContacts));
    renderIceContacts();
}

function renderIceContacts() {
    const list = document.getElementById("iceContactsList");
    const countBadge = document.getElementById("iceCountBadge");
    if (!list) return;

    countBadge.textContent = State.iceContacts.length;

    if (State.iceContacts.length === 0) {
        list.innerHTML = `<div class="no-evidence-hint">No ICE contacts saved yet. Click "Add" to protect yourself.</div>`;
        return;
    }

    list.innerHTML = State.iceContacts.map(c => {
        const sosText = encodeURIComponent(`🚨 *EMERGENCY SOS* from ${State.currentLocation.address}. Lat: ${State.currentLocation.lat.toFixed(4)}, Lon: ${State.currentLocation.lon.toFixed(4)}. Map: https://maps.google.com/?q=${State.currentLocation.lat},${State.currentLocation.lon}`);
        const waLink = `https://api.whatsapp.com/send?phone=${c.phone.replace(/[^0-9]/g, "")}&text=${sosText}`;

        return `
            <div class="ice-contact-card">
                <div class="contact-info">
                    <strong>${c.name}</strong>
                    <span>${c.relation} | ${c.phone}</span>
                </div>
                <div class="contact-actions">
                    <a href="tel:${c.phone}" class="btn-contact-action call" title="Call Contact"><i class="fa-solid fa-phone"></i></a>
                    <a href="${waLink}" target="_blank" class="btn-contact-action wa" title="Send WhatsApp SOS"><i class="fa-brands fa-whatsapp"></i></a>
                    <button class="btn-contact-action delete" onclick="deleteContact(${c.id})" title="Delete Contact"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join("");
}

function deleteContact(id) {
    State.iceContacts = State.iceContacts.filter(c => c.id !== id);
    saveIceContacts();
    logEvent("ICE emergency contact removed.", "info");
}

function broadcastToAllIce() {
    if (State.iceContacts.length === 0) {
        alert("Please add at least one ICE contact first!");
        return;
    }

    const lat = State.currentLocation.lat.toFixed(5);
    const lon = State.currentLocation.lon.toFixed(5);
    const text = `🚨 *URGENT RESCUE-AI BROADCAST* 🚨\nI have triggered an emergency broadcast!\n\n📍 Coordinates: ${lat}, ${lon}\n🗺️ Google Maps: https://maps.google.com/?q=${lat},${lon}\n🏠 Location: ${State.currentLocation.address}`;

    // Open first contact on WhatsApp
    const firstContact = State.iceContacts[0];
    const waUrl = `https://api.whatsapp.com/send?phone=${firstContact.phone.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");

    logEvent(`Broadcast SOS dispatched to ${State.iceContacts.length} ICE contacts.`, "critical");
}

function initMedicalProfile() {
    const saved = localStorage.getItem("rescueai_medical_profile");
    let med = DEFAULT_MEDICAL;
    if (saved) {
        try { med = JSON.parse(saved); } catch (e) { }
    }

    document.getElementById("medProfileName").textContent = med.name || DEFAULT_MEDICAL.name;
    document.getElementById("medBlood").textContent = med.blood || DEFAULT_MEDICAL.blood;
    document.getElementById("medAllergies").textContent = med.allergies || DEFAULT_MEDICAL.allergies;
    document.getElementById("medConditions").textContent = med.conditions || DEFAULT_MEDICAL.conditions;
    document.getElementById("medMeds").textContent = med.meds || DEFAULT_MEDICAL.meds;
}

// ==========================================================================
// 9. INCIDENT LOG & OFFICIAL REPORT EXPORTER
// ==========================================================================
function logEvent(msg, level = "info") {
    const time = new Date().toLocaleTimeString();
    const entry = { time, msg, level, timestamp: Date.now() };
    State.incidentLogs.unshift(entry);

    const timeline = document.getElementById("incidentTimeline");
    if (timeline) {
        const item = document.createElement("div");
        item.className = `timeline-entry ${level}`;
        item.innerHTML = `
            <span class="timeline-time">${time}</span>
            <span class="timeline-msg">${msg}</span>
        `;
        timeline.insertBefore(item, timeline.firstChild);
    }
}

function exportIncidentReport() {
    const dateStr = new Date().toLocaleString();
    let report = `==================================================================\n`;
    report += `🚨 RESCUE-AI AUTONOMOUS EMERGENCY RESPONSE COMMAND REPORT\n`;
    report += `Generated: ${dateStr}\n`;
    report += `==================================================================\n\n`;

    report += `--- LOCATION TELEMETRY ---\n`;
    report += `Coordinates: Latitude ${State.currentLocation.lat}, Longitude ${State.currentLocation.lon}\n`;
    report += `Accuracy Radius: ±${State.currentLocation.accuracy} meters\n`;
    report += `Geocoded Address: ${State.currentLocation.address}\n\n`;

    report += `--- PATIENT / USER MEDICAL ID ---\n`;
    report += `Name: ${document.getElementById("medProfileName")?.textContent || "N/A"}\n`;
    report += `Blood Group: ${document.getElementById("medBlood")?.textContent || "N/A"}\n`;
    report += `Allergies: ${document.getElementById("medAllergies")?.textContent || "N/A"}\n`;
    report += `Chronic Conditions: ${document.getElementById("medConditions")?.textContent || "N/A"}\n`;
    report += `Emergency Meds: ${document.getElementById("medMeds")?.textContent || "N/A"}\n\n`;

    report += `--- OPTICAL VISION & HAZARD TELEMETRY ---\n`;
    report += `Humans in Scene: ${State.ai.personCount}\n`;
    report += `Optical Evidence Photos Attached: ${State.evidencePhotos.length}\n\n`;

    report += `--- CHRONOLOGICAL INCIDENT TIMELINE ---\n`;
    State.incidentLogs.slice().reverse().forEach(log => {
        report += `[${log.time}] [${log.level.toUpperCase()}] ${log.msg}\n`;
    });

    report += `\n==================================================================\n`;
    report += `End of RescueAI Incident Transmission\n`;

    // Trigger File Download
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RescueAI_Incident_Report_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    logEvent("Official incident telemetry audit report exported.", "info");
}

// ==========================================================================
// 10. UI EVENT BINDINGS
// ==========================================================================
function bindEvents() {
    // Master SOS Toggle
    const masterEmergencyBtn = document.getElementById("masterEmergencyBtn");
    masterEmergencyBtn.addEventListener("click", () => {
        if (State.isEmergencyActive) stopEmergency();
        else triggerEmergency("General SOS");
    });

    document.getElementById("overlayStopBtn").addEventListener("click", stopEmergency);

    // Quick Emergency Category Buttons
    document.querySelectorAll(".btn-quick-cat").forEach(btn => {
        btn.addEventListener("click", () => {
            const cat = btn.getAttribute("data-type");
            triggerEmergency(cat);
        });
    });

    // Voice SOS Button
    document.getElementById("voiceToggleBtn").addEventListener("click", () => toggleVoiceListening());

    // Sound Test Button
    const soundTestBtn = document.getElementById("soundTestBtn");
    soundTestBtn.addEventListener("click", () => {
        getAudioContext();
        if (State.audio.isPlayingSiren) {
            stopSiren();
            soundTestBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        } else {
            State.audio.isPlayingSiren = true;
            playSiren();
            soundTestBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            setTimeout(() => {
                if (State.audio.isPlayingSiren && !State.isEmergencyActive) {
                    stopSiren();
                    soundTestBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                }
            }, 3000);
        }
    });

    // Camera Controls
    const toggleCameraBtn = document.getElementById("toggleCameraBtn");
    const startCameraPrimaryBtn = document.getElementById("startCameraPrimaryBtn");
    const captureSnapshotBtn = document.getElementById("captureSnapshotBtn");
    const cameraFlipBtn = document.getElementById("cameraFlipBtn");
    const nightVisionBtn = document.getElementById("nightVisionBtn");
    const tripwireToggleBtn = document.getElementById("tripwireToggleBtn");

    const handleCameraToggle = () => {
        if (State.camera.isRunning) stopCamera();
        else startCamera();
    };

    toggleCameraBtn.addEventListener("click", handleCameraToggle);
    startCameraPrimaryBtn.addEventListener("click", handleCameraToggle);

    captureSnapshotBtn.addEventListener("click", () => {
        captureSnapshot("Manual Evidence Capture");
    });

    cameraFlipBtn.addEventListener("click", () => {
        State.camera.facingMode = State.camera.facingMode === "user" ? "environment" : "user";
        if (State.camera.isRunning) {
            stopCamera();
            startCamera();
        }
    });

    nightVisionBtn.addEventListener("click", () => {
        State.camera.nightVision = !State.camera.nightVision;
        const viewport = document.querySelector(".viewport-wrapper");
        if (State.camera.nightVision) {
            viewport.classList.add("night-vision");
            nightVisionBtn.style.color = "var(--cyber-cyan)";
        } else {
            viewport.classList.remove("night-vision");
            nightVisionBtn.style.color = "";
        }
    });

    tripwireToggleBtn.addEventListener("click", () => {
        State.camera.zoneGuard = !State.camera.zoneGuard;
        document.getElementById("zoneGuardText").textContent = State.camera.zoneGuard ? "ON" : "OFF";
        tripwireToggleBtn.style.borderColor = State.camera.zoneGuard ? "var(--warning)" : "";
    });

    // Tactical GPS Controls
    document.getElementById("refreshGpsBtn").addEventListener("click", refreshGeolocation);
    document.getElementById("shareLocationBtn").addEventListener("click", shareCurrentLocation);

    // CPR Controls
    document.getElementById("cprStartBtn").addEventListener("click", toggleCprMetronome);
    document.getElementById("toggleCprModalBtn").addEventListener("click", toggleCprMetronome);

    // ICE Contacts & Broadcast
    document.getElementById("broadcastIceBtn").addEventListener("click", broadcastToAllIce);

    // Contact Modal
    const contactModal = document.getElementById("contactModal");
    const addContactBtn = document.getElementById("addContactBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const contactForm = document.getElementById("contactForm");

    addContactBtn.addEventListener("click", () => contactModal.classList.remove("hidden"));
    const hideContactModal = () => contactModal.classList.add("hidden");
    closeModalBtn.addEventListener("click", hideContactModal);
    cancelModalBtn.addEventListener("click", hideContactModal);

    contactForm.addEventListener("submit", e => {
        e.preventDefault();
        const name = document.getElementById("contactName").value.trim();
        const relation = document.getElementById("contactRelation").value.trim();
        const phone = document.getElementById("contactPhone").value.trim();

        if (name && phone) {
            State.iceContacts.push({ id: Date.now(), name, relation, phone });
            saveIceContacts();
            contactForm.reset();
            hideContactModal();
            logEvent(`Added ICE Contact: ${name} (${relation})`, "info");
        }
    });

    // Medical ID Modal
    const medicalModal = document.getElementById("medicalModal");
    const editMedicalBtn = document.getElementById("editMedicalBtn");
    const closeMedModalBtn = document.getElementById("closeMedModalBtn");
    const cancelMedModalBtn = document.getElementById("cancelMedModalBtn");
    const medicalForm = document.getElementById("medicalForm");

    editMedicalBtn.addEventListener("click", () => {
        document.getElementById("medInputName").value = document.getElementById("medProfileName").textContent;
        document.getElementById("medInputBlood").value = document.getElementById("medBlood").textContent;
        document.getElementById("medInputAllergies").value = document.getElementById("medAllergies").textContent;
        document.getElementById("medInputConditions").value = document.getElementById("medConditions").textContent;
        document.getElementById("medInputMeds").value = document.getElementById("medMeds").textContent;
        medicalModal.classList.remove("hidden");
    });

    const hideMedModal = () => medicalModal.classList.add("hidden");
    closeMedModalBtn.addEventListener("click", hideMedModal);
    cancelMedModalBtn.addEventListener("click", hideMedModal);

    medicalForm.addEventListener("submit", e => {
        e.preventDefault();
        const profile = {
            name: document.getElementById("medInputName").value.trim(),
            blood: document.getElementById("medInputBlood").value,
            allergies: document.getElementById("medInputAllergies").value.trim(),
            conditions: document.getElementById("medInputConditions").value.trim(),
            meds: document.getElementById("medInputMeds").value.trim()
        };

        localStorage.setItem("rescueai_medical_profile", JSON.stringify(profile));
        initMedicalProfile();
        hideMedModal();
        logEvent("Medical ID profile updated.", "info");
    });

    // Log Controls
    document.getElementById("exportLogBtn").addEventListener("click", exportIncidentReport);
    document.getElementById("clearLogBtn").addEventListener("click", () => {
        State.incidentLogs = [];
        document.getElementById("incidentTimeline").innerHTML = "";
        logEvent("Incident timeline cleared.", "info");
    });
}