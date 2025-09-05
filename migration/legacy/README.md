# Legacy Migration Scripts

This folder contains old test scripts, debug tools, and experimental code that were used during development but are no longer needed for the actual migration.

## Contents

- **Test scripts** (`test-*.mjs`) - Various experimental approaches
- **Debug scripts** (`debug-*.mjs`) - Troubleshooting tools
- **Old import scripts** (`people-import*.mjs`) - Previous attempts
- **Check scripts** (`check-*.mjs`) - Diagnostic tools (moved to functions)
- **Credits import** (`credits-import.mjs`) - Unrelated functionality

## Why These Are Here

These scripts were created during the development process to:
- Test different API approaches
- Debug authentication issues
- Experiment with data formats
- Troubleshoot visibility problems
- Try alternative solutions

## Current Status

All of these scripts are **deprecated** and should not be used. The working solution is in the `functions/` folder.

## If You Need Them

If you need to reference any of these scripts for debugging or understanding the development process, they're preserved here. However, the `functions/` folder contains the final, working solution.

## Cleanup

This folder can be safely deleted once you're confident the migration is working properly, or archived separately from the main migration tools.
