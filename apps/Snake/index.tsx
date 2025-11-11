import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const INITIAL_SPEED = 200;

type Vector = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const getRandomCoord = (): Vector => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  y: Math.floor(Math.random() * GRID_SIZE),
});

const Snake: React.FC = () => {
  const [snake, setSnake] = useState<Vector[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Vector>(getRandomCoord);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [speed, setSpeed] = useState<number>(INITIAL_SPEED);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [score, setScore] = useState(0);

  const gameLoopRef = useRef<number | null>(null);

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameState('gameOver');
        return prevSnake;
      }
      
      // Self collision
      for(let i = 1; i < newSnake.length; i++) {
        if(head.x === newSnake[i].x && head.y === newSnake[i].y) {
           setGameState('gameOver');
           return prevSnake;
        }
      }

      newSnake.unshift(head);
      
      // Food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 1);
        setFood(getRandomCoord);
        setSpeed(s => Math.max(50, s * 0.95)); // Increase speed
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food]);
  
  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(getRandomCoord());
    setDirection('RIGHT');
    setSpeed(INITIAL_SPEED);
    setScore(0);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') {
      if(gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }
    gameLoopRef.current = window.setInterval(moveSnake, speed);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, moveSnake, speed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);
  
  const renderGrid = () => {
      const isSnake = (x: number, y: number) => snake.some(seg => seg.x === x && seg.y === y);
      const isFood = (x: number, y: number) => food.x === x && food.y === y;
      const isHead = (x: number, y: number) => snake[0].x === x && snake[0].y === y;

      const cells = [];
      for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
              let cellClass = 'bg-[hsl(var(--muted-hsl))]';
              if(isSnake(x,y)) cellClass = 'bg-green-500';
              if(isHead(x,y)) cellClass = 'bg-green-400';
              if(isFood(x,y)) cellClass = 'bg-red-500';
              cells.push(<div key={`${x}-${y}`} className={`aspect-square rounded-sm ${cellClass}`} />);
          }
      }
      return cells;
  }

  return (
    <div className="w-full h-full bg-[hsl(var(--card-hsl))] flex flex-col items-center justify-center p-4">
      <div className="w-full flex justify-between items-center mb-4 px-2">
        <h1 className="text-xl font-bold">Snake</h1>
        <div className="text-lg">Score: <span className="font-bold">{score}</span></div>
      </div>
      <div className="relative w-full max-w-lg aspect-square bg-[hsl(var(--secondary-hsl))] rounded-md p-1">
        <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`}}>
            {renderGrid()}
        </div>
        {gameState !== 'playing' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center">
                <h2 className="text-4xl font-bold mb-4">{gameState === 'start' ? 'Ready to play?' : 'Game Over'}</h2>
                <button onClick={startGame} className="px-4 py-2 bg-[hsl(var(--accent-strong-hsl))] rounded-md text-[hsl(var(--accent-foreground-hsl))]">
                    {gameState === 'start' ? 'Start Game' : 'Play Again'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Snake;
