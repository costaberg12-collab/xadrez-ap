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

export default function TrainingScreen() {
  const [game, setGame] = useState(new Chess());
  const [tick, setTick] = useState(0); 
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [status, setStatus] = useState('Toque em uma peça para ver os movimentos.');

  const board = useMemo(() => game.board(), [tick]);
  const legalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
  }, [selectedSquare, tick]);

  const forceUpdate = () => setTick(t => t + 1);

  const makeAiMove = (currentGame) => {
    setIsThinking(true);
    setStatus('Máquina pensando...');
    setTimeout(() => {
      const moves = currentGame.moves();
      if (moves.length > 0) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        const result = currentGame.move(move);
        setLastMove({ from: result.from, to: result.to });
        setStatus(currentGame.isCheckmate() ? 'Fim de jogo: Máquina venceu!' : 'Sua vez.');
      }
      setIsThinking(false);
      forceUpdate();
    }, 600);
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
    <ScreenContainer eyebrow="♟️ Treino" title="Xadrez Inteligente" subtitle={status}>
      <SectionCard title="Tabuleiro" icon="🎮">
        <View style={styles.outerContainer}>
          {/* Container principal do tabuleiro com números à esquerda */}
          <View style={styles.boardWithRanks}>
            {/* Números (Ranks) 8 a 1 */}
            <View style={styles.ranksColumn}>
              {[8, 7, 6, 5, 4, 3, 2, 1].map(n => (
                <View key={n} style={styles.coordCell}><Text style={styles.coordText}>{n}</Text></View>
              ))}
            </View>
            
            {/* O Tabuleiro propriamente dito */}
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

          {/* Letras (Files) a-h embaixo do tabuleiro */}
          <View style={styles.filesRow}>
            {/* Espaço vazio para alinhar com a coluna de números */}
            <View style={styles.coordSpacer} />
            {FILES.map(f => (
              <View key={f} style={styles.coordCell}><Text style={styles.coordText}>{f.toUpperCase()}</Text></View>
            ))}
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
  outerContainer: { alignItems: 'center', padding: 10 },
  boardWithRanks: { flexDirection: 'row' },
  ranksColumn: { justifyContent: 'space-around', paddingRight: 5 },
  filesRow: { flexDirection: 'row', marginTop: 5, width: '100%', paddingLeft: 5 },
  board: { borderWidth: 2, borderColor: '#333', borderRadius: 2, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  square: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  squareLight: { backgroundColor: '#f0d9b5' },
  squareDark: { backgroundColor: '#b58863' },
  selected: { backgroundColor: '#baca44' },
  highlight: { backgroundColor: 'rgba(255, 255, 0, 0.3)' },
  legalIndicator: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(0, 0, 0, 0.12)', position: 'absolute' },
  piece: { fontSize: 28 },
  pieceWhite: { color: '#fff', textShadowColor: '#000', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 1 },
  pieceBlack: { color: '#000', fontWeight: 'bold' },
  coordCell: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  coordText: { fontSize: 12, fontWeight: 'bold', color: palette.textMuted },
  coordSpacer: { width: 20 }, // Deve bater com a largura da ranksColumn aprox.
  resetBtn: { marginTop: 20, backgroundColor: palette.gold, padding: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  resetBtnText: { fontWeight: 'bold', color: '#000' }
});
