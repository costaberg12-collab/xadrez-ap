import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Chess } from 'chess.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../components/ScreenContainer';
import SectionCard from '../components/SectionCard';
import { palette } from '../theme/palette';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const MOCK_POSITIONS = [
  {
    label: 'Posição A — Abertura Italiana',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    side: 'w',
  },
  {
    label: 'Posição B — Gambito de Dama',
    fen: 'rnbqkbnr/ppp2ppp/8/3p4/2PPp2q/2N5/PP3PPP/R1BQKBNR w KQkq - 0 4',
    side: 'w',
  },
  {
    label: 'Posição C — Defesa Siciliana',
    fen: 'r1bqkb1r/1p3ppp/p1np1n2/4p3/2B1P3/3P4/PPP2PPP/RNBQK1NR w KQkq - 2 5',
    side: 'w',
  },
  {
    label: 'Posição D — Ataque看来有风险',
    fen: 'r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/3P4/PPPPQPPP/RNB1K2R w KQkq - 4 5',
    side: 'w',
  },
];

function findBestMove(game) {
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;

  const PIECE_VALUES = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 };
  const CENTER = new Set(['c3','c4','c5','c6','d3','d4','d5','d6','e3','e4','e5','e6','f3','f4','f5','f6']);
  const CAPTURE_BONUS = 10;
  const CHECK_BONUS = 5;
  const CENTER_BONUS = 2;
  const ATTACK_BONUS = 4;

  const ranked = moves.map((m) => {
    let score = 0;
    if (m.captured) score += PIECE_VALUES[m.captured] * CAPTURE_BONUS;
    if (m.san.includes('+')) score += CHECK_BONUS;
    if (m.san.includes('#')) score += 50;
    if (CENTER.has(m.to)) score += CENTER_BONUS;
    const clone = new Chess(game.fen());
    clone.move(m.san);
    const attacks = clone.board().flat().filter(p => p && p.color === clone.turn()).length;
    score += attacks * ATTACK_BONUS;
    return { move: m, score };
  });

  return ranked.sort((a, b) => b.score - a.score)[0].move;
}

function findThreats(game) {
  const threats = [];
  const enemyColor = game.turn();
  const playerColor = enemyColor === 'w' ? 'b' : 'w';
  const moves = game.moves({ verbose: true });

  const PIECE_VALUES = { p: 1, n: 3, b: 3.2, r: 5, q: 9 };

  moves.forEach((move) => {
    if (move.captured) {
      const capturedVal = PIECE_VALUES[move.captured] ?? 0;
      threats.push({
        type: 'capture',
        piece: move.piece,
        target: move.to,
        captured: move.captured,
        value: capturedVal,
        urgency: capturedVal,
      });
    }
    if (move.san.includes('+') || move.san.includes('#')) {
      threats.push({
        type: 'check',
        piece: move.piece,
        target: move.to,
        urgency: 3,
      });
    }
  });

  return threats.sort((a, b) => b.urgency - a.urgency).slice(0, 5);
}

function makeSimpleExplanation(move, threats, side, profileLabel) {
  const pieceNames = { p: 'Peão', n: 'Cavalo', b: 'Bispo', r: 'Torre', q: 'Dama', k: 'Rei' };
  const pName = pieceNames[move.piece] ?? move.piece;
  const from = move.from;
  const to = move.to;

  const explanations = [];
  explanations.push(`Movimento sugerido: ${pName} de ${from} para ${to} (${move.san}).`);

  if (move.captured) {
    explanations.push(`Este movimento captura uma peça ${move.captured === 'p' ? 'inimiga (peão)' : move.captured === 'n' ? 'inimiga (cavalo)' : 'inimiga'}. Boa troca!`);
  }
  if (move.san.includes('+')) {
    explanations.push(`Xeque! Você coloca o rei adversário em xeque — pressão imediata.`);
  }
  if (move.san.includes('#')) {
    explanations.push(`Xeque-mate! Partida encerrada com vitória.`);
  }

  const centerMoves = ['c4', 'c5', 'd4', 'd5', 'e4', 'e5', 'f4', 'f5'];
  if (centerMoves.includes(to)) {
    explanations.push(`Controle do centro: posicionar peças no centro gera mais espaço e opções.`);
  }

  if (threats.length > 0) {
    explanations.push(`${threats.length} ameaça(s) detectada(s) no próximo lance do adversário.`);
  }

  return explanations;
}

