const map = document.getElementById("map");
const draw = document.getElementById("draw");
const grid = document.getElementById("grid");
const unitLayer = document.getElementById("unitLayer");
const ctx = draw.getContext("2d");
const gtx = grid.getContext("2d");
const canvasContainer = document.getElementById("canvas-container");
let tool = "ping";
let color = "red";
let showArrow = false;
let showGrid = true;
let selectedUnitType = null;
let startX, startY;
let drawing = false;
let history = [];
let redo = [];
let polygonPoints = [];

let drawnElements = [];
let selectedElement = null;
let isDraggingElement = false;
let dragStartX, dragStartY;
let elementIdCounter = 0;

const board = document.getElementById("board");
let scale = 1;
let minScale = 1;
let offsetX = 0;
let offsetY = 0;
let isPanning = false;
let panStartX, panStartY;

let draggedUnit = null;
let selectedUnit = null;
let unitIdCounter = 0;
const unitTypes = {
    tank_heavy: { name: "Heavy Tank", view: 400, radio: 750 },
    tank_medium: { name: "Medium Tank", view: 400, radio: 750 },
    tank_light: { name: "Light Tank", view: 390, radio: 750 },
    arty: { name: "Artillery", view: 300, radio: 750 },
    destroyer: { name: "Tank destroyer", view: 380, radio: 750 }
};

// === MAP LIST ===
let mapList = [];
let pixelsPerMeter = 2;
let currentMapPath = "";
let currentMapWidthKm = 1;
let currentMapHeightKm = 1;

const modes = {
    standard: "Standard Battle",
    attack: "Атака / Оборона",
    bloggers: "Битва блогеров",
    clash: "Встречный бой",
    general: "Генеральное сражение",
    onslaught: "Натиск"
};

function populateMapSelect(mode) {
    const select = document.getElementById("map-select");
    select.length = 0;
    let firstIdx = -1;
    mapList.forEach((m, i) => {
        if ((m.mode || "standard") !== mode) return;
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = m.name;
        select.appendChild(opt);
        if (firstIdx < 0) firstIdx = i;
    });
    return firstIdx;
}

const modeSelect = document.getElementById("mode-select");
Object.keys(modes).forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = modes[key];
    modeSelect.appendChild(opt);
});
modeSelect.addEventListener("change", function() {
    const idx = populateMapSelect(this.value);
    if (idx >= 0) loadMap(idx);
});

fetch("maps2/list.json").then(r => r.json()).then(data => {
    mapList = data;
    const idx = populateMapSelect(modeSelect.value);
    if (idx >= 0) loadMap(idx);
}).catch(() => {
    loadMapByPath("maps2/Прохоровка.webp", 1, 1);
});

document.getElementById("map-select").addEventListener("change", function() {
    loadMap(parseInt(this.value));
});

function loadMap(index) {
    const m = mapList[index];
    if (!m) return;
    loadMapByPath(m.path, m.width_km || 1, m.height_km || 1);
}

function loadMapByPath(path, wKm, hKm) {
    currentMapPath = path;
    currentMapWidthKm = wKm;
    currentMapHeightKm = hKm;
    history = [];
    redo = [];
    drawnElements = [];
    polygonPoints = [];
    unitLayer.innerHTML = "";
    unitIdCounter = 0;
    selectedElement = null;
    selectedUnit = null;

    map.onload = () => {
        draw.width = map.naturalWidth;
        draw.height = map.naturalHeight;
        grid.width = map.naturalWidth;
        grid.height = map.naturalHeight;
        unitLayer.style.width = map.naturalWidth + "px";
        unitLayer.style.height = map.naturalHeight + "px";
        pixelsPerMeter = map.naturalWidth / (wKm * 1000);
        centerMap();
        drawGrid();
        updateTransform();
        renderAllElements();
    };
    map.onerror = () => console.error("Map load failed:", path);
    map.src = path;
}

// Center map
function centerMap() {
    const containerHeight = canvasContainer.clientHeight;
    const containerWidth = canvasContainer.clientWidth;
    minScale = Math.min(containerWidth / map.naturalWidth, containerHeight / map.naturalHeight);
    scale = minScale;
    offsetX = (containerWidth - map.naturalWidth * scale) / 2;
    offsetY = (containerHeight - map.naturalHeight * scale) / 2;
}

