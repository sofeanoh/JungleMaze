import { Board } from './board.js';
import { Player } from './player.js';
import { Piece } from './piece.js';
import { Destination } from './destination.js';
import { Tile } from './tile.js';
import { Game } from './game.js';


export class AIPlayer extends Player {
    constructor(name, colour, row, col, maxDepth, aiType, minimaxType) {
        super(name, colour, row, col); // Call the parent class constructor with parameters
        this.maxDepth = maxDepth;
        this.aiType = aiType;
        this.minimaxType = minimaxType;
        this.transpositionTable = new Map(); // Initialize the transposition table
        this.initializeZobristTable(); // Initialize Zobrist table

    }

     getBestMove(state) {
        if (this.aiType === 'minimax') {
            switch (this.minimaxType) {
                case 'simpleMinimax':
                    return this.findBestMoveMinimax(state)
                    break;
                case 'minimaxAB':
                    // Implement Minimax with alpha-beta pruning
                    return this.findBestMoveAB(state)
                    break;
                case 'minimaxTrans':
                    return this.findBestMoveABTransposition(state);
                    break;
                case 'minimaxTransID':
                    // Implement Minimax with alpha-beta pruning and iterative deepening
                    return this.findBestMoveIterativeDeepening(state);
                    break;
                default:
                    // Fallback or default logic
                    return this.findBestMoveIterativeDeepening(state)
                    break;
            }
        } else if (this.aiType === 'mcts') {
            return this.findBestMoveUsingMCTS(state);
        }
        // Return the best move based on the selected strategy
    }

    initializeZobristTable() {
        const boardSize = 7; //  a 7x7 board, need to size as necessary
        const pieceTypes = ['R', 'B', null]; // will revisit later
        const numPieces = pieceTypes.length;
        this.zobristTable = Array(boardSize).fill(null).map(() =>
            Array(boardSize).fill(null).map(() =>
                Array(numPieces).fill(null).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
            )
        );
    }
    generateHashKey(state) {
        let hash = 0;
        for (let row = 0; row < state.grid.length; row++) {
            for (let col = 0; col < state.grid[row].length; col++) {
                const piece = state.grid[row][col].split("-").pop(); // Get the piece type
                const pieceIndex = ['R', 'B', null].indexOf(piece); // Get index of the piece in predefined list
                if (pieceIndex !== -1) { // Check if the piece exists
                    hash ^= this.zobristTable[row][col][pieceIndex];
                }
            }
        }
        return hash;
    }
    
    ////////// AB PRUNING + TRANSPOSITION TABLE + ITERATIVE DEEPENING /////////

    findBestMoveIterativeDeepening(state) {
        let bestMoveOverall = null;
        let bestScoreOverall = -Infinity; //  AI wants to maximize its score
        let finalPath = [];
        let possibleMoves;
        for (let depth = 1; depth <= this.maxDepth; depth++) {
            const result = this.findBestMoveABTransposition(state, depth, -Infinity, Infinity, true, [], null, null);
            console.log(`Depth: ${depth}, Score: ${result.score}, Move:`, result.move);
            possibleMoves = result.possibleMoves
            // Update overall best move and score if this depth's result is better
            if (result.score > bestScoreOverall) {
                bestScoreOverall = result.score;
                bestMoveOverall = result.move;
                finalPath = result.path;
            }

            // Optionally, halt if a certain condition is met (e.g., finding a winning move)
            if (result.halt) break;
        }

        console.log(`Best Move Found:`, bestMoveOverall);
        console.log(`Best Score: ${bestScoreOverall}`);
        console.log(`Path to Best Move:`, finalPath);
        console.log(`possible Moves`, possibleMoves);
        return { move: bestMoveOverall, score: bestScoreOverall, path: finalPath};
    }
         ////////////////// AB PRUNING + TRANSPOSITION TABLE ///////////////////////////////

    findBestMoveABTransposition(stateAfterPieceMove, depth = this.maxDepth, alpha = -Infinity, beta = Infinity, maximizingPlayer = true, path = [], stateAfterSpareTile = null, originalState = null) {
        const stateHash = this.generateHashKey(stateAfterPieceMove);

        if (this.transpositionTable.has(stateHash)) {
            return this.transpositionTable.get(stateHash);
        }
       
        if (depth === 0 || stateAfterPieceMove.gameOver) {
            // Leaf node reached, evaluate this node
            let score = this.evaluateState(stateAfterPieceMove, stateAfterSpareTile, originalState);
            // console.log(`Leaf Node Reached at Depth: ${this.maxDepth - depth}`);
            // console.log(`Path to Leaf:`, path);
            // console.log(`Final State:`, stateAfterPieceMove);
            // console.log(`Evaluated Score: ${score}`);
    
            // Halt the function by returning the evaluated score, move as null, and the path to this node
            return { score: score, move: null, path: path, halt: depth === 0 ? false : true }; // Add 'halt: true' to indicate stopping
        }
    
        let bestScore = maximizingPlayer ? -Infinity : Infinity;
        let bestMove = null;
        const possibleMoves = this.generateAllPossibleMovesAI(stateAfterPieceMove);
    
        for (let move of possibleMoves) {
            const sim = this.simulateMove(stateAfterPieceMove, move.spareTilePlacement, move.pieceMove);
            let newPath = [...path, move];
    
            let result = this.findBestMoveABTransposition(sim.stateAfterPieceMove, depth - 1, alpha, beta, !maximizingPlayer, newPath, sim.stateAfterSpareTile, sim.originalState);

            if ((maximizingPlayer && result.score > bestScore) || (!maximizingPlayer && result.score < bestScore)) {
                bestScore = result.score;
                bestMove = move;
                if (maximizingPlayer) alpha = Math.max(alpha, bestScore);
                else beta = Math.min(beta, bestScore);
            }

            if (beta <= alpha) break; // Alpha-beta pruning
        }
        
    
       // Return the best score and move without halting (since we didn't reach a leaf node in this call)
        // Before returning the result, store it in the transposition table
        const result = { score: bestScore, move: bestMove, path: path, halt: false , possibleMoves:possibleMoves};
        this.transpositionTable.set(stateHash, result);
        return result;  
         }

