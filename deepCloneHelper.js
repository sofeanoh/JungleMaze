export class DeepCloneHelper {
    static clonePlayer(player) {
        // Assuming Player class has properties like name, colour, destinations, currentDestinationIndex, etc.
        const clonedPlayer = new Player(player.name, player.colour);
        // Clone properties
        Object.assign(clonedPlayer, {
            destinations: [...player.destinations],
            currentDestinationIndex: player.currentDestinationIndex,
            // Add more player properties to clone as needed
            spareTile: player.spareTile ? DeepCloneHelper.cloneTile(player.spareTile) : null,
            piecePosition: player.piecePosition ? {...player.piecePosition} : null
            // Ensure all relevant properties are deeply cloned
        });
        return clonedPlayer;
    }

    static cloneTile(tile) {
        const clonedTile = new Tile(tile.pattern);
        // Clone properties
        if (tile.piece) clonedTile.piece = DeepCloneHelper.clonePiece(tile.piece);
        if (tile.destination) clonedTile.destination = new Destination(tile.destination.type);
        // Add more tile properties to clone as needed
        return clonedTile;
    }

    static clonePiece(piece) {
        // Assuming Piece class has properties like colour, player reference, etc.
        const clonedPiece = new Piece(piece.colour);
        // Clone properties
        // If the piece class contains references to players or other objects, handle those carefully
        return clonedPiece;
    }

    static cloneBoard(board) {
        const clonedBoard = new Board(); // Assuming Board constructor can be called without arguments for this purpose
        clonedBoard.grid = board.grid.map(row => row.map(tile => DeepCloneHelper.cloneTile(tile)));
        // Clone or re-assign other board properties as needed
        clonedBoard.originalState = JSON.parse(JSON.stringify(board.originalState)); // Example for simple properties
        return clonedBoard;
    }

    static cloneGame(state) {
        const clonedState = new Game(); // Assuming Game constructor can handle an empty init or provide a separate method for cloning
        // Deep clone players (including their properties like spare tiles)
        clonedState.players = state.players.map(player => DeepCloneHelper.clonePlayer(player));
        clonedState.currentPlayer = clonedState.players[state.players.indexOf(state.currentPlayer)]; // Re-assign currentPlayer based on the index
        clonedState.board = DeepCloneHelper.cloneBoard(state.board);
        // Clone other state properties as needed
        clonedState.gameOver = state.gameOver;
        // Add more properties to clone
        return clonedState;
    }
}
