// Lazy loader for react-native-agora. The Agora RTC SDK is a NATIVE module, so
// it only exists in a custom dev/EAS build - NOT in Expo Go. We require it
// defensively so that in Expo Go the require simply fails and the app falls
// back to frame-based (snapshot) proctoring instead of crashing.

let cached;
let attempted = false;

export function getAgora() {
  if (attempted) return cached;
  attempted = true;
  try {
    // eslint-disable-next-line global-require, import/no-unresolved
    cached = require('react-native-agora');
  } catch (_) {
    cached = null;
  }
  return cached;
}

export function isAgoraAvailable() {
  const a = getAgora();
  return !!(a && (a.createAgoraRtcEngine || a.default));
}

export default { getAgora, isAgoraAvailable };