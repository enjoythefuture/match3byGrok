const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 50;
const gridSize = 8;
let board = [];
let score = 0;
let selectedTile = null;
let isAnimating = false;

// Звуковые эффекты
const match3Sound = new Audio('match3.wav');
match3Sound.volume = 0.4;
const match4Sound = new Audio('match4.wav');
match4Sound.volume = 0.4;
const match5Sound = new Audio('match5.wav');
match5Sound.volume = 0.4;
const dropSound = new Audio('drop.wav');
dropSound.volume = 0.25;

// Инициализация игрового поля с ограничением
function initBoard() {
    for (let i = 0; i < gridSize; i++) {
        board[i] = [];
        for (let j = 0; j < gridSize; j++) {
            board[i][j] = Math.floor(Math.random() * 4);
        }
    }
    let initialMatches = checkMatches();
    let maxIterations = 100;
    while (initialMatches.length > 0 && maxIterations > 0) {
        removeMatchesNoAnimation(initialMatches);
        dropTilesNoAnimation();
        initialMatches = checkMatches();
        maxIterations--;
    }
    if (maxIterations === 0) {
        console.warn('Достигнут лимит итераций при очистке начальных совпадений');
    }
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (board[i][j] === null || board[i][j] === undefined) {
                board[i][j] = Math.floor(Math.random() * 4);
            }
        }
    }
}

// Отрисовка поля
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (board[i][j] !== null && board[i][j] !== undefined) {
                ctx.fillStyle = getColor(board[i][j]);
                ctx.fillRect(j * tileSize, i * tileSize, tileSize - 2, tileSize - 2);
            }
        }
    }
    document.getElementById('score').textContent = `Очки: ${score}`;
}

// Цвета для элементов
function getColor(value) {
    const colors = ['red', 'blue', 'yellow', 'green'];
    return colors[value];
}

// Анимация перемещения при обмене
function animateSwap(x1, y1, x2, y2, callback) {
    const startX1 = x1 * tileSize;
    const startY1 = y1 * tileSize;
    const startX2 = x2 * tileSize;
    const startY2 = y2 * tileSize;
    const endX1 = x2 * tileSize;
    const endY1 = y2 * tileSize;
    const endX2 = x1 * tileSize;
    const endY2 = y1 * tileSize;
    const duration = 200;
    let startTime = null;

    const tile1Value = board[y1][x1];
    const tile2Value = board[y2][x2];

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);

        const currentX1 = startX1 + (endX1 - startX1) * progress;
        const currentY1 = startY1 + (endY1 - startY1) * progress;
        const currentX2 = startX2 + (endX2 - startX2) * progress;
        const currentY2 = startY2 + (endY2 - startY2) * progress;

        drawBoard();
        ctx.fillStyle = getColor(tile1Value);
        ctx.fillRect(currentX1, currentY1, tileSize - 2, tileSize - 2);
        ctx.fillStyle = getColor(tile2Value);
        ctx.fillRect(currentX2, currentY2, tileSize - 2, tileSize - 2);

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            [board[y1][x1], board[y2][x2]] = [board[y2][x2], board[y1][x1]];
            isAnimating = false;
            callback();
        }
    }

    isAnimating = true;
    requestAnimationFrame(step);
}

// Обмен элементов
function swapTiles(x1, y1, x2, y2) {
    if (isAnimating || Math.abs(x1 - x2) + Math.abs(y1 - y2) !== 1) return;

    animateSwap(x1, y1, x2, y2, () => {
        const matches = checkMatches();
        if (matches.length > 0) {
            removeMatches(matches);
        } else {
            [board[y1][x1], board[y2][x2]] = [board[y2][x2], board[y1][x1]];
            drawBoard();
        }
    });
}

// Проверка совпадений с учётом длины цепочек
function checkMatches() {
    let matches = [];
    for (let i = 0; i < gridSize; i++) {
        let j = 0;
        while (j < gridSize - 2) {
            if (
                board[i][j] !== null &&
                board[i][j] !== undefined &&
                board[i][j] === board[i][j + 1] &&
                board[i][j] === board[i][j + 2]
            ) {
                let chainLength = 3;
                let k = j + 3;
                while (k < gridSize && board[i][k] === board[i][j]) {
                    chainLength++;
                    k++;
                }
                const chain = Array.from({ length: chainLength }, (_, idx) => [i, j + idx]);
                matches.push(chain);
                j = k;
            } else {
                j++;
            }
        }
    }
    for (let j = 0; j < gridSize; j++) {
        let i = 0;
        while (i < gridSize - 2) {
            if (
                board[i][j] !== null &&
                board[i][j] !== undefined &&
                board[i][j] === board[i + 1][j] &&
                board[i][j] === board[i + 2][j]
            ) {
                let chainLength = 3;
                let k = i + 3;
                while (k < gridSize && board[k][j] === board[i][j]) {
                    chainLength++;
                    k++;
                }
                const chain = Array.from({ length: chainLength }, (_, idx) => [i + idx, j]);
                matches.push(chain);
                i = k;
            } else {
                i++;
            }
        }
    }
    return matches;
}

