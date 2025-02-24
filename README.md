# Changelog Patcher

## What This Is For?

This tool is designed to automate the process of updating your project’s changelog. It reads the CHANGELOG.md file and moves the content from the Unreleased section into a new release section, based on the version number defined in your package.json. The script performs several checks to prevent version conflicts, ensuring that the new version is higher than the most recent release and that the version doesn’t already exist in the changelog. It also resets the Unreleased section so that it’s ready for new changes.

## Usage (CLI)

### Ensure your project structure includes:
- A package.json file with a valid version field.
- A CHANGELOG.md file formatted with an Unreleased section and pre-defined category blocks (e.g., Added, 
Changed, Deprecated, etc.).

### Run the script:

Execute the following command in your project’s root directory:
```node patchChangelog.js```

This will:
- Read the current changelog.
- Verify and update the version based on your package.json.
- Create a new release section with today’s date.
- Reset the Unreleased section for future changes.

### Output:
Upon successful execution, the script prints a message confirming the changelog update with the new version number.

## Usage (package.json)

Using npm Scripts:
You can also set up an npm script to run the changelog patcher easily. Add the following entry in the scripts section of your package.json:
```{
  "scripts": {
    "patch-changelog": "changelog-updater"
  }
}
```

## Test

The project includes automated tests to ensure that the changelog update works as expected and to catch version conflicts. The tests verify:
- Correct Update: That unreleased content is moved to a new release section with the correct header and date.
- Version Conflict Detection: That the script throws an error when the provided package version is already present or lower than the latest version in the changelog.

### Running the Tests

Assuming you have Node.js installed, you can run the tests using:

```
npm run test
```