// ===== TILE =====
const tileSize = 15;

// ===== CANVAS =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 675; // 45 * 15
canvas.height = 750; // 50 * 15

const audioctx = new (window.AudioContext || window.webkitAudioContext)();

// GAME OVER zvuk
const audio = new Audio("mp3/gameover.mp3");
const source = audioctx.createMediaElementSource(audio);
const gainNode = audioctx.createGain();
gainNode.gain.value = 5; // volume

source.connect(gainNode);
gainNode.connect(audioctx.destination);

// EAT zvuk
const eatAudio = new Audio("mp3/eat.mp3");
const eatSource = audioctx.createMediaElementSource(eatAudio);
const eatGain = audioctx.createGain();
eatGain.gain.value = 10; // volume

eatSource.connect(eatGain);
eatGain.connect(audioctx.destination);

// ===== PACMAN =====
let pac = {
    x: 22 * tileSize + tileSize / 2,
    y: 37.5 * tileSize + tileSize / 2,
    size: 13,
    speed: 3.5,
    dirX: 0,
    dirY: 0,
    nextDirX: 0,
    nextDirY: 0
};

// ===== GHOSTS =====
// Všichni uprostřed dlaždice – X,Y = tile*index + tileSize/2
let ghosts = [
    {
        x: 22 * tileSize + tileSize / 2,
        y: 22 * tileSize + tileSize / 2,
        size: 11,
        speed: 2.85,
        dirX: 0,
        dirY: -1,
        color: "red",
        state: "waiting",     // čeká
        name: "blinky"
    },
    {
        x: 22 * tileSize + tileSize / 2,
        y: 24 * tileSize + tileSize / 2,
        size: 11,
        speed: 2.85,
        dirX: 0,
        dirY: -1,
        color: "#0ef3ff",
        state: "waiting",     // čeká
        name: "pinky"
    },
    {
        x: 20 * tileSize + tileSize / 2,
        y: 24 * tileSize + tileSize / 2,
        size: 11,
        speed: 2.85,
        dirX: 0,
        dirY: -1,
        color: "blue",
        state: "waiting", // čeká
        name: "inky"
    },
    {
        x: 24 * tileSize + tileSize / 2,
        y: 24 * tileSize + tileSize / 2,
        size: 11,
        speed: 2.85,
        dirX: 0,
        dirY: -1,
        color: "yellow",
        state: "waiting", // čeká
        name: "clyde"
    }
];

let frightMode = false;
let frightTimer = 0;
let gameOver = false;
let gameRunning = false;
let soundPlayed = false;
let pacAngle = 0;
let mouth = 0.2;
let mouthSpeed = 0.05;
let score = 0;
const walls = [];

// 🔴 jen červený duch jede
let activeGhosts = ["red"];


// ===== MAPA =====
const mapData = [
    "#############################################",
    "#0 . . . . . . . . . # #. . . . . . . . . 0 #",
    "#                    # #                    #",
    "#. ######. ########. # #. ########. ######. #",
    "#  #    #  #      #  # #  #      #  #    #  #",
    "#. #    #. #      #. # #. #      #. #    #. #",
    "#  #    #  #      #  # #  #      #  #    #  #",
    "#. ######. ########. ###. ########. ######. #",
    "#  . . .   . . . .   .    .  .  .   . . .   #",
    "#.       .                        .       . #",
    "#  ######  ###  #############  ###  ######  #",
    "#. #    #. # #  #           #. # #. #    #. #",
    "#  ######  # #  ###### ######  # #  ######  #",
    "#. . . . . # # . . . # #. . .  # #. . . . . #",
    "#          # #       # #       # #          #",
    "#########. # ######. # #. ###### #. #########",
    "        #  #      #  # #  #      #  #        ",
    "        #. # ######  ###  ###### #. #        ",
    "        #  # #. .  .  . . .  . # #  #        ",
    "        #. # #                 # #. #        ",
    "        #  # #. #####   #####  # #  #        ",
    "        #. # #  #           #. # #. #        ",
    "#########  ###  #           #  ###  #########",
    "  . . .  .  . . #           #. .  .  . . .   ",
    "                #           #                ",
    "#########. ###  #           #. ###. #########",
    "        #  # #. #############  # #  #        ",
    "        #. # #   .  .  .  .  . # #. #        ",
    "        #  # #                 # #  #        ",
    "        #. # #. #############. # #. #        ",
    "        #  # #  #           #  # #  #        ",
    "#########. ###  ###### ######. ###. #########",
    "#.  . .     . . . .  # #.  .   .     . .  . #",
    "#        .           # #          .         #",
    "#  ######  ########. # #. ########  ######  #",
    "#. #    #. #      #  # #  #      #. #    #. #",
    "#  #### #  ########  ###  ########  # ####  #",
    "#.  . # #. . . . . .    . . . . . . # #.  . #",
    "#     # #                           # #     #",
    "####. # #. ###  #############  ###  # #. ####",
    "   #  # #  # #. #           #. # #. # #  #   ",
    "####  ###  # #  #####  ######  # #  ###  ####",
    "#. . . . . # #. .   #  #   . . # #. . . . . #",
    "#          # #    . #  #.      # #          #",
    "#  ######### #####  #  #  ###### #########  #",
    "#. #             #. #  #. #              #. #",
    "#  ###############  ####  ################  #",
    "#0  .  .  .  .  .  .  .  .  .  .  .  . .  0 #",
    "#                                           #",
    "#############################################"
];

