let cnv = document.getElementById("maincanvas");
let ctx = cnv.getContext("2d");
let radiusSlider = document.getElementById("influenceRadius");
let createOrDestroySwitch = document.getElementById("CreateOrDestroy");
let setStartPointButton = document.getElementById("SetStartPoint");
let randomStartPointButton = document.getElementById("RandomStartPoint");
let setEndPointButton = document.getElementById("SetEndPoint");
let randomEndPointButton = document.getElementById("RandomEndPoint");

let cellSize = 10;
let cols = cnv.width / cellSize;
let rows = cnv.height / cellSize;
let grid;
let walls = [];
let isMousePressed = false;
let currentRadius = 0.5;
let mouseX, mouseY;
const EditType = {
    CREATE: 'create',
    DESTROY: 'destroy',
    START_POINT: 'startPoint',
    END_POINT: 'endPoint'
};
let startPoint = null;
let endPoint = null;

let currentEditType = EditType.CREATE;

radiusSlider.addEventListener('input', () => {
    currentRadius = radiusSlider.value;
});

cnv.addEventListener('mousemove', handleMouseMove);

cnv.addEventListener('mousedown', (event) => {
    isMousePressed = true;
    toggleCellsInRadius();
});

cnv.addEventListener('mouseup', () => {
    isMousePressed = false;
});

function resetButtons() {
    setStartPointButton.textContent = "Set Start Point";
    randomStartPointButton.textContent = "Random Start Point";
    setEndPointButton.textContent = "Set End Point";
    randomEndPointButton.textContent = "Random End Point";

    setStartPointButton.disabled = false;
    randomStartPointButton.disabled = false;
    setEndPointButton.disabled = false;
    randomEndPointButton.disabled = false;
    createOrDestroySwitch.disabled = false;
}

function checkEditStatus() {
    return createOrDestroySwitch.checked;
}

function setEditType() {
    if (checkEditStatus()) {
        currentEditType = EditType.DESTROY;
    } else {
        currentEditType = EditType.CREATE;
    }
}

createOrDestroySwitch.addEventListener('change', () => {
    setEditType();
});


setStartPointButton.addEventListener('click', () => {
    if (setStartPointButton.textContent === "Cancel") {
        resetButtons();
        setEditType();
    } else {
        setStartPointButton.textContent = "Cancel";
        randomStartPointButton.disabled = true;
        setEndPointButton.disabled = true;
        randomEndPointButton.disabled = true;
        createOrDestroySwitch.disabled = true;
        currentEditType = EditType.START_POINT;
    }
});


setEndPointButton.addEventListener('click', () => {
    if (setEndPointButton.textContent === "Cancel") {
        resetButtons();
        setEditType();
    } else {
        setEndPointButton.textContent = "Cancel";
        setStartPointButton.disabled = true;
        randomStartPointButton.disabled = true;
        randomEndPointButton.disabled = true;
        createOrDestroySwitch.disabled = true;
        currentEditType = EditType.END_POINT;
    }
});

randomStartPointButton.addEventListener('click', () => {
    randomizeStartPoint();
});

randomEndPointButton.addEventListener('click', () => {
    randomizeEndPoint();
});

function handleMouseMove(event) {
    updateMousePosition(event);
    if (isMousePressed) {
        toggleCellsInRadius();
    }
}


class Cell {
    constructor(x, y, state) {
        this.x = x * cellSize;
        this.y = y * cellSize;
        this.active = state;
        this.startPoint = false;
        this.endPoint = false;
    }
}

class Node {
    constructor(x, y, parent, g, h) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.g = g;
        this.h = h;
        this.f = g + h;
    }
}

init();

function init() {
    createGrid();
    animate();
}

function animate() {
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    drawGrid();
    switch (currentEditType) {
        case EditType.CREATE:
            drawPreview();
            break;
        case EditType.DESTROY:
            drawPreview();
            break;
        case EditType.START_POINT:
            previewStartPoint();
            break;
        case EditType.END_POINT:
            previewEndPoint();
            break;
    }

    if (startPoint && endPoint) {
        let path = findPathAStar();
        drawPath(path);
    }

    requestAnimationFrame(animate);
}

function createGrid() {
    grid = [];
    for (let i = 0; i < cols; i++) {
        let row = [];
        for (let j = 0; j < rows; j++) {
            row.push(new Cell(i, j, false));
        }
        grid.push(row);
    }
}


function drawGrid() {
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
            if (grid[i][j].active) {
                ctx.fillStyle = "#5A5A5A";
            } else {
                ctx.fillStyle = "white";
            }
            if (grid[i][j].startPoint) {
                ctx.fillStyle = "green";
            } else if (grid[i][j].endPoint) {
                ctx.fillStyle = "red";
            }

            ctx.fillRect(grid[i][j].x, grid[i][j].y, cellSize, cellSize);
        }
    }
    drawGridLines();
}

function drawGridLines() {
    for (let i = 0; i < cnv.width; i += cellSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, cnv.height);
        ctx.stroke();
    }

    for (let i = 0; i < cnv.height; i += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(cnv.width, i);
        ctx.stroke();
    }
}

function drawPreview() {
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(mouseX + 2, mouseY + 5, currentRadius * cellSize, 0, 2 * Math.PI);
    ctx.stroke();
}

function previewStartPoint() {
    let cellUnderMouse = findCellUnderMouse();
    if (cellUnderMouse) {
        ctx.fillStyle = "lightgreen";
        ctx.fillRect(cellUnderMouse.x, cellUnderMouse.y, cellSize, cellSize);
    }
}