// Tool buttons
document.querySelectorAll(".tool-btn").forEach(btn => {
    btn.addEventListener("click", function() {
        const wasActive = this.classList.contains("active");
        document.querySelectorAll(".tool-btn").forEach(b => b.classList.remove("active"));
        
        if (wasActive) {
            tool = "";
            document.getElementById("arrow-option").classList.add("hidden");
            polygonPoints = [];
            renderAllElements();
            return;
        }
        
        this.classList.add("active");
        tool = this.dataset.tool;
        
        const arrowOption = document.getElementById("arrow-option");
        
        if (tool === "line") {
            arrowOption.classList.remove("hidden");
        } else {
            arrowOption.classList.add("hidden");
        }
        
        polygonPoints = [];
        renderAllElements();
    });
});

// Arrow checkbox
document.getElementById("showArrow").addEventListener("change", function() {
    showArrow = this.checked;
});

document.getElementById("toggleGrid").addEventListener("change", function() {
    showGrid = this.checked;
    grid.style.display = showGrid ? "block" : "none";
});

// Color buttons
document.querySelectorAll(".color-btn").forEach(btn => {
    btn.addEventListener("click", function() {
        document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        color = this.dataset.color;
    });
});

// Unit selection
document.querySelectorAll("#units-panel .unit-btn").forEach(btn => {
    const type = btn.dataset.type;
    const ic = document.createElement("img");
    ic.className = "unit-btn-icon";
    ic.alt = type;
    btn.textContent = "";
    btn.appendChild(ic);
    btn.title = type.replace('_', ' ');
    setUnitIcon(ic, type, "#a0a0a0");
    btn.addEventListener("click", function() {
        const wasSelected = this.classList.contains("selected");
        document.querySelectorAll("#units-panel .unit-btn").forEach(b => b.classList.remove("selected"));
        if (wasSelected) {
            selectedUnitType = null;
        } else {
            document.querySelectorAll(".tool-btn").forEach(b => b.classList.remove("active"));
            tool = "";
            document.getElementById("arrow-option").classList.add("hidden");
            polygonPoints = [];
            renderAllElements();
            this.classList.add("selected");
            selectedUnitType = this.dataset.type;
        }
    });
});

// Get mouse position
function getMousePos(e) {
    const rect = draw.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale
    };
}

// Hit test
function getElementAtPosition(x, y) {
    for (let i = drawnElements.length - 1; i >= 0; i--) {
        const el = drawnElements[i];
        if (el.type === "line" || el.type === "ruler") {
            const dist = pointToLineDistance(x, y, el.points[0], el.points[1]);
            if (dist < 10) return el;
        }
        if (el.type === "circle") {
            const dist = Math.hypot(x - el.center.x, y - el.center.y);
            if (dist <= el.radius) return el;
        }
        if (el.type === "polygon") {
            if (pointInPolygon(x, y, el.points)) return el;
        }
    }
    return null;
}

function pointToLineDistance(px, py, lineStart, lineEnd) {
    const A = px - lineStart.x;
    const B = py - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) { xx = lineStart.x; yy = lineStart.y; }
    else if (param > 1) { xx = lineEnd.x; yy = lineEnd.y; }
    else { xx = lineStart.x + param * C; yy = lineStart.y + param * D; }
    return Math.hypot(px - xx, py - yy);
}

function pointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
}

