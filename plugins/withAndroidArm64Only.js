const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Force the app module to package only arm64 native libraries.
 * Works even when some Maven deps (e.g. Agora full-sdk) ship all ABIs.
 */
function withAndroidArm64Only(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      return cfg;
    }

    let contents = cfg.modResults.contents;
    if (contents.includes('skillmedhaAbiFilters')) {
      cfg.modResults.contents = contents;
      return cfg;
    }

    contents = contents.replace(
      /defaultConfig\s*\{/,
      `defaultConfig {
        // skillmedhaAbiFilters
        ndk {
            abiFilters "arm64-v8a"
        }`
    );

    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = withAndroidArm64Only;
