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
                row.push(new Tile(this.getRandomPattern()));
            }
            grid.push(row);
        }

        // Fixed patterns and destinations
        this.setFixedPatternsAndDestinations(grid, player1, player2);

        this.assignRandomDestinations(grid);

        // Isolate destinations and player tiles
        this.setIsolatedPatterns(grid, [
            [0, 0], [6, 6], // Destinations
            [1, 3], [5,3],
            [0, 6], [6, 0] // Player positions
        
        ]);



        return grid;
    }

    assignRandomDestinations(grid) {
        const destinations = ['mountain', 'moon'];
        const positions = [[1, 3], [5, 3]];

        // Shuffle the destinations array
        for (let i = destinations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [destinations[i], destinations[j]] = [destinations[j], destinations[i]];
        }

        // Assign destinations and isolate them
        positions.forEach((position, index) => {
            const [row, col] = position;
            grid[row][col] = new Tile(this.getRandomPattern(), null, new Destination(destinations[index]));
            // Isolate the newly assigned destinations
        });
    }


    setFixedPatternsAndDestinations(grid, player1, player2) {
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
    }

    setIsolatedPatterns(grid, positions) {
        positions.forEach(([row, col]) => {
            this.setIsolatedDestinationPatterns(grid, row, col);
        });
    }

    setIsolatedDestinationPatterns(grid, destRow, destCol) {
        const patternRules = {
            'horizontal': {
                'left': ['horizontal', 'L-up-right', 'L-down-right', 'T-up', 'T-down', 'T-right'],
                'right': ['horizontal', 'L-up-left', 'L-down-left', 'T-up', 'T-down', 'T-left'],
                'up' : [],
                'down' : [],

            },
            'vertical': {
                'up': ['vertical', 'L-down-left', 'L-down-right', 'T-left', 'T-right', 'T-down'],
                'down': ['vertical', 'L-up-left', 'L-up-right', 'T-left', 'T-right', 'T-up'],
                'left' : [],
                'right' : [],
            },
            'L-up-right': {
                'up': ['vertical', 'T-left', 'T-right', 'T-down', 'L-down-left', 'L-down-right'],
                'right': ['horizontal', 'T-up', 'T-down', 'T-left', 'L-up-left', 'L-down-left'],
                'left' : [],
                'down' : [],

            },
            'L-up-left': {
                'up': ['vertical', 'T-left', 'T-right', 'T-down', 'L-down-left', 'L-down-right'],
                'left': ['horizontal', 'T-up', 'T-down', 'T-right', 'L-up-right', 'L-down-right'],
                'right':[],
                'down': [],
            },
            'L-down-right': {
                'right': ['horizontal', 'T-up', 'T-down', 'T-left', 'L-up-left', 'L-down-left'],
                'down': ['vertical', 'T-left', 'T-right', 'T-up', 'L-up-left', 'L-up-right'],
                'up' : [],
                'left' : [],

            },
            'L-down-left': {
                'left': ['horizontal', 'T-up', 'T-down', 'T-right', 'L-up-right', 'L-down-right'],
                'down': ['vertical', 'T-left', 'T-right', 'T-up', 'L-up-left', 'L-up-right'],
                'up' : [],
                'right': [],
            },
            'T-up': {
                'left': ['horizontal', 'L-down-right', 'L-up-right', 'T-down', 'T-right', 'T-up'],
                'right': ['horizontal', 'L-down-left', 'L-up-left', 'T-down', 'T-left', 'T-up'],
                'up': ['vertical', 'L-down-left', 'L-down-right', 'T-left', 'T-right', 'T-down'],
                'down': [],

            },
            'T-down': {
                'left': ['horizontal', 'L-down-right', 'L-up-right', 'T-up', 'T-down', 'T-right'],
                'right': ['horizontal', 'L-down-left', 'L-up-left', 'T-up', 'T-left', 'T-down'],
                'down': ['vertical', 'L-up-left', 'L-up-right', 'T-left', 'T-right', 'T-up'],
                'up': [],
            },
            'T-right': {
                'up': ['vertical', 'L-down-left', 'L-down-right', 'T-left', 'T-down', 'T-right'],
                'down': ['vertical', 'L-up-left', 'L-up-right', 'T-left', 'T-up', 'T-right'],
                'right': ['horizontal', 'L-up-left', 'L-down-left', 'T-up', 'T-down', 'T-left'],
                'left' : [],
            },
            'T-left': {
                'up': ['vertical', 'L-down-left', 'L-down-right', 'T-right', 'T-down', 'T-left'],
                'down': ['vertical', 'L-up-left', 'L-up-right', 'T-right', 'T-up', 'T-left'],
                'left': ['horizontal', 'L-up-right', 'L-down-right', 'T-up', 'T-down', 'T-right'],
                'right' : [],
            }
        };   

        const directions = [
            { dx: -1, dy: 0, ruleKey: 'up' },
            { dx: 1, dy: 0, ruleKey: 'down' },
            { dx: 0, dy: -1, ruleKey: 'left' },
            { dx: 0, dy: 1, ruleKey: 'right' }
        ];
    
        directions.forEach(({ dx, dy, ruleKey }) => {
            const row = destRow + dx;
            const col = destCol + dy;
            if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
                // Ensure that we're accessing a valid pattern for the current tile
                const currentPattern = grid[destRow][destCol].pattern; // Assume each Tile object has a 'pattern' property
                if (patternRules[currentPattern] && patternRules[currentPattern][ruleKey]) {
                    const excludePatterns = patternRules[currentPattern][ruleKey];
                    const filteredPatterns = this.getFilteredPatterns(excludePatterns);
                    grid[row][col].pattern = filteredPatterns[Math.floor(Math.random() * filteredPatterns.length)];
                } else {
                    console.error(`No exclusion patterns found for pattern: ${currentPattern} and direction: ${ruleKey}`);
                }
            }
        });
    }

    getFilteredPatterns(excludePatterns) {
        const allPatterns = ['T-up', 'T-right', 'T-down', 'T-left', 'L-up-right', 'L-up-left', 'L-down-right', 'L-down-left', 'horizontal', 'vertical'];
        return allPatterns.filter(p => !excludePatterns.includes(p));
    }

    getRandomPattern() {
        const patterns = ['T-up', 'T-right', 'T-down', 'T-left', 'L-up-right', 'L-up-left', 'L-down-right', 'L-down-left', 'horizontal', 'vertical'];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }
}