         ////////////////// AB PRUNING ///////////////////////////////

         findBestMoveAB(stateAfterPieceMove, depth = this.maxDepth, alpha = -Infinity, beta = Infinity, maximizingPlayer = true, path = [], stateAfterSpareTile = null, originalState = null) {
            if (depth === 0 || stateAfterPieceMove.gameOver) {
                // Leaf node reached, evaluate this node
                let score = this.evaluateState(stateAfterPieceMove, stateAfterSpareTile, originalState);
                console.log(`Leaf Node Reached at Depth: ${this.maxDepth - depth}`);
                console.log(`Path to Leaf:`, path);
                console.log(`Final State:`, stateAfterPieceMove);
                console.log(`Evaluated Score: ${score}`);
        
                // Halt the function by returning the evaluated score, move as null, and the path to this node
                return { score: score, move: null, path: path, halt: false }; // Add 'halt: true' to indicate stopping
            }
        
            let bestScore = maximizingPlayer ? -Infinity : Infinity;
            let bestMove = null;
            const possibleMoves = this.generateAllPossibleMovesAI(stateAfterPieceMove);
        
            for (let move of possibleMoves) {
                const sim = this.simulateMove(stateAfterPieceMove, move.spareTilePlacement, move.pieceMove);
                let newPath = [...path, move];
        
                let result = this.findBestMoveAB(sim.stateAfterPieceMove, depth - 1, alpha, beta, !maximizingPlayer, newPath, sim.stateAfterSpareTile, sim.originalState);
        
                // Immediately halt further recursion and return the result if 'halt' flag is present
                if (result.halt) {
                    return result; // Pass the halt signal up the recursion chain
                }
        
                if ((maximizingPlayer && result.score > bestScore) || (!maximizingPlayer && result.score < bestScore)) {
                    bestScore = result.score;
                    bestMove = move;
                } else {
                    if (result.score < bestScore) {
                        bestScore = result.score;
                        bestMove = move;
                    }
                    beta = Math.min(beta, bestScore);
                }
        
                if (beta <= alpha) {
                    break; // Alpha-beta pruning
                }
            }
        
           // Return the best score and move without halting (since we didn't reach a leaf node in this call)
        return { score: bestScore, move: bestMove, path: path, halt: false };
        }

        //////////////// Simple minimax //////////////////////
        findBestMoveMinimax(stateAfterPieceMove, depth = this.maxDepth, maximizingPlayer = true, path = [], stateAfterSpareTile = null, originalState = null) {
            if (depth === 0 || stateAfterPieceMove.gameOver) {
                // Leaf node reached, evaluate this node
                let score = this.evaluateState(stateAfterPieceMove, stateAfterSpareTile, originalState);
                console.log(`Leaf Node Reached at Depth: ${this.maxDepth - depth}`);
                console.log(`Path to Leaf:`, path);
                console.log(`Final State:`, stateAfterPieceMove);
                console.log(`Evaluated Score: ${score}`);
        
                // Halt the function by returning the evaluated score, move as null, and the path to this node
                return { score: score, move: null, path: path, halt: false }; // Add 'halt: true' to indicate stopping
            }
        
            let bestScore = maximizingPlayer ? -Infinity : Infinity;
            let bestMove = null;
            const possibleMoves = this.generateAllPossibleMovesAI(stateAfterPieceMove);
        
            for (let move of possibleMoves) {
                const sim = this.simulateMove(stateAfterPieceMove, move.spareTilePlacement, move.pieceMove);
                let newPath = [...path, move];
        
                let result = this.findBestMoveMinimax(sim.stateAfterPieceMove, depth - 1, !maximizingPlayer, newPath, sim.stateAfterSpareTile, sim.originalState);
        
                // Immediately halt further recursion and return the result if 'halt' flag is present
                if (result.halt) {
                    return result; // Pass the halt signal up the recursion chain
                }
        
                if ((maximizingPlayer && result.score > bestScore) || (!maximizingPlayer && result.score < bestScore)) {
                    bestScore = result.score;
                    bestMove = move;
                } else {
                    if (result.score < bestScore) {
                        bestScore = result.score;
                        bestMove = move;
                    }
                }
        
               
            }
            const result = { score: bestScore, move: bestMove, path: path, halt: false , possibleMoves:possibleMoves};
            console.log (result)
            // Return the best score and move without halting (since we didn't reach a leaf node in this call)
            return result;
        }
        
