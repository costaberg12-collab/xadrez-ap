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

const PIECE_VALUES = { p:1, n:3, b:3.2, r:5, q:9, k:0 };
const FILES = ['a','b','c','d','e','f','g','h'];
const CENTER_SQUARES = new Set(['c3','c4','c5','c6','d3','d4','d5','d6','e3','e4','e5','e6','f3','f4','f5','f6']);

function createGame() { return new Chess(); }

function evaluateMove(move, profile) {
  const w = profile.weights;
  let score = 0;
  if (move.captured) score += PIECE_VALUES[move.captured] * w.capture;
  if (move.san.includes('+')) score += 1.5 * w.check;
  if (move.san.includes('#')) score += 100;
  if (CENTER_SQUARES.has(move.to)) score += w.center;
  if (move.flags.includes('k') || move.flags.includes('q')) score += 2.2 * w.castle;
  if (['n','b'].includes(move.piece) && ['b8','g8','b1','g1','c8','f8','c1','f1'].includes(move.from)) score += 1.1 * w.develop;
  if (move.piece === 'q' && ['d8','d1'].includes(move.from)) score += w.queenEarly;
  if (move.piece === 'n') score += w.knight;
  if (move.piece === 'b') score += w.bishop;
  if (move.piece === 'r') score += w.rook;
  if (move.piece === 'p') score += w.pawnPush;
  const tr = Number(move.to[1]);
  if (move.color === 'b' && tr <= 4) score += 0.35;
  if (move.color === 'w' && tr >= 5) score += 0.35;
  return score;
}

function pickAIMove(game, levelId, profileId) {
  const level = engineLevels.find(l => l.id === levelId) ?? engineLevels[0];
  const profile = masterProfiles.find(p => p.id === profileId) ?? masterProfiles[0];
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;
  const ranked = moves.map(m => ({ move: m, score: evaluateMove(m, profile) + Math.random() * level.randomness })).sort((a, b) => b.score - a.score);
  const pool = ranked.slice(0, Math.min(level.topPool, ranked.length));
  return pool[Math.floor(Math.random() * pool.length)]?.move ?? ranked[0].move;
}

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

function loadStats() {
  return AsyncStorage.getItem('playerStats').then(d => d ? JSON.parse(d) : { wins:0, losses:0, draws:0, games:0, puzzlesSolved:0, analysisCount:0 });
}

function loadRecentGames() {
  return AsyncStorage.getItem('recentGames').then(d => d ? JSON.parse(d) : []);
}

async function saveGameResult(result, opponent) {
  const [stats, recent] = await Promise.all([loadStats(), loadRecentGames()]);
  if (result === 'win') stats.wins++;
  else if (result === 'loss') stats.losses++;
  else { stats.draws++; }
  stats.games++;
  const updated = [result, opponent, Date.now()].join('|');
  const newRecent = [{ result, opponent, mode: 'vs Máquina', timestamp: Date.now() }, ...recent].slice(0, 10);
  await Promise.all([
    AsyncStorage.setItem('playerStats', JSON.stringify(stats)),
    AsyncStorage.setItem('recentGames', JSON.stringify(newRecent)),
  ]);
}