// Render
function renderAllElements() {
    ctx.clearRect(0, 0, draw.width, draw.height);
    drawnElements.forEach(el => {
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.fillStyle = getColorWithAlpha(el.color, 0.2);
        ctx.strokeStyle = getColorHex(el.color);
        ctx.shadowBlur = 0;
        if (el.type === "line") {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            ctx.lineTo(el.points[1].x, el.points[1].y);
            ctx.stroke();
            if (el.showArrow) drawArrowhead(el.points[0].x, el.points[0].y, el.points[1].x, el.points[1].y, getColorHex(el.color));
        }
        if (el.type === "circle") {
            ctx.beginPath();
            ctx.arc(el.center.x, el.center.y, el.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        if (el.type === "polygon") {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            for (let i = 1; i < el.points.length; i++) ctx.lineTo(el.points[i].x, el.points[i].y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        if (el.type === "ruler") {
            ctx.save();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            ctx.lineTo(el.points[1].x, el.points[1].y);
            ctx.stroke();
            ctx.restore();
            const midX = (el.points[0].x + el.points[1].x) / 2;
            const midY = (el.points[0].y + el.points[1].y) / 2;
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(el.distance + "m", midX, midY - 10);
        }
        ctx.shadowBlur = 0;
    });
}

function redrawFromHistory() {
    renderAllElements();
}

// Mouse down
draw.addEventListener("mousedown", e => {
    e.preventDefault();
    const pos = getMousePos(e);
    if (e.button === 2) {
        isPanning = true;
        panStartX = e.clientX - offsetX;
        panStartY = e.clientY - offsetY;
        board.style.cursor = "grabbing";
        return;
    }
    if (e.button !== 0) return;
    if (tool === "ruler") {
        drawing = true;
        startX = pos.x;
        startY = pos.y;
        return;
    }
    if (tool === "eraser") {
        const el = getElementAtPosition(pos.x, pos.y);
        if (el) {
            drawnElements = drawnElements.filter(e => e !== el);
            save();
            renderAllElements();
        }
        return;
    }
    if (!selectedUnitType) {
        const clickedElement = getElementAtPosition(pos.x, pos.y);
        if (clickedElement) {
            selectedElement = clickedElement;
            isDraggingElement = true;
            dragStartX = pos.x;
            dragStartY = pos.y;
            renderAllElements();
            return;
        } else {
            selectedElement = null;
            renderAllElements();
        }
    }
    if (selectedUnitType && !tool) {
        addUnit(selectedUnitType, pos.x, pos.y, color);
        selectedUnitType = null;
        document.querySelectorAll("#units-panel .unit-btn").forEach(b => b.classList.remove("selected"));
        save();
        return;
    }
    if (tool === "polygon") {
        if (polygonPoints.length === 0) save();
        polygonPoints.push({x: pos.x, y: pos.y});
        redrawPolygonPreview();
        return;
    }
    if (tool === "ping") {
        startPing(pos.x, pos.y);
        return;
    }
    if (tool === "line" || tool === "circle" || tool === "ruler") {
        drawing = true;
        startX = pos.x;
        startY = pos.y;
    }
});

// Mouse move
draw.addEventListener("mousemove", e => {
    const pos = getMousePos(e);
    if (isPanning) {
        offsetX = e.clientX - panStartX;
        offsetY = e.clientY - panStartY;
        updateTransform();
        return;
    }
    if (isDraggingElement && selectedElement) {
        const dx = pos.x - dragStartX;
        const dy = pos.y - dragStartY;
        selectedElement.points.forEach(p => { p.x += dx; p.y += dy; });
        if (selectedElement.type === "circle") {
            selectedElement.center = { x: selectedElement.center.x + dx, y: selectedElement.center.y + dy };
        }
        dragStartX = pos.x;
        dragStartY = pos.y;
        renderAllElements();
        return;
    }
    if (draggedUnit) {
        const p = getMousePos(e);
        draggedUnit.style.left = (p.x - 16) + "px";
        draggedUnit.style.top = (p.y - 16) + "px";
        return;
    }
    if (tool === "ping" && drawing) updatePing(pos.x, pos.y);
    if (drawing && (tool === "line" || tool === "circle" || tool === "ruler")) {
        redrawFromHistory();
        drawPreview(pos.x, pos.y);
    }
    if (!isDraggingElement && !isPanning && !draggedUnit) {
        const hoveredElement = getElementAtPosition(pos.x, pos.y);
        draw.style.cursor = hoveredElement ? "move" : "crosshair";
    }
});

// Mouse up
draw.addEventListener("mouseup", e => {
    if (e.button === 2) { isPanning = false; board.style.cursor = "crosshair"; return; }
    if (e.button !== 0) return;
    if (isDraggingElement) { isDraggingElement = false; save(); return; }
    if (tool === "ping") { stopPing(); return; }
    if (!drawing) return;
    drawing = false;
    const pos = getMousePos(e);
    let x = pos.x, y = pos.y;
    save();
    const strokeHex = getColorHex(color);
    ctx.strokeStyle = strokeHex;
    ctx.fillStyle = getColorWithAlpha(color, 0.2);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    if (tool === "line") {
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(x, y); ctx.stroke();
        if (showArrow) drawArrowhead(startX, startY, x, y, strokeHex);
        drawnElements.push({ id: ++elementIdCounter, type: "line", points: [{x: startX, y: startY}, {x: x, y: y}], color: color, showArrow: showArrow });
    }
    if (tool === "ruler") {
        const distPx = Math.hypot(x - startX, y - startY);
        const rulerEl = { id: ++elementIdCounter, type: "ruler", points: [{x: startX, y: startY}, {x: x, y: y}], distance: Math.round(distPx / pixelsPerMeter), color: "white" };
        drawnElements.push(rulerEl);
        renderAllElements();
        setTimeout(() => {
            drawnElements = drawnElements.filter(e => e !== rulerEl);
            renderAllElements();
        }, 1500);
    }
    if (tool === "circle") {
        let r = Math.hypot(x - startX, y - startY);
        ctx.beginPath(); ctx.arc(startX, startY, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        drawnElements.push({ id: ++elementIdCounter, type: "circle", points: [{x: startX, y: startY}], radius: r, center: {x: startX, y: startY}, color: color });
    }
});

draw.addEventListener("contextmenu", e => e.preventDefault());

document.addEventListener("mousemove", e => {
    if (draggedUnit) {
        const p = getMousePos(e);
        draggedUnit.style.left = (p.x - 16) + "px";
        draggedUnit.style.top = (p.y - 16) + "px";
    }
});

document.addEventListener("mouseup", () => {
    isPanning = false;
    if (tool === "ping") stopPing();
    if (draggedUnit) save();
    board.style.cursor = "crosshair";
    draggedUnit = null;
    isDraggingElement = false;
});

// Zoom
board.addEventListener("wheel", e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * delta, minScale), 4);
    const rect = canvasContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    offsetX = mouseX - (mouseX - offsetX) * (newScale / scale);
    offsetY = mouseY - (mouseY - offsetY) * (newScale / scale);
    scale = newScale;
    updateTransform();
}, { passive: false });

function updateTransform() {
    board.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

// Ping
let pingInterval = null;
let pingCurrentX = 0;
let pingCurrentY = 0;
function startPing(x, y) {
    drawing = true;
    pingCurrentX = x;
    pingCurrentY = y;
    createPing(x, y);
    pingInterval = setInterval(() => { createPing(pingCurrentX, pingCurrentY); }, 40);
}
function updatePing(x, y) { pingCurrentX = x; pingCurrentY = y; }
function stopPing() {
    drawing = false;
    if (pingInterval) { clearInterval(pingInterval); pingInterval = null; }
}
function createPing(x, y) {
    const ping = document.createElement("div");
    ping.className = "ping";
    ping.style.left = x + "px";
    ping.style.top = y + "px";
    ping.style.borderColor = getColorHex(color);
    ping.style.animation = "pulse 0.8s ease-out forwards";
    board.appendChild(ping);
    setTimeout(() => { if (ping.parentNode) ping.remove(); }, 800);
}

// Preview
function drawPreview(x, y) {
    ctx.strokeStyle = getColorHex(color);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    if (tool === "line") {
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(x, y); ctx.stroke();
        if (showArrow) drawArrowheadPreview(startX, startY, x, y);
    }
    if (tool === "circle") {
        let r = Math.hypot(x - startX, y - startY);
        ctx.beginPath(); ctx.arc(startX, startY, r, 0, Math.PI * 2); ctx.stroke();
    }
    if (tool === "ruler") {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(x, y); ctx.stroke();
        ctx.restore();
        const distPx = Math.hypot(x - startX, y - startY);
        const distM = Math.round(distPx / pixelsPerMeter);
        ctx.fillStyle = "white";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(distM + "m", (startX + x) / 2, (startY + y) / 2 - 10);
    }
}

function drawArrowheadPreview(x1, y1, x2, y2) {
    ctx.beginPath();
    let angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 12;
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowSize * Math.cos(angle - 0.4), y2 - arrowSize * Math.sin(angle - 0.4));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowSize * Math.cos(angle + 0.4), y2 - arrowSize * Math.sin(angle + 0.4));
    ctx.stroke();
}

function drawArrowhead(x1, y1, x2, y2, color) {
    let angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 12;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowSize * Math.cos(angle - 0.4), y2 - arrowSize * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - arrowSize * Math.cos(angle + 0.4), y2 - arrowSize * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

// Polygon
function redrawPolygonPreview() {
    renderAllElements();
    if (polygonPoints.length === 0) return;
    const hex = getColorHex(color);
    ctx.strokeStyle = hex;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonPoints.length; i++) ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    ctx.stroke();
    ctx.fillStyle = hex;
    for (let p of polygonPoints) { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); }
}

