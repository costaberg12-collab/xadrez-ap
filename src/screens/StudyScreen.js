import React, { useState, useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Chess } from 'chess.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../components/ScreenContainer';
import SectionCard from '../components/SectionCard';
import { palette } from '../theme/palette';

const PIECE_SYMBOLS = {
  wp:'♙', wr:'♖', wn:'♘', wb:'♗', wq:'♕', wk:'♔',
  bp:'♟', br:'♜', bn:'♞', bb:'♝', bq:'♛', bk:'♚',
};

const FILES = ['a','b','c','d','e','f','g','h'];
const SQUARE_SIZE = 40;
const BOARD_SIZE = SQUARE_SIZE * 8;
const RANKS_WIDTH = 25;

const PUZZLES = [
  {
    id: 'p1',
    title: 'Xeque-mate em 1',
    theme: 'Mate em 1',
    difficulty: 'Fácil',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    solution: ['Qxf7#'],
    hint: 'A dama branca pode atacar o ponto mais fraco em f7.',
    description: 'Brancas jogam e dão xeque-mate em um lance.'
  },
  {
    id: 'p2',
    title: 'Garfo de Cavalo',
    theme: 'Tática',
    difficulty: 'Fácil',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    solution: ['Nc6'],
    hint: 'Mova o cavalo para atacar rei e dama ao mesmo tempo.',
    description: 'Encontre o lance que ganha material valioso.'
  }
];

export default function StudyScreen() {
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [game, setGame] = useState(null);
  const [tick, setTick] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [solved, setSolved] = useState(false);
  const [tab, setTab] = useState('puzzles');

  const board = useMemo(() => game ? game.board() : null, [game, tick]);
  const legalMoves = useMemo(() => {
    if (!selectedSquare || !game) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
  }, [selectedSquare, tick]);

  const forceUpdate = () => setTick(t => t + 1);

  function startPuzzle(puzzle) {
    setSelectedPuzzle(puzzle);
    setGame(new Chess(puzzle.fen));
    setSolved(false);
    setSelectedSquare(null);
    forceUpdate();
  }

  function handlePress(square) {
    if (!game || solved) return;
    
    if (selectedSquare) {
      const move = game.moves({ square: selectedSquare, verbose: true }).find(m => m.to === square);
      if (move) {
        const san = move.san;
        if (selectedPuzzle.solution.includes(san) || (move.promotion && selectedPuzzle.solution.some(s => s.startsWith(san)))) {
          game.move(move);
          setSolved(true);
          forceUpdate();
        } else {
          Alert.alert('Ops!', 'Este não é o lance correto. Tente novamente!');
          setSelectedSquare(null);
        }
        return;
      }
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  }

  return (
    <ScreenContainer eyebrow={selectedPuzzle ? '🧩 Puzzle' : '📚 Estudo'} title={selectedPuzzle ? selectedPuzzle.title : 'Modo Estudo'}>
      {!selectedPuzzle ? (
        <View style={styles.puzzleGrid}>
          {PUZZLES.map(p => (
            <TouchableOpacity key={p.id} style={styles.card} onPress={() => startPuzzle(p)}>
              <Text style={styles.cardTitle}>{p.title}</Text>
              <Text style={styles.cardSub}>{p.difficulty}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.outerContainer}>
          <Text style={styles.puzzleDesc}>{selectedPuzzle.description}</Text>
          <View style={styles.boardWithCoords}>
            <View style={styles.ranksColumn}>
              {[8,7,6,5,4,3,2,1].map(n => (
                <View key={n} style={styles.coordSquare}><Text style={styles.coordText}>{n}</Text></View>
              ))}
            </View>
            <View style={styles.board}>
              {board.map((row, ri) => (
                <View key={ri} style={styles.row}>
                  {row.map((piece, ci) => {
                    const sq = `${FILES[ci]}${8 - ri}`;
                    const isLight = (ri + ci) % 2 === 0;
                    const isSelected = selectedSquare === sq;
                    const isLegal = legalMoves.includes(sq);
                    return (
                      <TouchableOpacity
                        key={sq}
                        style={[styles.square, isLight ? styles.squareLight : styles.squareDark, isSelected && styles.selected]}
                        onPress={() => handlePress(sq)}
                      >
                        {isLegal && <View style={styles.legalIndicator} />}
                        <Text style={[styles.piece, piece?.color === 'b' ? styles.pieceBlack : styles.pieceWhite]}>
                          {piece ? PIECE_SYMBOLS[`${piece.color}${piece.type}`] : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
          <View style={styles.filesRowContainer}>
            {FILES.map(f => (
              <View key={f} style={styles.fileSquare}><Text style={styles.coordText}>{f.toUpperCase()}</Text></View>
            ))}
          </View>

          {solved && <Text style={styles.solvedText}>🎉 Excelente! Você acertou!</Text>}
          
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedPuzzle(null)}>
            <Text style={styles.backBtnText}>← Voltar aos Puzzles</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  puzzleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, padding: 10 },
  card: { backgroundColor: palette.card, padding: 20, borderRadius: 15, width: '45%', borderWidth: 1, borderColor: palette.border },
  cardTitle: { color: '#fff', fontWeight: 'bold' },
  cardSub: { color: palette.gold, fontSize: 12 },
  outerContainer: { alignItems: 'center' },
  puzzleDesc: { color: palette.text, marginBottom: 20, textAlign: 'center' },
  boardWithCoords: { flexDirection: 'row' },
  ranksColumn: { width: RANKS_WIDTH, height: BOARD_SIZE, justifyContent: 'space-between' },
  board: { width: BOARD_SIZE, height: BOARD_SIZE, borderWidth: 2, borderColor: '#333' },
  row: { flexDirection: 'row' },
  square: { width: SQUARE_SIZE, height: SQUARE_SIZE, alignItems: 'center', justifyContent: 'center' },
  squareLight: { backgroundColor: '#f0d9b5' },
  squareDark: { backgroundColor: '#b58863' },
  selected: { backgroundColor: '#baca44' },
  legalIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.15)', position: 'absolute' },
  piece: { fontSize: 28 },
  pieceWhite: { color: '#fff', textShadowColor: '#000', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 1 },
  pieceBlack: { color: '#000', fontWeight: 'bold' },
  filesRowContainer: { width: BOARD_SIZE, marginLeft: RANKS_WIDTH, flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  fileSquare: { width: SQUARE_SIZE, alignItems: 'center' },
  coordText: { fontSize: 13, fontWeight: 'bold', color: palette.textMuted },
  coordSquare: { height: SQUARE_SIZE, justifyContent: 'center', alignItems: 'center' },
  solvedText: { color: '#28F0A1', fontWeight: 'bold', marginTop: 15, fontSize: 18 },
  backBtn: { marginTop: 20, backgroundColor: palette.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: palette.border },
  backBtnText: { color: palette.text }
});
