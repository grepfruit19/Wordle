import { useState, useEffect } from "react";
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

async function getWord(index?: number) {
  const file = await (await fetch('../wordlist.txt')).text();
  const words = file.split("\n");
  const usingIndex = index ? index - 1 : Math.floor(Math.random() * (words.length));
  return words[usingIndex];
}

function generateEmptyString(spaces: number) {
  let builder = '';
  for (let i = 0; i < spaces; i++) {
    builder += ' ';
  }
  return builder;
}

function generateLetterCount(str: string) {
  const letterCount: Record<string, any> = {};

  for (const char of str) {
    if (letterCount[char]) {
      letterCount[char] += 1;
    } else {
      letterCount[char] = 1;
    }
  }

  return letterCount;
}

function Box(props: {
  children: string;
  color?: string;
} ) {
  let backgroundColor = '#7c7c7c';
  if (props.color === 'green') backgroundColor = '#79a76b';
  if (props.color === 'yellow') backgroundColor = '#c6b466';
  return (
    <div style={{
      border: '2px solid #d3d3d3',
      width: '50px',
      height: '50px',
      backgroundColor,
    }}>{props.children}</div>
  )
}

function Row(props: {
  guess: string;
  actualWord: string;
  status: 'guessed' | 'active' | 'waiting';
  setGameState: any;
}) {
  const checkWord = (actualWord: string, guess: string) => {
    if (props.status !== 'guessed') {
      return null;
    }
    const output: string[] = [];
    const actualWordArray = actualWord.split('');

    const letterCount = generateLetterCount(actualWord);

    for (let i = 0; i < actualWordArray.length; i++) {
      if (actualWord[i] === guess[i]) {
        letterCount[guess[i]] = letterCount[guess[i]] - 1;
        if (letterCount[guess[i]] >= 0) output.push('green');
        else { output.push('gray') }
      }
      else if (actualWordArray.includes(guess[i])) {
        letterCount[guess[i]] = letterCount[guess[i]] - 1;
        if (letterCount[guess[i]] >= 0) output.push('yellow');
        else { output.push('gray')}
      }
      else output.push('gray');
    }
    if (output.every(value => value === 'green')) props.setGameState('won');
    return output;
  }

  const renderWord = (actualWord: string, guess: string) => {
    const colors = checkWord(actualWord, guess);
    let output = guess.split('').map((letter, index) => {
      const color = colors ? colors[index] : undefined;
      return <Box color={color}>{letter}</Box>
    });
    let emptySpace = actualWord.length - output.length;
    if (emptySpace > 0) {
      for (let i = 0; i < emptySpace; i++) {
        output.push(<Box color={'gray'}>{' '}</Box>)
      }
    }
    return output;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row'
    }}>
      {renderWord(props.actualWord, props.guess)}
    </div>
  )
}

function Game() {
  // The word that is to be guessed
  const [word, setWord] = useState('');
  // wordIndex used for seeding specific words into the game
  const [wordIndex, setWordIndex] = useState<number | undefined>(undefined);
  const [gameState, setGameState] = useState<'active' | 'won' | 'lost'>('active');

  // The word that is currently being constructed
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [previousGuesses, setPreviousGuesses] = useState<string[]>([]);

  // seeds initial word
  useEffect(() => {
    async function fetchWord() {
      setWord(await getWord());
    }
    if (!word) {
      fetchWord();
    }
  });

  const handleWordIndexChange = (event: any) => {
    setWordIndex(event.target.value);
  }

  const handleSubmit = () => {
    if (gameState === 'won' || gameState === 'lost') return;
    if (currentGuess.length < word.length) return;
    setPreviousGuesses([...previousGuesses, currentGuess]);
    if (previousGuesses.length === 5) setGameState('lost');
    setCurrentGuess('');
  }

  const handleSeed = (event: any) => {
    handleReset(event, wordIndex);
    setWordIndex(undefined);
  }

  const handleReset = async (event?: any, wordIndex?: number) => {
    const newWord = wordIndex ? await getWord(wordIndex) : await getWord();
    setWord(newWord);
    setCurrentGuess('');
    setPreviousGuesses([]);
    setGameState('active');
  }

  const handleKeyPress = (key: string) => {
    console.log('word', word);
    if (key === '{enter}') return handleSubmit();
    if (key === '{bksp}') return setCurrentGuess(currentGuess.slice(0, -1));

    // Tests for any characters that are alphabetic, ignore any non-alphabetic characters
    const alphaRegex = /[^A-Za-z]/;
    if (alphaRegex.test(key)) return;

    // Hit max length
    if (currentGuess.length === word.length) return;
    setCurrentGuess(currentGuess + key);
  }

  const renderRows = () => {
    const rows: any[] = [];
    // Render all the previous guesses
    previousGuesses.forEach(guess => {
      rows.push(<Row actualWord={word} guess={guess} status={'guessed'} setGameState={setGameState}></Row>)
    });
    if (rows.length === 6) return rows;
    // Render one row that is the current guess
    if (currentGuess === '') {
      rows.push(<Row actualWord={word} guess={generateEmptyString(word.length)} status={'active'} setGameState={setGameState}></Row>);
    } else {
      rows.push(<Row actualWord={word} guess={currentGuess} status={'active'} setGameState={setGameState}></Row>);
    }
    // Render the remaining rows as blanks
    const emptyRowCount = 5 - (previousGuesses.length);
    for (let i = 0; i < emptyRowCount; i++) {
      rows.push(<Row actualWord={word} guess={generateEmptyString(word.length)} status={'waiting'} setGameState={setGameState}></Row>);
    }
    return rows;
  }
  
  return (<div>
    <p>Instructions: To reset the game you can click reset. Enter a number below and click "Seed Word" for a specific word in our dictionary.</p>
    <input type="number" value={wordIndex} onChange={handleWordIndexChange}></input>
    <button onClick={handleSeed} onKeyDown={(event) => event.preventDefault()}>Seed Word</button>
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
    {renderRows()}
    </div>
    {gameState === 'won' && 'You won!'}
    {gameState === 'lost' && 'You lost :('}
    <button onClick={handleReset} onKeyDown={(event) => event.preventDefault()}>Reset</button>
    <Keyboard
      onKeyPress={handleKeyPress}
      physicalKeyboardHighlight={true}
      physicalKeyboardHighlightPress={true}
    ></Keyboard>
  </div>);
}

export default Game;