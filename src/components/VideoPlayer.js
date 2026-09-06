import React from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

function VideoPlayerInner({ uri, style, autoPlay = false }) {
  const source = encodeURI(uri);

  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 1;
    if (autoPlay) p.play();
  });

  return (
    <VideoView
      style={[styles.video, style]}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
      contentFit="contain"
      nativeControls
    />
  );
}

/**
 * Wraps expo-video. Renders native playback controls (play/pause, scrubber,
 * fullscreen). Pass a direct media URL via `uri`. Remounts when the uri changes.
 */
export default function VideoPlayer({ uri, style, autoPlay = false }) {
  if (!uri) return null;

  return <VideoPlayerInner key={uri} uri={uri} style={style} autoPlay={autoPlay} />;
}

const styles = StyleSheet.create({
  video: { width: '100%', backgroundColor: '#000' },
});
