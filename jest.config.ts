const { compilerOptions } = require("./tsconfig");
const { pathsToModuleNameMapper } = require("ts-jest");

module.exports = {
  preset: "ts-jest",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testPathIgnorePatterns: ["/node_modules/"],
  clearMocks: true,
  coveragePathIgnorePatterns: ["index.ts", "/node_modules/"],
  testEnvironment: "node",
  rootDir: ".",
  transform: {
    "\\.(ts)$": "ts-jest",
  },
  transformIgnorePatterns: ["node_modules"],
  moduleDirectories: ["node_modules", "src"],
  roots: ["<rootDir>"],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(
    compilerOptions.paths /*, { prefix: '<rootDir>/' } */
  ),
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};
