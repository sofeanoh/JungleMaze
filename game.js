import { Board } from './board.js';
import { Player } from './player.js';
import { Piece } from './piece.js';
import { Destination } from './destination.js';
import { Tile } from './tile.js';
import { AIPlayer } from './aiplayer.js';

export class Game {
    constructor(player1, player2) {
        this.players = [player1, player2];
        this.currentPlayer = this.players[0];
        this.board = new Board(player1, player2);
        this.players[0].spareTile = new Tile(this.board.getRandomPattern());
        this.board.originalState = JSON.parse(JSON.stringify(this.board.grid));
        this.updateSpareTiles();
        this.assignRandomDestinations(player1, player2);
        this.updateGameInfo();
        this.updateUIflag = false;
        this.spareTileClicked = false;
        this.lastClickedRow = null;
        this.lastClickedCol = null;
        this.pieceClickable = false; // Track if the piece is clickable
        this.selectedPiece = null;
        this.currentPlayerValidMoves = null;
        this.gameOver = false;
         // Initialize the AI player if applicable
        this.nextRound = false;
        // Assign aiPlayer if one of the players is AI
        if (player1 instanceof AIPlayer) {
            this.aiPlayer = player1;
        } else if (player2 instanceof AIPlayer) {
            this.aiPlayer = player2;
        } else {
            this.aiPlayer = null;
        }
        
    }

    renderBoard() {
        for (let i = 0; i < this.board.grid.length; i++) {
            for (let j = 0; j < this.board.grid[i].length; j++) {
                // Calculate the cell's ID based on its row and column
                let cellId = `Cell${i * this.board.grid[i].length + j + 1}`;
                let cellElement = document.getElementById(cellId);
                
                // Clear previous contents
                cellElement.innerHTML = '';
    
                // Update cell background for the tile
                cellElement.style.backgroundImage = `url('${this.board.grid[i][j].getImageName()}')`;
    
                // If the tile has a piece, add a div for the piece
                if (this.board.grid[i][j].piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.style.backgroundColor = this.board.grid[i][j].piece.getColour();
                    cellElement.appendChild(pieceElement);
                }
    
                // If the tile has a destination, add a div for the destination
                if (this.board.grid[i][j].destination) {
                    const destinationElement = document.createElement('div');
                    destinationElement.className = 'destination';
                    destinationElement.style.backgroundImage = `url('${this.board.grid[i][j].getDestinationImageName()}')`;
                    cellElement.appendChild(destinationElement);
                }      
                
            }
        }
    }

    switchTurn() {
        if (this.nextRound) {
            // Switch the current player
            this.currentPlayer = this.getOtherPlayer();
            // Reset the nextRound flag
            this.nextRound = false;
            // Update any UI elements or game state as needed
            this.updateUIAfterTurn();
            // Simulate clicking on the spare tile of the new current player
            this.simulateSpareTileClick();
    
            // Check if the current player is AI and if the game is not over
            if (this.currentPlayer === this.players[1] && this.players[1].name === 'AI' && !this.gameOver) {
                this.executeAIMove();
            }
        }
    }

        // Assuming this method is called right after switching turns
    simulateSpareTileClick() {
        const currentPlayerSpareTileElement = document.getElementById(`player${this.currentPlayer === this.players[0] ? '1' : '2'}-spare-tile`);
        if (currentPlayerSpareTileElement) {
            currentPlayerSpareTileElement.click(); // Simulate the click

            // Introduce a slight delay before forcing highlights or refreshing UI
            setTimeout(() => {
                this.highlightValidSpareTilePlacements(); // Reapply or ensure highlights
                // Optionally, force a UI refresh if there's a specific method that does it
                // this.refreshUI(); // This is just an example. Adjust according to your actual UI refresh method.
            }, 100); // Adjust delay as necessary
        }
    }

    
    
    

    updateUIAfterTurn() {
        // This method should update the UI based on the new game state
        // For example, updating the current player display, refreshing the board, etc.
        this.updateUI();
        this.updateGameInfo();
    }
    
    updateUI() {
        this.renderBoard();
        this.updateSpareTiles();
    }
    
   

    attachEventListeners() {
        const gameBoardElement = document.getElementById('game-board');
    
        gameBoardElement.addEventListener('mouseover', (event) => {
            if (event.target.classList.contains('cell')) { // Ensure we're hovering over a cell
                this.highlightRowCol(event);
            }
        });
    
        gameBoardElement.addEventListener('mouseout', (event) => {
            if (event.target.classList.contains('cell')) {
                this.removeHighlightRowCol(event);
            }
        });
    
        gameBoardElement.addEventListener('click', (event) => {
            if (event.target.classList.contains('cell')) {
                // Directly call handleEdgeTileClick without checking updateUIflag
                this.handleEdgeTileClick(event);
            }
        });

        gameBoardElement.addEventListener('click', (event) => {
            let target = event.target;
            let targetCell;
    
            // Check if the click is directly on a piece or destination, or anywhere within the cell
            if (target.classList.contains('piece') || target.classList.contains('destination')) {
                targetCell = target.parentElement; // The cell is the parent of the piece/destination
            } else if (target.classList.contains('cell')) {
                targetCell = target; // Clicked directly on the cell
            }
    
            if (!targetCell) return; // If we didn't click on something we care about, exit
    
            // First, try to handle the piece click logic if applicable
            if (this.pieceClickable) {
                const piece = targetCell.querySelector('.piece');
                if (piece) {
                    this.handlePieceClick(piece);
                    return; // Prevent further logic from executing in this click event
                }
            }
    
            // Then, handle cell click logic for moving a piece if applicable
            if (this.pieceClickable && this.selectedPiece) {
                this.handleCellClickForPiece({ target: targetCell });
            }
        });
        
    }