    /////////////////////////MCTS////////////////////////
     // Start of MCTS implementation
     MCTS = class {
        constructor(rootState, aiPlayer) {
            this.rootNode = new this.Node(rootState, null, null, aiPlayer);
            this.aiPlayer = aiPlayer;
        }

        // Node class within MCTS
        Node = class {
            constructor(state, parent, move, aiPlayer) {
                this.state = state;
                this.parent = parent;
                this.move = move;
                this.children = [];
                this.wins = 0;
                this.visits = 0;
                this.untriedMoves = aiPlayer.generateAllPossibleMovesAI(state); // Utilize AIPlayer's method to get valid moves
                this.playerColor = state.currentPlayer;
            }

            addChildren(moves, state) {
                moves.forEach((move) => {
                    let newState = aiPlayer.simulateMove(state, move.spareTilePlacement, move.pieceMove).stateAfterPieceMove; //other player's turn
                    let node = new this.constructor(newState, this, move, this.aiPlayer);
                    this.untriedMoves = this.untriedMoves.filter((m) => m !== move);
                    this.children.push(node);
                });
            }

            update(result) {
                this.visits += 1;
                this.wins += result;
            }

            selectChild() {
                const ucb1 = (child) => 
                    (child.wins / child.visits) + Math.sqrt(2) * Math.sqrt(Math.log(this.visits) / child.visits);
                return this.children.reduce((prev, current) => (ucb1(prev) > ucb1(current) ? prev : current));
            }
        };

        runSimulation(budget) {
            while (budget > 0) {
                let node = this.selectPromisingNode(this.rootNode);
                let result = 0;
                if (node.untriedMoves.length !== 0) {
                    node = this.expandNode(node);
                }
                result = this.simulateRandomPlayout(node);
                this.backPropagation(node, result);
                budget--;
            }
        }

        selectPromisingNode(node) {
            while (node.children.length !== 0) {
                node = node.selectChild();
            }
            return node;
        }

        expandNode(node) {
            const move = node.untriedMoves[Math.floor(Math.random() * node.untriedMoves.length)];
            let newState = this.aiPlayer.simulateMove(node.state, move.spareTilePlacement, move.pieceMove).stateAfterPieceMove; // Adapted to use simulateMove
            let childNode = new this.Node(newState, node, move, this.aiPlayer);
            node.children.push(childNode);
            node.untriedMoves = node.untriedMoves.filter(m => m !== move);
            return childNode
        }

        simulateRandomPlayout(node) {
            let currentState = this.aiPlayer.deepCloneState(node.state);
            let simulationResult = 0;
            while (!currentState.gameOver) {
                const possibleMoves = this.aiPlayer.generateAllPossibleMovesAI(currentState);
                if (possibleMoves.length === 0) break; // No moves available, break the simulation

                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                const result = this.aiPlayer.simulateMove(currentState, randomMove.spareTilePlacement, randomMove.pieceMove);
                currentState = result.stateAfterPieceMove; // Update currentState after the move

            }

            if (currentState.gameOver) {
                if (currentState.currentPlayer === (this.playerColorcolour == 'blue' ? 'B' : 'R')) { //because at stateAfterPieceMove the turn is switched
                    simulationResult = 1; // AI wins
                } else {
                    simulationResult = -1
                }
            }  else {
                simulationResult = this.evaluateSimulationOutcome(currentState);
            }
        
        

            return simulationResult; // Return the simulation result (e.g., 1 for win, -1 for loss, 0 for draw)
        }

        evaluateSimulationOutcome(endState) {
            const opponentIndex = endState.currentPlayerCurrentDestinationIndex;
            // const opponentColor = aiPlayerColor === 'R' ? 'B' : 'R'; // Swap colors
            const  aiPlayerIndex = endState.opponentCurrentDestinationIndex;
        
            // Prioritize reaching the destination over the opponent's progress
             if (aiPlayerIndex > opponentIndex) {
                // AI player is ahead in reaching destinations
                return 0.5;
            } else if (aiPlayerIndex < opponentIndex) {
                // Opponent is ahead in reaching destinations
                return -0.5;
            }
        
            // Neutral outcome or draw
            return 0;
        }


        backPropagation(node, result) {
            while (node !== null) {
                node.update(result);
                node = node.parent;
            }
        }
    };

    // Method to start MCTS process and find the best move
    findBestMoveUsingMCTS(state) {
        const mcts = new this.MCTS(state, this);
        mcts.runSimulation(50); // (50 sim)
        const bestMove = mcts.rootNode.selectChild().move; // Select the best move after simulations
        return bestMove; // Return the selected move
    }





    generateAllPossibleMovesAI(state) {
        let allPossibleMoves = [];
        state.validSpareTilePlacements.forEach(spareTilePlacement => {
            let simulatedState = this.placeSpareTileAI(this.deepCloneState(state), spareTilePlacement.row, spareTilePlacement.col);
            // Ensure validPiecePlacements are determined after placing the spare tile
            simulatedState.validPiecePlacements = this.findValidMovesFromCurrentPiecePositionAI(simulatedState);
            console.log(state.currentPlayer, state.piecePosition)
    
            if (simulatedState.validPiecePlacements.length > 0) {
                // If there are valid piece moves, generate moves including these piece placements
                simulatedState.validPiecePlacements.forEach(pieceMove => {
                    allPossibleMoves.push({
                        spareTilePlacement,
                        pieceMove: { row: pieceMove.row, col: pieceMove.col }
                    });
                });
            } else {
                // If there are no valid piece moves after placing a spare tile, add a move with a null pieceMove
                allPossibleMoves.push({
                    spareTilePlacement,
                    pieceMove: null,
                });
            }
        });
        this.sortMovesByHeuristic(state, allPossibleMoves);

        return allPossibleMoves;
    }

    sortMovesByHeuristic(state, moves) {
        // 'state' contains the necessary information to evaluate the moves
        // For demonstration, let's sort moves by how close they get to the destination
        const destination = this.getDestinationCoords(state, state.currentPlayerCurrentDestination, state.currentPlayer);
        
        moves.sort((a, b) => {
            // Calculate distance for a
            let aDistance = Infinity;
            if (a.pieceMove) { // If there is a pieceMove, calculate its distance to the destination
                const aPos = {row: a.pieceMove.row, col: a.pieceMove.col};
                aDistance = this.calculateDistance(aPos, destination);
            }
    
            // Calculate distance for b
            let bDistance = Infinity;
            if (b.pieceMove) {
                const bPos = {row: b.pieceMove.row, col: b.pieceMove.col};
                bDistance = this.calculateDistance(bPos, destination);
            }
    
            return aDistance - bDistance; // Ascending order
        });
    }
    

