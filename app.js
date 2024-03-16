// Assuming the necessary imports are made at the top of  App.js file
import { Game } from './game.js'; // Adjust the path as necessary
import { Player } from './player.js';
import { AIPlayer } from './aiplayer.js';


class App {
    constructor() {
        // The Game instance now requires player objects to be passed in its constructor.  initialize these in startGameWithSettings.
        this.game = null;
        this.turnCheckInterval = null; // Keep a reference to the interval

    }

    initializeTurnCheck() {
        if (this.turnCheckInterval !== null) {
            clearInterval(this.turnCheckInterval); // Clear existing interval if it exists
        }

        this.turnCheckInterval = setInterval(() => {
            // Ensure the game instance exists and is in a state where turns can be switched
            if (this.game && this.game.nextRound) {
                this.game.switchTurn();

            }
        }, 1500); // Check every 100 milliseconds
    }

    // Ensure to clear the interval when the app/game is stopped or restarted to prevent memory leaks
    stopGame() {
        if (this.turnCheckInterval !== null) {
            clearInterval(this.turnCheckInterval);
            this.turnCheckInterval = null;
        }

        // Additional game stopping logic...
    }



    startGameWithSettings() {
        const opponentType = document.getElementById('selectOpponent').value;
        const playerName = document.getElementById('playerName').value || 'AI Player 1';
        const aiDepth1 = parseInt(document.getElementById('aiDepth1').value, 10) || 1; // Default depth to 3 if not applicable
        const aiDepth2 = parseInt(document.getElementById('aiDepth2').value, 10) || 1; // Default depth to 3 if not applicable
        const aiType1 = document.getElementById('aiType1').value; // Default depth to 3 if not applicable
        const aiType2 = document.getElementById('aiType2').value; // Default depth to 3 if not applicable
        const minimaxType1 = document.getElementById('minimaxType1').value ; // Default depth to 3 if not applicable
        const minimaxType2 = document.getElementById('minimaxType2').value ; // Default depth to 3 if not applicable

    
        // AI vs AI mode setup
        if (opponentType === 'aiVsAI') {
            // Create two AIPlayer instances
            const aiPlayer1 = new AIPlayer('AI Player 1', 'red', 6, 0, aiDepth1, aiType1, minimaxType1); // Customize as needed
            const aiPlayer2 = new AIPlayer('AI Player 2', 'blue', 0, 6, aiDepth2, aiType2, minimaxType2); // Customize as needed
    
            this.game = new Game(aiPlayer1, aiPlayer2);
        } else if (opponentType === 'playerVsAI') {
            // Existing player vs AI setup
            const player1 = new Player(playerName, 'red', 6, 0);
            const aiPlayer = new AIPlayer('AI Player', 'blue', 0, 6, aiDepth1, aiType1, minimaxType1);
    
            this.game = new Game(player1, aiPlayer);
        } else {
            // Existing player vs player setup
            const player1 = new Player(playerName, 'red', 6, 0);
            const player2 = new Player('Player 2', 'blue', 0, 6);
    
            this.game = new Game(player1, player2);
        }
    
        // Common setup for all modes
        this.game.renderBoard();
        this.game.attachEventListeners();
        this.game.renderDestinations();
        this.game.simulateSpareTileClick();
        window.game = this.game; // For debugging
        if (opponentType === 'aiVsAI') {
        setTimeout(() => this.game.executeAIMove(), 300); // A slight delay to ensure everything is set up
        }

        // this.initializeTurnCheck(); // Initialize the turn check if necessary for AI vs AI mode
    }
    
    

    updateSettingsVisibility() {
        const opponentType = document.getElementById('selectOpponent').value;
        const aiType1 = document.getElementById('aiType1').value;
        const aiType2 = document.getElementById('aiType2').value;


        // Adjust visibility based on opponent type
        if (opponentType === 'playerVsAI'){
            document.getElementById('aiTypeContainer1').style.display = 'block';
            document.getElementById('minimaxContainer1').style.display =  aiType1 == 'minimax' ? 'block' : 'none';
            document.getElementById('aiDepthContainer1').style.display = aiType1 == 'minimax'? 'block' : 'none';

            document.getElementById('aiTypeContainer2').style.display = 'none';
            document.getElementById('minimaxContainer2').style.display = 'none';
            document.getElementById('aiDepthContainer2').style.display = 'none';

        } else if(opponentType === 'aiVsAI') {
            document.getElementById('aiTypeContainer1').style.display = 'block';
            document.getElementById('minimaxContainer1').style.display =  aiType1 == 'minimax' ? 'block' : 'none';
            document.getElementById('aiDepthContainer1').style.display = aiType1 == 'minimax'? 'block' : 'none';

            document.getElementById('aiTypeContainer2').style.display = 'block';
            document.getElementById('minimaxContainer2').style.display =  aiType2 == 'minimax' ? 'block' : 'none';
            document.getElementById('aiDepthContainer2').style.display = aiType2 == 'minimax'? 'block' : 'none';
        } else {
            document.getElementById('aiTypeContainer1').style.display = 'none';
            document.getElementById('aiDepthContainer1').style.display = 'none';
            document.getElementById('minimaxContainer1').style.display = 'none';

            document.getElementById('aiTypeContainer2').style.display = 'none';
            document.getElementById('aiDepthContainer2').style.display = 'none';
            document.getElementById('minimaxContainer2').style.display = 'none';

        }
    
        // Adjust visibility for player name input - hide if AI vs AI
        document.getElementById('playerNameInput').style.display = opponentType === 'aiVsAI' ? 'none' : 'block';
    }
    

    

}

// Initialize the app and its UI components on window load
window.onload = function() {
    // Attach app to window to make it globally accessible
    window.app = new App();
    window.app.updateSettingsVisibility(); // Set initial visibility for settings

    // Setup event listeners for dynamic UI updates
    document.getElementById('selectOpponent').addEventListener('change', function() { window.app.updateSettingsVisibility(); });
    document.getElementById('aiType1').addEventListener('change', function() { window.app.updateSettingsVisibility(); });
    document.getElementById('minimaxType1').addEventListener('change', function() { window.app.updateSettingsVisibility(); });
    document.getElementById('aiDepth1').addEventListener('change', function() { window.app.updateSettingsVisibility(); });

    document.getElementById('aiType2').addEventListener('change', function() { window.app.updateSettingsVisibility(); });
    document.getElementById('minimaxType2').addEventListener('change', function() { window.app.updateSettingsVisibility(); });
    document.getElementById('aiDepth2').addEventListener('change', function() { window.app.updateSettingsVisibility(); });

    // Start the game based on selected settings
    document.getElementById('startGame').addEventListener('click', function() {
        window.app.startGameWithSettings();
    });
};
