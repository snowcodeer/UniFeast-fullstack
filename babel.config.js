module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-class-static-block',
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
      // Add ES module transformation to handle react-native-config and other ES modules
      ['@babel/plugin-transform-modules-commonjs', {
        allowTopLevelThis: true,
        lazy: true,
        strictMode: false
      }],
      // Add runtime transformation for better ES module compatibility
      ['@babel/plugin-transform-runtime', {
        absoluteRuntime: false,
        corejs: false,
        helpers: true,
        regenerator: true,
        useESModules: false
      }]
    ],
    env: {
      production: {
        plugins: [
          // Remove console.log in production
          ['transform-remove-console', { exclude: ['error', 'warn'] }]
        ]
      }
    }
  };
};