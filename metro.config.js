const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable Watchman — macOS blocks it from accessing Downloads folder
config.watchFolders = [__dirname];
config.watcher = {
  ...config.watcher,
  watchman: {
    ...config.watcher?.watchman,
    deferStates: ['hg.update'],
  },
};

module.exports = config;
