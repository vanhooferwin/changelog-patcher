#!/usr/bin/env node
/**
 * patchChangelog.js
 *
 * This script:
 *  - Reads CHANGELOG.md.
 *  - Finds the "Unreleased" section.
 *  - Extracts content for each category (Added, Changed, etc.).
 *  - Retrieves the version number from package.json.
 *  - Checks if that version already exists in the changelog (to prevent a version conflict).
 *  - Creates a new release section with today’s date and moves the unreleased content over.
 *  - Resets the Unreleased section (leaving empty category blocks).
 *  - Writes the updated file back.
 *
 * Usage: node patchChangelog.js
 */

const fs = require('fs');
const path = require('path');

function getFirstVersionHeader(changelogContent) {
  const versionRegex = /^##\s*\[(?:V)?(\d+\.\d+\.\d+)\]\s*-\s*\d{4}-\d{2}-\d{2}/m;
  const match = changelogContent.match(versionRegex);
  return match ? match[1] : null;
}

function isHigherVersion(version, currentVersion) {
  // Split the version strings into arrays of numbers.
  const versionParts = version.split('.').map(Number);
  const currentParts = currentVersion.split('.').map(Number);

  // Determine the longest length between the two version arrays.
  const maxLength = Math.max(versionParts.length, currentParts.length);

  // Compare each part: major, minor, patch, etc.
  for (let i = 0; i < maxLength; i++) {
    // If a part is missing, treat it as 0.
    const v = versionParts[i] || 0;
    const c = currentParts[i] || 0;

    if (v > c) return true;
    if (v < c) return false;
  }

  // Versions are equal.
  return false;
}

// Core function that processes the changelog content.
// Throws an error if a version conflict is found or if the "Unreleased" section is missing.
function processChangelog(changelogContent, packageVersion, currentDateStr) {
  // The new version string in the changelog should be prefixed with "V"
  const newVersion = 'V' + packageVersion;

  const currentVersion = getFirstVersionHeader(changelogContent);

  if (currentVersion && currentVersion === newVersion) {
    throw new Error(`Version conflict: ${newVersion} is already in CHANGELOG.md`);
  }

  if (currentVersion && !isHigherVersion(packageVersion, currentVersion)) {
    throw new Error(`Version conflict: ${newVersion} is not higher than ${currentVersion}`);
  }

  // Capture the "Unreleased" section: everything from "## [Unreleased]" until the next top-level header.
  const unreleasedRegex = /(## \[Unreleased\]\n([\s\S]*?))(?=^## )/m;
  const unreleasedMatch = changelogContent.match(unreleasedRegex);
  if (!unreleasedMatch) {
    throw new Error('Could not find "Unreleased" section in CHANGELOG.md');
  }
  const unreleasedBlock = unreleasedMatch[1];

  // Define the categories (order matters)
  const categories = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];

  // Parse unreleased content by splitting into lines and then accumulating text for each category.
  const categoryContent = {};
  categories.forEach(category => {
    categoryContent[category] = '';
  });
  let currentCategory = null;
  const unreleasedLines = unreleasedBlock.split('\n');
  for (const line of unreleasedLines) {
    // Check if the line is a category header (e.g., "### Added")
    const headerMatch = line.match(/^###\s*(\w+)/);
    if (headerMatch && categories.includes(headerMatch[1])) {
      currentCategory = headerMatch[1];
      continue;
    }
    // If we are within a category, accumulate the line.
    if (currentCategory) {
      categoryContent[currentCategory] += line + '\n';
    }
  }
  // Trim each category's content.
  Object.keys(categoryContent).forEach(key => {
    categoryContent[key] = categoryContent[key].trim();
  });

  // Use the provided currentDateStr or generate today's date in YYYY-MM-DD format.
  let dateStr = currentDateStr;
  if (!dateStr) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateStr = `${yyyy}-${mm}-${dd}`;
  }

  // Build the new release section.
  let newReleaseSection = `## [${newVersion}] - ${dateStr}\n\n`;
  categories.forEach(category => {
    const bullets = categoryContent[category];
    if (bullets) {
      newReleaseSection += `### ${category}\n\n${bullets}\n\n`;
    }
  });

  // Rebuild the "Unreleased" section as empty (ready for new entries)
  let newUnreleasedSection = '## [Unreleased]\n\n';
  categories.forEach(category => {
    newUnreleasedSection += `### ${category}\n\n`;
  });

  // Rebuild the changelog.
  const updatedContent =
    changelogContent.slice(0, unreleasedMatch.index) +
    newUnreleasedSection +
    "\n" +
    newReleaseSection +
    changelogContent.slice(unreleasedMatch.index + unreleasedBlock.length);

  return updatedContent;
}

// If the script is run directly, perform the file read/process/write.
if (require.main === module) {
  // Retrieve the version from package.json
  const projectRoot = process.cwd();
  const packageJsonPath = path.resolve(projectRoot, 'package.json');
  let packageJson;
  try {
    packageJson = require(packageJsonPath);
  } catch (err) {
    console.error('Error reading package.json:', err);
    process.exit(1);
  }
  const packageVersion = packageJson.version;

  // Path to your changelog file
  const changelogPath = path.resolve(projectRoot, 'CHANGELOG.md');

  // Read the changelog file
  let changelogContent;
  try {
    changelogContent = fs.readFileSync(changelogPath, 'utf8');
  } catch (err) {
    console.error('Error reading CHANGELOG.md:', err);
    process.exit(1);
  }

  // Process the changelog content
  let updatedContent;
  try {
    updatedContent = processChangelog(changelogContent, packageVersion);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  // Write the updated content back to the file.
  try {
    fs.writeFileSync(changelogPath, updatedContent, 'utf8');
    console.log(`Changelog updated successfully. New version: V${packageVersion}`);
  } catch (err) {
    console.error('Error writing updated CHANGELOG.md:', err);
    process.exit(1);
  }
}

// Export the processChangelog function.
module.exports = { processChangelog };