const appJson = require('./app.json');

module.exports = () => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const slimApk = profile === 'preview' || profile === 'development';

  const plugins = appJson.expo.plugins.filter((p) => p !== 'expo-build-properties');
  plugins.push([
    'expo-build-properties',
    {
      android: slimApk ? { abiFilters: ['arm64-v8a'] } : {},
    },
  ]);

  return {
    expo: {
      ...appJson.expo,
      plugins,
    },
  };
};