draw.addEventListener("dblclick", e => {
    if (tool === "polygon" && polygonPoints.length >= 3) {
        e.preventDefault();
        save();
        ctx.strokeStyle = getColorHex(color);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
        for (let p of polygonPoints) ctx.lineTo(p.x, p.y);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        drawnElements.push({ id: ++elementIdCounter, type: "polygon", points: [...polygonPoints], color: color });
        polygonPoints = [];
        renderAllElements();
    }
});

// === UNDO / REDO WITH UNITS ===
function captureUnitsState() {
    return Array.from(unitLayer.querySelectorAll(".unit-container")).map(u => ({
        type: u.dataset.type,
        color: u.dataset.color,
        x: parseFloat(u.style.left) + 16,
        y: parseFloat(u.style.top) + 16
    }));
}

function restoreUnitsState(units) {
    selectedUnit = null;
    unitLayer.innerHTML = "";
    unitIdCounter = 0;
    if (units) units.forEach(u => addUnit(u.type, u.x, u.y, u.color));
}

function save() {
    history.push({
        imageData: ctx.getImageData(0, 0, draw.width, draw.height),
        elements: JSON.parse(JSON.stringify(drawnElements)),
        units: captureUnitsState()
    });
    if (history.length > 50) history.shift();
    redo = [];
}

