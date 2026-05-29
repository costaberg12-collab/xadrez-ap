import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';

export default function ScreenContainer({ eyebrow, title, subtitle, children, scroll = true }) {
  const Wrapper = scroll ? ScrollView : View;
  return (
    <Wrapper
      style={styles.wrapper}
      contentContainerStyle={scroll ? styles.contentContainer : undefined}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.content}>{children}</View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: palette.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  eyebrow: {
    color: palette.neon,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: {
    color: palette.white,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  content: {
    gap: 14,
  },
});
