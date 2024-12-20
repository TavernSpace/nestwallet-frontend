const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidAllowBackup = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];
    application.$['android:allowBackup'] = 'false';
    return config;
  });
};

module.exports = withAndroidAllowBackup;