// ===== Grid movement check =====
function atCenter() {
    return (
        Math.abs(pac.x - Math.round(pac.x / tileSize) * tileSize) < 4.6 &&
        Math.abs(pac.y - Math.round(pac.y / tileSize) * tileSize) < 4.6
    );
}

function nearestPacLane(value) {
    const lane = tileSize / 2;
    return Math.round(value / lane) * lane;
}

function tryPacmanTurn() {
    if (pac.nextDirX === 0 && pac.nextDirY === 0) return;

    let alignedX = pac.x;
    let alignedY = pac.y;

    if (pac.nextDirX !== 0) {
        alignedY = nearestPacLane(pac.y);
        if (Math.abs(pac.y - alignedY) > pac.speed) return;
    }

    if (pac.nextDirY !== 0) {
        alignedX = nearestPacLane(pac.x);
        if (Math.abs(pac.x - alignedX) > pac.speed) return;
    }

    let tryX = alignedX + pac.nextDirX * pac.speed;
    let tryY = alignedY + pac.nextDirY * pac.speed;

    if (!isColliding(tryX, tryY)) {
        pac.x = alignedX;
        pac.y = alignedY;
        pac.dirX = pac.nextDirX;
        pac.dirY = pac.nextDirY;
    }
}

// ===== KOLIZE PAC-MAN =====
function isColliding(newX, newY) {
    const left = newX - pac.size;
    const right = newX + pac.size;
    const top = newY - pac.size;
    const bottom = newY + pac.size;

    for (let w of walls) {
        if (right > w.x && left < w.x + w.w && bottom > w.y && top < w.y + w.h) {
            return true;
        }
    }
    return false;
}

// ===== KOLIZE GHOST =====
function isGhostColliding(g, newX, newY) {
    const hit = g.size * 1.2;
    const left = newX - hit;
    const right = newX + hit;
    const top = newY - hit;
    const bottom = newY + hit;

    for (let w of walls) {
        if (right > w.x && left < w.x + w.w && bottom > w.y && top < w.y + w.h) {
            return true;
        }
    }
    return false;
}

// napověda Kolize Ghost RED
function debugGhostHitbox(g) {
    const hit = g.size * 1.2;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "purple";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(g.x - hit, g.y - hit, hit * 2, hit * 2);
    ctx.stroke();
    ctx.restore();
}

// zákazaní otočení zpět
function isReverse(g, d) {
    return (g.dirX === -d.x && g.dirY === -d.y);
}

// core AI


// ===== POHYB kolize PAC-MANA =====
function movePacman() {

    tryPacmanTurn();

    // pohyb
    let newX = pac.x + pac.dirX * pac.speed;
    let newY = pac.y + pac.dirY * pac.speed;

    if (!isColliding(newX, newY)) {
        pac.x = newX;
        pac.y = newY;
    } else {
        pac.x = nearestPacLane(pac.x);
        pac.y = nearestPacLane(pac.y);
    }

    // 🔥 SPRÁVNÉ OTÁČENÍ
    if (pac.dirX === 1) pacAngle = 0;
    else if (pac.dirX === -1) pacAngle = Math.PI;
    else if (pac.dirY === -1) pacAngle = -Math.PI / 2;
    else if (pac.dirY === 1) pacAngle = Math.PI / 2;
}