// Упрощённое удаление для начальной очистки (без анимации)
function removeMatchesNoAnimation(matches) {
    if (!matches || !Array.isArray(matches) || matches.length === 0) return;
    matches.forEach(chain => {
        chain.forEach(([y, x]) => {
            if (board[y][x] !== null && board[y][x] !== undefined) {
                board[y][x] = null;
                score += 10;
            }
        });
    });
}

// Упрощённое падение для начальной очистки (без анимации)
function dropTilesNoAnimation() {
    for (let j = 0; j < gridSize; j++) {
        let emptySpaces = 0;
        for (let i = gridSize - 1; i >= 0; i--) {
            if (board[i][j] === null || board[i][j] === undefined) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                board[i + emptySpaces][j] = board[i][j];
                board[i][j] = null;
            }
        }
        for (let k = 0; k < emptySpaces; k++) {
            board[k][j] = Math.floor(Math.random() * 4);
        }
    }
}

// Анимация исчезновения совпадений
function animateRemoveMatches(matches, callback) {
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
        callback();
        return;
    }

    const durations = {
        3: 100,  // Быстрая анимация для 3 (лазер)
        4: 300,  // Увеличено до 300 для Tetris
        5: 250   // Взрыв для 5+
    };
    let startTime = null;
    const sparkColors = ['red', 'yellow', 'white', 'orange'];

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        drawBoard();

        let allDone = true;
        matches.forEach((chain, chainIndex) => {
            const chainLength = chain.length;
            const duration = durations[chainLength >= 5 ? 5 : chainLength] || 200;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const color = getColor(board[chain[0][0]][chain[0][1]]);
            const isHorizontal = chain.every(([cy]) => cy === chain[0][0]);

            chain.forEach(([y, x], index) => {
                if (board[y][x] !== null && board[y][x] !== undefined) {
                    if (chainLength === 3) {
                        // Лазер: луч с белым свечением
                        if (isHorizontal) {
                            const laserWidth = tileSize * 3 * progress;
                            ctx.fillStyle = 'white';
                            ctx.globalAlpha = 0.5;
                            ctx.fillRect(chain[0][1] * tileSize - 5, y * tileSize - 5, laserWidth + 10, tileSize + 8);
                            ctx.globalAlpha = 1;
                            ctx.fillStyle = color;
                            ctx.fillRect(chain[0][1] * tileSize, y * tileSize, laserWidth, tileSize - 2);
                        } else {
                            const laserHeight = tileSize * 3 * progress;
                            ctx.fillStyle = 'white';
                            ctx.globalAlpha = 0.5;
                            ctx.fillRect(x * tileSize - 5, chain[0][0] * tileSize - 5, tileSize + 8, laserHeight + 10);
                            ctx.globalAlpha = 1;
                            ctx.fillStyle = color;
                            ctx.fillRect(x * tileSize, chain[0][0] * tileSize, tileSize - 2, laserHeight);
                        }
                        if (progress < 1) {
                            ctx.fillStyle = color;
                            ctx.fillRect(x * tileSize, y * tileSize, tileSize - 2, tileSize - 2);
                        }
                    } else if (chainLength === 4) {
                        // Tetris: сжатие с вращением
                        const scale = 1 - progress;
                        const newSize = (tileSize - 2) * scale;
                        const centerX = x * tileSize + (tileSize - 2) / 2;
                        const centerY = y * tileSize + (tileSize - 2) / 2;
                        const rotation = progress * Math.PI; // Полный поворот на 180 градусов

                        ctx.save();
                        ctx.translate(centerX, centerY);
                        ctx.rotate(rotation);
                        ctx.fillStyle = color;
                        ctx.fillRect(-newSize / 2, -newSize / 2, newSize, newSize);
                        ctx.restore();

                        console.log(`Tetris animation: x=${x}, y=${y}, progress=${progress}, size=${newSize}`);
                    } else if (chainLength >= 5) {
                        // Взрыв: круг в цвете элементов + искры
                        const midIndex = Math.floor(chain.length / 2);
                        const midX = chain[midIndex][1] * tileSize + tileSize / 2;
                        const midY = chain[midIndex][0] * tileSize + tileSize / 2;
                        const maxRadius = tileSize * chain.length / 2;
                        const radius = maxRadius * progress;

                        ctx.beginPath();
                        ctx.arc(midX, midY, radius, 0, Math.PI * 2);
                        ctx.fillStyle = color;
                        ctx.fill();
                        ctx.closePath();

                        if (progress < 0.9) {
                            for (let i = 0; i < 5; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                const distance = radius * Math.random();
                                const sparkX = midX + Math.cos(angle) * distance;
                                const sparkY = midY + Math.sin(angle) * distance;
                                ctx.beginPath();
                                ctx.arc(sparkX, sparkY, 3 * (1 - progress), 0, Math.PI * 2);
                                ctx.fillStyle = sparkColors[Math.floor(Math.random() * sparkColors.length)];
                                ctx.fill();
                                ctx.closePath();
                            }
                        }

                        if (progress < 0.8) {
                            ctx.fillStyle = color;
                            ctx.fillRect(x * tileSize, y * tileSize, tileSize - 2, tileSize - 2);
                        }
                    }

                    if (progress === 0) {
                        const sound = chainLength >= 5 ? match5Sound : chainLength === 4 ? match4Sound : match3Sound;
                        const clonedSound = sound.cloneNode();
                        clonedSound.volume = sound.volume;
                        setTimeout(() => clonedSound.play(), (chainIndex * chain.length + index) * 50);
                    }

                    if (progress < 1) allDone = false;
                }
            });
        });

        if (!allDone) {
            requestAnimationFrame(step);
        } else {
            matches.forEach(chain => {
                chain.forEach(([y, x]) => {
                    if (board[y][x] !== null && board[y][x] !== undefined) {
                        board[y][x] = null;
                        score += 10;
                    }
                });
            });
            isAnimating = false;
            drawBoard();
            callback();
        }
    }

    isAnimating = true;
    requestAnimationFrame(step);
}

