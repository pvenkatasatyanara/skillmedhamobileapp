const appJson = require('./app.json');
const withAndroidArm64Only = require('./plugins/withAndroidArm64Only');

module.exports = () => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const slimApk = profile === 'preview' || profile === 'development';

  const plugins = appJson.expo.plugins.filter((p) => p !== 'expo-build-properties');

  if (slimApk) {
    plugins.push([
      'expo-build-properties',
      {
        android: {
          buildArchs: ['arm64-v8a'],
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ]);
    plugins.push(withAndroidArm64Only);
  } else {
    plugins.push(['expo-build-properties', {}]);
  }

  return {
    expo: {
      ...appJson.expo,
      plugins,
    },
  };
};