function snapToGrid(g) {
    g.x = Math.round(g.x / tileSize) * tileSize;
    g.y = Math.round(g.y / tileSize) * tileSize;
}

function atGhostGrid(g) {
    const tolerance = 1.6;

    return (
        Math.abs(g.x - Math.round(g.x / tileSize) * tileSize) <= tolerance &&
        Math.abs(g.y - Math.round(g.y / tileSize) * tileSize) <= tolerance
    );
}

function getRemainingPellets() {
    return pellets.filter(p => !p.eaten).length;
}

function updateGhostChaseSpeed(g) {
    if (g.baseSpeed === undefined) {
        g.baseSpeed = g.speed;
    }

    if (g.name !== "blinky") return;

    const totalPellets = pellets.length || 1;
    const eatenRatio = (totalPellets - getRemainingPellets()) / totalPellets;

    if (eatenRatio > 0.65) {
        g.speed = g.baseSpeed + 0.6;
    } else if (eatenRatio > 0.4) {
        g.speed = g.baseSpeed + 0.3;
    } else {
        g.speed = g.baseSpeed;
    }
}

function getValidGhostDirs(g, allowReverse = false) {
    const dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    let valid = [];

    for (let d of dirs) {
        if (!allowReverse && isReverse(g, d)) continue;
        if (g.blockHouseReturn && d.y === 1 && isGhostNearHouseExit(g)) continue;

        let tx = g.x + d.x * g.speed;
        let ty = g.y + d.y * g.speed;

        if (!isGhostColliding(g, tx, ty)) {
            valid.push(d);
        }
    }

    if (valid.length === 0 && !allowReverse) {
        return getValidGhostDirs(g, true);
    }

    return valid;
}

function isGhostNearHouseExit(g) {
    return (
        g.x > 18 * tileSize &&
        g.x < 26 * tileSize &&
        g.y > 16 * tileSize &&
        g.y < 22 * tileSize
    );
}

function shouldGhostChooseDirection(g, valid) {
    if (g.dirX === 0 && g.dirY === 0) return true;

    const forwardOpen = valid.some(d => d.x === g.dirX && d.y === g.dirY);
    if (!forwardOpen) return true;

    return valid.some(d => d.x !== g.dirX || d.y !== g.dirY);
}

// Vzor pohybu pro červeného ducha (red ghost AI)
const pettern = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: 0 },
    { x: 0, y: 1 }
];

function scriptAI(g) {
    if (g.stepIndex === undefined) g.stepIndex = 0;
    if (g.stepCount === undefined) g.stepCount = 0;

    let dir = pettern[g.stepIndex];

    g.x += dir.x * g.speed;
    g.y += dir.y * g.speed;

    g.stepCount++;

    const stepLimit = 1; // rychlost změny směru - vyšší = pomalejší změna

    if (g.stepCount >= stepLimit) {
        g.stepCount = 0;
        g.stepIndex = (g.stepIndex + 1) % pettern.length;
    }
}