export default function TrainingScreen() {
  const [game, setGame] = useState(() => createGame());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [levelId, setLevelId] = useState('beginner');
  const [profileId, setProfileId] = useState('magnus');
  const [isThinking, setIsThinking] = useState(false);
  const [moveLog, setMoveLog] = useState([]);
  const [lastFrom, setLastFrom] = useState(null);
  const [lastTo, setLastTo] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Você joga de brancas. Toque em uma peça para começar.');
  const [gameOverShown, setGameOverShown] = useState(false);

  const board = useMemo(() => game.board(), [game]);
  const legalTargets = useMemo(() => {
    if (!selectedSquare) return [];
    return game.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
  }, [game, selectedSquare]);

  const activeLevel = engineLevels.find(l => l.id === levelId) ?? engineLevels[0];
  const activeProfile = masterProfiles.find(p => p.id === profileId) ?? masterProfiles[0];

  function resetMatch() {
    setGame(createGame());
    setSelectedSquare(null);
    setMoveLog([]);
    setLastFrom(null);
    setLastTo(null);
    setIsThinking(false);
    setGameOverShown(false);
    setStatusMessage('Nova partida. Você joga de brancas.');
  }

  async function handleGameEnd(result) {
    if (gameOverShown) return;
    setGameOverShown(true);
    await saveGameResult(result, activeProfile.label);
    const messages = {
      win: '🎉 Parabéns! Você venceu a máquina!',
      loss: '☠️ A máquina venceu. Tente novamente!',
      draw: '🤝 Empate! Boa partida.',
    };
    Alert.alert(result === 'win' ? '🎉 Vitória!' : result === 'loss' ? '☠️ Derrota' : '🤝 Empate', messages[result], [{ text: 'Nova partida', onPress: resetMatch }]);
  }

  function runAiTurn(nextGame, userMoveSan) {
    const gameStatus = normalizeStatus(nextGame, activeProfile.label);
    if (gameStatus) {
      setStatusMessage(gameStatus);
      if (nextGame.isCheckmate()) {
        const winner = nextGame.turn() === 'w' ? 'loss' : 'win';
        handleGameEnd(winner);
      } else if (nextGame.isDraw()) {
        handleGameEnd('draw');
      }
      return;
    }

    setIsThinking(true);
    setStatusMessage(`${activeProfile.label} está pensando...`);

    setTimeout(async () => {
      const aiMove = pickAIMove(nextGame, levelId, profileId);
      if (!aiMove) { setIsThinking(false); return; }
      nextGame.move(aiMove);
      const refreshed = new Chess(nextGame.fen());
      setGame(refreshed);
      setLastFrom(aiMove.from);
      setLastTo(aiMove.to);
      setMoveLog(prev => [`${userMoveSan}`, `${activeProfile.label}: ${aiMove.san}`, ...prev].slice(0, 16));
      setIsThinking(false);

      const status = normalizeStatus(refreshed, activeProfile.label);
      if (status) {
        setStatusMessage(status);
        if (refreshed.isCheckmate()) {
          const winner = refreshed.turn() === 'w' ? 'loss' : 'win';
          handleGameEnd(winner);
        } else if (refreshed.isDraw()) {
          handleGameEnd('draw');
        }
      } else {
        setStatusMessage('Sua vez. Toque em uma peça branca para jogar.');
      }
    }, 100);
  }

  function handleSquarePress(square) {
    if (isThinking || game.isGameOver() || game.turn() !== 'w') return;
    const piece = game.get(square);

    if (selectedSquare) {
      const availableMove = game.moves({ square: selectedSquare, verbose: true }).find(m => m.to === square);
      if (availableMove) {
        const clone = new Chess(game.fen());
        const result = clone.move({ from: selectedSquare, to: square, promotion: 'q' });
        const refreshed = new Chess(clone.fen());
        setGame(refreshed);
        setSelectedSquare(null);
        setLastFrom(result.move.from);
        setLastTo(result.move.to);
        setStatusMessage(`${result.san}. Aguardando resposta da máquina...`);
        runAiTurn(clone, `Você: ${result.san}`);
        return;
      }
      setSelectedSquare(null);
    }

    if (piece?.color === 'w') {
      const moves = game.moves({ square, verbose: true });
      setSelectedSquare(square);
      setStatusMessage(moves.length ? `Peça em ${square}. Escolha uma casa verde.` : 'Sem lances legais para esta peça.');
    }
  }

  return (
    <ScreenContainer
      eyebrow={isThinking ? '🤖 Pensando...' : '♟️ Treino'}
      title={`vs ${activeProfile.label}`}
      subtitle={`Nível ${activeLevel.label} · ${statusMessage}`}
    >
      <SectionCard icon={isThinking ? '🤖' : '🎮'} title={`Configuração (Nível: ${activeLevel.label})`} description={activeLevel.description} accent={isThinking ? 'gold' : 'neon'}>
        <Text style={styles.groupLabel}>Nível da máquina</Text>
        <View style={styles.optionRow}>
          {engineLevels.map(l => (
            <TouchableOpacity key={l.id} style={[styles.choiceChip, l.id === levelId && styles.choiceChipActive]} onPress={() => l.id !== levelId && (setLevelId(l.id), resetMatch())}>
              <Text style={[styles.choiceText, l.id === levelId && styles.choiceTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.groupLabel}>Estilo do oponente</Text>
        <View style={styles.profileList}>
          {masterProfiles.map(p => (
            <TouchableOpacity key={p.id} style={[styles.profileCard, p.id === profileId && styles.profileCardActive]} onPress={() => p.id !== profileId && (setProfileId(p.id), resetMatch())}>
              <Text style={[styles.profileTitle, p.id === profileId && styles.profileTitleActive]}>{p.label}</Text>
              <Text style={styles.profileSummary}>{p.summary}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SectionCard>

      <SectionCard icon={isThinking ? '⏳' : '♟️'} title={isThinking ? `${activeProfile.label} pensando...` : 'Tabuleiro'} description={`${game.turn() === 'w' ? 'Sua vez' : 'Vez da máquina'} · ${game.isCheck() ? '⚠️ XEQUE!' : ''}`}>
        <View style={styles.boardWrap}>
          <View style={styles.fileTop}>{FILES.map(f => <Text key={`f${f}`} style={styles.axisLabel}>{f.toUpperCase()}</Text>)}</View>
          <View style={styles.boardRows}>
            {board.map((row, ri) => {
              const rank = 8 - ri;
              return (
                <View key={`r${rank}`} style={styles.rankRow}>
                  <Text style={styles.axisSide}>{rank}</Text>
                  <View style={styles.squareRow}>
                    {row.map((piece, ci) => {
                      const sq = `${FILES[ci]}${rank}`;
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
                          <Text style={[styles.piece, !isLight && styles.pieceDark]}>{piece ? PIECE_SYMBOLS[`${piece.color}${piece.type}`] : ''}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.fileBottom}>{FILES.map(f => <Text key={`fb${f}`} style={styles.axisLabel}>{f.toUpperCase()}</Text>)}</View>
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={resetMatch}><Text style={styles.primaryButtonText}>Nova partida</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setSelectedSquare(null)}><Text style={styles.actionButtonText}>Limpar seleção</Text></TouchableOpacity>
        </View>
      </SectionCard>

      <SectionCard icon={isThinking ? '⏳' : '📝'} title={isThinking ? 'Aguarde...' : 'Registro de lances'} description={isThinking ? 'A máquina está processando...' : 'Últimos lances da partida.'}>
        <View style={styles.logList}>
          {moveLog.length ? moveLog.map((item, i) => <View key={`l${i}`} style={styles.logItem}><Text style={styles.logText}>{item}</Text></View>) : <Text style={styles.emptyText}>Nenhum lance ainda.</Text>}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

// onSquarePress is not used - handler is handleSquarePress

const styles = StyleSheet.create({
  groupLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  choiceChip: { borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, paddingHorizontal: 14, paddingVertical: 10 },
  choiceChipActive: { borderColor: palette.neon, backgroundColor: palette.neonSoft },
  choiceText: { color: palette.text, fontWeight: '700' },
  choiceTextActive: { color: palette.neon },
  profileList: { gap: 10 },
  profileCard: { backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.border, padding: 14, gap: 6 },
  profileCardActive: { borderColor: palette.gold, backgroundColor: 'rgba(217,180,94,0.12)' },
  profileTitle: { color: palette.white, fontWeight: '800', fontSize: 15 },
  profileTitleActive: { color: palette.gold },
  profileSummary: { color: palette.textMuted, lineHeight: 20 },
  boardWrap: { alignItems: 'center', gap: 4 },
  fileTop: { width: '100%', flexDirection: 'row', paddingLeft: 26, paddingRight: 8 },
  axisLabel: { flex: 1, textAlign: 'center', color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  boardRows: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: palette.border },
  rankRow: { flexDirection: 'row', alignItems: 'stretch' },
  axisSide: { width: 26, textAlign: 'center', color: palette.textMuted, fontSize: 11, fontWeight: '700', backgroundColor: palette.surfaceElevated, paddingTop: 18 },
  squareRow: { flex: 1, flexDirection: 'row' },
  square: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  squareLight: { backgroundColor: '#E5D6AF' },
  squareDark: { backgroundColor: '#6D5336' },
  squareSelected: { backgroundColor: '#28F0A1' },
  squareLegal: { borderColor: '#28F0A1', borderWidth: 2 },
  squareLastMove: { backgroundColor: 'rgba(217,180,94,0.55)' },
  piece: { fontSize: 30 },
  pieceDark: { color: '#fff' },
  fileBottom: { width: '100%', flexDirection: 'row', paddingLeft: 26, paddingRight: 8 },
  controlRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionButton: { flexGrow: 1, minWidth: 140, borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  primaryButton: { borderColor: palette.gold, backgroundColor: palette.gold },
  actionButtonText: { color: palette.text, fontWeight: '700' },
  primaryButtonText: { color: palette.background, fontWeight: '800' },
  logList: { gap: 8 },
  logItem: { backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 12, paddingVertical: 10 },
  logText: { color: palette.text, fontWeight: '600' },
  emptyText: { color: palette.textMuted },
});
