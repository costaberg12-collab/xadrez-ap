import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../components/ScreenContainer';
import SectionCard from '../components/SectionCard';
import { formatClock, timeControls } from '../data/timeControls';
import { palette } from '../theme/palette';

const LOW_TIME_SECONDS = 10;
const SAVE_KEY = 'clockHistory';

async function loadHistory() {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveHistory(history) {
  try {
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(history));
  } catch {}
}

async function updateStats(result, playerA, playerB) {
  try {
    const raw = await AsyncStorage.getItem('playerStats');
    const stats = raw ? JSON.parse(raw) : { wins:0, losses:0, draws:0, games:0, puzzlesSolved:0, analysisCount:0 };
    const rawRecent = await AsyncStorage.getItem('recentGames');
    const recent = rawRecent ? JSON.parse(rawRecent) : [];
    if (result === 'win') stats.wins++;
    else if (result === 'loss') stats.losses++;
    else stats.draws++;
    stats.games++;
    const label = result === 'win' ? playerA : result === 'loss' ? playerB : 'Empate';
    const newRecent = [{ result, opponent: label, mode: 'Relógio', timestamp: Date.now() }, ...recent].slice(0, 10);
    await Promise.all([
      AsyncStorage.setItem('playerStats', JSON.stringify(stats)),
      AsyncStorage.setItem('recentGames', JSON.stringify(newRecent)),
    ]);
  } catch {}
}

function PlayerClockPanel({ name, seconds, active, onPress, isLeft, lowTime, finished }) {
  const displaySeconds = Math.max(0, seconds);
  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;
  const isCritical = displaySeconds <= LOW_TIME_SECONDS && displaySeconds > 0 && !finished;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      disabled={finished}
      style={[
        styles.clockPanel,
        isLeft ? styles.clockPanelLeft : styles.clockPanelRight,
        active && !finished && styles.clockPanelActive,
        isCritical && !active && styles.clockPanelCritical,
        finished && styles.clockPanelFinished,
      ]}
    >
      <View style={styles.clockTopSection}>
        <Text style={[styles.clockName, finished && styles.clockNameFinished]}>{name}</Text>
        {isCritical && <View style={styles.criticalBadge}><Text style={styles.criticalBadgeText}>⚠️ TEMPO CRÍTICO</Text></View>}
        {finished && <View style={styles.finishedBadge}><Text style={styles.finishedBadgeText}>TEMPO ESGOTADO</Text></View>}
      </View>
      <View style={styles.clockTimeRow}>
        <Text style={[styles.clockMinutes, isCritical && styles.clockMinutesCritical]}>{String(mins).padStart(2,'0')}</Text>
        <Text style={[styles.clockColon, isCritical && styles.clockColonCritical]}>:</Text>
        <Text style={[styles.clockSeconds, isCritical && styles.clockSecondsCritical]}>{String(secs).padStart(2,'0')}</Text>
      </View>
      <Text style={styles.clockHint}>
        {finished ? 'Partida encerrada' : active ? '▼ Toque para passar a vez' : 'Aguardando...'}
      </Text>
    </TouchableOpacity>
  );
}

