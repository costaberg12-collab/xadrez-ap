import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../theme/palette';

export default function SectionCard({ icon, title, description, cta, onPress, accent = 'gold', children }) {
  const accentColor = accent === 'neon' ? palette.neon : accent === 'danger' ? palette.danger : palette.gold;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.9 : 1}
      onPress={onPress}
      style={[styles.card, { borderColor: `${accentColor}55` }]}
      disabled={!onPress}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}55` }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      {children}
      {cta ? <Text style={[styles.cta, { color: accentColor }]}>{cta}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconText: {
    fontSize: 22,
  },
  textWrap: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  description: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
