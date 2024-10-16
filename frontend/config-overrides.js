const webpack = require("webpack");

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    path: false,
    crypto: false,
  });
  config.resolve.fallback = fallback;
  return config;
};