// ===== POHYB DUCHŮ (GHOST) =====
function moveGhost(g) {

    // ===== NORMAL AI =====
    if (g.state === "waiting") return;

    if (g.state === "leaving") { // nezměnilo proměnné
        g.dirX = 1;

        const gateX = 22 * tileSize;
        const exitY = 19 * tileSize;

        if (Math.abs(g.x - gateX) > g.speed) {
            g.x += Math.sign(gateX - g.x) * g.speed;
            return;
        }

        g.x = gateX;

        if (g.y > exitY) {
            g.y = Math.max(exitY, g.y - g.speed);
            return;
        }

        g.y = exitY;
        g.state = "chasing";
        g.blockHouseReturn = true;
        g.dirX = 1;
        g.dirY = 0;

        return;
    }

    if (g.state === "chasing") {
        updateGhostChaseSpeed(g);

        if (g.blockHouseReturn && !isGhostNearHouseExit(g)) {
            g.blockHouseReturn = false;
        }

        if (atGhostGrid(g)) {
            snapToGrid(g);

            let valid = getValidGhostDirs(g, frightMode);

            if (valid.length > 0 && shouldGhostChooseDirection(g, valid)) {
                const target = getPersonalityTarget(g);
                const best = frightMode
                    ? getFarthestFromValid(g, valid, pac.x, pac.y)
                    : getBestFromValid(g, valid, target.x, target.y);

                if (best) {
                    g.dirX = best.x;
                    g.dirY = best.y;
                }
            }
        }

        let nx = g.x + g.dirX * g.speed;
        let ny = g.y + g.dirY * g.speed;

        if (!isGhostColliding(g, nx, ny)) {
            g.x = nx;
            g.y = ny;
            return;
        }

        const valid = getValidGhostDirs(g, true);
        if (valid.length === 0) return;

        const target = getPersonalityTarget(g);
        const best = frightMode
            ? getFarthestFromValid(g, valid, pac.x, pac.y)
            : getBestFromValid(g, valid, target.x, target.y);

        if (best) {
            g.dirX = best.x;
            g.dirY = best.y;

            nx = g.x + g.dirX * g.speed;
            ny = g.y + g.dirY * g.speed;
for (let row = 0; row < mapData.length; row++) {
    for (let col = 0; col < mapData[row].length; col++) {
        let x = col * tileSize;
        let y = row * tileSize;

        if (mapData[row][col] === "#") {
            walls.push({ x, y, w: tileSize, h: tileSize });
        } else if (mapData[row][col] === ".") {
            pellets.push({
                x: x + tileSize / 1,
                y: y + tileSize / 1,
                eaten: false,
                power: false
            });
        }
        else if (mapData[row][col] === "0") {
            pellets.push({
                x: x + tileSize / 1,
                y: y + tileSize / 1,
                eaten: false,
                power: true
            });
        }
    }
}
            if (!isGhostColliding(g, nx, ny)) {
                g.x = nx;
                g.y = ny;
            }
        }

    }

}

function makeGhostsRunAway() {
    for (let g of ghosts) {
        if (g.state !== "chasing") continue;

        const valid = getValidGhostDirs(g, true);
        const best = getFarthestFromValid(g, valid, pac.x, pac.y);

        if (best) {
            g.dirX = best.x;
            g.dirY = best.y;
        }
    }
}

function getGhostHomePosition(g) {
    if (g.name === "inky") {
        return { x: 20 * tileSize + tileSize / 2, y: 24 * tileSize + tileSize / 2 };
    }

    if (g.name === "clyde") {
        return { x: 24 * tileSize + tileSize / 2, y: 24 * tileSize + tileSize / 2 };
    }

    if (g.name === "pinky") {
        return { x: 22 * tileSize + tileSize / 2, y: 24 * tileSize + tileSize / 2 };
    }

    return { x: 22 * tileSize + tileSize / 2, y: 22 * tileSize + tileSize / 2 };
}

function respawnGhostInHouse(g) {
    const home = getGhostHomePosition(g);

    g.x = home.x;
    g.y = home.y;
    g.dirX = 0;
    g.dirY = -1;
    g.state = "leaving";
    g.blockHouseReturn = false;
}

function eatGhost(g) {
    score += 10;
    respawnGhostInHouse(g);
    drawScore();

    eatAudio.currentTime = 0;
    eatAudio.play().catch(e => console.log("eat ghost zvuk blokovan", e));
}

function getFarthestFromValid(g, valid, targetX, targetY) {
    let best = null;
    let bestDist = -Infinity;

    for (let d of valid) {
        let tx = g.x + d.x * tileSize;
        let ty = g.y + d.y * tileSize;
        let dist = Math.hypot(targetX - tx, targetY - ty);

        if (dist > bestDist) {
            bestDist = dist;
            best = d;
        }
    }

    return best;
}


function getBestFromValid(g, valid, targetX, targetY) {

    // 👻 PERSONALITY AI OVERRIDE – použij osobnostní cíl pokud existuje
    if (g && g._personalityTarget) {
        targetX = g._personalityTarget.x;
        targetY = g._personalityTarget.y;
    }

    let best = null;
    let bestDist = Infinity;

    for (let d of valid) {

        let tx = g.x + d.x * tileSize;
        let ty = g.y + d.y * tileSize;

        let dist = Math.hypot(targetX - tx, targetY - ty);

        if (dist < bestDist) {
            bestDist = dist;
            best = d;
        }
    }

    return best;
}

// zakazat 0,0 směr aby ghosts nezasekul se domečku
function safeSign(v) {
    if (v > 0) return 1;
    if (v < 0) return -1;
    return 0;
}


