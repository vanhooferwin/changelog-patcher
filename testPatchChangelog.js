const assert = require('assert');
const { processChangelog } = require('./patchChangelog.js');

// A sample changelog content with an "Unreleased" section and some released versions.
const sampleChangelog = `
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- add new user feature

### Changed
- change rendering egine

### Deprecated

### Removed

### Fixed

### Security

## [V1.0.1] - 2024-02-14

### Fixed
- fix login bug
`;

// Test 1: Check that the unreleased content is moved and the Unreleased block is reset.
(function testUpdateChangelog() {
  // For testing, supply a fixed date.
  const fixedDate = '2025-02-19';
  const packageVersion = '1.0.2';
  const updated = processChangelog(sampleChangelog, packageVersion, fixedDate);

  // Check that the new version header is in place.
  assert(
    updated.includes(`## [V1.0.2] - ${fixedDate}`),
    'New release header should be present with correct version and date.'
  );

  // Check that the unreleased bullet from "Added" has been moved.
  assert(
    updated.includes('- add new user feature'),
    'Added bullet from unreleased section should be moved to new release section.'
  );

  // Check that the "Unreleased" section is reset (i.e. contains only empty categories).
  const unreleasedSectionExpected = `## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security
`;
  assert(
    updated.includes(unreleasedSectionExpected.trim()),
    'Unreleased section should be reset with empty category blocks.'
  );

  // Also ensure that the previous release is still intact.
  assert(
    updated.includes('## [V1.0.1] - 2024-02-14'),
    'Existing release headers should remain intact.'
  );

  console.log('Test 1 passed: Unreleased content is moved correctly.');
})();

// Test 2: Check for version conflict.
(function testVersionConflict() {
  // Create a changelog that already includes the version from package.json.
  const conflictChangelog = `
# Changelog

## [Unreleased]

### Added
- MP-1235 - added new user feature

## [V2.5.12] - 2025-02-19

### Fixed
- MP-9999 - some fix
`;
  const packageVersion = '2.5.12'; // Same as the version already present.
  try {
    processChangelog(conflictChangelog, packageVersion, '2025-02-19');
    // If no error is thrown, the test fails.
    assert.fail('Expected a version conflict error.');
  } catch (err) {
    assert(
      err.message.includes('Version conflict'),
      'Error message should indicate a version conflict.'
    );
  }
  console.log('Test 2 passed: Version conflict is detected correctly.');
})();

// Test 3: Check for version conflict when package version is lower than the version in the changelog.
(function testLowerVersionConflict() {
  // Create a changelog that already includes a higher version than the package version.
  const conflictChangelog = `
# Changelog

## [Unreleased]

### Added
- new experimental feature

## [V1.2.0] - 2025-02-18

### Fixed
- resolved issue with login
`;
  const packageVersion = '1.1.9'; // Lower than 1.2.0
  try {
    processChangelog(conflictChangelog, packageVersion, '2025-02-19');
    // If no error is thrown, the test should fail.
    assert.fail('Expected a version conflict error due to lower version.');
  } catch (err) {
    assert(
      err.message.includes('Version conflict'),
      'Error message should indicate a version conflict when version is lower than the existing version.'
    );
  }
  console.log('Test 3 passed: Lower version conflict is detected correctly.');
})();