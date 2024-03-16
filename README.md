Project: Game : JungleMaze

This project can be run live on the link :

Otherwise:
Run this repository on a localhost.

/////Game introduction:///////

There are three versions:
1. Player vs Player
 - Note that this version can only be run by two players on the SAME device.

2. Player VS AI

3. AI Vs AI

For 2 and 3, user must choose the AITYPE; whether to use Minimax, Minimax with AB Pruning, Transosition table AB pruning or Minimax Iterative Deepening
    - For All minimax functions, user have to choose the depth up to depth 3.

//////////Gameplay :////////////////////

Players have to compete to achieve all destinations before the other player. At the start of the game, board of 7x7 cells will be initialised with random pattern. the four destinations are on the board. 

Each player's destinations list are displayed on their side of the board. Initially, only the first destination is shown on each destinations containers. This is their first goal to reach. Each time a player reach their current destination, the next destination will be revealed.

Once a player has reached all four destinations, the player has to return to their initial position. Once this happen, the player wins and the game is over. 

The game is a battle between aiming to form path to complete the destinations before the opponent while aiming to block the opponent pathway.

/////////////How to play?/////////////

1. Place Spare tile:

On player's turn, Player have to click on the valid tile at the edge of the board. 
Only valid position will be highlighted. This will place the pattern of player's spareTile (the small box below destinations container) on to the desired row/col. Depending on the position that player place the spare Tile, the entire row/col will be shifted, and opponent will get the pushed out tile. 

- If a piece/destination is at the end of a row/col, the opposite end will be excluded from being highlighted. As it is illegal to pushed out such tile out of the board. 

- Illegal spare tile placement include the position that is the end opposite of previous player's move.


2. Placing Piece:

If there is a legal move to place piece after placing spare tile, the legal moves will be highlighted. otherwise, it is the next player's turn.

- Illegal piece placement includes the tile that has opponent's piece.