// Удаление совпадений с последующим падением
function removeMatches(matches) {
    animateRemoveMatches(matches, () => {
        dropTiles();
    });
}

// Анимация падения элементов
function dropTiles() {
    const fallingTiles = [];
    const newBoard = board.map(row => [...row]);

    for (let j = 0; j < gridSize; j++) {
        let emptySpaces = 0;
        for (let i = gridSize - 1; i >= 0; i--) {
            if (newBoard[i][j] === null || newBoard[i][j] === undefined) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                newBoard[i + emptySpaces][j] = newBoard[i][j];
                fallingTiles.push([j, i * tileSize, (i + emptySpaces) * tileSize, newBoard[i][j]]);
                newBoard[i][j] = null;
            }
        }
        for (let k = 0; k < emptySpaces; k++) {
            const value = Math.floor(Math.random() * 4);
            newBoard[k][j] = value;
            fallingTiles.push([j, -tileSize * (emptySpaces - k), k * tileSize, value]);
        }
    }

    const duration = 300;
    let startTime = null;

    function animateDrop(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);

        drawBoard();
        fallingTiles.forEach(([x, startY, endY, value]) => {
            const currentY = startY + (endY - startY) * progress;
            ctx.fillStyle = getColor(value);
            ctx.fillRect(x * tileSize, currentY, tileSize - 2, tileSize - 2);
        });

        if (progress < 1) {
            requestAnimationFrame(animateDrop);
        } else {
            board = newBoard.map(row => [...row]);
            isAnimating = false;
            drawBoard();
            dropSound.play();
            const newMatches = checkMatches();
            if (newMatches.length > 0) {
                setTimeout(() => removeMatches(newMatches), 100);
            }
        }
    }

    isAnimating = true;
    requestAnimationFrame(animateDrop);
}

// Обработка кликов
canvas.addEventListener('click', (e) => {
    if (isAnimating) return;
    const x = Math.floor(e.offsetX / tileSize);
    const y = Math.floor(e.offsetY / tileSize);
    if (!selectedTile) {
        selectedTile = [x, y];
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize - 2, tileSize - 2);
    } else {
        const [prevX, prevY] = selectedTile;
        selectedTile = null;
        swapTiles(prevX, prevY, x, y);
    }
});

// Старт игры
initBoard();
drawBoard();