    simulateMove(state, spareTilePlacement, pieceMove) {
        let originalState = this.deepCloneState(state); // Deep clone to preserve the original state
        let stateAfterSpareTile = this.placeSpareTileAI(this.deepCloneState(state), spareTilePlacement.row, spareTilePlacement.col);
        let stateAfterPieceMove;
    
        if (pieceMove === null) {
            // If there's no piece move, the state after the piece move is identical to the state after the spare tile placement
            stateAfterPieceMove = this.switchTurnAI(stateAfterSpareTile);

        } else {
            // Apply the piece move only if it's not null
            stateAfterPieceMove = this.placePieceAI(this.deepCloneState(stateAfterSpareTile), pieceMove.row, pieceMove.col);
            stateAfterPieceMove = this.switchTurnAI(stateAfterPieceMove);
        }
    
        return { stateAfterPieceMove, stateAfterSpareTile, originalState };
    }
   
    

    

    evaluateState(stateAfterPieceMove, stateAfterSpareTile, originalState) {

        let score = 0;
        console.log(stateAfterPieceMove.currentPlayer != stateAfterSpareTile.currentPlayer)
    
        // Combine evaluations
        score += this.evaluateToGoal(stateAfterPieceMove, stateAfterSpareTile, originalState);
        score += this.evaluatePreventOpponentToGoal(stateAfterPieceMove, stateAfterSpareTile, originalState);
    
        // Add more evaluations as needed
        // Example: score += this.evaluatePieceSafety(stateAfterPieceMove);
    
        return score;
    }
    

    // evaluateToGoal(stateAfterPieceMove, stateAfterSpareTile, originalState) {
    //     //focus on current player aim to achieve destination
    //     //TO DO: :
    //     //1: 
        evaluateToGoal(stateAfterPieceMove, stateAfterSpareTile, originalState) {
            let score = 0;
            // Focus on the current player's aim to achieve the destination
            const currentPlayer = stateAfterSpareTile.currentPlayer;
            const destinationType = stateAfterSpareTile.currentPlayerCurrentDestination; //use this as placing the piece will alter the destination
            const piecePosition = this.findPlayerPiecePosition(stateAfterPieceMove, currentPlayer) //whenever we use stateafterPieceMove, we use currentPlayer from afterSpareTile
            const destinationCoords = this.getDestinationCoords(stateAfterPieceMove, destinationType, currentPlayer);
            const distanceToDestination = this.calculateDistance(piecePosition, destinationCoords);
            if (distanceToDestination == 0){
                score += 5000;
            } else{
            // Score inversely proportional to the distance to the destination
             score = 1000 - distanceToDestination; // Arbitrary scoring, needs adjustment based on game dynamics
            }
            console.log({score, destinationType, piecePosition, destinationCoords, distanceToDestination});
            return score;
        }
        
    // }
    evaluatePreventOpponentToGoal(stateAfterPieceMove, stateAfterSpareTile, originalState) {
        // Initialize variables for player and opponent
        const currentPlayer = stateAfterSpareTile.currentPlayer;
        const opponent = currentPlayer === "R" ? "B" : "R";
    
        // Fetch opponent's current piece position and destination
        const opponentPiecePosition = this.findPlayerPiecePosition(stateAfterSpareTile, opponent);
        const opponentDestination = this.getDestinationCoords(stateAfterSpareTile, stateAfterSpareTile.opponentCurrentDestination, opponent);
        let penalty = 0;
    
        // Evaluate based on whether currentPlayer has valid moves
        if (stateAfterSpareTile.validPiecePlacements == null) { // Case 1: currentPlayer has no valid moves after spare tile placement
    
            const opponentValidMoves = this.findValidMovesFromPiecePositionAI(stateAfterSpareTile, opponent);
    
            if (opponentValidMoves.length > 0) { // Subcase 1: Opponent has valid moves
                let destinationReached = opponentValidMoves.some(move => 
                    move.row === opponentDestination.row && move.col === opponentDestination.col);
    
                if (destinationReached) {
                    // Subsubcase 1: Opponent's move includes their destination
                    return -10000000; // Penalize heavily to avoid allowing the opponent to reach their destination
                } else {
                    // Subsubcase 2: None of the opponent's valid moves includes their destination
                    let minDistance = Math.min(...opponentValidMoves.map(move => 
                        this.calculateDistance(move, opponentDestination)));
    
                    if (minDistance < this.calculateDistance(opponentPiecePosition, opponentDestination)) {
                        return -10000000; // Penalize heavily if the opponent gets closer to their destination
                    }
                }
            } else { // Subcase 2: Opponent has no valid moves
                let distanceAfter = this.calculateDistance(opponentPiecePosition, opponentDestination);
                let distanceBefore = this.calculateDistance(this.findPlayerPiecePosition(originalState, opponent), opponentDestination);
    
                if (distanceAfter < distanceBefore) {
                    penalty = -1000; // Penalize if the opponent is closer to their destination after the move
                }
            }
        } else { // Case 2: currentPlayer has valid piece moves
    
            const opponentValidMoves = this.findValidMovesFromPiecePositionAI(stateAfterSpareTile, opponent);

            console.log({opponentDestination})
            if (opponentValidMoves.length > 0) {
                let destinationReached = opponentValidMoves.some(move => 
                    move.row === opponentDestination.row && move.col === opponentDestination.col);
                    
                if (destinationReached) { //stateAfterSpareTile.opponentCurrentDestinationIndex is the opponent, and the latter it the current player
                    if (stateAfterSpareTile.opponentCurrentDestinationIndex >= stateAfterPieceMove.opponentCurrentDestinationIndex) {
                        return -10000000; // Penalize (avoid at all costs) if allowing opponent to reach their destination first
                    }
                }
            }
        }
    
        return penalty; // Return the calculated penalty
    }
    

