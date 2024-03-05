import { Piece } from './piece.js';

export class Player {
    constructor(name, colour, row, col) {
        this.name = name;       // Player's name
        this.colour = colour;   // Player's color
        this.pieceRow = row;    // Starting row position of the player's piece
        this.pieceCol = col;    // Starting column position of the player's piece
        this.spareTile = null;  // Initialize the spare tile as null
        this.destinations = null; // Generate and store the random destinations
        this.initialRow = row; // Store initial position
        this.initialCol = col;
        this.currentDestinationIndex = 0;

    }

    // Method to update the piece's position
    updatePiecePosition(newRow, newCol) {
        this.pieceRow = newRow;       // Update the stored row position
        this.pieceCol = newCol;       // Update the stored column position
    }

    // Method to get the current piece's position
    getPiecePosition() {
        return { row: this.pieceRow, col: this.pieceCol };
    }

        // In Player class
    advanceToNextDestination() {
        if (this.destinations && this.currentDestinationIndex < this.destinations.length - 1) {
            this.currentDestinationIndex++;
        } else {
            // Handle the case when all destinations are reached
            this.currentDestinationIndex = "return"; // Use a special marker to indicate returning phase
        }
    }


    // In Player class
    getCurrentDestination() {
        if (this.currentDestinationIndex === "return") {
            // Special case for returning to the initial position
            return "return";
        } else if (this.destinations && this.currentDestinationIndex < this.destinations.length) {
            return this.destinations[this.currentDestinationIndex];
        }
        return null; // or any other appropriate default value
    }


     // Add method to check if returned to initial position
     hasReturnedToInitialPosition() {
        return this.pieceRow === this.initialRow && this.pieceCol === this.initialCol;
    }

}