    updateSpareTiles() {
        const player1SpareTileElement = document.getElementById('player1-spare-tile');
        const player2SpareTileElement = document.getElementById('player2-spare-tile');
    
        // Check if player1's spareTile is not null
        if (this.players[0].spareTile) {
            player1SpareTileElement.style.backgroundImage = `url('${this.players[0].spareTile.getImageName()}')`;
            player1SpareTileElement.style.cursor = 'pointer';
        } else {
            // Clear the backgroundImage if spareTile is null
            player1SpareTileElement.style.backgroundImage = '';
            player1SpareTileElement.style.cursor = 'default';

        }
    
        // Check if player2's spareTile is not null
        if (this.players[1].spareTile) {
            player2SpareTileElement.style.backgroundImage = `url('${this.players[1].spareTile.getImageName()}')`;
            player2SpareTileElement.style.cursor = 'pointer';
        } else {
            // Clear the backgroundImage if spareTile is null
            player2SpareTileElement.style.backgroundImage = '';
            player2SpareTileElement.style.cursor = 'default';

        }

         // Add click event listeners
        player1SpareTileElement.onclick = () => {
            if (this.currentPlayer === this.players[0]) {
                // Player 1 can click on their own spareTile
                this.handleSpareTileClick();
            }
        };
        player2SpareTileElement.onclick = () => {
            if (this.currentPlayer === this.players[1]) {
                // Player 2 can click on their own spareTile
                this.handleSpareTileClick();
            }
        };
    }

    handleSpareTileClick() {
        // Toggle the spare tile clicked state
        this.spareTileClicked = !this.spareTileClicked;

        // Update the border for the current player's spare tile
        const currentPlayerSpareTileElement = document.getElementById(`player${this.currentPlayer === this.players[0] ? '1' : '2'}-spare-tile`);
        if (this.spareTileClicked) {
            this.highlightValidSpareTilePlacements();
            currentPlayerSpareTileElement.classList.add('spare-tile-selected');
            // Highlight valid moves
        } else {
            currentPlayerSpareTileElement.classList.remove('spare-tile-selected');
            // Remove highlights if deselected
            this.removeHighlights();
        }
    }