    deepCloneState(state) {
        // Create a shallow clone of the state
        const clonedState = { ...state };
    
        // Deep clone grid if it exists
        clonedState.grid = state.grid.map(row => [...row]);
    
        // Deep clone currentPlayerDestinations and opponentDestinations if they exist
        clonedState.currentPlayerDestinations = state.currentPlayerDestinations ? [...state.currentPlayerDestinations] : null;
        clonedState.opponentDestinations = state.opponentDestinations ? [...state.opponentDestinations] : null;
    
        // Clone piecePosition if it exists
        clonedState.piecePosition = state.piecePosition ? { ...state.piecePosition } : null;
    
        // Clone validPiecePlacements and validSpareTilePlacements if they exist
        // Ensure to clone each object within the arrays
        clonedState.validPiecePlacements = state.validPiecePlacements ? state.validPiecePlacements.map(place => ({ ...place })) : null;
        clonedState.validSpareTilePlacements = state.validSpareTilePlacements ? state.validSpareTilePlacements.map(place => ({ ...place })) : null;
    
        // Return the deeply cloned state
        return clonedState;
    }
    

    
    
    calculateDistance(from, to) {
        //  from and to are objects with { row, col } structure
        return Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
    }
    
    
    isgameOver(state) {
        return state.gameOver === true;
    }

    
    
    
    
    
    getDestinationCoords(state, destinationType, player) {
        if (destinationType != 'return'){
            for (let row = 0; row < state.grid.length; row++) {
                for (let col = 0; col < state.grid[row].length; col++) {
                    // Split the tile data into its components
                    const tileComponents = state.grid[row][col].split("-");
                    // Check if the tileComponents array has at least two elements, indicating a destination might be present
                    if (tileComponents.length > 1) {
                        // The destination is expected to be the second component (index 1) if present
                        const tileDestination = tileComponents[1];
                        if (tileDestination === destinationType) {
                            return { row, col }; // Return the coordinates of the destination
                        }
                    }
                }
            }
        } else{
                const initialPosition = player === "R" ? { row: 6, col: 0 } : { row: 0, col: 6 }; //  initial positions for two players
                return initialPosition;
            }


        return null; // Return null if the destination type is not found
    }
    
    
    

    switchTurnAI(state) {
        // Initialize newState as a clone of the current state
        let newState = { ...state };
    
        // Swap current player
        newState.currentPlayer = state.currentPlayer === "R" ? "B" : "R";
        newState.opponent = state.opponent === "R" ? "B" : "R"; // Ensure the opponent is also swapped correctly
    
        // Clone the grid to ensure moves do not affect the original state
        newState.grid = state.grid.map(row => [...row]);
    
        // Swap spare tiles
        let tempSpareTile = state.currentPlayerSpareTile;
        newState.currentPlayerSpareTile = state.opponentSpareTile;
        newState.opponentSpareTile = tempSpareTile;
    
        // Swap destinations array
        let tempDestinations = [...state.currentPlayerDestinations];
        newState.currentPlayerDestinations = [...state.opponentDestinations];
        newState.opponentDestinations = tempDestinations;
    
        // Swap destination indexes
        let tempDestinationIndex = state.currentPlayerCurrentDestinationIndex;
        newState.currentPlayerCurrentDestinationIndex = state.opponentCurrentDestinationIndex;
        newState.opponentCurrentDestinationIndex = tempDestinationIndex;
    
        // Swap current destinations
        let tempCurrentDestination = state.currentPlayerCurrentDestination;
        newState.currentPlayerCurrentDestination = state.opponentCurrentDestination;
        newState.opponentCurrentDestination = tempCurrentDestination;
    
        // Find and set the new current player's piece position
        newState.piecePosition = this.findCurrentPlayerPiecePositionAI(newState);
    
        // Reset valid piece placements and calculate valid spare tile placements for the new current player
        newState.validPiecePlacements = this.findValidMovesFromCurrentPiecePositionAI(newState);
        newState.validSpareTilePlacements = this.validSpareTilePlacement(newState);
    
        return newState;
    }
    
    
    // Method to find a player's piece position on the board
    findPlayerPiecePosition(state, player) {
        for (let row = 0; row < state.grid.length; row++) {
            for (let col = 0; col < state.grid[row].length; col++) {
                const tileComponent = state.grid[row][col].split("-");
                // Check if the last element of tileComponent matches the player
                if (tileComponent[tileComponent.length - 1] === player) { // Corrected condition
                    return { row, col };
                }
            }
        }
        return null; // Handle the case where the piece is not found
    }

    
    
    

    canPlaceSpareTileAI(state, row, col) {
        // Edge condition: Only allow placement on the board's edges
        const isEdgeTile = row === 0 || row === state.grid.length - 1 || col === 0 || col === state.grid[0].length - 1;
        
        if (!isEdgeTile) {
            return false; // If it's not an edge tile, immediately return false
        }
    
        // Prevent interaction with specific cells (the four corners and the middle cells on each side)
        if ((row === 0 && (col === 0 || col === 2 || col === 4 || col === 6)) || 
            (row === state.grid.length - 1 && (col === 0 || col === 2 || col === 4 || col === 6)) ||
            (col === 0 && (row === 0 || row === 2 || row === 4 || row === 6)) ||
            (col === state.grid[0].length - 1 && (row === 0 || row === 2 || row === 4 || row === 6))) {
            return false;
        }
    
        // Check if the last action was placing a tile at the direct opposite position
        if (this.isDirectOppositeEndBlockedAI(state, row, col)) {
            return false;
        }
    
        return true; // Allow placement if none of the conditions are met
    }
    
