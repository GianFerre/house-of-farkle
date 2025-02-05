import React, { useState, useEffect } from 'react';
import './index.css';

const initialDiceCount = 6;
const winningScore = 5000; // Winning condition

function App() {
  const [mode, setMode] = useState(null);

  // Main menu: Only Two Player mode is available.
  if (!mode) {
    return (
      <div className="container">
        <h1 className="title">Farkle Game</h1>
        <p>Welcome to Farkle! Here are the rules:</p>
        <ul className="rules">
          <li>Roll up to six dice and score based on specific combinations.</li>
          <li>
            On each roll, if you score points, the scoring dice are set aside and remain visible while the remaining dice are re‐rolled.
          </li>
          <li>If you roll no scoring dice, you Farkle and lose all points for that turn.</li>
          <li>Three of a kind: 1s = 1000 points, other numbers = 100 × their value.</li>
          <li>Single 1s and 5s are worth 100 and 50 points respectively.</li>
          <li>The first player to reach {winningScore} wins.</li>
        </ul>
        <p>Select a game mode:</p>
        <div className="button-container">
          <button className="button" onClick={() => setMode('two')}>
            Two Player
          </button>
        </div>
      </div>
    );
  }

  return <FarkleGame goToMainMenu={() => setMode(null)} />;
}