    highlightValidSpareTilePlacements() {
        // Example logic, adjust according to your game's rules
        this.board.grid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (this.canPlaceSpareTile(rowIndex, colIndex)) {
                    const cellElement = document.querySelector(`[data-row="${rowIndex}"][data-column="${colIndex}"]`);
                    cellElement.classList.add('validEdge'); // Assuming 'highlight' is your CSS class for valid moves
                }
            });
        });
    }
    

    highlightRowCol(event) {
        // Early exit if not the correct target or if spareTileClicked is not set
        if (!event.target.classList.contains('cell') || !this.spareTileClicked) return;
    
        const i = parseInt(event.target.getAttribute('data-row'), 10);
        const j = parseInt(event.target.getAttribute('data-column'), 10);

       if(!this.canPlaceSpareTile(i,j)){
        return;
       }

                let simulateRemovedTile;

                // Common setup for all edges
                const currentSpareTilePattern = this.currentPlayer.spareTile.pattern;

                // Hide current player's spare tile for the duration of the hover
                const currentPlayerSpareTileElement = document.getElementById('player' + (this.currentPlayer === this.players[0] ? '1' : '2') + '-spare-tile');
                currentPlayerSpareTileElement.style.visibility = 'hidden';

    
            // Example for right column hover
            if (j === this.board.grid[0].length - 1) { // Example: Right column hover
                // Simulate the tile that would be pushed out (for UI update purposes)
                simulateRemovedTile = this.board.grid[i][0];
                for (let col = 0; col < this.board.grid[i].length; col++) {
                    const nextCol = (col + 1) % this.board.grid[i].length;
                    const cellElement = document.querySelector(`[data-row="${i}"][data-column="${col}"]`);
                    const tile = this.board.grid[i][col];
                    const nextTile = this.board.grid[i][nextCol];
        
                    // Shift the background pattern
                    if (nextCol === 0) {
                        cellElement.style.backgroundImage = `url('${this.currentPlayer.spareTile.getImageName()}')`;
                    } else {
                        cellElement.style.backgroundImage = `url('${nextTile.getImageName()}')`;
                    }
        
                    // Shift pieces and destinations visually
                    this.updateCellContentsForHover(cellElement, nextTile, simulateRemovedTile, col === this.board.grid[i].length - 1);
        
                    // Add border effect
                    cellElement.classList.add('highlight');
                    cellElement.classList.remove('validEdge');
                }
            }
            // Example for left column hover
            if (j === 0) { // Left column hover
                simulateRemovedTile = this.board.grid[i][this.board.grid[i].length - 1];
                for (let col = this.board.grid[i].length - 1; col >= 0; col--) {
                    const prevCol = col - 1 < 0 ? this.board.grid[i].length - 1 : col - 1;
                    const cellElement = document.querySelector(`[data-row="${i}"][data-column="${col}"]`);
                    const tile = this.board.grid[i][col];
                    const prevTile = this.board.grid[i][prevCol];

                    if (col === 0) {
                        cellElement.style.backgroundImage = `url('${this.currentPlayer.spareTile.getImageName()}')`;
                    } else {
                        cellElement.style.backgroundImage = `url('${prevTile.getImageName()}')`;
                    }

                    this.updateCellContentsForHover(cellElement, prevTile, simulateRemovedTile, col === 0);
                    cellElement.classList.add('highlight');
                    cellElement.classList.remove('validEdge');
                }
            }


            // Example for top row hover
            if (i === 0) { // Top row hover
                simulateRemovedTile = this.board.grid[this.board.grid.length - 1][j];
                for (let row = this.board.grid.length - 1; row >= 0; row--) {
                    const prevRow = row - 1 < 0 ? this.board.grid.length - 1 : row - 1;
                    const cellElement = document.querySelector(`[data-row="${row}"][data-column="${j}"]`);
                    const tile = this.board.grid[row][j];
                    const prevTile = this.board.grid[prevRow][j];

                    if (row === 0) {
                        cellElement.style.backgroundImage = `url('${this.currentPlayer.spareTile.getImageName()}')`;
                    } else {
                        cellElement.style.backgroundImage = `url('${prevTile.getImageName()}')`;
                    }

                    this.updateCellContentsForHover(cellElement, prevTile, simulateRemovedTile, row === 0);
                    cellElement.classList.add('highlight');
                    cellElement.classList.remove('validEdge');
                }
            }
            // Example for bottom row hover
            if (i === this.board.grid.length - 1) { // Bottom row hover
                simulateRemovedTile = this.board.grid[0][j];
                for (let row = 0; row < this.board.grid.length; row++) {
                    const nextRow = (row + 1) % this.board.grid.length;
                    const cellElement = document.querySelector(`[data-row="${row}"][data-column="${j}"]`);
                    const tile = this.board.grid[row][j];
                    const nextTile = this.board.grid[nextRow][j];

                    if (row === this.board.grid.length - 1) {
                        cellElement.style.backgroundImage = `url('${this.currentPlayer.spareTile.getImageName()}')`;
                    } else {
                        cellElement.style.backgroundImage = `url('${nextTile.getImageName()}')`;
                    }

                    this.updateCellContentsForHover(cellElement, nextTile, simulateRemovedTile, row === this.board.grid.length - 1);
                    cellElement.classList.add('highlight');
                    cellElement.classList.remove('validEdge')
                }
            }


            const opponentSpareTileElementId = 'player' + (this.currentPlayer === this.players[0] ? '2' : '1') + '-spare-tile';
            const opponentSpareTileElement = document.getElementById(opponentSpareTileElementId);

            if (simulateRemovedTile) {
                opponentSpareTileElement.style.backgroundImage = `url('${simulateRemovedTile.getImageName()}')`;
            } else {
                // In case there is no tile to simulate as removed, clear the background image
                opponentSpareTileElement.style.backgroundImage = '';
            }
        
    }

    updateCellContentsForHover(cellElement, nextTile, simulateRemovedTile, isLastCell) {
        // Clear existing contents
        cellElement.innerHTML = '';
    
        // Determine what content to display (either the next tile's content or the current player's spare tile for the last cell)
        const tileToDisplay = isLastCell ? this.currentPlayer.spareTile : nextTile;
    
        // If there's a piece, add it
        if (tileToDisplay.piece) {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'piece';
            pieceElement.style.backgroundColor = tileToDisplay.piece.getColour();
            cellElement.appendChild(pieceElement);
        }
    
        // If there's a destination, add it
        if (tileToDisplay.destination) {
            const destinationElement = document.createElement('div');
            destinationElement.className = 'destination';
            destinationElement.style.backgroundImage = `url('${tileToDisplay.getDestinationImageName()}')`;
            cellElement.appendChild(destinationElement);
        }
    }
    
    
    removeHighlightRowCol(event) {
        if (!this.spareTileClicked || !event.target.classList.contains('cell')) return;
    
        // Reset visibility of the current player's spare tile
        const currentPlayerSpareTileElement = document.getElementById('player' + (this.currentPlayer === this.players[0] ? '1' : '2') + '-spare-tile');
        currentPlayerSpareTileElement.style.visibility = 'visible';
    
        // Reset the opponent's spare tile to its original state
        const opponentSpareTileElement = document.getElementById('player' + (this.currentPlayer === this.players[0] ? '2' : '1') + '-spare-tile');
        opponentSpareTileElement.style.backgroundImage = this.getOtherPlayer().spareTile ? `url('${this.getOtherPlayer().spareTile.getImageName()}')` : '';
    
        // Remove any highlight effect
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('highlight'); // Remove the border effect
    
            // Retrieve the original state for each cell
            const i = parseInt(cell.getAttribute('data-row'), 10);
            const j = parseInt(cell.getAttribute('data-column'), 10);
            const originalTile = this.board.grid[i][j];
    
            // Reset cell's background image to its original state
            cell.style.backgroundImage = `url('${originalTile.getImageName()}')`;
    
            // Clear any temporary content (for hover effect) and restore original content
            this.updateCellContents(cell, originalTile);
        });

         // After removing 'highlight', reapply 'validEdge' to valid edge cells
        this.board.grid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellElement = document.querySelector(`[data-row="${rowIndex}"][data-column="${colIndex}"]`);
                if (this.canPlaceSpareTile(rowIndex, colIndex)) {
                    cellElement.classList.add('validEdge'); // Reapply 'validEdge' class
                }
            });
        });
    }
    

    updateCellContents(cellElement, tile) {
        cellElement.innerHTML = ''; // Clear existing contents
    
        if (tile.piece) {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'piece';
            pieceElement.style.backgroundColor = tile.piece.getColour();
            cellElement.appendChild(pieceElement);
        }
        if (tile.destination) {
            const destinationElement = document.createElement('div');
            destinationElement.className = 'destination';
            destinationElement.style.backgroundImage = `url('${tile.getDestinationImageName()}')`;
            cellElement.appendChild(destinationElement);
        }
    }
    
    
    
    handleEdgeTileClick(event) {
        if (!this.spareTileClicked) return; // Ensures that a spare tile was clicked before handling the edge tile click
    
        const cellElement = event.target.closest('.cell');
        if (!cellElement) return; // Ensures the click was on a cell
    
        const i = parseInt(cellElement.getAttribute('data-row'), 10);
        const j = parseInt(cellElement.getAttribute('data-column'), 10);

        if(!this.canPlaceSpareTile(i,j)){
            return;
        }
        // Check if it's an edge cell where a shift can occur
        if (i === 0 || i === this.board.grid.length - 1 || j === 0 || j === this.board.grid[0].length - 1) {
            this.updateUIflag = true; // Set flag to update the UI
            this.placeSpareTile(i, j); // Call existing logic to place the tile and update the board state
             // Manually remove the highlighting from all cells
             this.clearAllHighlights();
    }
}

    clearAllHighlights() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('highlight'); // Remove the border effect
            cell.classList.remove('invalid'); // Remove the border effect
            cell.classList.remove('validEdge');

        });
    }

    canPlaceSpareTile(row, col) {
        // Edge condition: Only allow placement on the board's edges
        const isEdgeTile = row === 0 || row === this.board.grid.length - 1 || col === 0 || col === this.board.grid[0].length - 1;
        
        if (!isEdgeTile) {
            return false; // If it's not an edge tile, immediately return false
        }
    
        // Prevent interaction with specific cells (the four corners and the middle cells on each side)
        if ((row === 0 && (col === 0 || col === 2 || col === 4 || col === 6)) || 
            (row === 6 && (col === 0 || col === 2 || col === 4 || col === 6)) ||
            (col === 0 && (row === 0 || row === 2 || row === 4 || row === 6)) ||
            (col === 6 && (row === 0 || row === 2 || row === 4 || row === 6))) {
            return false;
        }
    
        // Check if the last action was placing a tile at the direct opposite position
        if (this.isDirectOppositeEndBlocked(row, col)) {
            return false;
        }
    
        return true; // Allow placement if none of the conditions are met
    }
    
    isDirectOppositeEndBlocked(row, col) {
        // Calculate the direct opposite position
        let oppositeRow = (row === 0) ? this.board.grid.length - 1 : (row === this.board.grid.length - 1) ? 0 : row;
        let oppositeCol = (col === 0) ? this.board.grid[0].length - 1 : (col === this.board.grid[0].length - 1) ? 0 : col;
        
        // Check if the direct opposite position was the last clicked position
        if (this.lastClickedRow === oppositeRow && this.lastClickedCol === oppositeCol) {
            return true; // Block if trying to place at the direct opposite end
        }
    
        // Check if there's a piece or destination at the direct opposite position
        const tileAtOpposite = this.board.grid[oppositeRow][oppositeCol];
        if (tileAtOpposite.piece || tileAtOpposite.destination) {
            return true; // Block if there's a piece or destination at the direct opposite
        }
    
        return false; // Allow if there's no piece/destination and it's not the direct opposite of the last move
    }
    

    handlePieceClick(pieceElement) {
        this.selectedPiece = pieceElement; // Store the clicked piece for reference
    
        // Extract the row and column from the piece's parent cell
        const cell = pieceElement.closest('.cell');
        const selectedPieceRow = parseInt(cell.getAttribute('data-row'), 10);
        const selectedPieceCol = parseInt(cell.getAttribute('data-column'), 10);
    
        // Highlight valid moves for the selected piece
        this.highlightValidMoves(selectedPieceRow, selectedPieceCol);
    }
    
    handleCellClickForPiece(event) {
        if (!this.selectedPiece) return; // Exit if no piece is selected
    
    
        const targetCell = event.target.closest('.cell'); // Ensure we're targeting the cell
        if (!targetCell) return; // Exit if not a cell
    
        const targetRow = parseInt(targetCell.getAttribute('data-row'), 10);
        const targetCol = parseInt(targetCell.getAttribute('data-column'), 10);
    
        // Proceed with existing logic to check if move is valid and then place the piece
        const isValidMove = this.currentPlayerValidMoves.some(move => move.row === targetRow && move.col === targetCol);
    
        if (isValidMove) {
            this.updateUIflag = true;
            this.placePiece(targetRow, targetCol);
            this.updateUI(); // Update the UI to reflect the new state
            this.updateGameInfo();
            this.pieceClickable = false; // Disable piece clicking after moving
            this.selectedPiece = null; // Deselect the piece
            this.clearAllHighlights(); // Clear all highlights
            this.updateUIflag = false;
        }
    }
    
    
        ///////////////////////////////////////////////////////////////////
        //////                                                  ///////////
        //////                                                  ///////////
        //////                VALID MOVES PART                  ///////////
        //////                                                  ///////////
        //////                                                  ///////////
        ///////////////////////////////////////////////////////////////////
    
        
        highlightValidMoves(selectedPieceRow, selectedPieceCol) {
            this.clearAllHighlights();
        
            const validMoves = this.findValidMovesFromCurrentPiecePosition();
        
            // Highlight valid moves
            validMoves.forEach(move => {
                const cellElement = document.querySelector(`.cell[data-row="${move.row}"][data-column="${move.col}"]`);
                if (cellElement) {
                    cellElement.classList.add('highlight'); // Use existing highlight style
                }
            });
        
            // Highlight opponent's pieces and the current player's piece differently
                this.opponentPiecePositions.forEach(move => {
                const cellElement = document.querySelector(`.cell[data-row="${move.row}"][data-column="${move.col}"]`);
                if (cellElement) {
                    cellElement.classList.add('invalid'); // Apply red border for special highlighting
                }
            });
        
            // Highlight the current player's piece tile with a red border
            const currentPlayerPieceCell = document.querySelector(`.cell[data-row="${selectedPieceRow}"][data-column="${selectedPieceCol}"]`);
            if (currentPlayerPieceCell) {
                currentPlayerPieceCell.classList.add('invalid'); // Apply red border for special highlighting
            }
        }
        
    
    


    
    
        
    updateGameInfo() {
        // Update current player info
        const currentPlayerElement = document.getElementById('current-player');
        currentPlayerElement.textContent = `Current player: ${this.currentPlayer.name}`;
    
        // Update current piece position info
        const piecePosition = this.currentPlayer.getPiecePosition(); // Assuming this method returns the position
        const currentPiecePositionElement = document.getElementById('current-piece-position');
        if (piecePosition) {
            currentPiecePositionElement.textContent = `Current piece position: Row ${piecePosition.row}, Column ${piecePosition.col}`;
        } else {
            currentPiecePositionElement.textContent = "Current piece position: Not placed";
        }
    
        // Handle the new message for returning to the initial position
        const currentDestinationElement = document.getElementById('current-destination');
        const currentDestination = this.currentPlayer.getCurrentDestination();
        if (currentDestination === "return") {
            currentDestinationElement.textContent = "Head back to initial position!";
        } else if (currentDestination) {
            currentDestinationElement.textContent = `Head to: ${currentDestination.toUpperCase()}!`;
        } else {
            currentDestinationElement.textContent = "No current destination";
        }
    }
    
        ///////////////////////////////////////////////////////////////////
        //////                                                  ///////////
        //////                                                  ///////////
        //////                DESTINATIONS PART                 ///////////
        //////                                                  ///////////
        //////                                                  ///////////
        ///////////////////////////////////////////////////////////////////

    assignRandomDestinations(player1, player2) {
        const allDestinations = ['moon', 'sun', 'galaxy', 'mountain'];
        player1.destinations = this.shuffleArray([...allDestinations]);
        player2.destinations = this.shuffleArray([...allDestinations]);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    renderDestinations() {
        ['player1', 'player2'].forEach((playerId, index) => {
            const destinationsContainer = document.getElementById(`${playerId}-destinations`);
            destinationsContainer.innerHTML = ''; // Clear existing content
            this.players[index].destinations.forEach((destination, destinationIndex) => {
                const destinationElement = document.createElement('div');
                destinationElement.className = 'destinationDiv';
                destinationElement.style.backgroundImage = `url('${destination}.png')`;
    
                // Add 'covered' class to all destinations except the first one
                if (destinationIndex > this.players[index].currentDestinationIndex) {
                    destinationElement.classList.add('covered');
                }
    
                destinationsContainer.appendChild(destinationElement);
            });
        });
    }
            // Function to reveal the next destination for the current player
        revealNextDestination() {
            // Determine the currentPlayer's index
            const currentPlayerIndex = this.players.indexOf(this.currentPlayer);
            const playerId = currentPlayerIndex + 1; // Assuming player IDs are 1 and 2

            const destinationsContainer = document.getElementById(`player${playerId}-destinations`);
            const destinationDivs = destinationsContainer.querySelectorAll('.destinationDiv');

            // Loop through the destinationDivs to find the first covered destination
            for (let i = 0; i < destinationDivs.length; i++) {
                if (destinationDivs[i].classList.contains('covered')) {
                    // This assumes that reaching a destination means revealing the next one
                    if (i <= this.currentPlayer.currentDestinationIndex) {
                        destinationDivs[i].classList.remove('covered');
                        destinationDivs[i].classList.add('revealed'); // Adjust CSS as needed
                    }
                    break; // Stop after handling the first applicable destination
                }
            }
        }

        ///////////////////////////////////////////////////////////////////
        //////                                                  ///////////
        //////                                                  ///////////
        //////                AI PART                           ///////////
        //////                                                  ///////////
        //////                                                  ///////////
        ///////////////////////////////////////////////////////////////////
       
        executeAIMove() {
            // Assuming aiPlayer has been properly initialized and linked to the game
            let bestMove = this.aiPlayer.findBestMove(this);
            if (bestMove) {
                // Temporarily set the flags as if the AI is a player making the moves
                this.updateUIflag = true; // To enable UI updates
                this.spareTileClicked = true; // Simulate that the spare tile was clicked for placement
        
                // Simulate placing the spare tile
                this.placeSpareTile(bestMove.spareTilePlacement.row, bestMove.spareTilePlacement.col);
                this.clearAllHighlights();
        
                // Reset the spareTileClicked flag after placing the tile
                this.spareTileClicked = false;
    
                this.selectedPiece = this.getPlayerPiece();
                this.updateUIflag = true; // To enable UI updates

        
                // Simulate moving the piece
                // Assuming the pieceMove part of bestMove contains the target row and col for the piece's new position
                this.placePiece(bestMove.pieceMove.row, bestMove.pieceMove.col);
        
                // Update the UI to reflect the AI's move
                this.updateUI();
                this.updateGameInfo();
                this.pieceClickable = false; // Disable piece clicking after moving
                this.selectedPiece = null; // Deselect the piece
                this.clearAllHighlights(); // Clear all highlights
                this.updateUIflag = false;
                console.log(this.aiPlayer.hasReturnedToInitialPosition())
            }
        }
        ///////////////////////////////////////////////////////////////////
        //////                                                  ///////////
        //////                                                  ///////////
        //////                LOGIC PART                        ///////////
        //////                                                  ///////////
        //////                                                  ///////////
        ///////////////////////////////////////////////////////////////////
              
        // Revised getPlayerPiece method to return the DOM element of the current player's piece
        getPlayerPiece() {
            // Assuming each cell has a unique ID or a way to select them all
            const cells = document.querySelectorAll('.cell'); // Adjust the selector as needed
            for (let cell of cells) {
                const pieceElement = cell.querySelector('.piece');
                if (pieceElement && pieceElement.style.backgroundColor === this.currentPlayer.colour) {
                    return pieceElement; // Return the DOM element of the piece
                }
            }
            return null; // Return null if no piece found for the current player
        }
      
        getOtherPlayer() {
            return (this.currentPlayer === this.players[0]) ? this.players[1] : this.players[0];
        }

        shiftUp(col) {
            let topCell = new Tile(this.board.grid[0][col].pattern);
            if (this.board.grid[0][col].destination) {
                topCell.destination = new Destination(this.board.grid[0][col].destination.colour);
            }
            if (this.board.grid[0][col].piece) {
                topCell.piece = new Piece(this.board.grid[0][col].piece.colour);
            }
            for (let row = 0; row < this.board.grid.length - 1; row++) {
                this.board.grid[row][col] = this.board.grid[row + 1][col];
            }
            this.board.grid[this.board.grid.length - 1][col] = topCell;
        
            return topCell;
        }
        
        shiftDown(col) {
            let bottomCell = new Tile(this.board.grid[this.board.grid.length - 1][col].pattern);
            if (this.board.grid[this.board.grid.length - 1][col].destination) {
                bottomCell.destination = new Destination(this.board.grid[this.board.grid.length - 1][col].destination.colour);
            }
            if (this.board.grid[this.board.grid.length - 1][col].piece) {
                bottomCell.piece = new Piece(this.board.grid[this.board.grid.length - 1][col].piece.colour);
            }
            for (let row = this.board.grid.length - 1; row > 0; row--) {
                this.board.grid[row][col] = this.board.grid[row - 1][col];
            }
            this.board.grid[0][col] = bottomCell;
        
            return bottomCell;
        }
        
        shiftLeft(row) {
            let leftCell = new Tile(this.board.grid[row][0].pattern);
            if (this.board.grid[row][0].destination) {
                leftCell.destination = new Destination(this.board.grid[row][0].destination.colour);
            }
            if (this.board.grid[row][0].piece) {
                leftCell.piece = new Piece(this.board.grid[row][0].piece.colour);
            }
            for (let col = 0; col < this.board.grid[row].length - 1; col++) {
                this.board.grid[row][col] = this.board.grid[row][col + 1];
            }
            this.board.grid[row][this.board.grid[row].length - 1] = leftCell;
        
            return leftCell;
        }
        
        shiftRight(row) {
            let rightCell = new Tile(this.board.grid[row][this.board.grid[row].length - 1].pattern);
            if (this.board.grid[row][this.board.grid[row].length - 1].destination) {
                rightCell.destination = new Destination(this.board.grid[row][this.board.grid[row].length - 1].destination.colour);
            }
            if (this.board.grid[row][this.board.grid[row].length - 1].piece) {
                rightCell.piece = new Piece(this.board.grid[row][this.board.grid[row].length - 1].piece.colour);
            }
            for (let col = this.board.grid[row].length - 1; col > 0; col--) {
                this.board.grid[row][col] = this.board.grid[row][col - 1];
            }
            this.board.grid[row][0] = rightCell;
        
            return rightCell;
        }

        //piece section for logic
    placePiece(row, col) {
        // First, ensure that the selected piece belongs to the current player
    if (!this.selectedPiece || this.selectedPiece.style.backgroundColor !== this.currentPlayer.colour) {
        console.error("Attempted to move an invalid or opponent's piece.");
        return; // Optionally, provide user feedback here
    }

    // Retrieve the current player's previous piece position
    let prevPosition = this.currentPlayer.getPiecePosition();

    // Update the board to remove the piece from its previous position if it exists
    if (prevPosition && this.board.grid[prevPosition.row][prevPosition.col].piece &&
        this.board.grid[prevPosition.row][prevPosition.col].piece.getColour() === this.currentPlayer.colour) {
        this.board.grid[prevPosition.row][prevPosition.col].piece = null;
    }

        // Update the board to add the piece to its new position
        this.board.grid[row][col].piece = new Piece(this.currentPlayer, row, col); // Assume Piece constructor takes a player, row, and col
    
        // Update the currentPlayer's piece position
        this.currentPlayer.updatePiecePosition(row, col);
    
        // After moving the piece, perform any additional game state updates as needed
            // For example, checking for win conditions or triggering any special board effects
        // After placing the piece, check if it matches the current destination
        const currentDestination = this.currentPlayer.getCurrentDestination();
        const placedTile = this.board.grid[row][col];
     
        // Assuming the tile has a property 'destination' that can be 'moon', 'sun', 'galaxy', 'mountain', etc.
        if (placedTile.destination && placedTile.destination.type === currentDestination) {
            console.log(`Destination ${currentDestination} reached. Move to the next destination.`);
            this.currentPlayer.advanceToNextDestination();
            this.revealNextDestination();
        }
        // Note: Depending on your game's rules, you might want to add more checks,
        // for instance, to ensure the move is valid (e.g., within bounds, not jumping over obstacles).
    
        // Update the UI to reflect the new board state
        // Assuming this is inside a method after moving the piece
        if (this.currentPlayer.getCurrentDestination() === "return" && this.currentPlayer.hasReturnedToInitialPosition()) {
            this.gameOver = true;
            // Update the UI immediately before showing the alert
            if (this.updateUIflag) {
                this.updateUI(); // Make sure this actually updates the UI as needed
                // Use setTimeout to delay the alert until after the UI has had a chance to update
                setTimeout(() => {
                    alert(`Player ${this.currentPlayer.name} wins!`);
                }, 100); // Adjust the delay as needed, 100ms is usually enough
            }
            // other game-ending logic...
        } else {
            this.nextRound = true;
            this.selectedPiece = null;
        }
        

        this.switchTurn();
    }

        // logic for pattern connectivity

        getValidMoves(row, col) {
            const patternRules = {
                'horizontal': {
                    'left': ['horizontal', 'L-up-right', 'L-down-right', 'T-up', 'T-down', 'T-right'],
                    'right': ['horizontal', 'L-up-left', 'L-down-left', 'T-up', 'T-down', 'T-left'],
                    'up' : [],
                    'down' : []
                },
                'vertical': {
                    'up': ['vertical', 'L-down-left', 'L-down-right', 'T-left', 'T-right', 'T-down'],
                    'down': ['vertical', 'L-up-left', 'L-up-right', 'T-left', 'T-right', 'T-up'],
                    'left' : [],
                    'right' : []
                },
                'L-up-right': {
                    'up': ['vertical', 'T-left', 'T-right', 'T-down', 'L-down-left', 'L-down-right'],
                    'right': ['horizontal', 'T-up', 'T-down', 'T-left', 'L-up-left', 'L-down-left'],
                    'left' : [],
                    'down' : []
                },
                'L-up-left': {
                    'up': ['vertical', 'T-left', 'T-right', 'T-down', 'L-down-left', 'L-down-right'],
                    'left': ['horizontal', 'T-up', 'T-down', 'T-right', 'L-up-right', 'L-down-right'],
                    'right' : [],
                    'down' : []
                },
                'L-down-right': {
                    'right': ['horizontal', 'T-up', 'T-down', 'T-left', 'L-up-left', 'L-down-left'],
                    'down': ['vertical', 'T-left', 'T-right', 'T-up', 'L-up-left', 'L-up-right'],
                    'left' : [],
                    'up' : []
                },
                'L-down-left': {
                    'left': ['horizontal', 'T-up', 'T-down', 'T-right', 'L-up-right', 'L-down-right'],
                    'down': ['vertical', 'T-left', 'T-right', 'T-up', 'L-up-left', 'L-up-right'],
                    'right' : [],
                    'up' : []
                },
                'T-up': {
                    'left': ['horizontal', 'L-down-right', 'L-up-right', 'T-down', 'T-right', 'T-up'],
                    'right': ['horizontal', 'L-down-left', 'L-up-left', 'T-down', 'T-left', 'T-up'],
                    'up': ['vertical', 'L-down-left', 'L-down-right', 'T-left', 'T-right', 'T-down'],
                    'down' : []
                },
                'T-down': {
                    'left': ['horizontal', 'L-down-right', 'L-up-right', 'T-up', 'T-down', 'T-right'],
                    'right': ['horizontal', 'L-down-left', 'L-up-left', 'T-up', 'T-left', 'T-down'],
                    'down': ['vertical', 'L-up-left', 'L-up-right', 'T-left', 'T-right', 'T-up'],
                    'up' : []
                },
                'T-right': {
                    'up': ['vertical', 'L-down-left', 'L-down-right', 'T-left', 'T-down', 'T-right'],
                    'down': ['vertical', 'L-up-left', 'L-up-right', 'T-left', 'T-up', 'T-right'],
                    'right': ['horizontal', 'L-up-left', 'L-down-left', 'T-up', 'T-down', 'T-left'],
                    'left' : []
                },
                'T-left': {
                    'up': ['vertical', 'L-down-left', 'L-down-right', 'T-right', 'T-down', 'T-left'],
                    'down': ['vertical', 'L-up-left', 'L-up-right', 'T-right', 'T-up', 'T-left'],
                    'left': ['horizontal', 'L-up-right', 'L-down-right', 'T-up', 'T-down', 'T-right'],
                    'right' : []
                }
            };        
        
            const validMoves = [];
            const directions = {
                'up': [-1, 0],
                'down': [1, 0],
                'left': [0, -1],
                'right': [0, 1]
            };
        
            Object.entries(directions).forEach(([direction, [dx, dy]]) => {
                const newRow = row + dx;
                const newCol = col + dy;
        
                if (newRow >= 0 && newRow < this.board.grid.length && newCol >= 0 && newCol < this.board.grid[0].length) {
                    const currentPattern = this.board.grid[row][col].pattern;
                    const adjacentPattern = this.board.grid[newRow][newCol].pattern;
        
                    if (patternRules[currentPattern] && patternRules[currentPattern][direction].includes(adjacentPattern)) {
                        validMoves.push({
                            row: newRow,
                            col: newCol,
                            direction: direction,
                            pattern: adjacentPattern
                        });
                    }
                }
            });
        
            return validMoves;
        }
        
        // In the Game class
    
        findAllValidMoves(row, col, visited = {}, validMoves = [], isInitialCall = true) {
            const cellKey = `${row},${col}`;
        
            if (visited[cellKey]) return;
        
            visited[cellKey] = true;
        
            const moves = this.getValidMoves(row, col);
            const self = this;
        
            moves.forEach(function(move) {
                const { row: nextRow, col: nextCol } = move;
                const nextCellKey = `${nextRow},${nextCol}`;
        
                if (!visited[nextCellKey]) {
                    // Directly add move without the initial position check
                    validMoves.push(move);
                    
                    self.findAllValidMoves(nextRow, nextCol, visited, validMoves, false);
                }
            });
        
            // Only return the moves excluding the initial call position to prevent it from being a valid move
            if (isInitialCall) {
                return validMoves.filter(v => !(v.row === row && v.col === col));
            } else {
                return validMoves;
            }
        }
        
    
    
        findValidMovesFromCurrentPiecePosition() {
            const piecePosition = this.currentPlayer.getPiecePosition();
            if (!piecePosition) {
                console.log("Current player has no piece on the board.");
                return [];
            }
            const {row, col} = piecePosition;
        
            // Find all valid moves from this position
            let validMoves = this.findAllValidMoves(row, col);
            const opponentColor = this.getOtherPlayer().colour;
        
            // Split valid moves into moves without an opponent's piece and moves with an opponent's piece
            this.opponentPiecePositions = []; // Store positions with opponent's pieces
            validMoves = validMoves.filter(move => {
                const tile = this.board.grid[move.row][move.col];
                if (tile.piece && tile.piece.getColour() === opponentColor) {
                    this.opponentPiecePositions.push(move);
                    return false; // Exclude from valid moves
                }
                return true;
            });
        
            this.currentPlayerValidMoves = validMoves;
        
            return validMoves;

        }

        placeSpareTile(row, col) {

    
            if (this.canPlaceSpareTile(row, col)){
            
            let removedTile;
    
                // Save previous position of the piece
            let prevRow = this.currentPlayer.pieceRow;
            let prevCol = this.currentPlayer.pieceCol;
    
            // Determine which shift operation to perform and update piece position if necessary
            if (row === 0) {
                removedTile = this.shiftDown(col);
                if (prevCol === col) this.currentPlayer.updatePiecePosition((prevRow + 1) % this.board.grid.length, col);
            } else if (row === this.board.grid.length - 1) {
                removedTile = this.shiftUp(col);
                if (prevCol === col) this.currentPlayer.updatePiecePosition((this.board.grid.length + prevRow - 1) % this.board.grid.length, col);
            } else if (col === 0) {
                removedTile = this.shiftRight(row);
                if (prevRow === row) this.currentPlayer.updatePiecePosition(row, (prevCol + 1) % this.board.grid[row].length);
            } else if (col === this.board.grid[0].length - 1) {
                removedTile = this.shiftLeft(row);
                if (prevRow === row) this.currentPlayer.updatePiecePosition(row, (this.board.grid[row].length + prevCol - 1) % this.board.grid[row].length);
            }
    
        
            // Place the removed tile onto the opponent's spareTile
            this.getOtherPlayer().spareTile = removedTile;
    
                // Determine the new position for the opponent's piece if affected
            const opponent = this.getOtherPlayer();
            const oppPiecePos = opponent.getPiecePosition(); // Assuming this method exists and returns { row, col }
    
            if (oppPiecePos) {
                let newPos = { ...oppPiecePos }; // Copy to avoid mutating the original position directly
    
                if (row === 0 && oppPiecePos.col === col) {
                    // Shifting down
                    newPos.row = (oppPiecePos.row + 1) % this.board.grid.length;
                } else if (row === this.board.grid.length - 1 && oppPiecePos.col === col) {
                    // Shifting up
                    newPos.row = oppPiecePos.row === 0 ? this.board.grid.length - 1 : oppPiecePos.row - 1;
                } else if (col === 0 && oppPiecePos.row === row) {
                    // Shifting right
                    newPos.col = (oppPiecePos.col + 1) % this.board.grid[row].length;
                } else if (col === this.board.grid[row].length - 1 && oppPiecePos.row === row) {
                    // Shifting left
                    newPos.col = oppPiecePos.col === 0 ? this.board.grid[row].length - 1 : oppPiecePos.col - 1;
                }
    
                // Check if the opponent's piece position actually changes
                if (newPos.row !== oppPiecePos.row || newPos.col !== oppPiecePos.col) {
                    // Update the opponent's piece position
                    opponent.updatePiecePosition(newPos.row, newPos.col);
                }
            }
    
        
            // Remove the currentPlayer's spareTile and place it onto the empty cell
            let spareTile = this.currentPlayer.spareTile;
            this.board.grid[row][col] = spareTile;
            this.currentPlayer.spareTile = null;
    
            // Update the UI
            if (this.updateUIflag) {
                const currentPlayerSpareTileElement = document.getElementById('player' + (this.currentPlayer === this.players[0] ? '1' : '2') + '-spare-tile');
                currentPlayerSpareTileElement.classList.remove('spare-tile-selected');
                currentPlayerSpareTileElement.style.visibility = 'visible';
                this.updateUI();
                this.updateGameInfo();
            }
            this.lastClickedRow = row;
            this.lastClickedCol = col;
            // Switch the current player
            this.updateUIflag = false;
            this.spareTileClicked = false;
            // Make the current player's piece clickable after placing a spare tile
            if(this.findValidMovesFromCurrentPiecePosition().length == 0){
                this.pieceClickable = false;
                this.nextRound = true;
                this.switchTurn()
    
            } else{
                this.pieceClickable = true;
                setTimeout(() => {
                    const pieceElement = this.findPlayerPieceElement(this.currentPlayer);
                    if (pieceElement) {
                        pieceElement.click();
                    }
                }, 500); // Delay of 500 milliseconds
            }
                // this.makePieceClickablex();
            }
        }

        findPlayerPieceElement(player) {
            // Assuming each player's piece has a unique color or identifier that can be used to find it
            const pieceColor = player.colour; // Adjust based on your game's logic
            const pieces = document.querySelectorAll('.piece');
            for (const piece of pieces) {
                if (piece.style.backgroundColor === pieceColor) {
                    return piece; // Found the player's piece element
                }
            }
            return null; // No piece found for the player
        }
        
}