    isDirectOppositeEndBlockedAI(state, row, col) {
        // Calculate the direct opposite position
        let oppositeRow = row;
        let oppositeCol = col;
    
        if (row === 0) oppositeRow = state.grid.length - 1;
        else if (row === state.grid.length - 1) oppositeRow = 0;
        else if (col === 0) oppositeCol = state.grid[0].length - 1;
        else if (col === state.grid[0].length - 1) oppositeCol = 0;
    
        // Direct opposite end blockage due to last action
        if (oppositeRow === state.lastClickedRow && oppositeCol === state.lastClickedCol) {
            return true;
        }
    
        // Checking if the opposite tile has a piece or destination that would block placement
        const tileAtOpposite = state.grid[oppositeRow][oppositeCol];
        if (tileAtOpposite){
        const hasPieceOrDestinationOpposite = tileAtOpposite.includes("-") //has suffix
        return hasPieceOrDestinationOpposite;
        } else {
            return null
        }
    }
    
    
    
    
    shiftTilesUp(state, row, col) {
        let shiftedOutTile = state.grid[0][col]; // Tile that will be shifted out
        // Shift all tiles up
        for (let i = 0; i < state.grid.length - 1; i++) {
            state.grid[i][col] = state.grid[i + 1][col];
        }
        // Place the currentPlayer's spareTile at the bottom row, shifted column
        state.grid[state.grid.length - 1][col] = state.currentPlayerSpareTile;
    
        // Update the spare tile of the opponent to the shifted out tile
        state.opponentSpareTile = shiftedOutTile;
        state.currentPlayerSpareTile = null;
        state.validSpareTilePlacements = this.validSpareTilePlacement(state);
        state.piecePosition = this.findCurrentPlayerPiecePositionAI(state)
        state.validPiecePlacements = this.findValidMovesFromCurrentPiecePositionAI(state)
        return state;
    }
    
    shiftTilesDown(state, row, col) {
        let shiftedOutTile = state.grid[state.grid.length - 1][col]; // Tile that will be shifted out
        // Shift all tiles down
        for (let i = state.grid.length - 1; i > 0; i--) {
            state.grid[i][col] = state.grid[i - 1][col];
        }
        // Place the currentPlayer's spareTile at the top row, shifted column
        state.grid[0][col] = state.currentPlayerSpareTile;
    
        // Update the spare tile of the opponent to the shifted out tile
        state.opponentSpareTile = shiftedOutTile;
        state.currentPlayerSpareTile = null;
        state.validSpareTilePlacements = this.validSpareTilePlacement(state);
        state.piecePosition = this.findCurrentPlayerPiecePositionAI(state)
        state.validPiecePlacements = this.findValidMovesFromCurrentPiecePositionAI(state)
        return state;
    }
    
    shiftTilesLeft(state, row, col) {
        let shiftedOutTile = state.grid[row][0]; // Tile that will be shifted out
        // Shift all tiles left
        for (let i = 0; i < state.grid[row].length - 1; i++) {
            state.grid[row][i] = state.grid[row][i + 1];
        }
        // Place the currentPlayer's spareTile at the shifted row, rightmost column
        state.grid[row][state.grid[row].length - 1] = state.currentPlayerSpareTile;
    
        // Update the spare tile of the opponent to the shifted out tile
        state.opponentSpareTile = shiftedOutTile;
        state.currentPlayerSpareTile = null;
        state.validSpareTilePlacements = this.validSpareTilePlacement(state);
        state.piecePosition = this.findCurrentPlayerPiecePositionAI(state)
        state.validPiecePlacements = this.findValidMovesFromCurrentPiecePositionAI(state)
        return state;
    }
    
    shiftTilesRight(state, row, col) {
        let shiftedOutTile = state.grid[row][state.grid[row].length - 1]; // Tile that will be shifted out
        // Shift all tiles right
        for (let i = state.grid[row].length - 1; i > 0; i--) {
            state.grid[row][i] = state.grid[row][i - 1];
        }
        // Place the currentPlayer's spareTile at the shifted row, leftmost column
        state.grid[row][0] = state.currentPlayerSpareTile;
    
        // Update the spare tile of the opponent to the shifted out tile
        state.opponentSpareTile = shiftedOutTile;
        state.currentPlayerSpareTile = null;
        state.validSpareTilePlacements = this.validSpareTilePlacement(state);
        state.piecePosition = this.findCurrentPlayerPiecePositionAI(state)
        state.validPiecePlacements = this.findValidMovesFromCurrentPiecePositionAI(state)
        return state;
    }
    
    placeSpareTileAI(state, row, col) {
        // First, check if the position is valid for placing the spare tile
        if (!this.canPlaceSpareTileAI(state, row, col)) {
            console.error("Invalid position for spare tile placement.", {row, col});
            return state; // Return the unchanged state if the position is invalid
        }

        state.lastClickedCol = col;
        state.lastClickedRow = row;
        
        // Depending on the row and column, call the appropriate shift method
        if (row === 0) {
            // If the tile is to be placed at the top, shift tiles down
            return this.shiftTilesDown(state, row, col);
        } else if (row === state.grid.length - 1) {
            // If the tile is to be placed at the bottom, shift tiles up
            return this.shiftTilesUp(state, row, col);
        } else if (col === 0) {
            // If the tile is to be placed on the left side, shift tiles right
            return this.shiftTilesRight(state, row, col);
        } else if (col === state.grid[0].length - 1) {
            // If the tile is to be placed on the right side, shift tiles left
            return this.shiftTilesLeft(state, row, col);
        }
    

        // If none of the conditions are met (which should not happen given the initial check), log an error and return the unchanged state
        console.error("Unexpected condition in placeSpareTileAI.");
        return state;
    }

