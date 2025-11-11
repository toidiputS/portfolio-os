import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

interface GameState {
  deck: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Card[][];
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_VALUES: Record<Rank, number> = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
  return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const Solitaire: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<{ pile: string; cardIndex: number } | null>(null);
  const [isWon, setIsWon] = useState(false);

  const initializeGame = useCallback(() => {
    let deck = shuffleDeck(createDeck());
    const tableau: Card[][] = Array.from({ length: 7 }, () => []);
    for (let i = 0; i < 7; i++) {
      for (let j = i; j < 7; j++) {
        tableau[j].push(deck.pop()!);
      }
    }
    tableau.forEach(pile => {
      if (pile.length > 0) {
        pile[pile.length - 1].faceUp = true;
      }
    });

    setGameState({
      deck,
      waste: [],
      foundations: [[], [], [], []],
      tableau,
    });
    setSelected(null);
    setIsWon(false);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (gameState && gameState.foundations.every(f => f.length === 13)) {
      setIsWon(true);
    }
  }, [gameState]);
  
  const handleDeckClick = () => {
    if (isWon) return;
    setGameState(prev => {
      if (!prev) return prev;
      let newDeck = [...prev.deck];
      let newWaste = [...prev.waste];

      if (newDeck.length > 0) {
        const card = newDeck.pop()!;
        card.faceUp = true;
        newWaste.push(card);
      } else if (newWaste.length > 0) {
        newDeck = newWaste.reverse().map(c => ({...c, faceUp: false}));
        newWaste = [];
      }
      return { ...prev, deck: newDeck, waste: newWaste };
    });
  };

  const handleCardClick = (pileName: string, cardIndex: number) => {
    if (isWon) return;
    if (!selected) {
      setSelected({ pile: pileName, cardIndex });
      return;
    }

    // Move logic
    const { pile: fromPile, cardIndex: fromIndex } = selected;
    
    setGameState(prev => {
        if(!prev) return prev;
        const newState = JSON.parse(JSON.stringify(prev)) as GameState;

        const getPile = (name: string, state: GameState) => {
          const [type, index] = name.split('-');
          if (type === 'tableau') return state.tableau[parseInt(index)];
          if (type === 'foundation') return state.foundations[parseInt(index)];
          if (type === 'waste') return state.waste;
          return [];
        };

        const fromPileArr = getPile(fromPile, newState);
        const toPileArr = getPile(pileName, newState);
        const cardToMove = fromPileArr[fromIndex];

        if (!cardToMove || !cardToMove.faceUp) return prev;

        // To Foundation
        if (pileName.startsWith('foundation')) {
            const cardStack = fromPileArr.slice(fromIndex);
            if(cardStack.length > 1) return prev; // Can't move stacks to foundation

            const foundation = toPileArr;
            if (foundation.length === 0 && cardToMove.rank === 'A') {
                foundation.push(fromPileArr.pop()!);
            } else if (foundation.length > 0) {
                const topCard = foundation[foundation.length - 1];
                if (topCard.suit === cardToMove.suit && RANK_VALUES[cardToMove.rank] === RANK_VALUES[topCard.rank] + 1) {
                    foundation.push(fromPileArr.pop()!);
                }
            }
        }
        
        // To Tableau
        if (pileName.startsWith('tableau')) {
            const tableau = toPileArr;
            const cardIsRed = cardToMove.suit === 'hearts' || cardToMove.suit === 'diamonds';

            if (tableau.length === 0 && cardToMove.rank === 'K') {
                const cards = fromPileArr.splice(fromIndex);
                tableau.push(...cards);
            } else if (tableau.length > 0) {
                const topCard = tableau[tableau.length - 1];
                const topCardIsRed = topCard.suit === 'hearts' || topCard.suit === 'diamonds';
                if (cardIsRed !== topCardIsRed && RANK_VALUES[cardToMove.rank] === RANK_VALUES[topCard.rank] - 1) {
                    const cards = fromPileArr.splice(fromIndex);
                    tableau.push(...cards);
                }
            }
        }
        
        // Flip card in fromPile if needed
        const newFromPileArr = getPile(fromPile, newState);
        if (newFromPileArr && newFromPileArr.length > 0 && !newFromPileArr[newFromPileArr.length - 1].faceUp) {
          newFromPileArr[newFromPileArr.length - 1].faceUp = true;
        }

        return newState;
    });

    setSelected(null);
  };
  
