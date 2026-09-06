import colors from './colors';
import { s, ms, font, screenWidth, screenHeight, isSmallDevice, isLargeDevice } from './scale';

export const spacing = {
  xs: s(4),
  sm: s(8),
  md: s(12),
  lg: s(16),
  xl: s(18),
  xxl: s(24),
  gutter: s(18), // horizontal screen padding used across the prototype
};

export const radius = {
  sm: s(11),
  md: s(14),
  lg: s(16),
  xl: s(18),
  xxl: s(22),
  pill: 999,
};

export { colors, s, ms, font, screenWidth, screenHeight, isSmallDevice, isLargeDevice };

export default { colors, spacing, radius, s, ms, font };