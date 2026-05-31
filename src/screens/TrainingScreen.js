import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Chess } from 'chess.js';
import ScreenContainer from '../components/ScreenContainer';
import SectionCard from '../components/SectionCard';
import { palette } from '../theme/palette';

const PIECE_SYMBOLS = {
  wp:'♙', wr:'♖', wn:'♘', wb:'♗', wq:'♕', wk:'♔',
  bp:'♟', br:'♜', bn:'♞', bb:'♝', bq:'♛', bk:'♚',
};

const FILES = ['a','b','c','d','e','f','g','h'];
const SQUARE_SIZE = 40; // Tamanho fixo para garantir alinhamento
const BOARD_SIZE = SQUARE_SIZE * 8;

export default function TrainingScreen() {
  const [game, setGame] = useState(new Chess());
  const [tick, setTick] = useState(0); 
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [status, setStatus] = useState('Brancas jogam.');

  const board = useMemo(() => game.board(), [tick]);
  const legalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
  }, [selectedSquare, tick]);

  const forceUpdate = () => setTick(t => t + 1);

  const makeAiMove = (currentGame) => {
    setIsThinking(true);
    setTimeout(() => {
      const moves = currentGame.moves();
      if (moves.length > 0) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        const result = currentGame.move(move);
        setLastMove({ from: result.from, to: result.to });
      }
      setIsThinking(false);
      forceUpdate();
    }, 500);
  };

  const handlePress = (square) => {
    if (isThinking || game.isGameOver()) return;
    if (selectedSquare) {
      const move = game.moves({ square: selectedSquare, verbose: true }).find(m => m.to === square);
      if (move) {
        game.move({ from: selectedSquare, to: square, promotion: 'q' });
        setLastMove({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        forceUpdate();
        if (!game.isGameOver()) makeAiMove(game);
        return;
      }
    }
    const piece = game.get(square);
    if (piece && piece.color === 'w') setSelectedSquare(square);
    else setSelectedSquare(null);
  };

  return (
    <ScreenContainer eyebrow="♟️ Treino" title="Xadrez AP" subtitle={status}>
      <SectionCard title="Tabuleiro" icon="🎮">
        <View style={styles.outerContainer}>
          
          <View style={styles.boardWithCoords}>
            {/* Números Laterais (Ranks) */}
            <View style={styles.ranksColumn}>
              {[8, 7, 6, 5, 4, 3, 2, 1].map(n => (
                <View key={n} style={styles.coordSquare}><Text style={styles.coordText}>{n}</Text></View>
              ))}
            </View>

            {/* Tabuleiro */}
            <View style={styles.board}>
              {board.map((row, ri) => (
                <View key={ri} style={styles.row}>
                  {row.map((piece, ci) => {
                    const sq = `${FILES[ci]}${8 - ri}`;
                    const isLight = (ri + ci) % 2 === 0;
                    const isSelected = selectedSquare === sq;
                    const isLegal = legalMoves.includes(sq);
                    const isHighlight = lastMove?.from === sq || lastMove?.to === sq;

                    return (
                      <TouchableOpacity
                        key={sq}
                        style={[
                          styles.square, 
                          isLight ? styles.squareLight : styles.squareDark,
                          isSelected && styles.selected,
                          isHighlight && styles.highlight
                        ]}
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

          {/* Letras Inferiores (Files) - Alinhadas com o tabuleiro */}
          <View style={styles.filesRowContainer}>
             {/* Espaço vazio para compensar a coluna de números */}
            <View style={styles.ranksSpacer} />
            <View style={styles.filesRow}>
              {FILES.map(f => (
                <View key={f} style={styles.coordSquare}><Text style={styles.coordText}>{f.toUpperCase()}</Text></View>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.resetBtn} 
            onPress={() => { setGame(new Chess()); setLastMove(null); forceUpdate(); }}
          >
            <Text style={styles.resetBtnText}>🔄 Reiniciar Jogo</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  outerContainer: { alignItems: 'center', paddingVertical: 20 },
  boardWithCoords: { flexDirection: 'row', alignItems: 'flex-start' },
  ranksColumn: { height: BOARD_SIZE, justifyContent: 'space-between', marginRight: 5 },
  board: { width: BOARD_SIZE, height: BOARD_SIZE, borderWidth: 2, borderColor: '#333' },
  row: { flexDirection: 'row' },
  square: { width: SQUARE_SIZE, height: SQUARE_SIZE, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  squareLight: { backgroundColor: '#f0d9b5' },
  squareDark: { backgroundColor: '#b58863' },
  selected: { backgroundColor: '#baca44' },
  highlight: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
  legalIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(0, 0, 0, 0.15)', position: 'absolute' },
  piece: { fontSize: 28 },
  pieceWhite: { color: '#fff', textShadowColor: '#000', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 1 },
  pieceBlack: { color: '#000', fontWeight: 'bold' },
  
  filesRowContainer: { flexDirection: 'row', marginTop: 5 },
  ranksSpacer: { width: 20 }, // Deve ser igual ou próximo à largura da ranksColumn
  filesRow: { width: BOARD_SIZE, flexDirection: 'row', justifyContent: 'space-between' },
  
  coordSquare: { width: SQUARE_SIZE, alignItems: 'center', justifyContent: 'center' },
  coordText: { fontSize: 13, fontWeight: 'bold', color: palette.textMuted },
  
  resetBtn: { marginTop: 30, backgroundColor: palette.gold, padding: 15, borderRadius: 10, width: BOARD_SIZE + 30, alignItems: 'center' },
  resetBtnText: { fontWeight: 'bold', color: '#000', fontSize: 16 }
});
