import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../components/ScreenContainer';
import SectionCard from '../components/SectionCard';
import { palette } from '../theme/palette';

const TOTAL_ACHIEVEMENTS = 12;

function StatCard({ label, value, icon, color }) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}44` }]}>
      <Text style={[styles.statIcon, { color }]}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AchievementBadge({ label, unlocked, icon }) {
  return (
    <View style={[styles.achievementBadge, unlocked && styles.achievementUnlocked]}>
      <Text style={styles.achIcon}>{icon}</Text>
      <Text style={[styles.achLabel, unlocked && styles.achLabelUnlocked]}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const [playerName, setPlayerName] = useState('');
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0, games: 0, puzzlesSolved: 0, analysisCount: 0 });
  const [recentGames, setRecentGames] = useState([]);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const name = await AsyncStorage.getItem('playerName');
    const statData = await AsyncStorage.getItem('playerStats');
    const gameData = await AsyncStorage.getItem('recentGames');
    if (name) setPlayerName(name);
    if (statData) setStats(JSON.parse(statData));
    if (gameData) setRecentGames(JSON.parse(gameData));
  }

  async function saveName(value) {
    await AsyncStorage.setItem('playerName', value);
    setPlayerName(value);
    setIsEditingName(false);
  }

  const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;
  const achievementsUnlocked = Math.floor(stats.games / 2) + (stats.puzzlesSolved > 0 ? 1 : 0);
  const level = stats.games < 5 ? 'Iniciante' : stats.games < 20 ? 'Intermediário' : 'Avançado';
  const xp = Math.min(100, (stats.games % 10) * 10 + Math.floor(stats.puzzlesSolved * 5));

  return (
    <ScreenContainer
      eyebrow={level}
      title={playerName || 'Jogador Xadrez AP'}
      subtitle={stats.games > 0 ? `${stats.games} partidas registradas · ${winRate}% de vitória` : 'Nenhuma partida registrada ainda. Jogue no modo treino para começar.'}
    >
      <SectionCard
        icon={isEditingName ? '✏️' : '🏅'}
        title={isEditingName ? 'Editando nome...' : 'Perfil do jogador'}
        description={level}
      >
        {isEditingName ? (
          <View style={styles.nameRow}>
            <TextInput
              value={playerName}
              onChangeText={(v) => setPlayerName(v)}
              placeholder={playerName || 'Seu nome'}
              placeholderTextColor={palette.textMuted}
              style={[styles.input, { flex: 1 }]}
              autoFocus
            />
            <TouchableOpacity style={styles.saveBtn} onPress={() => saveName(playerName)}>
              <Text style={styles.saveBtnText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditingName(true)}>
            <Text style={styles.editHint}>Toque para editar seu nome</Text>
          </TouchableOpacity>
        )}
        <View style={styles.levelBar}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelText}>{level}</Text>
            <Text style={styles.xpText}>{xp}% para próximo nível</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xp}%` }]} />
          </View>
        </View>
      </SectionCard>

      <SectionCard
        icon={stats.games > 0 ? '📊' : '📈'}
        title={stats.games > 0 ? 'Estatísticas' : 'Comece a jogar'}
        description={stats.games > 0 ? 'Seu desempenho registrado ao longo das partidas.' : 'Suas estatísticas vão aparecer aqui conforme você joga.'}
      >
        <View style={styles.statsGrid}>
          <StatCard label={'Vitórias'} value={stats.wins} icon={'🏆'} color={palette.gold} />
          <StatCard label={'Derrotas'} value={stats.losses} icon={'❌'} color={palette.danger} />
          <StatCard label={'Empates'} value={stats.draws} icon={'🤝'} color={palette.textMuted} />
          <StatCard label={'Total'} value={stats.games} icon={'♟️'} color={palette.neon} />
          <StatCard label={'Puzzles'} value={stats.puzzlesSolved} icon={'🧩'} color={'#A78BFA'} />
          <StatCard label={'Análises'} value={stats.analysisCount} icon={'🔍'} color={'#60A5FA'} />
        </View>
        {stats.games > 0 && (
          <View style={styles.winRateRow}>
            <Text style={styles.winRateLabel}>Taxa de vitória</Text>
            <Text style={[styles.winRateValue, { color: winRate >= 60 ? palette.neon : winRate >= 40 ? palette.gold : palette.danger }]}>{winRate}%</Text>
          </View>
        )}
      </SectionCard>

      <SectionCard
        icon={stats.games >= 2 ? '🎖️' : '🔒'}
        title={stats.games >= 2 ? 'Conquistas' : 'Conquistas trancadas'}
        description={`${achievementsUnlocked} de ${TOTAL_ACHIEVEMENTS} conquistas desbloqueadas`}
      >
        <View style={styles.achieveGrid}>
          <AchievementBadge unlocked={stats.games >= 1} icon={'🎯'} label={'Primeira partida'} />
          <AchievementBadge unlocked={stats.games >= 5} icon={'🔥'} label={'5 partidas'} />
          <AchievementBadge unlocked={stats.games >= 10} icon={'⚡'} label={'10 partidas'} />
          <AchievementBadge unlocked={stats.wins >= 1} icon={'🏆'} label={'Primeira vitória'} />
          <AchievementBadge unlocked={stats.wins >= 5} icon={'👑'} label={'5 vitórias'} />
          <AchievementBadge unlocked={stats.puzzlesSolved >= 1} icon={'🧩'} label={'Puzzle resolvido'} />
          <AchievementBadge unlocked={stats.analysisCount >= 1} icon={'🔍'} label={'Primeira análise'} />
          <AchievementBadge unlocked={stats.games >= 20} icon={'⚡'} label={'20 partidas'} />
        </View>
      </SectionCard>

      {recentGames.length > 0 && (
        <SectionCard
          icon={'🕹️'}
          title={'Partidas recentes'}
          description={`${recentGames.length} partida(s) nesta sessão.`}
        >
          <View style={styles.gameList}>
            {recentGames.slice(0, 5).map((g, i) => (
              <View key={`g${i}`} style={styles.gameItem}>
                <Text style={[styles.gameResult, g.result === 'win' && styles.gameWin, g.result === 'loss' && styles.gameLoss]}>{g.result === 'win' ? '🏆 Vitória' : g.result === 'loss' ? '❌ Derrota' : '🤝 Empate'}</Text>
                <Text style={styles.gameDetail}>{g.opponent ? `vs ${g.opponent}` : g.mode} • {new Date(g.timestamp).toLocaleDateString('pt-BR')}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      <SectionCard
        icon={'🚧'}
        title={'Próximos recursos'}
        description={'Ranking global, conquistas expandidas, login social, partidas online e muito mais.'}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  nameRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, color: palette.text, fontSize: 15 },
  saveBtn: { backgroundColor: palette.neon, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  saveBtnText: { color: palette.background, fontWeight: '800' },
  editHint: { color: palette.textMuted, fontSize: 13 },
  levelBar: { gap: 8 },
  levelInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  levelText: { color: palette.gold, fontWeight: '800', fontSize: 15 },
  xpText: { color: palette.textMuted, fontSize: 13 },
  xpBar: { height: 8, backgroundColor: palette.surface, borderRadius: 999, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: palette.neon, borderRadius: 999 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, padding: 14, gap: 6 },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { color: palette.textMuted, fontWeight: '700', fontSize: 13 },
  winRateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.border, padding: 14 },
  winRateLabel: { color: palette.text, fontWeight: '700' },
  winRateValue: { fontSize: 20, fontWeight: '800' },
  achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achievementBadge: { borderRadius: 999, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  achievementUnlocked: { borderColor: palette.gold, backgroundColor: 'rgba(217,180,94,0.12)' },
  achIcon: { fontSize: 16 },
  achLabel: { color: palette.textMuted, fontSize: 13, fontWeight: '600' },
  achLabelUnlocked: { color: palette.gold },
  gameList: { gap: 10 },
  gameItem: { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.border, padding: 14, gap: 6 },
  gameResult: { fontWeight: '800', fontSize: 15 },
  gameWin: { color: palette.neon },
  gameLoss: { color: palette.danger },
  gameDetail: { color: palette.textMuted, fontSize: 13 },
});
