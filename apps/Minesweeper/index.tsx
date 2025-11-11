import React, { useState, useEffect, useCallback } from 'react';
import { Flag, Bomb, Smile, Frown, PartyPopper, RotateCcw } from 'lucide-react';

const ROWS = 10;
const COLS = 10;
const MINES = 12;

type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

type GameStatus = 'playing' | 'won' | 'lost';

const createEmptyBoard = (): CellState[][] => {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
};

const Minesweeper: React.FC = () => {
  const [board, setBoard] = useState<CellState[][]>(createEmptyBoard);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [flags, setFlags] = useState(0);
  const [timer, setTimer] = useState(0);

  const initializeBoard = useCallback((startRow: number, startCol: number) => {
    let newBoard = createEmptyBoard();
    
    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);
      // Ensure the first clicked cell and its neighbors are not mines
      const isStartZone = Math.abs(row - startRow) <= 1 && Math.abs(col - startCol) <= 1;
      if (!newBoard[row][col].isMine && !isStartZone) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mines
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (newBoard[row][col].isMine) continue;
        let count = 0;
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            const newRow = row + r;
            const newCol = col + c;
            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && newBoard[newRow][newCol].isMine) {
              count++;
            }
          }
        }
        newBoard[row][col].adjacentMines = count;
      }
    }
    
    return newBoard;
  }, []);

  const revealCell = useCallback((row: number, col: number, currentBoard: CellState[][]): CellState[][] => {
    let newBoard = JSON.parse(JSON.stringify(currentBoard));
    const cell = newBoard[row][col];

    if (cell.isRevealed || cell.isFlagged) {
      return newBoard;
    }

    cell.isRevealed = true;

    if (cell.isMine) {
      setGameStatus('lost');
      return newBoard;
    }

    if (cell.adjacentMines === 0) {
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          const newRow = row + r;
          const newCol = col + c;
          if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
            newBoard = revealCell(newRow, newCol, newBoard);
          }
        }
      }
    }
    return newBoard;
  }, []);
  
  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setGameStatus('playing');
    setFlags(0);
    setTimer(0);
  }, [initializeBoard]);
  
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const revealedCount = board.flat().filter(cell => cell.isRevealed).length;
    if (revealedCount > 0 && revealedCount === ROWS * COLS - MINES) {
      setGameStatus('won');
    }
  }, [board, gameStatus]);


  const handleCellClick = (row: number, col: number) => {
    if (gameStatus !== 'playing') return;
    
    let currentBoard = board;
    const isFirstClick = board.flat().every(cell => !cell.isRevealed);

    if (isFirstClick) {
        currentBoard = initializeBoard(row, col);
    }
    
    setBoard(revealCell(row, col, currentBoard));
  };

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (gameStatus !== 'playing') return;
    const newBoard = JSON.parse(JSON.stringify(board));
    const cell = newBoard[row][col];
    if (cell.isRevealed) return;
    
    if (cell.isFlagged) {
        cell.isFlagged = false;
        setFlags(f => f - 1);
    } else {
        if (flags < MINES) {
            cell.isFlagged = true;
            setFlags(f => f + 1);
        }
    }
    setBoard(newBoard);
  };
  
  const getCellContent = (cell: CellState) => {
      if (gameStatus !== 'playing' && cell.isMine) return <Bomb size={16} className="text-red-500" />;
      if (cell.isFlagged) return <Flag size={16} className="text-[hsl(var(--foreground-hsl))]" />;
      if (!cell.isRevealed) return null;
      if (cell.adjacentMines > 0) {
        const colors = ['text-blue-500', 'text-green-500', 'text-red-500', 'text-purple-500', 'text-maroon-500', 'text-teal-500', 'text-black', 'text-gray-500'];
        return <span className={`font-bold ${colors[cell.adjacentMines - 1]}`}>{cell.adjacentMines}</span>;
      }
      return null;
  };

  const getStatusIcon = () => {
      switch (gameStatus) {
          case 'won': return <PartyPopper className="w-8 h-8 text-yellow-400" />;
          case 'lost': return <Frown className="w-8 h-8 text-red-500" />;
          default: return <Smile className="w-8 h-8" />;
      }
  }

  return (
    <div className="w-full h-full bg-[hsl(var(--card-hsl))] flex flex-col items-center justify-center p-4 select-none">
      <header className="w-full max-w-sm flex justify-between items-center p-2 bg-[hsl(var(--secondary-hsl))] rounded-t-lg border-b border-[hsl(var(--border-hsl))]">
        <div className="bg-black text-red-500 font-mono text-2xl p-1 rounded">{String(MINES - flags).padStart(3, '0')}</div>
        <button onClick={resetGame} className="p-1 rounded-md hover:bg-[hsl(var(--muted-hsl))]">
            {getStatusIcon()}
        </button>
        <div className="bg-black text-red-500 font-mono text-2xl p-1 rounded">{String(timer).padStart(3, '0')}</div>
      </header>

      <div className="grid border-2 border-[hsl(var(--secondary-hsl))]" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              onContextMenu={(e) => handleRightClick(e, r, c)}
              className={`w-8 h-8 flex items-center justify-center border
              ${cell.isRevealed ? 'bg-[hsl(var(--muted-hsl))] border-[hsl(var(--border-hsl))]' : 'bg-[hsl(var(--secondary-hsl))] border-[hsl(var(--border-hsl))] hover:bg-[hsl(var(--muted-foreground-hsl))]'}`}
              disabled={gameStatus !== 'playing' && !cell.isRevealed}
            >
              {getCellContent(cell)}
            </button>
          ))
        )}
      </div>

       {gameStatus !== 'playing' && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <div className="p-8 bg-[hsl(var(--popover-hsl))] rounded-lg shadow-2xl text-center">
                <h2 className="text-3xl font-bold mb-4">{gameStatus === 'won' ? 'You Win!' : 'Game Over'}</h2>
                <button onClick={resetGame} className="flex items-center justify-center gap-2 p-2 rounded-md bg-[hsl(var(--accent-strong-hsl))] text-[hsl(var(--accent-foreground-hsl))]">
                    <RotateCcw size={16}/> Play Again
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Minesweeper;