function releaseGhost() {
    ghosts.forEach((g, i) => {
        setTimeout(() => {
            if (g.state === "waiting") {
                g.state = "leaving";
            }
        }, i * 1000);
    });
}

function startCountdown() {
    console.log("START GAME");
    gameRunning = true;
    let cd = document.getElementById("countdown");
    cd.style.display = "block";

    let numbers = ["3", "2", "1", "GO!"];
    let i = 0;

    let interval = setInterval(() => {
        cd.innerText = numbers[i];
        i++;

        if (i === numbers.length) {
            clearInterval(interval);
            setTimeout(() => {
                cd.style.display = "none";
                releaseGhost();
            }, 800);
        }
    }, 1000);
}


// ===== PELLETS =====
const pellets = [];

for (let row = 0; row < mapData.length; row++) {
    for (let col = 0; col < mapData[row].length; col++) {
        let x = col * tileSize;
        let y = row * tileSize;

        if (mapData[row][col] === "#") {
            walls.push({ x, y, w: tileSize, h: tileSize });
        } else if (mapData[row][col] === ".") {
            pellets.push({
                x: x + tileSize / 1,
                y: y + tileSize / 1,
                eaten: false,
                power: false
            });
        }
        else if (mapData[row][col] === "0") {
            pellets.push({
                x: x + tileSize / 1,
                y: y + tileSize / 1,
                eaten: false,
                power: true
            });
        }
    }
}

// ===== KRESLENÍ =====
function drawWalls() {
    ctx.shadowColor = "black";
    ctx.shadowBlur = 5;
    ctx.fillStyle = "#fff";
    for (let w of walls) {
        ctx.fillRect(w.x, w.y, w.w, w.h);
    }
    ctx.shadowBlur = 0;
}

function drawPellets() {
    for (let p of pellets) {
        if (!p.eaten) {

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (p.power) {
                ctx.font = "30px Arial";
                ctx.fillText("💥", p.x, p.y); // power pellet
            } else {
                ctx.font = "16px Arial";
                ctx.fillText("🩷", p.x, p.y); // normální pellet
            }
        }
    }
}

function eatPellets() {
    for (let p of pellets) {
        if (!p.eaten) {
            let dx = pac.x - p.x;
            let dy = pac.y - p.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < pac.size) {
                p.eaten = true;
                score++;

                // když je to bomba
                if (p.power) {
                    frightMode = true;
                    frightTimer = 600; // cca 10 sekund (60fps * 10)
                    makeGhostsRunAway();

                    console.log("fright Mode");
                }

                eatAudio.currentTime = 0;
                eatAudio.play().catch(e => console.log("eat zvuk blokovan", e));
                drawScore();
            }
        }
    }
}

function drawPacman() {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    let start = pacAngle + mouth;
    let end = pacAngle + Math.PI * 2 - mouth;
    ctx.arc(pac.x, pac.y, pac.size, start, end);
    ctx.lineTo(pac.x, pac.y);
    ctx.fill();
}

