export class Piece {
    constructor(player, row, col) {
        this.player = player;
        this.row = row;
        this.col = col;
    }

    getColour() {
        return this.player.colour;
    }
    
}
