import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Chess } from 'chess.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../components/ScreenContainer';
import SectionCard from '../components/SectionCard';
import { palette } from '../theme/palette';

const PIECE_SYMBOLS = {
  wp:'♙',wr:'♖',wn:'♘',wb:'♗',wq:'♕',wk:'♔',
  bp:'♟',br:'♜',bn:'♞',bb:'♝',bq:'♛',bk:'♚',
};

const FILES = ['a','b','c','d','e','f','g','h'];

const PUZZLES = [
  {
    id: 'p1',
    title: 'Xeque-mate em 1',
    theme: 'Mate em 1',
    difficulty: 'Fácil',
    difficultyLevel: 1,
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    solution: ['Qxf7#'],
    hint: 'A dama pode dar xeque-mate com uma captura.',
    description: 'Posição de xadrez clássica. Brancas jogam e dão xeque-mate em um lance.',
    isCheckmate: true,
  },
  {
    id: 'p2',
    title: 'Garfo de cavalo',
    theme: 'Tática de cavalo',
    difficulty: 'Fácil',
    difficultyLevel: 1,
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    solution: ['Nc6'],
    hint: 'O cavalo pode criar um garfo ataques múltiplos.',
    description: 'Brancas jogam. Encontre o garfo de cavalo que ataca rei e dama.',
    isCheckmate: false,
  },
  {
    id: 'p3',
    title: 'Captura com vantagem',
    theme: 'Troca vantajosa',
    difficulty: 'Médio',
    difficultyLevel: 2,
    fen: 'r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
    solution: ['Bxf7+'],
    hint: 'Um bispo está ameaçando algo valioso.',
    description: 'Brancas jogam. Capture uma peça com vantagem material.',
    isCheckmate: false,
  },
  {
    id: 'p4',
    title: 'Descoberta poderosa',
    theme: 'Xeque descoberto',
    difficulty: 'Médio',
    difficultyLevel: 2,
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 4',
    solution: ['Ng5'],
    hint: 'Mover o cavalo abre uma linha de ataque.',
    description: 'Brancas jogam. Crie um xeque descoberto devastador.',
    isCheckmate: false,
  },
  {
    id: 'p5',
    title: 'Promoção decisiva',
    theme: 'Promoção de peão',
    difficulty: 'Médio',
    difficultyLevel: 2,
    fen: '4k3/4P3/4K3/8/8/8/8/8 w - - 0 1',
    solution: ['e8=Q'],
    hint: 'O peão pode se tornar uma peça poderosa.',
    description: 'Brancas jogam. Mova o peão para promoção.',
    isCheckmate: false,
  },
  {
    id: 'p6',
    title: 'Ataque duplo',
    theme: 'Ataque a duas peças',
    difficulty: 'Difícil',
    difficultyLevel: 3,
    fen: 'r2qkb1r/ppp2ppp/2n1bn2/3pp3/2B1P1B1/2NP1N2/PPP2PPP/R2QKB1R w KQkq - 4 6',
    solution: ['Bxf7+'],
    hint: 'Sacrifício de bispo abre linhas para ataque.',
    description: 'Brancas jogam. Encontre o ataque duplo devastador.',
    isCheckmate: false,
  },
];

const LESSONS = [
  { id: 'l1', icon: '♙', title: 'Como mover as peças', description: 'Aprenda os movimentos básicos de cada peça.', tags: ['Básico', 'Iniciante'] },
  { id: 'l2', icon: '🏰', title: 'Roque: proteger o rei', description: 'Entenda quando e como fazer o roque.', tags: ['Intermediário'] },
  { id: 'l3', icon: '⚔️', title: 'Captura e troca', description: 'Quando vale a pena trocar peças.', tags: ['Básico', 'Iniciante'] },
  { id: 'l4', icon: '💡', title: 'Controle do centro', description: 'Por que o centro do tabuleiro é tão importante.', tags: ['Intermediário'] },
  { id: 'l5', icon: '🚫', title: 'Como evitar xeque-mate', description: 'Defesas básicas contra xeque-mate rápido.', tags: ['Básico'] },
];

function sqColor(sq) {
  const fi = FILES.indexOf(sq[0]);
  const ri = Number(sq[1]) - 1;
  return (fi + ri) % 2 === 0 ? 'light' : 'dark';
}

