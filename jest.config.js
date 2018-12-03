module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '~/(.*)': '<rootDir>/src/$1',
  },
  testMatch: ['**/*.spec.(ts|tsx)'],
  collectCoverage: false,
};
