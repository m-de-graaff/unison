/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // The first test in a file pays for loading react-native under jest-expo. In CI, turbo runs every
  // package's tests at once, and that load alone can pass jest's default 5 s.
  testTimeout: 30_000,
};
