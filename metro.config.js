const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable web platform
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure web aliases for better compatibility
config.resolver.alias = {
  'react-native': 'react-native-web',
};

// Web-specific module mapping
if (process.env.EXPO_PLATFORM === 'web') {
  config.resolver.alias = {
    ...config.resolver.alias,
    'react-native-maps': require.resolve('./components/MapComponent.web.tsx'),
  };
}

// Optimize for faster builds
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    // Configure terser for better performance
    ecma: 8,
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Enable hermesEnabled for better performance
config.transformer.hermesParser = true;

// Improve resolver performance
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
