import { Piece } from './piece.js';
import { Destination } from './destination.js';
import { Tile } from './tile.js';

export class Board {
    constructor(player1, player2) {
        this.grid = this.createGrid(7, 7, player1, player2);
        this.originalState = JSON.parse(JSON.stringify(this.grid)); // Save the original state of the board
    }

    createGrid(rows, cols, player1, player2) {
        let grid = [];
        for (let i = 0; i < rows; i++) {
            let row = [];
            for (let j = 0; j < cols; j++) {
                let pattern = this.getRandomPattern();
                row.push(new Tile(pattern));
            }
            grid.push(row);
        }

         // Set the fixed pattern tiles
         grid[0][0] = new Tile('L-down-right', null, new Destination('sun'));
         grid[0][6] = new Tile('L-down-left', new Piece(player2, 0, 6));
         grid[6][0] = new Tile('L-up-right', new Piece(player1, 6, 0));
         grid[6][6] = new Tile('L-up-left', null, new Destination('galaxy'));
         grid[0][2] = new Tile('T-down');
         grid[0][4] = new Tile('T-down');
         grid[2][0] = new Tile('T-right');
         grid[4][0] = new Tile('T-right');
         grid[6][2] = new Tile('T-up');
         grid[6][4] = new Tile('T-up');
         grid[2][6] = new Tile('T-left');
         grid[4][6] = new Tile('T-left');

         // Randomly assign the mountain and moon destinations
        const destinations = ['mountain', 'moon'];
        const positions = [[1, 3], [5, 3]];

        // Shuffle the destinations array
        for (let i = destinations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [destinations[i], destinations[j]] = [destinations[j], destinations[i]];
        }

        for (let i = 0; i < destinations.length; i++) {
            const [row, col] = positions[i];
            grid[row][col] = new Tile(this.getRandomPattern(), null, new Destination(destinations[i]));
        }

        return grid;
    }

    getRandomPattern() {
        const patterns = ['T-up', 'T-right', 'T-down', 'T-left', 'L-up-right', 'L-up-left', 'L-down-right', 'L-down-left', 'horizontal', 'vertical'];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    
}
