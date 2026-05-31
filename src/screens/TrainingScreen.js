import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Chess } from 'chess.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../components/ScreenContainer';
import SectionCard from '../components/SectionCard';
import { engineLevels, masterProfiles } from '../data/chessProfiles';
import { palette } from '../theme/palette';

const PIECE_SYMBOLS = {
  wp:'♙',wr:'♖',wn:'♘',wb:'♗',wq:'♕',wk:'♔',
  bp:'♟',br:'♜',bn:'♞',bb:'♝',bq:'♛',bk:'♚',
};

const FILES = ['a','b','c','d','e','f','g','h'];

function sqColor(sq) {
  const fi = FILES.indexOf(sq[0]);
  const ri = Number(sq[1]) - 1;
  return (fi + ri) % 2 === 0 ? 'light' : 'dark';
}

function normalizeStatus(game, profileLabel) {
  if (game.isCheckmate()) return game.turn() === 'w' ? `Xeque-mate. ${profileLabel} venceu.` : 'Xeque-mate. Você venceu!';
  if (game.isDraw()) return 'Partida empatada.';
  if (game.isCheck()) return game.turn() === 'w' ? 'Seu rei está em xeque!' : `${profileLabel} está em xeque!`;
  return null;
}

export default function TrainingScreen() {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [levelId, setLevelId] = useState('beginner');
  const [isThinking, setIsThinking] = useState(false);
  const [moveLog, setMoveLog] = useState([]);
  const [lastFrom, setLastFrom] = useState(null);
  const [lastTo, setLastTo] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Sua vez. Jogue de brancas.');

  const board = useMemo(() => game.board(), [game]);
  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    try {
      return game.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
    } catch (e) { return []; }
  }, [game, selectedSquare]);

  function resetMatch() {
    setGame(new Chess());
    setSelectedSquare(null);
    setMoveLog([]);
    setLastFrom(null);
    setLastTo(null);
    setIsThinking(false);
    setStatusMessage('Nova partida. Brancas jogam.');
  }

  function makeAiMove(currentGame, userSan) {
    setIsThinking(true);
    setStatusMessage('Máquina pensando...');

    // Timeout curto para não travar a interface
    setTimeout(() => {
      const moves = currentGame.moves();
      
      if (moves.length > 0) {
        // IA Simples: Escolhe um lance aleatório (garante que joga)
        const move = moves[Math.floor(Math.random() * moves.length)];
        currentGame.move(move);
        
        const newGame = new Chess(currentGame.fen());
        const history = newGame.history({ verbose: true });
        const lastMove = history[history.length - 1];

        setGame(newGame);
        setLastFrom(lastMove.from);
        setLastTo(lastMove.to);
        setMoveLog(prev => [`V: ${userSan}`, `M: ${lastMove.san}`, ...prev].slice(0, 10));
        
        const status = normalizeStatus(newGame, "Máquina");
        setStatusMessage(status || 'Sua vez.');
      }
      setIsThinking(false);
    }, 200);
  }

  function handleSquarePress(square) {
    if (isThinking || game.isGameOver() || game.turn() !== 'w') return;

    if (selectedSquare) {
      const move = game.moves({ square: selectedSquare, verbose: true }).find(m => m.to === square);
      
      if (move) {
        try {
          const moveResult = game.move({ from: selectedSquare, to: square, promotion: 'q' });
          const userSan = moveResult.san;
          
          setGame(new Chess(game.fen()));
          setLastFrom(move.from);
          setLastTo(move.to);
          setSelectedSquare(null);
          
          if (!game.isGameOver()) {
            makeAiMove(game, userSan);
          } else {
            setStatusMessage(normalizeStatus(game, "Máquina") || "Fim de jogo.");
          }
          return;
        } catch (e) {
          console.log("Erro ao mover:", e);
        }
      }
    }

    const piece = game.get(square);
    if (piece && piece.color === 'w') {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  }

  return (
    <ScreenContainer eyebrow="♟️ Treino" title="Humano vs Máquina" subtitle={statusMessage}>
      <SectionCard title="Tabuleiro" icon="🎮">
        <View style={styles.boardWrap}>
          <View style={styles.boardRows}>
            {board.map((row, ri) => (
              <View key={ri} style={styles.rankRow}>
                {row.map((piece, ci) => {
                  const sq = `${FILES[ci]}${8 - ri}`;
                  const isLight = sqColor(sq) === 'light';
                  const isSelected = selectedSquare === sq;
                  const isLegal = legalTargets.includes(sq);
                  const isLast = lastFrom === sq || lastTo === sq;
                  return (
                    <TouchableOpacity
                      key={sq}
                      style={[styles.square, isLight ? styles.squareLight : styles.squareDark, isSelected && styles.squareSelected, isLegal && styles.squareLegal, isLast && styles.squareLastMove]}
                      onPress={() => handleSquarePress(sq)}
                    >
                      <Text style={[styles.piece, piece?.color === 'b' && styles.pieceDark]}>
                        {piece ? PIECE_SYMBOLS[`${piece.color}${piece.type}`] : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
        <TouchableOpacity style={styles.resetBtn} onPress={resetMatch}>
          <Text style={styles.resetBtnText}>Reiniciar Partida</Text>
        </TouchableOpacity>
      </SectionCard>

      <SectionCard title="Histórico" icon="📝">
        {moveLog.map((m, i) => <Text key={i} style={styles.logText}>{m}</Text>)}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  boardWrap: { alignItems: 'center', marginVertical: 10 },
  boardRows: { borderWidth: 2, borderColor: palette.border, borderRadius: 8, overflow: 'hidden' },
  rankRow: { flexDirection: 'row' },
  square: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  squareLight: { backgroundColor: '#E5D6AF' },
  squareDark: { backgroundColor: '#6D5336' },
  squareSelected: { backgroundColor: '#28F0A1' },
  squareLegal: { backgroundColor: 'rgba(40,240,161,0.3)' },
  squareLastMove: { backgroundColor: 'rgba(217,180,94,0.4)' },
  piece: { fontSize: 28, color: '#000' },
  pieceDark: { color: '#000' },
  logText: { color: palette.text, fontSize: 14, marginVertical: 2 },
  resetBtn: { backgroundColor: palette.gold, padding: 12, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  resetBtnText: { color: palette.background, fontWeight: '800' }
});
