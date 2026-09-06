import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, s } from '../theme';

export default function ProgressBar({ progress = 0, track, fill, height = 8, style }) {
  const pct = Math.max(0, Math.min(100, progress));
return (
    <View
      style={[
        styles.track,
        { height: s(height), backgroundColor: track || 'rgba(255,255,255,0.25)' },
        style,
      ]}
    >
      <View
        style={[styles.fill,{ width: `${pct}%`, backgroundColor: fill || colors.white }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {borderRadius: radius.pill,overflow: 'hidden'},
  fill: {height: '100%', borderRadius: radius.pill},
});