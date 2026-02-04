# Chess App with Stockfish Backend

A fully functional chess application with drag-and-drop piece movement, move history navigation, and Stockfish engine evaluation.

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```

The backend server will start on `http://localhost:3001` and initialize Stockfish.

### 2. Frontend Setup (in a new terminal)

```bash
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`.

## Features

✅ **Chessboard Component**
- Drag-and-drop piece movement
- Legal move validation using chess.js
- Only allows moves for the current turn's side
- Automatic reset to opening position on page refresh

✅ **PGN Navigator**
- View full game history
- Navigate through all moves with arrow buttons
- Jump to any position in the game
- "Reset from Here" to start a new game from any past position

✅ **Moves List**
- Shows all legal moves for the current position
- Organized by piece type
- Click any move to execute it immediately
- Stockfish evaluation scores (when backend is running)

✅ **Game State Management**
- Full move history tracking
- Forward/backward navigation
- Disabled board when viewing past positions
- Clean, dark-themed UI

## Architecture

### Frontend (React + TypeScript + Vite)
- `src/components/Chessboard.tsx` - Main board component with drag-and-drop
- `src/components/PGNNavigator.tsx` - Game history and navigation
- `src/utils/stockfishEval.ts` - Move evaluation engine with console logging

## Technologies Used

- **Frontend**: React 19, TypeScript, Vite, chess.js
- **Backend**: Express, Stockfish (JavaScript), CORS
- **Styling**: Custom CSS with CSS variables for theming

## Running Both Simultaneously

In one terminal (backend):
```bash
cd backend
npm start
```

In another terminal (frontend):
```bash
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Notes

- The backend must be running for Stockfish evaluation to work
- If the backend is not running, the app still works but moves show 0.0 score
- Stockfish evaluation rankings are logged to the browser console
- All moves are legal - validated by chess.js before display
