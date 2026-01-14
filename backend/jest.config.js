module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Limit Jest to the backend source folder
  roots: ["<rootDir>/src"],
  // Separate unit, integration and e2e tests by naming/paths
  testMatch: [
    "**/tests/unit/**/*.test.ts",
    "**/tests/integration/**/*.test.ts",
    "**/tests/e2e/**/*.test.ts",
    // Backwards compatible with existing tests
    "**/?(*.)+(spec|test).ts",
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/tests/**",
    "!src/server.ts",
    "!src/config/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 20000,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Handle ESM modules like uuid
  transformIgnorePatterns: [],
};