    validSpareTilePlacement(state) {
        const validPlacements = []; // Initialize an array to hold valid placements
    
        // Check the top and bottom rows for valid placements
        for (let col = 0; col < state.grid[0].length; col++) {
            if (this.canPlaceSpareTileAI(state, 0, col)) {
                validPlacements.push({ row: 0, col: col });
            }
            if (this.canPlaceSpareTileAI(state, state.grid.length - 1, col)) {
                validPlacements.push({ row: state.grid.length - 1, col: col });
            }
        }
    
        // Check the left and right columns for valid placements
        for (let row = 1; row < state.grid.length - 1; row++) { // Start from 1 and end at length - 1 to avoid corners
            if (this.canPlaceSpareTileAI(state, row, 0)) {
                validPlacements.push({ row: row, col: 0 });
            }
            if (this.canPlaceSpareTileAI(state, row, state.grid[0].length - 1)) {
                validPlacements.push({ row: row, col: state.grid[0].length - 1 });
            }
        }
    
        // Return the array of valid placements
        return validPlacements;
    }

    findCurrentPlayerPiecePositionAI(state) {
        // Loop through each row and column of the grid
        for (let row = 0; row < state.grid.length; row++) {
            for (let col = 0; col < state.grid[row].length; col++) {
                //  the presence of a piece is marked by a specific character in the tile string
                // For example, "-R" for Red player's piece, "-B" for Blue player's piece
                const tile = state.grid[row][col];
                if (tile && tile.includes(`-${state.currentPlayer}`)) { // Adjust based on how you're marking the presence of a piece
                    return { row, col };
                }
            }
        }
        // Return null if the piece is not found
        return null;
    }
    
