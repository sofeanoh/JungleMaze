import { Board } from './board.js';
import { Player } from './player.js';
import { Piece } from './piece.js';
import { Destination } from './destination.js';
import { Tile } from './tile.js';
import { Game } from './game.js';


export class AIPlayer extends Player {
    constructor(name, colour, row, col, maxDepth) {
        super(name, colour, row, col); // Call the parent class constructor with parameters
        this.maxDepth = maxDepth;
    }


      // This method assumes the existence of a method to deeply clone the game state
      findBestMove(state) {
        const clonedstate = this.deepCloneState(state);
        // Generate all possible moves for the AI player
        const allPossibleMoves = this.generateAllPossibleMoves(clonedstate);
        console.log(allPossibleMoves);
        
        let bestScore = -Infinity;
        let bestMove = null;

        allPossibleMoves.forEach(move => {
        // Clone the state state for isolated simulation
        const clonedstateForSimulation = this.deepCloneState(clonedstate);
        
        // Apply the move to the cloned state state
        const updateState = this.simulateMove(clonedstateForSimulation, move);
        
        // Now, the cloned state state (clonedstateForSimulation) represents the moveOutcome
        // Evaluate this state state using minimax
        let score = this.minimax(updateState, this.maxDepth, true);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                // Undo the move is not necessary as we operate on a cloned state
        });
        console.log("best move:", bestMove)
        console.log( "score:", bestScore)
        return bestMove;
    }

    deepCloneState(state) {
        // Create a shallow clone of the state to start with
        const clonedState = Object.assign(Object.create(Object.getPrototypeOf(state)), state);
    
        // Ensure methods are correctly linked
        // This step is crucial to ensure that clonedState has all the methods available
        Object.setPrototypeOf(clonedState, Game.prototype);
    
        // Deep clone players
        clonedState.players = state.players.map(player => this.clonePlayer(player));
    
        // Update currentPlayer to reference the cloned player
        clonedState.currentPlayer = clonedState.players.find(player => player.name === state.currentPlayer.name);
    
        // Deep clone board
        clonedState.board = this.cloneBoard(state.board, clonedState.players);
    
        // Other properties such as gameOver and aiPlayer can be directly copied
        clonedState.gameOver = state.gameOver;
        clonedState.aiPlayer = this; // Assuming aiPlayer does not hold state or its state is not affected by the game directly
    
        return clonedState;
    }
    
    
    clonePlayer(player) {
        const clonedPlayer = new Player(player.name, player.colour, player.pieceRow, player.pieceCol);
        if (player.spareTile) clonedPlayer.spareTile = this.cloneTile(player.spareTile);
        // Repeat for other player properties that need deep cloning
         // Deep clone destinations if they are objects
         clonedPlayer.destinations = player.destinations ? [...player.destinations] : null;

         // Clone other necessary properties
         clonedPlayer.currentDestinationIndex = player.currentDestinationIndex;
         clonedPlayer.initialRow = player.initialRow;
         clonedPlayer.initialCol = player.initialCol;
         
        return clonedPlayer;
    }
    
    cloneBoard(board, players) {
        const clonedBoard = new Board(); // Adjust this if your Board constructor requires arguments
        clonedBoard.grid = board.grid.map(row => row.map(tile => this.cloneTile(tile, players)));
        // Repeat for other board properties that need deep cloning
        return clonedBoard;
    }
    
    cloneTile(tile, players) {
        const clonedTile = new Tile(tile.pattern); // Adjust this according to your Tile constructor
        if (tile.piece) {
            const ownerPlayer = players.find(player => player.name === tile.piece.player.name);
            clonedTile.piece = new Piece(ownerPlayer, tile.piece.row, tile.piece.col);
        }
        if (tile.destination) {
            clonedTile.destination = new Destination(tile.destination.type);
        }
        // Repeat for other tile properties that need deep cloning
        return clonedTile;
    }
    

    

    simulateMove(state, move) {
        // Simulate both placing a spare tile and moving a piece according to the move parameter
        // First, simulate placing the spare tile
        this.placeSpareTileSimulation(state, move.spareTilePlacement.row, move.spareTilePlacement.col);
        const updatedState = this.placePieceSimulation(state, move.pieceMove.row, move.pieceMove.col);

        // Before returning the updated state, ensure it has the correct prototype
        Object.setPrototypeOf(updatedState, Object.getPrototypeOf(state));
        return updatedState;

}

