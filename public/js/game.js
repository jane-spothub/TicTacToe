const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const restartButton = document.getElementById('restart');
const switchButton = document.getElementById('switch');
const difficultyOptions = document.querySelectorAll('.difficulty-option');
const themeOptions = document.querySelectorAll('.theme-option');
const playerXElement = document.getElementById('player-x');
const playerOElement = document.getElementById('player-o');
const winsElement = document.getElementById('wins');
const lossesElement = document.getElementById('losses');
const drawsElement = document.getElementById('draws');

// Game state
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let playerIsX = true;
let difficulty = 'easy';
let wins = 0, losses = 0, draws = 0;
let aiMoveTimeout = null;

// Winning combinations
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
];
function initializeBoard() {// Initialize the game board
    // Clear any pending AI move
    if (aiMoveTimeout) {
        clearTimeout(aiMoveTimeout);
        aiMoveTimeout = null;
    }
    boardElement.innerHTML = '';
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('button');
        cell.classList.add('cell');
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', () => cellClick(i));
        boardElement.appendChild(cell);
    }

    updateStatus();
    updatePlayerIndicators();

    // If AI goes first
    if (!playerIsX) {
        // Use a minimal delay to ensure the board is fully rendered
        aiMoveTimeout = setTimeout(makeAIMove, 10);
    }
}

// Handle cell click
function cellClick(index) {
    if (!gameActive || board[index] !== '' || !isPlayerTurn()) {
        return;
    }

    makeMove(index, currentPlayer);

    if (gameActive) {
        // Switch player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updatePlayerIndicators();

        // AI's turn if it's not player's turn
        if (!isPlayerTurn()) {
            // Clear any existing timeout to prevent multiple AI moves
            if (aiMoveTimeout) {
                clearTimeout(aiMoveTimeout);
            }
            aiMoveTimeout = setTimeout(makeAIMove, 500);
        }
    }
}

// Check if it's the player's turn
function isPlayerTurn() {
    return (playerIsX && currentPlayer === 'X') || (!playerIsX && currentPlayer === 'O');
}

// Make a move on the board
function makeMove(index, player) {
    board[index] = player;
    const cell = document.querySelector(`[data-index="${index}"]`);
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());

    // Add animation class
    cell.classList.add('animated');
    setTimeout(() => {
        cell.classList.remove('animated');
    }, 300);

    checkGameResult();
}

// Check for win or draw
function checkGameResult() {
    let roundWon = false;
    let winningCombo = [];

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningCombo = [a, b, c];
            break;
        }
    }

    if (roundWon) {
        gameActive = false;
        // Highlight winning cells
        winningCombo.forEach(index => {
            document.querySelector(`[data-index="${index}"]`).classList.add('winning-cell');
        });

        // Update stats
        if ((playerIsX && board[winningCombo[0]] === 'X') ||
            (!playerIsX && board[winningCombo[0]] === 'O')) {
            wins++;
            winsElement.textContent = wins;
            createConfetti();
        } else {
            losses++;
            lossesElement.textContent = losses;
        }

        statusElement.textContent = `${board[winningCombo[0]]} wins!`;
        return;
    }

    // Check for draw
    if (!board.includes('')) {
        gameActive = false;
        draws++;
        drawsElement.textContent = draws;
        statusElement.textContent = "It's a draw!";
        return;
    }

    updateStatus();
}

// Update game status
function updateStatus() {
    if (gameActive) {
        if (isPlayerTurn()) {
            statusElement.textContent = "Your turn";
        } else {
            statusElement.textContent = "AI is thinking...";
        }
    }
}

// Update player indicators
function updatePlayerIndicators() {
    if (isPlayerTurn()) {
        playerXElement.classList.add('active');
        playerOElement.classList.remove('active');
    } else {
        playerXElement.classList.remove('active');
        playerOElement.classList.add('active');
    }
}

// AI move logic
function makeAIMove() {
    if (!gameActive) return;

    let move;

    switch (difficulty) {
        case 'easy':
            move = getRandomMove();
            break;
        case 'medium':
            move = Math.random() < 0.7 ? getWinningOrBlockingMove() : getRandomMove();
            break;
        case 'hard':
            move = getBestMove();
            break;
    }

    if (move !== -1 && board[move] === '') {
        makeMove(move, currentPlayer);

        if (gameActive) {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updatePlayerIndicators();
            updateStatus();
        }
    }

    // Clear the timeout reference
    aiMoveTimeout = null;
}

// Get a random available move
function getRandomMove() {
    const availableMoves = board.map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);
    return availableMoves.length > 0 ?
        availableMoves[Math.floor(Math.random() * availableMoves.length)] : -1;
}

// Get a winning or blocking move
function getWinningOrBlockingMove() {
    // Check for winning move
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        const line = [board[a], board[b], board[c]];

        // If AI can win
        if (line.filter(cell => cell === currentPlayer).length === 2 &&
            line.includes('')) {
            return line.indexOf('') === 0 ? a :
                line.indexOf('') === 1 ? b : c;
        }
    }

    // Check for blocking move
    const opponent = currentPlayer === 'X' ? 'O' : 'X';
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        const line = [board[a], board[b], board[c]];

        // If opponent can win, block them
        if (line.filter(cell => cell === opponent).length === 2 &&
            line.includes('')) {
            return line.indexOf('') === 0 ? a :
                line.indexOf('') === 1 ? b : c;
        }
    }

    return -1; // No winning or blocking move found
}

// Minimax algorithm for hard difficulty
function getBestMove() {
    // Simple implementation - in a real game you'd use full minimax
    const availableMoves = board.map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);

    // Try center first
    if (board[4] === '') return 4;

    // Try corners
    const corners = [0, 2, 6, 8].filter(index => board[index] === '');
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

    // Otherwise return a winning/blocking move or random
    const smartMove = getWinningOrBlockingMove();
    return smartMove !== -1 ? smartMove : getRandomMove();
}

// Switch player sides
function switchSides() {
    playerIsX = !playerIsX;
    initializeBoard();
}

// Create confetti effect
function createConfetti() {
    const container = document.querySelector('.game-container');
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = Math.random() * 100 + '%';
        confetti.style.backgroundColor = getRandomColor();
        confetti.style.transform = `scale(${Math.random()})`;
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = confetti.style.width;

        container.appendChild(confetti);

        // Animate confetti
        setTimeout(() => {
            confetti.style.opacity = 1;
            confetti.style.transform = `translateY(${Math.random() * 100}px) rotate(${Math.random() * 360}deg)`;
        }, 10);

        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 2000);
    }
}

// Get random color for confetti
function getRandomColor() {
    const colors = ['#6c5ce7', '#a29bfe', '#fd79a8', '#00b894', '#fdcb6e', '#e17055'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Event listeners
restartButton.addEventListener('click', initializeBoard);
switchButton.addEventListener('click', switchSides);

// Difficulty selection - UPDATED: No longer resets the game
difficultyOptions.forEach(option => {
    option.addEventListener('click', () => {
        difficultyOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        difficulty = option.getAttribute('data-difficulty');
        // Removed the initializeBoard() call here
    });
});

// Theme selection
themeOptions.forEach(option => {
    option.addEventListener('click', () => {
        themeOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        const theme = option.getAttribute('data-theme');
        document.body.className = `theme-${theme}`;
    });
});

// Initialize the game
initializeBoard();