export default function ClockScreen() {
  const [selectedMinutes, setSelectedMinutes] = useState(5);
  const [customMinutes, setCustomMinutes] = useState('10');
  const [playerA, setPlayerA] = useState('Jogador A');
  const [playerB, setPlayerB] = useState('Jogador B');
  const [secondsA, setSecondsA] = useState(5 * 60);
  const [secondsB, setSecondsB] = useState(5 * 60);
  const [activePlayer, setActivePlayer] = useState('A');
  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [increment, setIncrement] = useState(0);
  const [history, setHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef(null);
  const alertCacheRef = useRef({ A: false, B: false });

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  useEffect(() => {
    if (!isRunning || winner) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsA(prev => {
        if (activePlayer !== 'A') return prev;
        if (prev <= 1) { clearInterval(intervalRef.current); intervalRef.current = null; handleWin('B'); return 0; }
        return prev - 1;
      });
      setSecondsB(prev => {
        if (activePlayer !== 'B') return prev;
        if (prev <= 1) { clearInterval(intervalRef.current); intervalRef.current = null; handleWin('A'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activePlayer, isRunning, winner]);

  useEffect(() => {
    if (secondsA <= LOW_TIME_SECONDS && secondsA > 0 && !alertCacheRef.current.A && isRunning && activePlayer === 'A') {
      alertCacheRef.current.A = true;
      triggerLowTimeFeedback();
    }
  }, [secondsA, isRunning, activePlayer]);

  useEffect(() => {
    if (secondsB <= LOW_TIME_SECONDS && secondsB > 0 && !alertCacheRef.current.B && isRunning && activePlayer === 'B') {
      alertCacheRef.current.B = true;
      triggerLowTimeFeedback();
    }
  }, [secondsB, isRunning, activePlayer]);

  function triggerLowTimeFeedback() {
    if (vibrationEnabled) Vibration.vibrate([0, 200, 100, 200]);
  }

  async function handleWin(winnerKey) {
    setIsRunning(false);
    setWinner(winnerKey);
    if (vibrationEnabled) Vibration.vibrate([0, 300, 150, 300, 150, 300]);
    const winnerName = winnerKey === 'A' ? playerA : playerB;
    const newEntry = { id: Date.now().toString(), label: `${winnerName} venceu no tempo`, playerA: playerA, playerB: playerB, secondsA, secondsB, timestamp: Date.now() };
    const updated = [newEntry, ...history].slice(0, 8);
    setHistory(updated);
    await saveHistory(updated);
    await updateStats(winnerKey === 'A' ? 'win' : 'loss', playerA, playerB);
    Alert.alert('⏱️ Fim de partida', `${winnerName} venceu! O relógio de ${winnerKey === 'A' ? playerB : playerA} chegou a zero.`, [{ text: 'Nova partida', onPress: resetClock }]);
  }

  function applyTime(minutes) {
    const total = Math.max(1, minutes) * 60;
    setSelectedMinutes(minutes);
    setSecondsA(total); setSecondsB(total);
    setActivePlayer('A'); setWinner(null); setIsRunning(false);
    alertCacheRef.current = { A: false, B: false };
  }

  function applyCustomTime() {
    const parsed = Number(customMinutes.replace(',','.'));
    if (!parsed || parsed < 0.5) { Alert.alert('Tempo inválido', 'Digite um valor maior ou igual a 0.5 minuto.'); return; }
    applyTime(Math.max(0.5, parsed));
  }

  function handleStart() {
    if (winner) { resetClock(); return; }
    setIsRunning(true);
  }

  function handlePause() { setIsRunning(false); }

  function resetClock() {
    applyTime(selectedMinutes);
  }

  function switchTurn(playerKey) {
    if (!isRunning || winner || activePlayer !== playerKey) return;
    if (vibrationEnabled) Vibration.vibrate(30);
    setActivePlayer(playerKey === 'A' ? 'B' : 'A');
    alertCacheRef.current = { A: false, B: false };
  }

  const isCriticalA = secondsA <= LOW_TIME_SECONDS && secondsA > 0 && !winner;
  const isCriticalB = secondsB <= LOW_TIME_SECONDS && secondsB > 0 && !winner;

  return (
    <ScreenContainer
      eyebrow={winner ? '🏆 Partida encerrada' : isRunning ? '▶️ Partida em andamento' : '⏸️ Relógio pausado'}
      title={winner ? `${winner === 'A' ? playerA : playerB} venceu!` : 'Relógio profissional de xadrez'}
      subtitle={`${playerA} vs ${playerB} · ${selectedMinutes}min por jogador · ${isRunning ? 'Em andamento' : 'Pausado'}`}
    >
      <View style={styles.clockContainer}>
        <PlayerClockPanel name={playerB} seconds={secondsB} active={activePlayer === 'B' && isRunning && !winner} onPress={() => switchTurn('B')} isLeft={false} lowTime={isCriticalB} finished={winner === 'A'} />
        <View style={styles.centerDivider}>
          <TouchableOpacity style={[styles.playPauseBtn, isRunning ? styles.pauseBtn : winner ? styles.newGameBtn : styles.startBtn]} onPress={isRunning ? handlePause : handleStart}>
            <Text style={styles.playPauseIcon}>{winner ? '↻' : isRunning ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          {isRunning && <Text style={styles.turnIndicator}>{activePlayer === 'A' ? playerA : playerB}</Text>}
        </View>
        <PlayerClockPanel name={playerA} seconds={secondsA} active={activePlayer === 'A' && isRunning && !winner} onPress={() => switchTurn('A')} isLeft={true} lowTime={isCriticalA} finished={winner === 'B'} />
      </View>

      <SectionCard icon={showSettings ? '▼' : '⚙️'} title={showSettings ? 'Esconder configurações' : 'Configurações'} description={`Presets de tempo, incremento, sons e vibração.`} onPress={() => setShowSettings(!showSettings)}>
        {showSettings && (
          <>
            <Text style={styles.sectionLabel}>Tempo por jogador</Text>
            <View style={styles.presetGrid}>
              {[0.5, 1, 2, 3, 5, 10, 15, 30].map(m => (
                <TouchableOpacity key={m} style={[styles.presetBtn, m === selectedMinutes && styles.presetBtnSelected]} onPress={() => applyTime(m)}>
                  <Text style={[styles.presetBtnText, m === selectedMinutes && styles.presetBtnTextSelected]}>{m < 1 ? `${m * 60}s` : `${m}min`}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customRow}>
              <TextInput value={customMinutes} onChangeText={setCustomMinutes} keyboardType={'numeric'} placeholder={'Tempo personalizado (min)'} placeholderTextColor={palette.textMuted} style={[styles.input, { flex: 1 }]} />
              <TouchableOpacity style={styles.applyBtn} onPress={applyCustomTime}><Text style={styles.applyBtnText}>Aplicar</Text></TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Opções</Text>
            <View style={styles.toggleGrid}>
              <View style={styles.toggleItem}>
                <View><Text style={styles.toggleLabel}>Vibração</Text><Text style={styles.toggleSub}>Vibra ao trocar turno</Text></View>
                <Switch value={vibrationEnabled} onValueChange={setVibrationEnabled} trackColor={{ true: palette.neon }} thumbColor={palette.white} />
              </View>
              <View style={styles.toggleItem}>
                <View><Text style={styles.toggleLabel}>Som</Text><Text style={styles.toggleSub}>Avisos sonoros</Text></View>
                <Switch value={soundEnabled} onValueChange={setSoundEnabled} trackColor={{ true: palette.gold }} thumbColor={palette.white} />
              </View>
            </View>

            <View style={styles.controlRow}>
              <TouchableOpacity style={[styles.ctrlBtn, styles.ctrlPrimary]} onPress={handleStart}><Text style={styles.ctrlPrimaryText}>{winner ? '↻ Nova partida' : isRunning ? '▶ Retomar' : '▶ Iniciar'}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.ctrlBtn} onPress={handlePause} disabled={!isRunning}><Text style={[styles.ctrlText, !isRunning && styles.ctrlTextDisabled]}>⏸ Pausar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.ctrlBtn} onPress={resetClock}><Text style={styles.ctrlText}>↺ Reiniciar</Text></TouchableOpacity>
            </View>
          </>
        )}
      </SectionCard>

      <SectionCard icon={'📋'} title={'Histórico de partidas'} description={`${history.length} partida(s) registrada(s) neste dispositivo.`}>
        <View style={styles.historyList}>
          {history.length ? history.map(item => (
            <View key={item.id} style={styles.historyItem}>
              <Text style={styles.historyLabel}>{item.label}</Text>
              <Text style={styles.historyDetail}>{item.playerA} {formatClock(item.secondsA)} · {item.playerB} {formatClock(item.secondsB)}</Text>
              <Text style={styles.historyDate}>{new Date(item.timestamp).toLocaleDateString('pt-BR')} às {new Date(item.timestamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</Text>
            </View>
          )) : <Text style={styles.emptyText}>Nenhuma partida no relógio registrada ainda. Jogue e o histórico vai aparecer aqui.</Text>}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  clockContainer: { flexDirection: 'row', alignItems: 'stretch', gap: 0 },
  clockPanel: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 16, gap: 8 },
  clockPanelLeft: { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0.5 },
  clockPanelRight: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0.5 },
  clockPanelActive: { borderColor: palette.neon, backgroundColor: palette.neonSoft },
  clockPanelCritical: { borderColor: palette.warning, backgroundColor: 'rgba(255,176,32,0.08)' },
  clockPanelFinished: { borderColor: palette.gold, backgroundColor: 'rgba(217,180,94,0.08)' },
  clockTopSection: { gap: 4 },
  clockName: { color: palette.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  clockNameFinished: { color: palette.gold },
  criticalBadge: { backgroundColor: 'rgba(255,176,32,0.15)', borderWidth: 1, borderColor: 'rgba(255,176,32,0.4)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  criticalBadgeText: { color: palette.warning, fontSize: 10, fontWeight: '800' },
  finishedBadge: { backgroundColor: 'rgba(217,180,94,0.15)', borderWidth: 1, borderColor: 'rgba(217,180,94,0.4)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  finishedBadgeText: { color: palette.gold, fontSize: 10, fontWeight: '800' },
  clockTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  clockMinutes: { color: palette.white, fontSize: 44, fontWeight: '800', letterSpacing: 1 },
  clockSeconds: { color: palette.white, fontSize: 44, fontWeight: '800', letterSpacing: 1 },
  clockMinutesCritical: { color: palette.warning },
  clockSecondsCritical: { color: palette.warning },
  clockColon: { color: palette.white, fontSize: 40, fontWeight: '700', marginBottom: 4 },
  clockColonCritical: { color: palette.warning },
  clockHint: { color: palette.textMuted, fontSize: 11, textAlign: 'center', fontWeight: '600' },
  centerDivider: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 16, gap: 10 },
  playPauseBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  startBtn: { backgroundColor: palette.neon },
  pauseBtn: { backgroundColor: palette.gold },
  newGameBtn: { backgroundColor: palette.neon },
  playPauseIcon: { color: palette.background, fontSize: 20, fontWeight: '800' },
  turnIndicator: { color: palette.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center', maxWidth: 60 },
  sectionLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetBtn: { minWidth: 68, borderRadius: 12, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, paddingHorizontal: 10, paddingVertical: 10, alignItems: 'center' },
  presetBtnSelected: { borderColor: palette.gold, backgroundColor: 'rgba(217,180,94,0.12)' },
  presetBtnText: { color: palette.text, fontWeight: '700', fontSize: 13 },
  presetBtnTextSelected: { color: palette.gold },
  customRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: palette.text, fontSize: 15 },
  applyBtn: { backgroundColor: palette.gold, borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center' },
  applyBtnText: { color: palette.background, fontWeight: '800' },
  toggleGrid: { gap: 10, marginBottom: 16 },
  toggleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 14 },
  toggleLabel: { color: palette.text, fontWeight: '700' },
  toggleSub: { color: palette.textMuted, fontSize: 12 },
  controlRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ctrlBtn: { flexGrow: 1, minWidth: 100, borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 12 },
  ctrlPrimary: { borderColor: palette.neon, backgroundColor: palette.neon },
  ctrlText: { color: palette.text, fontWeight: '700' },
  ctrlTextDisabled: { color: palette.textMuted },
  ctrlPrimaryText: { color: palette.background, fontWeight: '800' },
  historyList: { gap: 10 },
  historyItem: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.border, padding: 14, gap: 6 },
  historyLabel: { color: palette.text, fontWeight: '800', fontSize: 15 },
  historyDetail: { color: palette.textMuted, fontSize: 13, fontFamily: 'monospace' },
  historyDate: { color: palette.textMuted, fontSize: 11, fontStyle: 'italic' },
  emptyText: { color: palette.textMuted, fontSize: 14 },
});