function generateAdvice(game) {
  const advice = [];
  const inCheck = game.isCheck();

  if (inCheck) {
    const kingSquare = game.board().flatMap((row, ri) =>
      row.map((p, ci) => p?.type === 'k' && p.color === game.turn() ? `${FILES[ci]}${8 - ri}` : null)
    ).filter(Boolean)[0];
    advice.push({ severity: 'high', text: 'Seu rei está em xeque! Você precisa responder a essa ameaça imediatamente.' });
  }

  const moves = game.moves({ verbose: true });
  const hasCastling = moves.some(m => m.flags.includes('k') || m.flags.includes('q'));
  if (hasCastling) advice.push({ severity: 'medium', text: 'Seu rei ainda pode roquear — é uma boa forma de proteger seu rei e ativar a torre.' });
  if (moves.length <= 3 && moves.every(m => ['p', 'n', 'b'].includes(m.piece))) advice.push({ severity: 'low', text: 'Desenvolvimento inicial bom. Continue desenvolvendo peças menores antes de avancar a dama.' });
  if (game.history().length === 0) advice.push({ severity: 'low', text: 'Partida no início. Considere avançar peões do centro ou desenvolver cavalos/bispos.' });

  return advice;
}

export default function AnalysisScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mockPosition, setMockPosition] = useState(MOCK_POSITIONS[0]);
  const [analysis, setAnalysis] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('beginner');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem('analysisHistory').then((stored) => {
      if (stored) setHistory(JSON.parse(stored));
    });
  }, []);

  function runAnalysis(position) {
    setLoading(true);
    setTimeout(() => {
      const game = new Chess(position.fen);
      const best = findBestMove(game);
      const threats = findThreats(game);
      const explanations = makeSimpleExplanation(best, threats, position.side, 'análise');
      const advice = generateAdvice(game);

      const result = {
        positionLabel: position.label,
        fen: position.fen,
        side: position.side,
        bestMove: best,
        threats,
        explanations,
        advice,
        timestamp: Date.now(),
      };

      setAnalysis(result);
      setLoading(false);

      setHistory((prev) => {
        const updated = [result, ...prev].slice(0, 10);
        AsyncStorage.setItem('analysisHistory', JSON.stringify(updated));
        return updated;
      });
    }, 800);
  }

  async function openCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos da permissão da câmera para capturar o tabuleiro.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }

  async function openGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos da permissão da galeria para importar a imagem.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }

  function startMockAnalysis(position) {
    setSelectedImage(null);
    runAnalysis(position);
  }

  function clearAnalysis() {
    setAnalysis(null);
    setSelectedImage(null);
  }

  const game = analysis ? new Chess(analysis.fen) : null;
  const board = game ? game.board() : null;

  return (
    <ScreenContainer
      eyebrow={`Análise ${analysisMode === 'beginner' ? 'para iniciantes' : 'técnica'}`}
      title={analysis ? `Análise: ${analysis.positionLabel}` : 'Análise de tabuleiro por câmera'}
      subtitle={analysis ? 'Resultado gerado pela engine de análise integrada.' : 'Use câmera, galeria ou teste com posições mockadas para ver a análise em ação.'}
    >
      <SectionCard
        icon={analysisMode === 'beginner' ? '🌱' : '⚙️'}
        title={`Modo ${analysisMode === 'beginner' ? 'Iniciante' : 'Avançado'}`}
        description={analysisMode === 'beginner' ? 'Explicações em linguagem simples para você entender o porquê de cada lance.' : 'Análise técnica com avaliação de posição e linhas táticas.'}
      >
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, analysisMode === 'beginner' && styles.modeBtnActive]}
            onPress={() => setAnalysisMode('beginner')}
          >
            <Text style={[styles.modeBtnText, analysisMode === 'beginner' && styles.modeBtnTextActive]}>🌱 Iniciante</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, analysisMode === 'advanced' && styles.modeBtnActive]}
            onPress={() => setAnalysisMode('advanced')}
          >
            <Text style={[styles.modeBtnText, analysisMode === 'advanced' && styles.modeBtnTextActive]}>⚙️ Técnico</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>

      {!analysis ? (
        <>
          <SectionCard
            icon={selectedImage ? '📷' : '📸'}
            title={selectedImage ? 'Imagem selecionada' : 'Capturar tabuleiro'}
            description={selectedImage ? 'Processando imagem... (pipeline de visão computacional em desenvolvimento)' : 'Use a câmera ou galeria para capturar um tabuleiro e receber análise automática.'}
          >
            {selectedImage ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode={Platform.OS === 'web' ? 'contain' : 'cover'} />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageOverlayText}>Processamento de imagem em desenvolvimento</Text>
                  <TouchableOpacity style={styles.clearBtn} onPress={clearAnalysis}>
                    <Text style={styles.clearBtnText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.captureRow}>
                <TouchableOpacity style={[styles.captureBtn, styles.capturePrimary]} onPress={openCamera}>
                  <Text style={styles.capturePrimaryText}>📷 Câmera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.captureBtn} onPress={openGallery}>
                  <Text style={styles.captureBtnText}>🖼️ Galeria</Text>
                </TouchableOpacity>
              </View>
            )}
          </SectionCard>

          <SectionCard
            icon={loading ? '🔍' : '🎯'}
            title={loading ? 'Analisando posição...' : 'Testar com posição mockada'}
            description={loading ? 'Engine processando lance, ameaças e estratégias...' : 'Escolha uma posição pré-configurada para ver a análise em ação agora mesmo.'}
          >
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size={Platform.OS === 'web' ? 'large' : 'small'} color={palette.neon} />
                <Text style={styles.loadingText}>Processando...</Text>
              </View>
            ) : (
              <View style={styles.mockList}>
                {MOCK_POSITIONS.map((pos) => (
                  <TouchableOpacity key={pos.label} style={styles.mockItem} onPress={() => startMockAnalysis(pos)}>
                    <Text style={styles.mockLabel}>{pos.label}</Text>
                    <Text style={styles.mockArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </SectionCard>
        </>
      ) : (
        <>
          <SectionCard
            icon={board ? '♟️' : '?'}
            title={`Posição: ${analysis.side === 'w' ? 'Brancas' : 'Pretas'} jogam`}
            description={analysis.bestMove ? `Melhor lance: ${analysis.bestMove.san}` : 'Lance não identificado'}
          >
            {board && (
              <View style={styles.boardWrap}>
                <View style={styles.boardInner}>
                  {board.map((row, ri) => {
                    const rank = 8 - ri;
                    return (
                      <View key={`r${rank}`} style={styles.boardRow}>
                        <Text style={styles.rankLabel}>{rank}</Text>
                        <View style={styles.squareRow}>
                          {row.map((piece, ci) => {
                            const sq = `${FILES[ci]}${rank}`;
                            const isLight = (FILES.indexOf(FILES[ci]) + ri) % 2 === 0;
                            const isBestTo = analysis.bestMove?.to === sq;
                            const isBestFrom = analysis.bestMove?.from === sq;
                            const PIECES = {
                              wp:'♙',wr:'♖',wn:'♘',wb:'♗',wq:'♕',wk:'♔',
                              bp:'♟',br:'♜',bn:'♞',bb:'♝',bq:'♛',bk:'♚',
                            };
                            const symbol = piece ? PIECES[`${piece.color}${piece.type}`] : '';
                            return (
                              <View
                                key={sq}
                                style={[
                                  styles.boardSquare,
                                  isLight ? styles.squareLight : styles.squareDark,
                                  (isBestTo || isBestFrom) && styles.squareHighlight,
                                ]}
                              >
                                <Text style={[styles.piece, !isLight && styles.pieceDark]}>{symbol}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.fileRow}>
                  {FILES.map((f) => <Text key={`f${f}`} style={styles.fileLabel}>{f.toUpperCase()}</Text>)}
                </View>
              </View>
            )}
          </SectionCard>

          {analysis.explanations.map((exp, i) => (
            <SectionCard key={`exp-${i}`} icon={i === 0 ? '💡' : '→'} title={analysisMode === 'beginner' ? 'Análise em linguagem simples' : `Insight ${i + 1}`} description={exp} accent={i === 0 ? 'neon' : 'gold'} />
          ))}

          {analysis.advice.map((adv, i) => (
            <View key={`adv-${i}`} style={[styles.adviceBadge, adv.severity === 'high' && styles.adviceHigh, adv.severity === 'medium' && styles.adviceMedium, adv.severity === 'low' && styles.adviceLow]}>
              <Text style={[styles.adviceText, adv.severity === 'high' && styles.adviceTextHigh]}>{adv.text}</Text>
            </View>
          ))}

          {analysis.threats.length > 0 && (
            <SectionCard
              icon={analysisMode === 'beginner' ? '⚠️' : '🔴'}
              title={analysisMode === 'beginner' ? 'Possíveis ameaças do adversário' : 'Threats detected'}
              description={analysisMode === 'advanced' ? `${analysis.threats.length} threats found in current position.` : 'Estas são as jogadas mais perigosas que o adversário pode fazer no próximo lance.'}
            >
              <View style={styles.threatList}>
                {analysis.threats.map((t, i) => (
                  <View key={`t-${i}`} style={styles.threatItem}>
                    <Text style={styles.threatType}>{t.type === 'capture' ? '📸 Captura' : '⚡ Xeque'}</Text>
                    <Text style={styles.threatDesc}>
                      {t.type === 'capture' ? `${t.piece === 'p' ? 'Peão' : t.piece.toUpperCase()} captura ${t.captured === 'p' ? 'peão' : t.captured.toUpperCase()} em ${t.target}` : `Xeque com ${t.piece === 'p' ? 'peão' : t.piece === 'n' ? 'cavalo' : t.piece === 'b' ? 'bispo' : 'torre'} em ${t.target}`}
                    </Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          )}

          <TouchableOpacity style={[styles.actionBtn, styles.primaryAction]} onPress={clearAnalysis}>
            <Text style={styles.primaryActionText}>Nova análise</Text>
          </TouchableOpacity>
        </>
      )}

      {history.length > 0 && !analysis && (
        <SectionCard
          icon={loading ? '🔍' : '📝'}
          title={loading ? 'Carregando histórico...' : 'Histórico de análises'}
          description={loading ? 'Carregando...' : `${history.length} posição(ões) analisada(s) nesta sessão.`}
        >
          <View style={styles.historyList}>
            {history.map((h, i) => (
              <TouchableOpacity key={`h${i}`} style={styles.historyItem} onPress={() => { setAnalysis(h); setSelectedImage(null); }}>
                <Text style={styles.historyLabel}>{h.positionLabel}</Text>
                <Text style={styles.historyDetail}>Melhor lance: {h.bestMove?.san ?? '?'} • {new Date(h.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, paddingVertical: 12, alignItems: 'center' },
  modeBtnActive: { borderColor: palette.neon, backgroundColor: palette.neonSoft },
  modeBtnText: { color: palette.text, fontWeight: '700' },
  modeBtnTextActive: { color: palette.neon },
  captureRow: { flexDirection: 'row', gap: 10 },
  captureBtn: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, paddingVertical: 14, alignItems: 'center' },
  capturePrimary: { backgroundColor: palette.neon, borderColor: palette.neon },
  captureBtnText: { color: palette.text, fontWeight: '700' },
  capturePrimaryText: { color: palette.background, fontWeight: '800' },
  imagePreview: { borderRadius: 16, overflow: 'hidden', minHeight: 200 },
  previewImage: { width: '100%', height: 200, backgroundColor: palette.surface },
  imageOverlay: { backgroundColor: 'rgba(8,11,17,0.85)', padding: 14, gap: 10 },
  imageOverlayText: { color: palette.textMuted, fontSize: 14, textAlign: 'center' },
  clearBtn: { backgroundColor: palette.surface, borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: palette.border },
  clearBtnText: { color: palette.text, fontWeight: '700' },
  mockList: { gap: 10 },
  mockItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 14 },
  mockLabel: { color: palette.text, fontWeight: '700', flex: 1 },
  mockArrow: { color: palette.neon, fontWeight: '800', fontSize: 18 },
  loadingWrap: { alignItems: 'center', gap: 12, paddingVertical: 14 },
  loadingText: { color: palette.textMuted, fontSize: 14 },
  boardWrap: { alignItems: 'center', gap: 4 },
  boardInner: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: palette.border },
  boardRow: { flexDirection: 'row', alignItems: 'stretch' },
  rankLabel: { width: 22, textAlign: 'center', color: palette.textMuted, fontSize: 11, fontWeight: '700', backgroundColor: palette.surfaceElevated, paddingTop: 16 },
  squareRow: { flexDirection: 'row' },
  boardSquare: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  squareLight: { backgroundColor: '#E5D6AF' },
  squareDark: { backgroundColor: '#6D5336' },
  squareHighlight: { backgroundColor: 'rgba(217,180,94,0.7)' },
  piece: { fontSize: 26 },
  pieceDark: { color: '#fff' },
  fileRow: { flexDirection: 'row', paddingLeft: 22, width: 320 },
  fileLabel: { width: 40, textAlign: 'center', color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  adviceBadge: { borderRadius: 16, padding: 14, borderWidth: 1 },
  adviceHigh: { backgroundColor: 'rgba(255,107,107,0.12)', borderColor: 'rgba(255,107,107,0.3)' },
  adviceMedium: { backgroundColor: 'rgba(255,176,32,0.12)', borderColor: 'rgba(255,176,32,0.3)' },
  adviceLow: { backgroundColor: 'rgba(40,240,161,0.10)', borderColor: 'rgba(40,240,161,0.25)' },
  adviceText: { color: palette.text, lineHeight: 20 },
  adviceTextHigh: { color: palette.danger },
  threatList: { gap: 10 },
  threatItem: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, padding: 12, gap: 6 },
  threatType: { color: palette.warning, fontWeight: '800', fontSize: 13 },
  threatDesc: { color: palette.textMuted, fontSize: 14, lineHeight: 20 },
  actionBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  primaryAction: { backgroundColor: palette.gold, borderColor: palette.gold },
  primaryActionText: { color: palette.background, fontWeight: '800' },
  historyList: { gap: 10 },
  historyItem: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 14, gap: 6 },
  historyLabel: { color: palette.text, fontWeight: '700' },
  historyDetail: { color: palette.textMuted, fontSize: 13 },
});