function FarkleGame({ goToMainMenu }) {
  // Both players are human.
  const [playerScores, setPlayerScores] = useState([0, 0]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [turnScore, setTurnScore] = useState(0);
  // diceCount holds the number of dice to roll next.
  const [diceCount, setDiceCount] = useState(initialDiceCount);
  // "dice" holds the dice that are available for the next roll.
  const [dice, setDice] = useState([]);
  // accumulatedScoredDice holds all dice that have scored this turn.
  const [accumulatedScoredDice, setAccumulatedScoredDice] = useState([]);
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  // disableActions disables the Roll Dice and Bank Points buttons.
  const [disableActions, setDisableActions] = useState(false);
  // endTurnEnabled controls whether the End Turn button is enabled.
  const [endTurnEnabled, setEndTurnEnabled] = useState(false);

  // Mapping from die number to Unicode die face.
  const diceFaces = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
  };

  // Update the message when the current player changes (if the game isn't over).
  useEffect(() => {
    if (!gameOver) {
      setMessage(`It's Player ${currentPlayer + 1}'s turn.`);
    }
  }, [currentPlayer, gameOver]);

  // Roll the dice and evaluate them.
  const rollDice = () => {
    if (gameOver || disableActions) return;

    // Play the dice roll sound.
    const rollSound = new Audio('/dice-roll.mp3');
    rollSound.play();

    // Roll the dice.
    const newRoll = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
    const result = evaluateDice(newRoll);

    if (result.score === 0) {
      // Update the dice state so the UI shows the dice that were rolled.
      setDiceCount(result.nonScoringDice.length);
      setDice(result.nonScoringDice);
      
      // Disable further actions and enable the End Turn button.
      setDisableActions(true);
      setMessage(
        `Rolled ${newRoll.join(', ')} - Farkle! No scoring dice. Turn lost.\nPress "End Turn" to continue.`
      );
      setEndTurnEnabled(true);
      return;
    } else {
      const updatedTurnScore = turnScore + result.score;
      // Add the scoring dice from this roll to the accumulated scored dice.
      setAccumulatedScoredDice(prev => [...prev, ...result.scoringDice]);

      // Determine the dice remaining for the next roll.
      if (result.nonScoringDice.length === 0) {
        // Hot dice: all dice scored, so reset to 6 dice.
        setDiceCount(initialDiceCount);
        setDice([]);
      } else {
        setDiceCount(result.nonScoringDice.length);
        setDice(result.nonScoringDice);
      }
      setTurnScore(updatedTurnScore);
      setMessage(
        `Rolled ${newRoll.join(', ')}: Scored ${result.score} points (${result.breakdown}).\n` +
          `Turn score: ${updatedTurnScore}.`
      );
    }
  };

  // This function evaluates a roll and returns the total score, arrays of scoring and non-scoring dice, and a breakdown string.
  const evaluateDice = (diceArray) => {
    // Create a frequency map.
    const counts = {};
    diceArray.forEach(die => {
      counts[die] = (counts[die] || 0) + 1;
    });

    let score = 0;
    const scoringDice = [];
    // Process three-of-a-kind.
    for (let num = 1; num <= 6; num++) {
      if (counts[num] >= 3) {
        const points = num === 1 ? 1000 : num * 100;
        score += points;
        scoringDice.push(num, num, num);
        counts[num] -= 3;
      }
    }
    // Process extra 1s and 5s.
    if (counts[1]) {
      score += counts[1] * 100;
      for (let i = 0; i < counts[1]; i++) {
        scoringDice.push(1);
      }
      counts[1] = 0;
    }
    if (counts[5]) {
      score += counts[5] * 50;
      for (let i = 0; i < counts[5]; i++) {
        scoringDice.push(5);
      }
      counts[5] = 0;
    }
    // The remaining dice are non-scoring.
    const nonScoringDice = [];
    for (let num = 1; num <= 6; num++) {
      if (counts[num]) {
        for (let i = 0; i < counts[num]; i++) {
          nonScoringDice.push(num);
        }
      }
    }
    // Create a breakdown string.
    const breakdownParts = [];
    for (let num = 1; num <= 6; num++) {
      const countInRoll = diceArray.filter(d => d === num).length;
      if (countInRoll >= 3) {
        const points = num === 1 ? 1000 : num * 100;
        breakdownParts.push(`Three ${num}'s = ${points}`);
      }
    }
    const onesExtra = diceArray.filter(d => d === 1).length % 3;
    if (onesExtra) {
      breakdownParts.push(`${onesExtra} one(s) = ${onesExtra * 100}`);
    }
    const fivesExtra = diceArray.filter(d => d === 5).length % 3;
    if (fivesExtra) {
      breakdownParts.push(`${fivesExtra} five(s) = ${fivesExtra * 50}`);
    }
    const breakdown = breakdownParts.join(' + ');

    return { score, scoringDice, nonScoringDice, breakdown };
  };

  // Bank the current turn's points.
  const bankPoints = () => {
    if (disableActions) return;
    setPlayerScores(prevScores => {
      const newScores = [...prevScores];
      newScores[currentPlayer] += turnScore;
      if (newScores[currentPlayer] >= winningScore) {
        setMessage(`Player ${currentPlayer + 1} wins with ${newScores[currentPlayer]} points!`);
        setGameOver(true);
      }
      return newScores;
    });
    if (!gameOver) {
      endTurn();
    }
  };

  // End the current turn and clear turn-specific state.
  const endTurn = () => {
    setTurnScore(0);
    setDiceCount(initialDiceCount);
    setDice([]);
    setAccumulatedScoredDice([]);
    setCurrentPlayer(prev => (prev + 1) % 2);
    // Re-enable actions and disable the End Turn button.
    setDisableActions(false);
    setEndTurnEnabled(false);
  };

  // Restart the game.
  const restartGame = () => {
    setPlayerScores([0, 0]);
    setCurrentPlayer(0);
    setTurnScore(0);
    setDiceCount(initialDiceCount);
    setDice([]);
    setAccumulatedScoredDice([]);
    setMessage('');
    setGameOver(false);
    setDisableActions(false);
    setEndTurnEnabled(false);
  };

  return (
    <div className="container">
      <h2 className="title">Farkle Game (Two Player)</h2>
      <h3>Current Player: {currentPlayer + 1}</h3>
      <p className="score">Turn Score: {turnScore}</p>
      <p className="message" style={{ whiteSpace: 'pre-wrap' }}>{message}</p>
      
      {/* Dice Visuals */}
      <div className="dice-row scored">
        <h4>Scored Dice</h4>
        {accumulatedScoredDice.length > 0 ? (
          accumulatedScoredDice.map((die, index) => (
            <span key={index} className="die">{diceFaces[die]}</span>
          ))
        ) : (
          <span className="die">-</span>
        )}
      </div>
      <div className="dice-row remaining">
        <h4>Dice to Roll</h4>
        {diceCount > 0 && dice.length > 0 ? (
          dice.map((die, index) => (
            <span key={index} className="die">{diceFaces[die]}</span>
          ))
        ) : (
          <span className="die">-</span>
        )}
      </div>
      
      <div className="button-container">
        <button className="button" onClick={rollDice} disabled={gameOver || disableActions}>
          Roll Dice ({diceCount} dice)
        </button>
        <button className="button" onClick={bankPoints} disabled={turnScore === 0 || gameOver || disableActions}>
          Bank Points
        </button>
        {/* End Turn button: only enabled when a Farkle occurs */}
        <button className="button" onClick={endTurn} disabled={!endTurnEnabled}>
          End Turn
        </button>
      </div>
      <div className="button-container">
        <button className="button" onClick={restartGame}>Restart Game</button>
        <button className="button" onClick={goToMainMenu}>Main Menu</button>
      </div>
      <div className="scoreboard">
        <h3>Scores:</h3>
        {playerScores.map((score, idx) => (
          <p key={idx}>Player {idx + 1}: {score}</p>
        ))}
      </div>
      <div className="instructions">
        <h3>Game Instructions:</h3>
        <ul>
          <li>Click "Roll Dice" to roll the dice and hear the sound.</li>
          <li>Scoring dice (those that contributed to your score) appear on the top row.</li>
          <li>The remaining dice available for the next roll are shown in the bottom row.</li>
          <li>
            If you roll no scoring dice (Farkle), you lose all points for that turn. Instead of an automatic delay, press
            "End Turn" to continue.
          </li>
          <li>The first player to reach {winningScore} wins.</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