  const suitSymbols: Record<Suit, { char: string; color: string }> = {
    hearts: { char: '♥', color: 'text-red-500' },
    diamonds: { char: '♦', color: 'text-red-500' },
    clubs: { char: '♣', color: 'text-[hsl(var(--foreground-hsl))]' },
    spades: { char: '♠', color: 'text-[hsl(var(--foreground-hsl))]' },
  };

  const CardComponent: React.FC<{ card: Card | null; isSelected?: boolean; onClick: () => void; isPlaceholder?: boolean }> = ({ card, isSelected, onClick, isPlaceholder }) => {
    const baseClasses = "w-20 h-28 rounded-lg border-2 flex flex-col justify-between p-1 text-lg font-bold";
    if (isPlaceholder) {
        return <div onClick={onClick} className={`${baseClasses} bg-black/20 border-dashed border-[hsl(var(--muted-foreground-hsl))]`} />;
    }
    if (!card) return null;

    if (!card.faceUp) {
        return <div onClick={onClick} className={`${baseClasses} bg-blue-500 border-blue-700`} />;
    }
    
    const { char, color } = suitSymbols[card.suit];
    return (
        <div onClick={onClick} className={`${baseClasses} ${color} ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-[hsl(var(--border-hsl))]'} bg-[hsl(var(--card-hsl))] cursor-pointer`}>
            <span>{card.rank}{char}</span>
            <span className="text-4xl text-center">{char}</span>
            <span className="self-end rotate-180">{card.rank}{char}</span>
        </div>
    );
  };

  const TableauPile: React.FC<{ pile: Card[]; pileIndex: number }> = ({ pile, pileIndex }) => {
    return (
        <div className="relative h-96 w-20" onClick={() => pile.length === 0 && handleCardClick(`tableau-${pileIndex}`, 0)}>
            {pile.length === 0 ? <div className="absolute top-0 left-0 w-20 h-28 rounded-lg bg-black/20 border-dashed border-[hsl(var(--muted-foreground-hsl))]"/> :
             pile.map((card, cardIndex) => (
                <div key={cardIndex} className="absolute" style={{ top: `${cardIndex * 30}px` }}>
                    <CardComponent card={card} isSelected={selected?.pile === `tableau-${pileIndex}` && selected.cardIndex === cardIndex} onClick={() => handleCardClick(`tableau-${pileIndex}`, cardIndex)} />
                </div>
            ))}
        </div>
    );
  };
  
  if (!gameState) return <div className="p-4">Loading...</div>;

  return (
    <div className="w-full h-full bg-[hsl(var(--secondary-hsl))] p-4 flex flex-col text-[hsl(var(--foreground-hsl))]">
       <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <div className="flex gap-2">
            <div onClick={handleDeckClick} className="w-20 h-28 rounded-lg border-2 border-[hsl(var(--border-hsl))] bg-blue-500 flex items-center justify-center cursor-pointer">
              {gameState.deck.length > 0 && <RotateCcw/>}
            </div>
            <CardComponent card={gameState.waste[gameState.waste.length - 1] ?? null} isSelected={selected?.pile === 'waste' && selected.cardIndex === gameState.waste.length-1} onClick={() => gameState.waste.length > 0 && handleCardClick('waste', gameState.waste.length-1)}/>
          </div>
          <div className="flex-grow"/>
          <div className="flex gap-2">
            {gameState.foundations.map((pile, i) => (
               <CardComponent key={i} card={pile[pile.length - 1] ?? null} isSelected={false} isPlaceholder={pile.length === 0} onClick={() => handleCardClick(`foundation-${i}`, pile.length)} />
            ))}
          </div>
        </div>
        <button onClick={initializeGame} className="p-2 bg-[hsl(var(--accent-strong-hsl))] rounded-md flex items-center gap-2"><RotateCcw size={16}/> New Game</button>
      </div>
      <div className="flex justify-between">
        {gameState.tableau.map((pile, i) => (
          <TableauPile key={i} pile={pile} pileIndex={i} />
        ))}
      </div>
       {isWon && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="p-8 bg-[hsl(var(--popover-hsl))] rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">You Win!</h2>
            <button onClick={initializeGame} className="p-2 bg-[hsl(var(--accent-strong-hsl))] rounded-md">Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Solitaire;