document.getElementById("undo").onclick = () => {
    if (history.length === 0) return;
    redo.push({
        imageData: ctx.getImageData(0, 0, draw.width, draw.height),
        elements: JSON.parse(JSON.stringify(drawnElements)),
        units: captureUnitsState()
    });
    const lastState = history.pop();
    drawnElements = JSON.parse(JSON.stringify(lastState.elements));
    restoreUnitsState(lastState.units);
    renderAllElements();
};

document.getElementById("redo").onclick = () => {
    if (redo.length === 0) return;
    history.push({
        imageData: ctx.getImageData(0, 0, draw.width, draw.height),
        elements: JSON.parse(JSON.stringify(drawnElements)),
        units: captureUnitsState()
    });
    const redoState = redo.pop();
    drawnElements = JSON.parse(JSON.stringify(redoState.elements));
    restoreUnitsState(redoState.units);
    renderAllElements();
};

document.getElementById("clear").onclick = () => {
    save();
    ctx.clearRect(0, 0, draw.width, draw.height);
    drawnElements = [];
    restoreUnitsState([]);
    renderAllElements();
};

// Grid
function drawGrid() {
    const letters = "ABCDEFGHJKL";
    const cols = 10;
    const rows = 10;
    const w = grid.width / cols;
    const h = grid.height / rows;
    gtx.strokeStyle = "rgba(255,255,255,0.5)";
    gtx.lineWidth = 1;
    gtx.font = "bold 14px sans-serif";
    gtx.fillStyle = "rgba(255,255,255,1.0)";
    for (let i = 0; i <= cols; i++) { gtx.beginPath(); gtx.moveTo(i * w, 0); gtx.lineTo(i * w, grid.height); gtx.stroke(); }
    for (let i = 0; i <= rows; i++) {
        gtx.beginPath(); gtx.moveTo(0, i * h); gtx.lineTo(grid.width, i * h); gtx.stroke();
        if (i < rows && i < letters.length) { gtx.textAlign = "right"; gtx.fillText(letters[i], 15, i * h + h/2); }
    }
    gtx.textAlign = "center";
    for (let i = 1; i <= cols; i++) gtx.fillText(i.toString(), i * w - w/2, 15);
}

// Units
function addUnit(type, x, y, unitColor) {
    const container = document.createElement("div");
    container.className = "unit-container";
    container.style.left = (x - 16) + "px";
    container.style.top = (y - 16) + "px";
    container.dataset.id = ++unitIdCounter;
    container.dataset.type = type;
    container.dataset.color = unitColor;

    const img = document.createElement("img");
    img.className = "unit-icon";
    setUnitIcon(img, type, unitColor);

    container.appendChild(img);
    unitLayer.appendChild(container);

    container.addEventListener("click", e => {
        e.stopPropagation();
        if (tool === "eraser") {
            container.remove();
            selectedUnit = null;
            save();
            return;
        }
        document.querySelectorAll(".unit-container").forEach(u => u.classList.remove("selected"));
        container.classList.add("selected");
        selectedUnit = container;
    });

    img.addEventListener("mousedown", e => {
        if (e.button !== 0) return;
        e.stopPropagation();
        draggedUnit = container;
    });
}



function getColorHex(colorName) {
    const hexMap = { red: '#e05050', green: '#50b050', blue: '#5080cc', yellow: '#d0b040', orange: '#d08040', purple: '#9060b0', white: '#ffffff', black: '#000000' };
    return hexMap[colorName] || '#ff0000';
}


