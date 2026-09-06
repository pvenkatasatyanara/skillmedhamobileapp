import React, { useState } from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { thumbColor } from '../utils/format';

/**
 * Course/media thumbnail: shows a remote image when available, otherwise a
 * deterministic gradient placeholder. Falls back to the gradient on load error.
 */
export default function Thumb({ uri, seed = 0, style, children }) {
  const [failed, setFailed] = useState(false);
  const [c1, c2] = thumbColor(seed);

  if (uri && !failed) {
    return (
      <ImageBackground
        source={{ uri }}
        style={[styles.base, style]}
        resizeMode="cover"
        onError={() => setFailed(true)}
      >
        {children}
      </ImageBackground>
    );
  }

  return (
    <LinearGradient
      colors={[c1, c2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});