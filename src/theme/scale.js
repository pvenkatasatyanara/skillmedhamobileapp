import { Dimensions,PixelRatio } from 'react-native';

// Responsive scaling utilities.
// The prototype is designed at a 390pt wide iPhone. We scale sizes relative to
// the device's shortest dimension so the UI fits phones from ~320pt (small
// Android) up to large phones, and caps growth so it never looks oversized.
const { width, height } = Dimensions.get('window');

export const screenWidth = width;
export const screenHeight = height;

const shortDimension = Math.min(width, height);
const GUIDELINE_BASE_WIDTH = 390;

// clamp the scale factor to a sensible range
const factor = Math.min(Math.max(shortDimension / GUIDELINE_BASE_WIDTH, 0.85), 1.2);

// linear scale (spacing, sizes)
export const s = (size) => Math.round(size * factor);

// moderate scale (fonts) - scales less aggressively
export const ms = (size, resistance = 0.5) =>
  Math.round(size + (s(size) - size) * resistance);

// normalize font for pixel density crispness
export const font = (size) => {
  const scaled = ms(size, 0.5);
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

// device size buckets
export const isSmallDevice = shortDimension < 360;
export const isLargeDevice = shortDimension >= 414;

export default { s, ms, font, screenWidth, screenHeight, isSmallDevice, isLargeDevice };