draw.addEventListener("click", e => {
    if (e.target === draw) {
        document.querySelectorAll(".unit-container").forEach(u => u.classList.remove("selected"));
        selectedUnit = null;
    }
});

document.addEventListener("keydown", e => {
    if (e.key === "Delete" && selectedElement) {
        drawnElements = drawnElements.filter(el => el !== selectedElement);
        selectedElement = null;
        renderAllElements();
        save();
    }
    if (e.key === "Delete" && selectedUnit) {
        selectedUnit.remove();
        selectedUnit = null;
        save();
    }
});

// Export
document.getElementById("export").onclick = () => {
    const temp = document.createElement("canvas");
    temp.width = draw.width;
    temp.height = draw.height;
    const tctx = temp.getContext("2d");
    tctx.drawImage(map, 0, 0);
    renderAllElements();
    tctx.drawImage(draw, 0, 0);
    const link = document.createElement("a");
    link.download = "tactics-plan.png";
    link.href = temp.toDataURL("image/png");
    link.click();
};

// Save
document.getElementById("save").onclick = () => {
    const data = {
        tool, color, scale, offsetX, offsetY,
        width: draw.width, height: draw.height,
        mapPath: currentMapPath, mapWidthKm: currentMapWidthKm, mapHeightKm: currentMapHeightKm,
        drawnElements: drawnElements,
        units: Array.from(unitLayer.querySelectorAll(".unit-container")).map(u => ({
            type: u.dataset.type, color: u.dataset.color,
            x: parseFloat(u.style.left) + 16, y: parseFloat(u.style.top) + 16
        })),
        timestamp: Date.now()
    };
    const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
    const link = document.createElement("a");
    link.download = "tactics-plan.json";
    link.href = URL.createObjectURL(blob);
    link.click();
};

// Load
document.getElementById("load").onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            const data = JSON.parse(event.target.result);
            loadData(data);
        };
        reader.readAsText(file);
    };
    input.click();
};

function loadData(data) {
    function restore(data) {
        scale = data.scale || 1;
        offsetX = data.offsetX || 0;
        offsetY = data.offsetY || 0;
        color = data.color || "red";
        tool = data.tool || "ping";
        drawnElements = data.drawnElements || [];
        renderAllElements();
        restoreUnitsState(data.units);
        updateTransform();
    }
    if (data.mapPath && data.mapPath !== currentMapPath) {
        history = [];
        redo = [];
        drawnElements = [];
        polygonPoints = [];
        unitLayer.innerHTML = "";
        unitIdCounter = 0;
        selectedElement = null;
        selectedUnit = null;
        currentMapPath = data.mapPath;
        currentMapWidthKm = data.mapWidthKm || 1;
        currentMapHeightKm = data.mapHeightKm || 1;
        map.onload = () => {
            draw.width = map.naturalWidth;
            draw.height = map.naturalHeight;
            grid.width = map.naturalWidth;
            grid.height = map.naturalHeight;
            unitLayer.style.width = map.naturalWidth + "px";
            unitLayer.style.height = map.naturalHeight + "px";
            pixelsPerMeter = map.naturalWidth / (currentMapWidthKm * 1000);
            centerMap();
            drawGrid();
            restore(data);
        };
        map.src = data.mapPath;
    } else {
        restore(data);
    }
}

function setUnitIcon(img, type, colorName) {
    const satHex = { red: '#ff4444', green: '#44d444', blue: '#4488ff', yellow: '#ffdd44', orange: '#ff8844', purple: '#bb66ff' };
    const hex = colorName.startsWith('#') ? colorName : (satHex[colorName] || '#ffffff');
    fetch(`units/${type}.svg`)
        .then(r => r.text())
        .then(svg => {
            let s = svg.replace(/fill="[^"]*"/g, `fill="${hex}"`);
            s = s.replace(/(fill:)#[A-Fa-f0-9]+/g, `$1${hex}`);
            img.src = 'data:image/svg+xml,' + encodeURIComponent(s);
        })
        .catch(() => {});
}

function getColorWithAlpha(color, alpha) {
    const colorMap = { red: '224, 80, 80', green: '80, 176, 80', blue: '80, 128, 204', yellow: '208, 176, 64', orange: '208, 128, 64', purple: '144, 96, 176', white: '255, 255, 255', black: '0, 0, 0' };
    let rgb = colorMap[color.toLowerCase()];
    if (!rgb && color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        rgb = `${r}, ${g}, ${b}`;
    }
    if (!rgb) rgb = '255, 0, 0';
    return `rgba(${rgb}, ${alpha})`;
}