    minimax(state, depth, isMaximizingPlayer) {
        // Base case: if the state is over or the maximum depth is reached
        if (state.gameOver === true|| depth === this.maxDepth) {
            const heuristicVal = this.evaluateBoard(state);
            console.log('heuristic:', heuristicVal, { pieceRow :state.currentPlayer.pieceRow, pieceCol : state.currentPlayer.pieceCol });
            return heuristicVal;
        }

        if (isMaximizingPlayer) {
            let maxScore = -Infinity;
            // Generate all possible moves for the maximizing player
            const allPossibleMoves = this.generateAllPossibleMoves(state);
            for (const move of allPossibleMoves) {
                // Simulate the move
                const clonedstate = this.deepCloneState(state);
                const updatedClonedState = this.simulateMove(clonedstate, move);
                // Recursively call minimax for the opponent's move (minimizing player)
                const score = this.minimax(updatedClonedState, depth - 1, false);
                maxScore = Math.max(maxScore, score);
                // Undo the move if necessary
            }
            return maxScore;
        } else {
            let minScore = Infinity;

            // Generate all possible moves for the minimizing player
            const allPossibleMoves = this.generateAllPossibleMoves(state);
            for (const move of allPossibleMoves) {
                // Simulate the move
                const clonedstate = this.deepCloneState(state);
                const updatedClonedState = this.simulateMove(clonedstate, move);
                // Recursively call minimax for the opponent's move (maximizing player)
                const score = this.minimax(updatedClonedState, depth - 1, true);
                minScore = Math.min(minScore, score);
                // Undo the move if necessary
            }
            return minScore;
        }
    }

    evaluateBoard(state) {
        const aiPlayer = state.currentPlayer; // Assuming the AI is the current player
        const piecePos = aiPlayer.getPiecePosition(); // { row, col }
    
        let score = 0;
    
        if (aiPlayer.getCurrentDestination() === "return") {
            // When the AI needs to return to its initial position, calculate score based on the distance to the initial position
            const distanceToInitial = Math.abs(piecePos.row - aiPlayer.initialRow) + Math.abs(piecePos.col - aiPlayer.initialCol);
            score += 1000 - distanceToInitial; // Encourage moves that decrease the distance to the initial position
        } else {
            // For other destinations, proceed as before
            const destinationType = aiPlayer.getCurrentDestination(); // Assuming this returns a destination type like 'moon', 'sun', etc.
            const tile = state.board.grid[piecePos.row][piecePos.col];
    
            // Check if the tile has a destination and if it matches the AI player's current destination
            if (tile.destination && tile.destination.type === destinationType) {
                score += 1000; // High score for reaching the destination
            } else {
                // If not at the destination, calculate the Manhattan distance to the destination as a fallback
                const destinationCoords = this.getDestinationCoords(state, destinationType);
                if (destinationCoords) { // Ensure destinationCoords is not null
                    const distance = Math.abs(piecePos.row - destinationCoords.row) + Math.abs(piecePos.col - destinationCoords.col);
                    score += 1000 - distance; // Favor closer distances
                } else {
                    // If destinationCoords is null, handle appropriately, possibly with a default score adjustment
                    score -= 500; // Penalize if the destination type is not found, adjust as needed
                }
            }
        }
    
        return score;
    }
    
    
    
    getDestinationCoords(state, destinationType) {
        for (let row = 0; row < state.board.grid.length; row++) {
            for (let col = 0; col < state.board.grid[0].length; col++) {
                const tile = state.board.grid[row][col];
                if (tile.destination && tile.destination.type === destinationType) {
                    return { row, col }; // Return the coordinates of the destination
                }
            }
        }
        return null; // Return null if the destination type is not found
    }
    

    generateSpareTilePlacements(state) {
        let placements = [];
        // Example logic for generating placements
        // Adapt this based on  state's rules for spare tile placement
        for (let row = 0; row < state.board.grid.length; row++) {
            for (let col = 0; col < state.board.grid[0].length; col++) {
                // Assuming a method that checks if a spare tile can be legally placed at the given position
                if (this.canPlaceSpareTile(state, row, col)) {
                    placements.push({row: row, col: col});
                }
            }
        }
        return placements;
    }

