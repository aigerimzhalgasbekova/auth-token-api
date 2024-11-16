
// eslint-disable-next-line no-undef
module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: "coverage",
    collectCoverageFrom: ["**/*.ts"],
    testMatch: [
      "**/tests/**/*.test.(ts|js)"
    ],
    coveragePathIgnorePatterns: [
      "jest.config.js",
      "/node_modules/",
      "/tests/",
      "/lib/",
    ],
    // setupFiles: ["./tests/jest/setEnvVars.js"],
};