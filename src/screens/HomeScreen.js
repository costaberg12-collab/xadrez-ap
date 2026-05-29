import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../components/ScreenContainer';
import SectionCard from '../components/SectionCard';
import { palette } from '../theme/palette';

const quickActions = [
  { key: 'clock', label: 'Abrir relógio' },
  { key: 'analysis', label: 'Analisar tabuleiro' },
  { key: 'training', label: 'Treino vs máquina' },
];

function GameStatusCard({ stats }) {
  if (!stats || stats.games === 0) return null;
  const winRate = Math.round((stats.wins / stats.games) * 100);
  return (
    <View style={styles.statusBar}>
      <View style={styles.statusItem}>
        <Text style={styles.statusNum}>{stats.games}</Text>
        <Text style={styles.statusLabel}>Partidas</Text>
      </View>
      <View style={styles.statusDivider} />
      <View style={styles.statusItem}>
        <Text style={[styles.statusNum, { color: palette.neon }]}>{winRate}%</Text>
        <Text style={styles.statusLabel}>Vitórias</Text>
      </View>
      <View style={styles.statusDivider} />
      <View style={styles.statusItem}>
        <Text style={[styles.statusNum, { color: palette.gold }]}>{stats.wins}</Text>
        <Text style={styles.statusLabel}>Vitórias</Text>
      </View>
    </View>
  );
}

export default function HomeScreen({ onNavigate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('playerStats').then((data) => {
      if (data) setStats(JSON.parse(data));
    });
  }, []);

  return (
    <ScreenContainer
      eyebrow={`Xadrez AP · v1.0 MVP`}
      title={`Hub competitivo de xadrez`}
      subtitle={`${stats ? stats.games + ' partidas · ' + Math.round((stats.wins / stats.games) * 100) + '% vitória' : 'MVP funcional com relógio, treino e análise.'}`}
    >
      <View style={styles.hero}>
        <Text style={styles.heroBadge}>🟢 Funcional</Text>
        <Text style={styles.heroTitle}>Aplicativo operacional com 4 módulos principais</Text>
        <Text style={styles.heroText}>
          Relógio profissional · Tabuleiro jogável vs máquina · Análise de posições · Perfil e conquistas
        </Text>
        <View style={styles.actionRow}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.key} style={styles.actionPill} onPress={() => onNavigate(action.key)}>
              <Text style={styles.actionPillText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {stats && <GameStatusCard stats={stats} />}

      <SectionCard
        icon={stats && stats.games > 0 ? '⏱️' : '⏱️'}
        title={stats && stats.games > 0 ? 'Relógio de xadrez' : 'Relógio profissional'}
        description={stats && stats.games > 0 ? `${stats.wins} vitória(s) no relógio` : 'Modo jogável com nomes customizados, presets de tempo, alternância de turno e alertas.'}
        cta={`${stats && stats.games > 0 ? stats.wins : 0} partidas no relógio`}
        onPress={() => onNavigate('clock')}
      />

      <SectionCard
        icon={stats && stats.games > 0 ? '♟️' : '♟️'}
        title={stats && stats.games > 0 ? 'Treino vs máquina' : 'Tabuleiro 2D jogável'}
        description={stats && stats.games > 0 ? `${stats.games} partida(s) contra a máquina` : 'Jogue contra IA com níveis Iniciante, Intermediário e Profissional + estilos de grandes mestres.'}
        accent={stats && stats.games > 0 ? 'gold' : 'neon'}
        cta={`${stats && stats.games > 0 ? stats.games : 0} jogos`}
        onPress={() => onNavigate('training')}
      />

      <SectionCard
        icon={stats && stats.analysisCount > 0 ? '🔍' : '📸'}
        title={stats && stats.analysisCount > 0 ? 'Análise de tabuleiro' : 'Análise por câmera + IA'}
        description={stats && stats.analysisCount > 0 ? `${stats.analysisCount} posição(ões) analisada(s)` : 'Captura foto, importa da galeria, analisa posição e explica lances em linguagem simples.'}
        accent={stats && stats.analysisCount > 0 ? 'gold' : 'neon'}
        cta={`${stats && stats.analysisCount > 0 ? stats.analysisCount : 0} análises`}
        onPress={() => onNavigate('analysis')}
      />

      <SectionCard
        icon={stats && stats.games > 0 ? '🏆' : '🏅'}
        title={stats && stats.games > 0 ? 'Perfil do jogador' : 'Conquistas e estatísticas'}
        description={stats && stats.games > 0 ? `Vitórias: ${stats.wins} · Derrotas: ${stats.losses}` : 'Nome, nível, estatísticas, conquistas e partidas recentes.'}
        cta={`${stats && stats.games > 0 ? stats.wins + stats.losses + stats.draws : 0} conquistas`}
        onPress={() => onNavigate('profile')}
      />

      <View style={styles.roadmapSection}>
        <Text style={styles.roadmapTitle}>📋 Próximas evoluções</Text>
        <View style={styles.roadmapList}>
          {['Tabuleiro 3D animado', 'Stockfish como IA forte', 'Puzzles de xadrez', 'Ranking online', 'Partidas multiplayer', 'Abertura ensinada'].map((item, i) => (
            <View key={i} style={styles.roadmapItem}>
              <Text style={styles.roadmapDot}>○</Text>
              <Text style={styles.roadmapText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.surfaceElevated, borderWidth: 1, borderColor: palette.border, borderRadius: 28, padding: 20, gap: 14 },
  heroBadge: { alignSelf: 'flex-start', color: palette.neon, backgroundColor: palette.neonSoft, borderWidth: 1, borderColor: 'rgba(40,240,161,0.30)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, fontSize: 12, fontWeight: '700' },
  heroTitle: { color: palette.white, fontSize: 22, lineHeight: 28, fontWeight: '800' },
  heroText: { color: palette.textMuted, fontSize: 14, lineHeight: 20 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionPill: { backgroundColor: palette.neonSoft, borderWidth: 1, borderColor: 'rgba(40,240,161,0.28)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  actionPillText: { color: palette.neon, fontWeight: '700', fontSize: 13 },
  statusBar: { flexDirection: 'row', backgroundColor: palette.surface, borderRadius: 20, borderWidth: 1, borderColor: palette.border, padding: 16, justifyContent: 'space-around' },
  statusItem: { alignItems: 'center', gap: 4 },
  statusNum: { color: palette.white, fontSize: 20, fontWeight: '800' },
  statusLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  statusDivider: { width: 1, backgroundColor: palette.border },
  roadmapSection: { backgroundColor: palette.surface, borderRadius: 24, borderWidth: 1, borderColor: palette.border, padding: 18, gap: 14 },
  roadmapTitle: { color: palette.text, fontSize: 15, fontWeight: '800' },
  roadmapList: { gap: 10 },
  roadmapItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roadmapDot: { color: palette.textMuted, fontSize: 14 },
  roadmapText: { color: palette.textMuted, fontSize: 14 },
});
