import React, { useMemo, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from './src/theme/palette';
import HomeScreen from './src/screens/HomeScreen';
import ClockScreen from './src/screens/ClockScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import StudyScreen from './src/screens/StudyScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const TABS = [
  { key: 'home', label: 'Início', icon: '♟️' },
  { key: 'clock', label: 'Relógio', icon: '⏱️' },
  { key: 'study', label: 'Estudo', icon: '📚' },
  { key: 'training', label: 'Treino', icon: '🧠' },
  { key: 'analysis', label: 'Análise', icon: '📸' },
  { key: 'profile', label: 'Perfil', icon: '🏆' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const Screen = useMemo(() => {
    switch (activeTab) {
      case 'clock': return <ClockScreen />;
      case 'analysis': return <AnalysisScreen />;
      case 'training': return <TrainingScreen />;
      case 'study': return <StudyScreen />;
      case 'profile': return <ProfileScreen />;
      case 'home': default: return <HomeScreen onNavigate={setActiveTab} />;
    }
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle='light-content' backgroundColor={palette.background} />
      <View style={styles.appShell}>
        <View style={styles.content}>{Screen}</View>
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                activeOpacity={0.85}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  appShell: { flex: 1, backgroundColor: palette.background },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 14,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tabButtonActive: { backgroundColor: palette.surfaceElevated },
  tabIcon: { fontSize: 16 },
  tabLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '600' },
  tabLabelActive: { color: palette.gold },
});
