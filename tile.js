export class Tile {
    constructor(pattern, piece = null, destination = null) {
        this.pattern = pattern;
        this.piece = piece;
        this.destination = destination;
        this.element = null;

    }
 
    getImageName() { //returns the name of the image file that corresponds to the pattern of the tile. 
        return `${this.pattern}.png`;
    }

    getDestinationImageName() { //returns the name of the image file that corresponds to the destination of the tile, or null if the tile does not have a destination. 
        return this.destination ? `${this.destination.type}.png` : null;
    }
}
