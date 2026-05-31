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
  
  // Calcula as casas para onde a peça selecionada pode se mover
  const legalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    const moves = game.moves({ square: selectedSquare, verbose: true });
    return moves.map(m => m.to);
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
        else setStatus('Parabéns! Você venceu!');
        return;
      }
    }

    const piece = game.get(square);
    if (piece && piece.color === 'w') {
      setSelectedSquare(square);
      setStatus('Caminhos iluminados em verde.');
    } else {
      setSelectedSquare(null);
    }
  };

  return (
    <ScreenContainer eyebrow="♟️ Treino" title="Xadrez Inteligente" subtitle={status}>
      <SectionCard title="Tabuleiro de Treino" icon="🎮">
        <View style={styles.boardContainer}>
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
                      {/* Indicador de movimento legal (Círculo) */}
                      {isLegal && <View style={styles.legalIndicator} />}
                      
                      <Text style={[
                        styles.piece,
                        piece?.color === 'b' ? styles.pieceBlack : styles.pieceWhite
                      ]}>
                        {piece ? PIECE_SYMBOLS[`${piece.color}${piece.type}`] : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.resetBtn} 
            onPress={() => { setGame(new Chess()); setLastMove(null); setStatus('Novo jogo!'); forceUpdate(); }}
          >
            <Text style={styles.resetBtnText}>🔄 Reiniciar Jogo</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  boardContainer: { alignItems: 'center' },
  board: { borderWidth: 4, borderColor: '#333', borderRadius: 4, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  square: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  squareLight: { backgroundColor: '#f0d9b5' },
  squareDark: { backgroundColor: '#b58863' },
  selected: { backgroundColor: '#baca44' },
  highlight: { backgroundColor: 'rgba(255, 255, 0, 0.3)' },
  legalIndicator: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 1
  },
  piece: { fontSize: 32, zIndex: 2 },
  pieceWhite: { color: '#fff', textShadowColor: '#000', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 1 },
  pieceBlack: { color: '#000', fontWeight: 'bold' },
  resetBtn: { marginTop: 20, backgroundColor: palette.gold, padding: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  resetBtnText: { fontWeight: 'bold', color: '#000', fontSize: 16 }
});