    getValidMovesAI(state, row, col) {
        // Define pattern rules based on the abbreviations used in  grid
        const patternRules = {
            'H': { // Horizontal
                'left': ['H', 'LUR', 'LDR', 'TU', 'TR', 'TD'],
                'right': ['H', 'LUL', 'LDL', 'TD', 'TL', 'TU']
            },
            'V': { // Vertical
                'up': ['V', 'LDL', 'LDR', 'TL', 'TR', 'TD'],
                'down': ['V', 'LUR', 'LUL', 'TU', 'TR', 'TL']
            },
            'LUR': { 
                'up': ['V', 'TL', 'TR', 'TD', 'LDL', 'LDR'],
                'right': ['H', 'TU', 'TD', 'TL', 'LUL', 'LDL']
            },
            'LUL': { 
                'up': ['V', 'TR', 'TL', 'TD', 'LDR', 'LDL'],
                'left': ['H', 'TD', 'TU', 'TR', 'LUR', 'LDR']
            },
            'LDR': { 
                'down': ['V', 'TL', 'TR', 'TU', 'LUL', 'LUR'],
                'right': ['H', 'TU', 'TD', 'TL', 'LUL', 'LDL']
            },
            'LDL': { 
                'down': ['V', 'TR', 'TL', 'TU', 'LUR', 'LUL'],
                'left': ['H', 'TD', 'TU', 'TR', 'LUR', 'LDR']
            },
            'TU': { // T Up
                'left': ['H', 'LDR', 'LUR', 'TD', 'TR', 'TU'],
                'right': ['H', 'LDL', 'LUL', 'TD', 'TL', 'TU'],
                'up': ['V', 'LDL', 'LDR', 'TL', 'TR', 'TD']
            },
            'TD': { // T Down
                'left': ['H', 'LUR', 'LDR', 'TU', 'TR', 'TD'],
                'right': ['H', 'LUL', 'LDL', 'TU', 'TL', 'TD'],
                'down': ['V', 'LUL', 'LUR', 'TL', 'TR', 'TU']
            },
            'TL': { // T Left
                'up': ['V', 'LDR', 'LDL', 'TR', 'TD', 'TL'],
                'down': ['V', 'LUR', 'LUL', 'TR', 'TU', 'TL'],
                'left': ['H', 'LUR', 'LDR', 'TU', 'TD', 'TR']
            },
            'TR': { // T Right
                'up': ['V', 'LDL', 'LDR', 'TL', 'TD', 'TR'],
                'down': ['V', 'LUL', 'LUR', 'TL', 'TU', 'TR'],
                'right': ['H', 'LUL', 'LDL', 'TU', 'TD', 'TL']
            }
        };

        let validMoves = [];
        const directions = ['up', 'right', 'down', 'left'];
        const deltas = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] };

        const currentPattern = state.grid[row][col].split("-")[0];

        directions.forEach(direction => {
            const [dx, dy] = deltas[direction];
            const newRow = row + dx;
            const newCol = col + dy;
    
            // Check bounds and ensure the target cell exists
            if (newRow >= 0 && newRow < state.grid.length && newCol >= 0 && newCol < state.grid[0].length && state.grid[newRow][newCol]) {
                const adjacentPattern = state.grid[newRow][newCol].split("-")[0];
                if (patternRules[currentPattern] && patternRules[currentPattern][direction] && patternRules[currentPattern][direction].includes(adjacentPattern)) {
                    validMoves.push({ row: newRow, col: newCol, direction: direction, pattern: adjacentPattern });
                }
            }
        });
    
        return validMoves;
    }
    
    
    findAllValidMovesAI(state, row, col, visited = {}, validMoves = [], isInitialCall = true) {
        const cellKey = `${row},${col}`;
    
        if (visited[cellKey]) return;
    
        visited[cellKey] = true;
    
        const moves = this.getValidMovesAI(state, row, col);
        moves.forEach(move => {
            const { row: nextRow, col: nextCol } = move;
            const nextCellKey = `${nextRow},${nextCol}`;
    
            if (!visited[nextCellKey]) {
                validMoves.push(move);
                this.findAllValidMovesAI(state, nextRow, nextCol, visited, validMoves, false);
            }
        });
    
        if (isInitialCall) {
            return validMoves.filter(v => !(v.row === row && v.col === col));
        } else {
            return validMoves;
        }
    }
    
    findValidMovesFromCurrentPiecePositionAI(state) {
        const piecePosition = this.findCurrentPlayerPiecePositionAI(state);
        if (!piecePosition) {
            // console.log("Current player has no piece on the board.");
            return [];
        }
        const {row, col} = piecePosition;
    
        // Find all valid moves from this position
        let validMoves = this.findAllValidMovesAI(state, row, col);
        //  the opponent's color is stored or can be determined
        const opponentColor = state.currentPlayer === 'R' ? 'B': 'R'; // Placeholder, adjust accordingly
    
        validMoves = validMoves.filter(move => {
            const tile = state.grid[move.row][move.col];
            return !(tile.includes(`-${opponentColor}`)); // need to adjust based on  implementation
        });
    
        return validMoves;
    }

    findValidMovesFromPiecePositionAI(state, player) { // so that opponent can use this
        const piecePosition = this.findPlayerPiecePosition(state, player );
        if (!piecePosition) {
            // console.log("Current player has no piece on the board.");
            return [];
        }
        const {row, col} = piecePosition;
    
        // Find all valid moves from this position
        let validMoves = this.findAllValidMovesAI(state, row, col);
        //  the opponent's color is stored or can be determined
    
        validMoves = validMoves.filter(move => {
            const tile = state.grid[move.row][move.col];
            return !(tile.includes(`-${player}`)); // need to adjust based on  implementation
        });
    
        return validMoves;
    }
    placePieceAI(state, row, col) {
        // First, find all valid moves for the current player's piece
        const validMoves = this.findValidMovesFromCurrentPiecePositionAI(state);
    
        // Check if (row, col) is a valid move
        const isValidMove = validMoves.some(move => move.row === row && move.col === col);
        
        if (!isValidMove) {
            console.error("Move to (row: " + row + ", col: " + col + ") is not valid.");
            return state; // Return the unchanged state if the move is invalid
        }
        
        // Find the current position of the piece
        const piecePosition = this.findCurrentPlayerPiecePositionAI(state);
        if (!piecePosition) {
            console.error("Current player's piece position not found.");
            return state;
        }
    
        // Remove the current player's piece abbreviation from the former location if it exists
        if (state.grid[piecePosition.row][piecePosition.col].includes(`-${state.currentPlayer}`)) {
            state.grid[piecePosition.row][piecePosition.col] = state.grid[piecePosition.row][piecePosition.col].replace(`-${state.currentPlayer}`, "");
        }
    
        // Add the piece abbreviation to the new location, handling existing destinations
        if (!state.grid[row][col].includes(`-${state.currentPlayer}`)) {
            // Append the current player's piece identifier to the tile
            state.grid[row][col] += `-${state.currentPlayer}`;
        } else {
            console.error("The target tile already contains the current player's piece.");
            return state;
        }
    
        // Update the piece position in the state
        state.piecePosition = { row: row, col: col };
        state.validPiecePlacements = null;
        state.validSpareTilePlacements = this.validSpareTilePlacement(state);
        this.updateDestinationIndexAfterPiecePlacementAI(state, row, col)
        // this.updateDestinationIndexAfterPiecePlacementAI(state, row, col);

    
        // Optionally, handle any additional game logic here, such as checking for game over
    
        return state; // Return the updated state
    }
    updateDestinationIndexAfterPiecePlacementAI(state, row, col) {
        const tileComponents = state.grid[row][col].split("-");
    
        if (state.currentPlayerCurrentDestinationIndex < state.currentPlayerDestinations.length) {
    
            // Extract the destination component from the tile, if present
            const tileDestination = tileComponents.length > 1 ? tileComponents[1] : "";
    
            // Check if the piece is placed on the current destination
            if (tileDestination === state.currentPlayerDestinations[state.currentPlayerCurrentDestinationIndex]) {
                // Advance the destination index
                let newDestinationIndex = state.currentPlayerCurrentDestinationIndex + 1;
    
                if (newDestinationIndex >= state.currentPlayerDestinations.length) {
                    // The player needs to return to their initial position now
                    state.currentPlayerCurrentDestination = "return";
                    state.currentPlayerCurrentDestinationIndex = "return";
                } else {
                    // Update the destination index and current destination normally
                    state.currentPlayerCurrentDestinationIndex = newDestinationIndex;
                    state.currentPlayerCurrentDestination = state.currentPlayerDestinations[newDestinationIndex];
                }
            }
        } else if (state.currentPlayerCurrentDestinationIndex === "return" || state.currentPlayerCurrentDestination === "return") {
            // Determine the initial position based on the player's color
            let initialPosition = state.currentPlayer === "R" ? {row: 6, col: 0} : {row: 0, col: 6};
    
            // Check if the player has returned to their initial position
            if (row === initialPosition.row && col === initialPosition.col) {
                // The player has returned to the initial position, set game over
                state.gameOver = true;
                // console.log('Game over, player returned to initial position');
            } else {
                // console.log('Player has not yet returned to initial position');
            }
        } else {
            // console.log('Unexpected case in updateDestinationIndex');
        }
    }
    
    
            
    
}