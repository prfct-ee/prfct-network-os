module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(ts|tsx)?$": "ts-jest",
  },
  testEnvironment: "jsdom",
  globals: {},
  setupFiles: ["fake-indexeddb/auto"],
};