function previewEndPoint() {
    let cellUnderMouse = findCellUnderMouse();
    if (cellUnderMouse) {
        ctx.fillStyle = "#FF7276";
        ctx.fillRect(cellUnderMouse.x, cellUnderMouse.y, cellSize, cellSize);
    }
}

function findCellUnderMouse() {
    let colIndex = Math.floor(mouseX / cellSize);
    let rowIndex = Math.floor(mouseY / cellSize);

    if (colIndex >= 0 && colIndex < cols && rowIndex >= 0 && rowIndex < rows) {
        return grid[colIndex][rowIndex];
    } else {
        return null;
    }
}

function updateMousePosition(event) {
    let rect = cnv.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
}

function handleMouseMove(event) {
    updateMousePosition(event);
    if (isMousePressed) {
        toggleCellsInRadius();
    }
}

function toggleCellsInRadius() {
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let distance = Math.sqrt((i * cellSize - mouseX) ** 2 + (j * cellSize - mouseY) ** 2);
            if (distance <= currentRadius * cellSize) {
                switch (currentEditType) {
                    case EditType.CREATE:
                        if (!grid[i][j].startPoint && !grid[i][j].endPoint) {
                            grid[i][j].active = true;
                            walls.push(grid[i][j]);
                        }
                        break;
                    case EditType.DESTROY:
                        if (!grid[i][j].startPoint && !grid[i][j].endPoint) {
                            grid[i][j].active = false;
                            walls.splice(walls.indexOf(grid[i][j]), 1);
                        }
                        break;
                    case EditType.START_POINT:
                        setStartPoint();
                        break;
                    case EditType.END_POINT:
                        setEndPoint();
                        break;
                }
            }
        }
    }
}

function setStartPoint() {
    let cellUnderMouse = findCellUnderMouse();
    if (cellUnderMouse) {
        if (startPoint) {
            startPoint.startPoint = false;
        }
        startPoint = cellUnderMouse;
        startPoint.startPoint = true;
    }
    resetButtons();
    setEditType();
}

function setEndPoint() {
    let cellUnderMouse = findCellUnderMouse();
    if (cellUnderMouse) {
        if (endPoint) {
            endPoint.endPoint = false;
        }
        endPoint = cellUnderMouse;
        endPoint.endPoint = true;
    }
    resetButtons();
    setEditType();
}

function randomizeStartPoint() {
    if (startPoint) {
        startPoint.startPoint = false;
    }
    let randomX = Math.floor(Math.random() * cols);
    let randomY = Math.floor(Math.random() * rows);
    startPoint = grid[randomX][randomY];
    startPoint.startPoint = true;
    startPoint.active = false;
}

function randomizeEndPoint() {
    if (endPoint) {
        endPoint.endPoint = false;
    }
    let randomX = Math.floor(Math.random() * cols);
    let randomY = Math.floor(Math.random() * rows);
    endPoint = grid[randomX][randomY];
    endPoint.endPoint = true;
    endPoint.active = false;
}

function findPathAStar() {
    let openList = [];
    let closedList = [];

    let startNode = new Node(startPoint.x, startPoint.y, null, 0, heuristic(startPoint, endPoint));
    openList.push(startNode);

    while (openList.length > 0) {
        openList.sort((a, b) => a.f - b.f);
        let currentNode = openList.shift();
        closedList.push(currentNode);

        if (currentNode.x === endPoint.x && currentNode.y === endPoint.y) {
            return reconstructPath(currentNode);
        }

        let neighbors = getNeighbors(currentNode);
        for (let neighbor of neighbors) {
            if (closedList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                continue;
            }

            let g = currentNode.g + 1;
            let h = heuristic(neighbor, endPoint);
            let f = g + h;

            let existingNode = openList.find(node => node.x === neighbor.x && node.y === neighbor.y);
            if (!existingNode || f < existingNode.f) {
                if (existingNode) {
                    openList.splice(openList.indexOf(existingNode), 1);
                }
                openList.push(new Node(neighbor.x, neighbor.y, currentNode, g, h));
            }
        }
    }

    return [];
}

function heuristic(nodeA, nodeB) {
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
}

function getNeighbors(node) {
    let neighbors = [];
    let colIndex = Math.floor(node.x / cellSize);
    let rowIndex = Math.floor(node.y / cellSize);

    if (colIndex > 0) neighbors.push(grid[colIndex - 1][rowIndex]);
    if (colIndex < cols - 1) neighbors.push(grid[colIndex + 1][rowIndex]);
    if (rowIndex > 0) neighbors.push(grid[colIndex][rowIndex - 1]);
    if (rowIndex < rows - 1) neighbors.push(grid[colIndex][rowIndex + 1]);

    return neighbors.filter(neighbor => neighbor && !walls.includes(neighbor));
}

function reconstructPath(node) {
    let path = [];
    while (node !== null) {
        path.unshift(node);
        node = node.parent;
    }
    return path;
}

function drawPath(path) {
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 1; i < path.length; i++) {
        let startX = path[i - 1].x * cellSize + cellSize / 2;
        let startY = path[i - 1].y * cellSize + cellSize / 2;
        let endX = path[i].x * cellSize + cellSize / 2;
        let endY = path[i].y * cellSize + cellSize / 2;
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
    }
    ctx.stroke();
}