function PuzzlBoard({ game, solutionMove, showingSolution, wrongMove }) {
  const board = game.board();
  return (
    <View style={styles.puzzleBoardWrap}>
      <View style={styles.puzzleFileRow}>{FILES.map(f => <Text key={`f${f}`} style={styles.axisLabel}>{f.toUpperCase()}</Text>)}</View>
      <View style={styles.puzzleBoard}>
        {board.map((row, ri) => {
          const rank = 8 - ri;
          return (
            <View key={`r${rank}`} style={styles.puzzleRankRow}>
              <Text style={styles.puzzleRankLabel}>{rank}</Text>
              <View style={styles.puzzleSquareRow}>
                {row.map((piece, ci) => {
                  const sq = `${FILES[ci]}${rank}`;
                  const isLight = sqColor(sq) === 'light';
                  const isSolutionFrom = showingSolution && solutionMove && solutionMove.from === sq;
                  const isSolutionTo = showingSolution && solutionMove && solutionMove.to === sq;
                  const isWrong = wrongMove && wrongMove.to === sq;
                  return (
                    <View
                      key={sq}
                      style={[
                        styles.puzzleSquare,
                        isLight ? styles.puzzleSquareLight : styles.puzzleSquareDark,
                        isSolutionFrom && styles.puzzleSquareFrom,
                        isSolutionTo && styles.puzzleSquareTo,
                        isWrong && styles.puzzleSquareWrong,
                      ]}
                    >
                      <Text style={[styles.puzzlePiece, !isLight && styles.puzzlePieceDark]}>
                        {piece ? PIECE_SYMBOLS[`${piece.color}${piece.type}`] : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.puzzleFileRow}>{FILES.map(f => <Text key={`fb${f}`} style={styles.axisLabel}>{f.toUpperCase()}</Text>)}</View>
    </View>
  );
}

export default function StudyScreen() {
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [game, setGame] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveCount, setMoveCount] = useState(0);
  const [solved, setSolved] = useState(false);
  const [showingSolution, setShowingSolution] = useState(false);
  const [wrongMove, setWrongMove] = useState(null);
  const [solvedPuzzles, setSolvedPuzzles] = useState([]);
  const [tab, setTab] = useState('puzzles');

  function startPuzzle(puzzle) {
    setSelectedPuzzle(puzzle);
    setGame(new Chess(puzzle.fen));
    setSelectedSquare(null);
    setMoveCount(0);
    setSolved(false);
    setShowingSolution(false);
    setWrongMove(null);
  }

  function handleSquarePress(square) {
    if (!game || solved) return;
    const piece = game.get(square);

    if (selectedSquare) {
      const targetMove = game.moves({ square: selectedSquare, verbose: true }).find(m => m.to === square);
      if (targetMove) {
        const san = targetMove.san;
        if (selectedPuzzle.solution.includes(san) || (targetMove.promotion && selectedPuzzle.solution.some(s => s.startsWith(san)))) {
          game.move(targetMove);
          const refreshed = new Chess(game.fen());
          setGame(refreshed);
          setSelectedSquare(null);
          setMoveCount(prev => prev + 1);
          setSolved(true);
          markSolved(selectedPuzzle.id);
        } else {
          setWrongMove({ to: square, from: selectedSquare });
          setTimeout(() => setWrongMove(null), 1000);
          setSelectedSquare(null);
        }
        return;
      }
      setSelectedSquare(null);
    }

    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
    }
  }

  async function markSolved(puzzleId) {
    try {
      const raw = await AsyncStorage.getItem('playerStats');
      const stats = raw ? JSON.parse(raw) : { wins:0, losses:0, draws:0, games:0, puzzlesSolved:0, analysisCount:0 };
      stats.puzzlesSolved = (stats.puzzlesSolved || 0) + 1;
      await AsyncStorage.setItem('playerStats', JSON.stringify(stats));
    } catch {}
    setSolvedPuzzles(prev => [...new Set([...prev, puzzleId])]);
  }

  function showSolution() { setShowingSolution(true); }

  function backToList() {
    setSelectedPuzzle(null);
    setGame(null);
    setSelectedSquare(null);
    setMoveCount(0);
    setSolved(false);
    setShowingSolution(false);
  }

  const legalTargets = selectedSquare && game ? game.moves({ square: selectedSquare, verbose: true }).map(m => m.to) : [];
  const targetMove = selectedPuzzle && game ? selectedPuzzle.solution[0] : null;

  return (
    <ScreenContainer
      eyebrow={selectedPuzzle ? '🧩 Puzzle' : '📚 Modo estudo'}
      title={selectedPuzzle ? selectedPuzzle.title : 'Estudo e quebra-cabeças'}
      subtitle={selectedPuzzle ? `${selectedPuzzle.theme} · ${selectedPuzzle.difficulty}` : 'Exercícios, lições e puzzles para melhorar seu jogo.'}
    >
      {!selectedPuzzle ? (
        <>
          <View style={styles.tabRow}>
            {[{ key: 'puzzles', label: '🧩 Puzzles' }, { key: 'lessons', label: '📖 Lições' }].map(t => (
              <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
                <Text style={[styles.tabBtnText, tab === t.key && styles.tabBtnTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'puzzles' && (
            <View style={styles.puzzleGrid}>
              {PUZZLES.map(puzzle => {
                const isSolved = solvedPuzzles.includes(puzzle.id);
                return (
                  <TouchableOpacity
                    key={puzzle.id}
                    style={[styles.puzzleCard, isSolved && styles.puzzleCardSolved]}
                    onPress={() => startPuzzle(puzzle)}
                  >
                    <View style={styles.puzzleCardHeader}>
                      <Text style={styles.puzzleIcon}>{isSolved ? '✅' : '🧩'}</Text>
                      <View style={styles.puzzleDiffBadge}>
                        <Text style={styles.puzzleDiffText}>{puzzle.difficulty}</Text>
                      </View>
                    </View>
                    <Text style={styles.puzzleTitle}>{puzzle.title}</Text>
                    <Text style={styles.puzzleTheme}>{puzzle.theme}</Text>
                    {isSolved && <Text style={styles.puzzleSolvedLabel}>✅ Resolvido</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {tab === 'lessons' && (
            <View style={styles.lessonList}>
              {LESSONS.map(lesson => (
                <View key={lesson.id} style={styles.lessonCard}>
                  <View style={styles.lessonIconWrap}><Text style={styles.lessonIcon}>{lesson.icon}</Text></View>
                  <View style={styles.lessonTextWrap}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonDesc}>{lesson.description}</Text>
                    <View style={styles.lessonTagRow}>
                      {lesson.tags.map(tag => <Text key={tag} style={styles.lessonTag}>{tag}</Text>)}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          <SectionCard
            icon={solved ? '🎉' : showingSolution ? '💡' : '🎯'}
            title={solved ? 'Puzzle resolvido!' : showingSolution ? 'Solução revelada' : 'Tente resolver'}
            description={selectedPuzzle.description}
            accent={solved ? 'neon' : showingSolution ? 'gold' : 'neon'}
          >
            <PuzzlBoard game={game} showingSolution={showingSolution} solutionMove={null} wrongMove={wrongMove} />

            {selectedSquare && legalTargets.length > 0 && (
              <View style={styles.legalMovesHint}>
                <Text style={styles.legalMovesText}>Casas possíveis: {legalTargets.join(', ')}</Text>
              </View>
            )}

            <View style={styles.puzzleStatusRow}>
              <Text style={styles.puzzleStatusText}>
                {solved ? `🎉 Resolvido em ${moveCount} lance!` : showingSolution ? '💡 Solução acima.' : `Lances: ${moveCount} · Brancas jogam`}
              </Text>
            </View>

            {solved && (
              <View style={styles.solvedCelebration}>
                <Text style={styles.solvedCelebrationText}>Parabéns! Você encontrou a solução correta!</Text>
              </View>
            )}

            {solved && (
              <TouchableOpacity style={styles.nextPuzzleBtn} onPress={backToList}>
                <Text style={styles.nextPuzzleBtnText}>← Voltar aos puzzles</Text>
              </TouchableOpacity>
            )}
          </SectionCard>

          {!solved && !showingSolution && (
            <View style={styles.helpRow}>
              <TouchableOpacity style={styles.helpBtn} onPress={showSolution}>
                <Text style={styles.helpBtnText}>💡 Ver solução</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.helpBtnSecondary} onPress={() => { setSelectedSquare(null); }}>
                <Text style={styles.helpBtnSecondaryText}>Limpar seleção</Text>
              </TouchableOpacity>
            </View>
          )}

          {showingSolution && !solved && (
            <SectionCard icon={'💡'} title={'Como resolver'} description={selectedPuzzle.hint} accent={'gold'} />
          )}

          <TouchableOpacity style={styles.backBtn} onPress={backToList}>
            <Text style={styles.backBtnText}>← Voltar à lista</Text>
          </TouchableOpacity>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  tabBtn: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, paddingVertical: 14, alignItems: 'center' },
  tabBtnActive: { borderColor: palette.neon, backgroundColor: palette.neonSoft },
  tabBtnText: { color: palette.text, fontWeight: '700' },
  tabBtnTextActive: { color: palette.neon },
  puzzleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  puzzleCard: { width: '47%', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 20, padding: 16, gap: 8 },
  puzzleCardSolved: { borderColor: palette.neon },
  puzzleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  puzzleIcon: { fontSize: 20 },
  puzzleDiffBadge: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  puzzleDiffText: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  puzzleTitle: { color: palette.white, fontWeight: '800', fontSize: 15 },
  puzzleTheme: { color: palette.textMuted, fontSize: 12 },
  puzzleSolvedLabel: { color: palette.neon, fontWeight: '700', fontSize: 12 },
  lessonList: { gap: 12 },
  lessonCard: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 20, padding: 16, flexDirection: 'row', gap: 14 },
  lessonIconWrap: { width: 48, height: 48, backgroundColor: palette.surface, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  lessonIcon: { fontSize: 24 },
  lessonTextWrap: { flex: 1, gap: 6 },
  lessonTitle: { color: palette.white, fontWeight: '800', fontSize: 16 },
  lessonDesc: { color: palette.textMuted, fontSize: 13, lineHeight: 19 },
  lessonTagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  lessonTag: { color: palette.text, backgroundColor: palette.surface, borderRadius: 999, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '700' },
  puzzleBoardWrap: { alignItems: 'center', gap: 4 },
  puzzleFileRow: { width: '100%', flexDirection: 'row', paddingLeft: 26, paddingRight: 8 },
  axisLabel: { flex: 1, textAlign: 'center', color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  puzzleBoard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: palette.border },
  puzzleRankRow: { flexDirection: 'row', alignItems: 'stretch' },
  puzzleRankLabel: { width: 26, textAlign: 'center', color: palette.textMuted, fontSize: 11, fontWeight: '700', backgroundColor: palette.surfaceElevated, paddingTop: 18 },
  puzzleSquareRow: { flex: 1, flexDirection: 'row' },
  puzzleSquare: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  puzzleSquareLight: { backgroundColor: '#E5D6AF' },
  puzzleSquareDark: { backgroundColor: '#6D5336' },
  puzzleSquareFrom: { backgroundColor: 'rgba(40,240,161,0.6)' },
  puzzleSquareTo: { backgroundColor: 'rgba(40,240,161,0.6)' },
  puzzleSquareWrong: { backgroundColor: 'rgba(255,107,107,0.6)' },
  puzzlePiece: { fontSize: 26 },
  puzzlePieceDark: { color: '#fff' },
  legalMovesHint: { backgroundColor: palette.surface, borderRadius: 12, padding: 10 },
  legalMovesText: { color: palette.neon, fontWeight: '700', fontSize: 13 },
  puzzleStatusRow: { backgroundColor: palette.surface, borderRadius: 12, padding: 10 },
  puzzleStatusText: { color: palette.text, fontWeight: '700', textAlign: 'center' },
  solvedCelebration: { backgroundColor: palette.neonSoft, borderWidth: 1, borderColor: 'rgba(40,240,161,0.3)', borderRadius: 14, padding: 12 },
  solvedCelebrationText: { color: palette.neon, fontWeight: '800', textAlign: 'center', fontSize: 15 },
  nextPuzzleBtn: { backgroundColor: palette.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  nextPuzzleBtnText: { color: palette.background, fontWeight: '800' },
  helpRow: { flexDirection: 'row', gap: 10 },
  helpBtn: { flex: 1, backgroundColor: palette.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  helpBtnText: { color: palette.background, fontWeight: '800' },
  helpBtnSecondary: { flex: 1, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  helpBtnSecondaryText: { color: palette.text, fontWeight: '700' },
  backBtn: { backgroundColor: palette.surface, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: palette.border },
  backBtnText: { color: palette.textMuted, fontWeight: '700' },
});
