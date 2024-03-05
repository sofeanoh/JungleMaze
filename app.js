// Assuming the necessary imports are made at the top of your App.js file
import { Game } from './game.js'; // Adjust the path as necessary
import { Player } from './player.js';
import { AIPlayer } from './aiplayer.js';


class App {
    constructor() {
        // The Game instance now requires player objects to be passed in its constructor. We'll initialize these in startGameWithSettings.
        this.game = null;
    }

    startGameWithSettings() {
        const opponentType = document.getElementById('selectOpponent').value;
        const playerName = document.getElementById('playerName').value || 'Player 1';
        const aiDepth = parseInt(document.getElementById('aiDepth').value, 10) || 1; // Default depth to 3 if not applicable
    
        // Initialize player1 as the human player
        const player1 = new Player(playerName, 'red', 6, 0); // Adjust parameters as needed
    
        // Configure player2 based on the selected mode
        if (opponentType === 'playerVsAI') {
            // Directly create an AIPlayer instance, which now extends Player
            // Since AIPlayer extends Player, it requires the parameters for Player plus any additional ones for AIPlayer
            const aiPlayer = new AIPlayer('AI', 'blue', 0, 6, aiDepth); // Note: Adjusted to pass parameters required by Player and AIPlayer
            this.game = new Game(player1, aiPlayer);
        } else {
            const player2 = new Player('Player 2', 'blue', 0, 6); // Default second player
            this.game = new Game(player1, player2);
        }
    
        // Now that the game is initialized, we can set up the board and attach event listeners
        this.game.renderBoard();
        this.game.attachEventListeners();
        this.game.renderDestinations();
        this.game.simulateSpareTileClick();
    
        // For debugging purposes
        window.game = this.game; // Make the game accessible globally for debugging
    }
    

    updateSettingsVisibility() {
        const opponentType = document.getElementById('selectOpponent').value;
        document.getElementById('aiTypeContainer').style.display = opponentType === 'playerVsAI' ? 'block' : 'none';
        document.getElementById('aiDepthContainer').style.display = (opponentType === 'playerVsAI' && document.getElementById('aiType').value === 'minimax') ? 'block' : 'none';
        document.getElementById('playerNameInput').style.display = 'block';

        if (opponentType === 'playerVsPlayer') {
            document.getElementById('aiType').value = 'N/A'; // Reset to default or hide
            document.getElementById('aiDepth').value = 'N/A'; // Similarly, reset or hide
        }
    }


    

}

// Initialize the app and its UI components on window load
window.onload = function() {
    // Attach app to window to make it globally accessible
    window.app = new App();
    window.app.updateSettingsVisibility(); // Set initial visibility for settings

    // Setup event listeners for dynamic UI updates
    document.getElementById('selectOpponent').addEventListener('change', function() { window.app.updateSettingsVisibility(); });
    document.getElementById('aiType').addEventListener('change', function() { window.app.updateSettingsVisibility(); });
    
    // Start the game based on selected settings
    document.getElementById('startGame').addEventListener('click', function() {
        window.app.startGameWithSettings();
    });
};
