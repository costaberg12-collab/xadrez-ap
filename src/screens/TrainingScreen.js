import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Chess } from 'chess.js';
import ScreenContainer from '../components/ScreenContainer';
import SectionCard from '../components/SectionCard';
import { palette } from '../theme/palette';

const PIECE_SYMBOLS = {
  wp:'♙',wr:'♖',wn:'♘',wb:'♗',wq:'♕',wk:'♔',
  bp:'♟',br:'♜',bn:'♞',bb:'♝',bq:'♛',bk:'♚',
};

const FILES = ['a','b','c','d','e','f','g','h'];

export default function TrainingScreen() {
  // Usamos um 'tick' para forçar o React a redesenhar sem perder a instância do Chess
  const [game, setGame] = useState(new Chess());
  const [tick, setTick] = useState(0); 
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [status, setStatus] = useState('Sua vez. Jogue de brancas.');

  const board = useMemo(() => game.board(), [tick]);
  const legalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
  }, [selectedSquare, tick]);

  const forceUpdate = () => setTick(t => t + 1);

  const makeAiMove = (currentGame) => {
    setIsThinking(true);
    setStatus('Máquina está jogando...');

    setTimeout(() => {
      const moves = currentGame.moves();
      if (moves.length > 0) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        const result = currentGame.move(move);
        setLastMove({ from: result.from, to: result.to });
        
        if (currentGame.isCheckmate()) setStatus('Xeque-mate! A máquina venceu.');
        else if (currentGame.isDraw()) setStatus('Empate!');
        else setStatus('Sua vez.');
      }
      setIsThinking(false);
      forceUpdate();
    }, 400);
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

        if (!game.isGameOver()) {
          makeAiMove(game);
        } else {
          setStatus(game.isCheckmate() ? 'Xeque-mate! Você venceu!' : 'Empate!');
        }
        return;
      }
    }

    const piece = game.get(square);
    if (piece && piece.color === 'w') {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  return (
    <ScreenContainer eyebrow="♟️ Modo Treino" title="Xadrez vs IA" subtitle={status}>
      <SectionCard title="Tabuleiro" icon="🎮">
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
                        isLegal && styles.legal,
                        isHighlight && styles.highlight
                      ]}
                      onPress={() => handlePress(sq)}
                    >
                      <Text style={styles.piece}>
                        {piece ? PIECE_SYMBOLS[`${piece.color}${piece.type}`] : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.btn} 
            onPress={() => { setGame(new Chess()); setLastMove(null); setStatus('Nova partida!'); forceUpdate(); }}
          >
            <Text style={styles.btnText}>Reiniciar</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  boardContainer: { alignItems: 'center' },
  board: { borderWidth: 3, borderColor: palette.border, borderRadius: 4 },
  row: { flexDirection: 'row' },
  square: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  squareLight: { backgroundColor: '#eedab5' },
  squareDark: { backgroundColor: '#8b5a2b' },
  selected: { backgroundColor: '#7cfc00' },
  legal: { backgroundColor: 'rgba(124, 252, 0, 0.4)' },
  highlight: { backgroundColor: 'rgba(255, 215, 0, 0.5)' },
  piece: { fontSize: 30, color: '#000' },
  btn: { marginTop: 20, backgroundColor: palette.gold, padding: 12, borderRadius: 8, width: 200, alignItems: 'center' },
  btnText: { fontWeight: 'bold', color: '#000' }
});