    generateAllPossibleMoves(state) {
        let allPossibleMoves = [];
        
        // Generate all possible spare tile placements
        const spareTilePlacements = this.generateSpareTilePlacements(state);
        
        spareTilePlacements.forEach(spareTilePlacement => {

            const clonedstate = this.deepCloneState(state);
            // Simulate placing the spare tile
            this.placeSpareTileSimulation(clonedstate, spareTilePlacement.row, spareTilePlacement.col);

            clonedstate.selectedPiece = clonedstate.getPlayerPiece();
            
            // After placing the spare tile, find all valid piece moves
            const pieceMoves = clonedstate.findValidMovesFromCurrentPiecePosition();
         
            pieceMoves.forEach(pieceMove => {
                allPossibleMoves.push({
                    spareTilePlacement: spareTilePlacement,
                    pieceMove: pieceMove
                });
            });
            
            // // Undo the spare tile placement simulation
            // state.undoPlaceSpareTileSimulation();
        });
    
        return allPossibleMoves;
    }

    isgameOver(state) {
        return state.gameOver === true;
    }
    
    placeSpareTileSimulation(state, row, col) {

        if (this.canPlaceSpareTile(state, row, col)){
        
            let removedTile;
    
                // Save previous position of the piece
            let prevRow = state.currentPlayer.pieceRow;
            let prevCol = state.currentPlayer.pieceCol;
    
            // Determine which shift operation to perform and update piece position if necessary
            if (row === 0) {
                removedTile = state.shiftDown(col);
                if (prevCol === col) state.currentPlayer.updatePiecePosition((prevRow + 1) % state.board.grid.length, col);
            } else if (row === state.board.grid.length - 1) {
                removedTile = state.shiftUp(col);
                if (prevCol === col) state.currentPlayer.updatePiecePosition((state.board.grid.length + prevRow - 1) % state.board.grid.length, col);
            } else if (col === 0) {
                removedTile = state.shiftRight(row);
                if (prevRow === row) state.currentPlayer.updatePiecePosition(row, (prevCol + 1) % state.board.grid[row].length);
            } else if (col === state.board.grid[0].length - 1) {
                removedTile = state.shiftLeft(row);
                if (prevRow === row) state.currentPlayer.updatePiecePosition(row, (state.board.grid[row].length + prevCol - 1) % state.board.grid[row].length);
            }
    
        
            // Place the removed tile onto the opponent's spareTile
            state.getOtherPlayer().spareTile = removedTile;
    
                // Determine the new position for the opponent's piece if affected
            const opponent = state.getOtherPlayer();
            const oppPiecePos = opponent.getPiecePosition(); // Assuming state method exists and returns { row, col }
    
            if (oppPiecePos) {
                let newPos = { ...oppPiecePos }; // Copy to avoid mutating the original position directly
    
                if (row === 0 && oppPiecePos.col === col) {
                    // Shifting down
                    newPos.row = (oppPiecePos.row + 1) % state.board.grid.length;
                } else if (row === state.board.grid.length - 1 && oppPiecePos.col === col) {
                    // Shifting up
                    newPos.row = oppPiecePos.row === 0 ? state.board.grid.length - 1 : oppPiecePos.row - 1;
                } else if (col === 0 && oppPiecePos.row === row) {
                    // Shifting right
                    newPos.col = (oppPiecePos.col + 1) % state.board.grid[row].length;
                } else if (col === state.board.grid[row].length - 1 && oppPiecePos.row === row) {
                    // Shifting left
                    newPos.col = oppPiecePos.col === 0 ? state.board.grid[row].length - 1 : oppPiecePos.col - 1;
                }
    
                // Check if the opponent's piece position actually changes
                if (newPos.row !== oppPiecePos.row || newPos.col !== oppPiecePos.col) {
                    // Update the opponent's piece position
                    opponent.updatePiecePosition(newPos.row, newPos.col);
                }
            }
    
        
            // Remove the currentPlayer's spareTile and place it onto the empty cell
            let spareTile = state.currentPlayer.spareTile;
            state.board.grid[row][col] = spareTile;
            state.currentPlayer.spareTile = null;
            state.lastClickedRow = row;
            state.lastClickedCol = col;
            if(state.findValidMovesFromCurrentPiecePosition().length == 0){
                state.nextRound = true;
                // this.switchTurnSimulation(state)
            } 
        }

        // Construct a new state object with all necessary updates
        const updatedState = {
            ...state, // Spread the cloned state to copy all properties
            // Explicitly update or add properties that have changed
            // For example, if board is updated in place, it's already pointing to the new board
            board: state.board,
            // Repeat for other properties that may have changed during the simulation
            currentPlayer: state.currentPlayer,
            gameOver: state.gameOver,
            lastClickedCol: state.lastClickedCol,
            lastClickedRow: state.lastClickedRow,
            nextRound: state.nextRound,
            players: state.players,
            // Any other properties that need to be updated should be explicitly listed here
        };

        return updatedState;
    }