function drawGhost(g) {

    // bomba
    if (frightMode) {
        ctx.fillStyle = "#66ccff";
    }

    // TĚLO DUCHA (pulkruh + vlnka)
    ctx.fillStyle = g.color;
    ctx.beginPath();

    // Horní pulkruh
    ctx.arc(g.x, g.y, g.size, Math.PI, 0);

    // Spodní vlnky
    let bottomY = g.y + g.size;
    ctx.lineTo(g.x + g.size, bottomY);

    // pravá vlnka
    ctx.lineTo(g.x + 8, bottomY);
    ctx.quadraticCurveTo(g.x + 8, bottomY + 4, g.x + 2, bottomY);

    // levá vlnka
    ctx.lineTo(g.x - 2, bottomY);
    ctx.quadraticCurveTo(g.x - 8, bottomY + 4, g.x - 8, bottomY);

    // třetí vlnka (UPROSTŘED – opravená)
    ctx.lineTo(g.x + 2, bottomY);
    ctx.quadraticCurveTo(g.x, bottomY + 4, g.x - 2, bottomY);

    ctx.lineTo(g.x - g.size, bottomY);

    ctx.closePath();
    ctx.fill();

    // oči
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(g.x - 5, g.y - 5, 5, 0, Math.PI * 2);
    ctx.arc(g.x + 5, g.y - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    // zorničky
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(g.x - 5, g.y - 5, 2, 0, Math.PI * 2);
    ctx.arc(g.x + 5, g.y - 5, 2, 0, Math.PI * 2);
    ctx.fill();

    // pusa
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(g.x, g.y + 7, 6, Math.PI, 0);
    ctx.fill();

    // 👻 FRIGHT MODE overlay – modré tělo + scared výraz
    if (frightMode && g.state === "chasing") {
        ctx.save();

        // Barva bliká když zbývá méně než 2 sekundy (120 framů)
        const blinking = frightTimer < 120 && Math.floor(frightTimer / 15) % 2 === 0;
        ctx.fillStyle = blinking ? "#ffffff" : "#3333ff";

        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size, Math.PI, 0);
        let bY = g.y + g.size;
        ctx.lineTo(g.x + g.size, bY);
        ctx.lineTo(g.x + 8, bY);
        ctx.quadraticCurveTo(g.x + 8, bY + 4, g.x + 2, bY);
        ctx.lineTo(g.x - 2, bY);
        ctx.quadraticCurveTo(g.x - 8, bY + 4, g.x - 8, bY);
        ctx.lineTo(g.x + 2, bY);
        ctx.quadraticCurveTo(g.x, bY + 4, g.x - 2, bY);
        ctx.lineTo(g.x - g.size, bY);
        ctx.closePath();
        ctx.fill();

        // Scared oči (bílé tečky)
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(g.x - 4, g.y - 3, 3, 0, Math.PI * 2);
        ctx.arc(g.x + 4, g.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Klikatá pusa (scared)
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(g.x - 5, g.y + 5);
        ctx.lineTo(g.x - 3, g.y + 3);
        ctx.lineTo(g.x - 1, g.y + 5);
        ctx.lineTo(g.x + 1, g.y + 3);
        ctx.lineTo(g.x + 3, g.y + 5);
        ctx.lineTo(g.x + 5, g.y + 3);
        ctx.stroke();

        ctx.restore();
    }
}


function drawScore() {
    let displayScore = score > 0 ? score : 0;
    document.getElementById("hud").innerText = "😻 SCORE:💘" + displayScore;
}


// povoleni zvuku
document.addEventListener("keydown", async () => {
    if (audioctx.state !== "running") {
        await audioctx.resume();
        console.log("audio odemčeno 🔊");
    }
});

// ===== OVLÁDÁNÍ =====
document.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") {
        e.preventDefault();
        pac.nextDirX = 0;
        pac.nextDirY = -1;
    }

    if (e.key === "ArrowDown") {
        e.preventDefault();
        pac.nextDirX = 0;
        pac.nextDirY = 1;
    }

    if (e.key === "ArrowLeft") {
        e.preventDefault();
        pac.nextDirX = -1;
        pac.nextDirY = 0;
    }

    if (e.key === "ArrowRight") {
        e.preventDefault();
        pac.nextDirX = 1;
        pac.nextDirY = 0;
    }
});

// ===== LOOP =====
function loop() {
    requestAnimationFrame(loop);

    if (!gameRunning || gameOver) return;

    mouth += mouthSpeed;
    if (mouth > 0.5 || mouth < 0.2) mouthSpeed *= -1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    movePacman();
    eatPellets();
    drawScore();
    drawWalls();
    drawPellets();
    drawPacman();

    let hit = false;

    if (frightMode) {
        frightTimer--;
        if (frightTimer <= 0) frightMode = false;
    }

    ghosts.forEach(g => {
        moveGhost(g);

        const touchingGhost = Math.hypot(pac.x - g.x, pac.y - g.y) < pac.size + g.size;

        if (touchingGhost) {
            if (frightMode && g.state === "chasing") {
                eatGhost(g);
            } else {
                hit = true;
            }
        }

        drawGhost(g);
        debugGhostHitbox(g);
    });

    if (hit && !gameOver) {
        gameRunning = false;
        gameOver = true;

        audio.currentTime = 0;
        audio.play().catch(() => { });

        document.getElementById("gameover").style.display = "flex";
        document.getElementById("menu").style.display = "flex";
    }
}

requestAnimationFrame(loop);

startCountdown();

