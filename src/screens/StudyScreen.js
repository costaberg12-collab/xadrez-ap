import React, { useState, useMemo, useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, Vibration } from 'react-native';
import { Chess } from 'chess.js';
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
    title: 'O Beijo da Dama',
    theme: 'Mate em 1',
    difficulty: 'Iniciante',
    // Adicionado Bispo em c4 protegendo a captura em f7
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    solution: { from: 'h5', to: 'f7' },
    explanation: 'Xeque-mate! O Rei não pode comer a Dama porque ela está protegida pelo Bispo em c4.'
  },
  {
    id: 'p2',
    title: 'Defesa do Pastor',
    theme: 'Xeque-mate',
    difficulty: 'Iniciante',
    fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    solution: { from: 'f3', to: 'f7' },
    explanation: 'A Dama ataca f7. O Rei está preso porque a Dama está protegida pelo Bispo.'
  }
];

export default function StudyScreen() {
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [game, setGame] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [status, setStatus] = useState('Encontre o melhor lance.');
  const [isSolved, setIsSolved] = useState(false);
  const [errorSquare, setErrorSquare] = useState(null);
  const [hintSquare, setHintSquare] = useState(null);

  // Inicializa o puzzle
  const startPuzzle = (puzzle) => {
    setSelectedPuzzle(puzzle);
    setGame(new Chess(puzzle.fen));
    setIsSolved(false);
    setSelectedSquare(null);
    setErrorSquare(null);
    setHintSquare(null);
    setStatus('Sua vez: Brancas jogam.');
  };

  const board = useMemo(() => game ? game.board() : [], [game, isSolved]);
  
  const legalMoves = useMemo(() => {
    if (!selectedSquare || !game) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
  }, [selectedSquare, game]);

  const handlePress = (square) => {
    if (!game || isSolved) return;

    // Se já tem uma peça selecionada, tenta mover
    if (selectedSquare) {
      const move = game.moves({ square: selectedSquare, verbose: true }).find(m => m.to === square);
      
      if (move) {
        // Verifica se é a solução correta
        if (move.from === selectedPuzzle.solution.from && move.to === selectedPuzzle.solution.to) {
          game.move(move);
          setIsSolved(true);
          setStatus('✨ Perfeito! Você acertou.');
        } else {
          // Errou: Feedback visual de erro
          setErrorSquare(square);
          setTimeout(() => setErrorSquare(null), 500);
          setSelectedSquare(null);
          setStatus('❌ Esse não é o melhor lance. Tente outro!');
        }
        return;
      }
    }

    // Seleciona peça (apenas brancas)
    const piece = game.get(square);
    if (piece && piece.color === 'w') {
      setSelectedSquare(square);
      setErrorSquare(null);
    } else {
      setSelectedSquare(null);
    }
  };

  const showSolution = () => {
    if (!selectedPuzzle) return;
    setHintSquare(selectedPuzzle.solution.from);
    setStatus('Dica: Observe a peça destacada em amarelo.');
    
    setTimeout(() => {
      setHintSquare(selectedPuzzle.solution.to);
      setTimeout(() => {
        const solGame = new Chess(selectedPuzzle.fen);
        solGame.move(selectedPuzzle.solution);
        setGame(solGame);
        setIsSolved(true);
        setHintSquare(null);
        setStatus('💡 Esta era a solução correta.');
      }, 800);
    }, 800);
  };

  return (
    <ScreenContainer eyebrow={selectedPuzzle ? '🧩 Exercício' : '📚 Estudo'} title={selectedPuzzle ? selectedPuzzle.title : 'Melhore seu Jogo'}>
      {!selectedPuzzle ? (
        <View style={styles.list}>
          {PUZZLES.map(p => (
            <TouchableOpacity key={p.id} style={styles.puzzleCard} onPress={() => startPuzzle(p)}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{p.title}</Text>
                <Text style={styles.cardTheme}>{p.theme} • {p.difficulty}</Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.playArea}>
          <Text style={styles.statusText}>{status}</Text>
          
          <View style={styles.boardContainer}>
            <View style={styles.ranks}>
              {[8,7,6,5,4,3,2,1].map(n => <Text key={n} style={styles.coordV}>{n}</Text>)}
            </View>
            
            <View style={styles.board}>
              {board.map((row, ri) => (
                <View key={ri} style={styles.row}>
                  {row.map((piece, ci) => {
                    const sq = `${FILES[ci]}${8 - ri}`;
                    const isLight = (ri + ci) % 2 === 0;
                    const isSelected = selectedSquare === sq;
                    const isLegal = legalMoves.includes(sq);
                    const isError = errorSquare === sq;
                    const isHint = hintSquare === sq;

                    return (
                      <TouchableOpacity 
                        key={sq} 
                        activeOpacity={0.8}
                        style={[
                          styles.square, 
                          isLight ? styles.squareLight : styles.squareDark,
                          isSelected && styles.selected,
                          isError && styles.error,
                          isHint && styles.hint
                        ]}
                        onPress={() => handlePress(sq)}
                      >
                        {isLegal && <View style={styles.legalDot} />}
                        <Text style={[styles.piece, piece?.color === 'b' ? styles.pieceB : styles.pieceW]}>
                          {piece ? PIECE_SYMBOLS[`${piece.color}${piece.type}`] : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.files}>
            {FILES.map(f => <Text key={f} style={styles.coordH}>{f.toUpperCase()}</Text>)}
          </View>

          {isSolved && (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationText}>{selectedPuzzle.explanation}</Text>
            </View>
          )}

          <View style={styles.actions}>
            {!isSolved && (
              <TouchableOpacity style={styles.btnHint} onPress={showSolution}>
                <Text style={styles.btnTextHint}>💡 Ver Solução</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.btnBack} onPress={() => setSelectedPuzzle(null)}>
              <Text style={styles.btnTextBack}>← Voltar à Lista</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: 15, gap: 12 },
  puzzleCard: { flexDirection: 'row', backgroundColor: palette.card, padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: palette.border },
  cardInfo: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  cardTheme: { color: palette.gold, fontSize: 13 },
  cardArrow: { color: palette.textMuted, fontSize: 20 },
  playArea: { alignItems: 'center', padding: 10 },
  statusText: { color: palette.text, fontSize: 15, fontWeight: '600', marginBottom: 15, textAlign: 'center', minHeight: 40 },
  boardContainer: { flexDirection: 'row', alignItems: 'center' },
  ranks: { height: BOARD_SIZE, justifyContent: 'space-around', paddingRight: 8 },
  coordV: { color: palette.textMuted, fontSize: 12, fontWeight: 'bold' },
  board: { width: BOARD_SIZE, height: BOARD_SIZE, borderWidth: 3, borderColor: '#222', borderRadius: 4, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  square: { width: SQUARE_SIZE, height: SQUARE_SIZE, alignItems: 'center', justifyContent: 'center' },
  squareLight: { backgroundColor: '#eedab5' },
  squareDark: { backgroundColor: '#8b5a2b' },
  selected: { backgroundColor: '#baca44' },
  error: { backgroundColor: '#ff6b6b' },
  hint: { backgroundColor: '#ffd700' },
  legalDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.15)', position: 'absolute' },
  piece: { fontSize: 30 },
  pieceW: { color: '#fff', textShadowColor: '#000', textShadowRadius: 2 },
  pieceB: { color: '#000', fontWeight: 'bold' },
  files: { flexDirection: 'row', width: BOARD_SIZE, marginLeft: RANKS_WIDTH, marginTop: 8, justifyContent: 'space-around' },
  coordH: { color: palette.textMuted, fontSize: 12, fontWeight: 'bold' },
  explanationBox: { backgroundColor: 'rgba(40,240,161,0.1)', padding: 15, borderRadius: 12, marginTop: 20, width: BOARD_SIZE, borderWidth: 1, borderColor: 'rgba(40,240,161,0.3)' },
  explanationText: { color: '#28F0A1', textAlign: 'center', fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 25 },
  btnHint: { backgroundColor: palette.gold, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 12 },
  btnTextHint: { color: '#000', fontWeight: 'bold' },
  btnBack: { backgroundColor: palette.surface, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: palette.border },
  btnTextBack: { color: palette.text, fontWeight: 'bold' }
});