    placePieceSimulation(state, row, col) {

    // Retrieve the current player's previous piece position
    let prevPosition = state.currentPlayer.getPiecePosition();

    // Update the board to remove the piece from its previous position if it exists
    if (prevPosition && state.board.grid[prevPosition.row][prevPosition.col].piece &&
        state.board.grid[prevPosition.row][prevPosition.col].piece.getColour() === state.currentPlayer.colour) {
        state.board.grid[prevPosition.row][prevPosition.col].piece = null;
    }

        // Update the board to add the piece to its new position
        state.board.grid[row][col].piece = new Piece(state.currentPlayer, row, col); // Assume Piece constructor takes a player, row, and col
    
        // Update the currentPlayer's piece position
        state.currentPlayer.updatePiecePosition(row, col);
    
        // After moving the piece, perform any additional game state updates as needed
            // For example, checking for win conditions or triggering any special board effects
        // After placing the piece, check if it matches the current destination
        const currentDestination = state.currentPlayer.getCurrentDestination();
        const placedTile = state.board.grid[row][col];
    
        // // Assuming the tile has a property 'destination' that can be 'moon', 'sun', 'galaxy', 'mountain', etc.
        // if (placedTile.destination && placedTile.destination.type === currentDestination) {
        //     state.currentPlayer.advanceToNextDestination();
        // }
        // Note: Depending on your game's rules, you might want to add more checks,
        // for instance, to ensure the move is valid (e.g., within bounds, not jumping over obstacles).
    
        // Update the UI to reflect the new board state
        // Assuming this is inside a method after moving the piece
        if (state.currentPlayer.getCurrentDestination() === "return" && state.currentPlayer.hasReturnedToInitialPosition()) {
            state.gameOver = true;
        } else{
            state.nextRound = true;
        }

         // Construct a new state object with all necessary updates
         const updatedState = {
            ...state, // Spread the cloned state to copy all properties
            // Explicitly update or add properties that have changed
            // For example, if board is updated in place, it's already pointing to the new board
            board: state.board,
            // Repeat for other properties that may have changed during the simulation
            currentPlayer: state.currentPlayer,
            currentPlayerValidMoves: null,
            gameOver: state.gameOver,
            nextRound: state.nextRound,
            players: state.players,
            // Any other properties that need to be updated should be explicitly listed here
        };

        return updatedState;
        // this.switchTurnSimulation(state);
    }

    switchTurnSimulation(state) {
        if (state.nextRound) {
            // Switch the current player
            state.currentPlayer = state.getOtherPlayer();
            // Reset the nextRound flag
            state.nextRound = false;
        }
    }

    canPlaceSpareTile(state, row, col) {
        // Edge condition: Only allow placement on the board's edges
        const isEdgeTile = row === 0 || row === state.board.grid.length - 1 || col === 0 || col === state.board.grid[0].length - 1;
        
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
        if (this.isDirectOppositeEndBlocked(state, row, col)) {
            return false;
        }
    
        return true; // Allow placement if none of the conditions are met
    }
    
    isDirectOppositeEndBlocked(state, row, col) {
        // Calculate the direct opposite position
        let oppositeRow = (row === 0) ? state.board.grid.length - 1 : (row === state.board.grid.length - 1) ? 0 : row;
        let oppositeCol = (col === 0) ? state.board.grid[0].length - 1 : (col === state.board.grid[0].length - 1) ? 0 : col;
        
        // Check if the direct opposite position was the last clicked position
        if (state.lastClickedRow === oppositeRow && state.lastClickedCol === oppositeCol) {
            return true; // Block if trying to place at the direct opposite end
        }
    
        // Check if there's a piece or destination at the direct opposite position
        const tileAtOpposite = state.board.grid[oppositeRow][oppositeCol];
        if (tileAtOpposite.piece || tileAtOpposite.destination) {
            return true; // Block if there's a piece or destination at the direct opposite
        }
    
        return false; // Allow if there's no piece/destination and it's not the direct opposite of the last move
    }
    


}