// ===== RESTART TLAČÍTKO =====
document.getElementById("restart").addEventListener("click", () => {
    // Skryj menu a game over
    document.getElementById("gameover").style.display = "none";
    document.getElementById("menu").style.display = "none";

    // Resetuj všechny proměnné
    gameOver = false;
    gameRunning = false; // reset game
    frightMode = false;
    frightTimer = 0;
    score = 0;
    soundPlayed = false;
    pacAngle = 0;
    mouth = 0.2;
    mouthSpeed = 0.05;

    // Resetuj Pac-Mana
    pac.x = 22 * tileSize + tileSize / 2;
    pac.y = 37.5 * tileSize + tileSize / 2;
    pac.dirX = 0;
    pac.dirY = 0;
    pac.nextDirX = 0;
    pac.nextDirY = 0;

    // Resetuj ghosty
    ghosts = [
        {
            x: 22 * tileSize + tileSize / 2,
            y: 22 * tileSize + tileSize / 2,
            size: 11,
            speed: 2.85,
            dirX: 0,
            dirY: -1,
            color: "red",
            state: "waiting", // čeká
            name: "blinky"
        },
        {
            x: 22 * tileSize + tileSize / 2,
            y: 24 * tileSize + tileSize / 2,
            size: 11,
            speed: 2.85,
            dirX: 0,
            dirY: -1,
            color: "#0ef3ff",
            state: "waiting", // čeká
            name: "pinky"
        },
        {
            x: 20 * tileSize + tileSize / 2,
            y: 24 * tileSize + tileSize / 2,
            size: 11,
            speed: 2.85,
            dirX: 0,
            dirY: -1,
            color: "blue",
            state: "waiting", // čeká
            name: "inky"
        },
        {
            x: 24 * tileSize + tileSize / 2,
            y: 24 * tileSize + tileSize / 2,
            size: 11,
            speed: 2.85,
            dirX: 0,
            dirY: -1,
            color: "yellow",
            state: "waiting", // čeká
            name: "clyde"
        }
    ];
    // Resetuj pelejty
    for (let p of pellets) {
        p.eaten = false;
    }

    // Updatuj HUD
    drawScore();

    // Spustit hru znovu
    startCountdown();
});


// =====================================================================
// 👻 GHOST PERSONALITY AI EXTENSION
// Přidáno na konec souboru – nic výše se nezměnilo.
// =====================================================================

// -----------------------------------------------------------------------
// getPersonalityTarget() – vrátí správný cíl podle originální Pac-Man AI
// -----------------------------------------------------------------------
function getPersonalityTarget(g) {

    // 🔴 BLINKY – přímý pronásledovatel, míří vždy přímo na Pac-Mana
    if (g.name === "blinky") {
        return { x: pac.x, y: pac.y };
    }

    // 🟣 PINKY – predikuje pohyb, míří 4 dlaždice PŘED Pac-Mana
    if (g.name === "pinky") {
        return {
            x: pac.x + pac.dirX * 4 * tileSize,
            y: pac.y + pac.dirY * 4 * tileSize
        };
    }

    // 🔵 INKY – kombinovaný cíl: vektor od Blinkyho k pivotu (2 před Pac-Manem), zdvojený
    if (g.name === "inky") {
        const distToPac = Math.hypot(pac.x - g.x, pac.y - g.y);

        if (distToPac < 5 * tileSize) {
            return {
                x: g.x + (g.x - pac.x) * 2,
                y: g.y + (g.y - pac.y) * 2
            };
        }

        const blinky = ghosts.find(gh => gh.name === "blinky");
        const pivotX = pac.x + pac.dirX * 2 * tileSize;
        const pivotY = pac.y + pac.dirY * 2 * tileSize;

        if (blinky) {
            return {
                x: pivotX + (pivotX - blinky.x),
                y: pivotY + (pivotY - blinky.y)
            };
        }
        return { x: pivotX, y: pivotY };
    }

    // 🟡 CLYDE – daleko = chase, blízko (≤8 dlaždic) = scatter do levého dolního rohu
    if (g.name === "clyde") {
        const distToPac = Math.hypot(pac.x - g.x, pac.y - g.y);
        if (distToPac > 8 * tileSize) {
            return { x: pac.x, y: pac.y };
        } else {
            return { x: 0, y: canvas.height };
        }
    }

    // fallback
    return { x: pac.x, y: pac.y };
}

// =====================================================================
// KONEC PERSONALITY AI EXTENSION
// =====================================================================
