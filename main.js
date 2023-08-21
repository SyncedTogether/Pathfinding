let cnv = document.getElementById("maincanvas");
let ctx = cnv.getContext("2d");

let cellSize = 10;
let cols = cnv.width / cellSize;
let rows = cnv.height / cellSize;
let grid;
let isMousePressed = false;
let currentRadius = 0.5;
let mouseX, mouseY;
const EditType = {
    CREATE: 'create',
    DESTROY: 'destroy',
    START_POINT: 'startPoint',
    END_POINT: 'endPoint'
};

let currentEditType = EditType.CREATE;

cnv.addEventListener('mousemove', handleMouseMove);

cnv.addEventListener('mousedown', (event) => {
    isMousePressed = true;
    toggleCellsInRadius();
});

cnv.addEventListener('mouseup', () => {
    isMousePressed = false;
});


function handleMouseMove(event) {
    updateMousePosition(event);
    if (isMousePressed) {
        toggleCellsInRadius();
    }
}

// cell class
class Cell {
    constructor(x, y, state) {
        this.x = x * cellSize;
        this.y = y * cellSize;
        this.active = state;
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
    drawPreview();
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
                ctx.fillStyle = "black";
            } else {
                ctx.fillStyle = "white";
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
                if (currentEditType === EditType.CREATE) {
                    grid[i][j].active = true;
                } else if (currentEditType === EditType.DESTROY) {
                    grid[i][j].active = false;
                }
            }
        }
    }
}