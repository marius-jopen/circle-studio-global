# Prismic Migration Tools

This folder contains tools for migrating data from CSV to Prismic CMS.

## Structure

- **`functions/`** - Active migration scripts and utilities
- **`legacy/`** - Old test scripts, debug tools, and experimental code
- **`input/`** - Source data files (CSV)
- **`output/`** - Generated data files (JSON)

## Quick Start

1. **Prepare your data:**
   ```bash
   node migration/functions/csv-to-json.mjs
   ```

2. **Import people to Prismic:**
   ```bash
   node migration/functions/people-import-from-json-final.mjs [count]
   ```

3. **Check results:**
   ```bash
   node migration/functions/check-existing-documents.mjs
   ```

## Environment Setup

Create a `.env` file at the project root:

```
PRISMIC_WRITE_TOKEN=your_write_token
PRISMIC_ACCESS_TOKEN=your_access_token
```

## What to Share with Prismic Team

If you need to share this with the Prismic team, include:

- `functions/` folder (all active scripts)
- `input/` folder (sample data)
- `output/` folder (generated data)
- This README
- `.env.example` (with placeholder values)

**Do NOT share:**
- `.env` file (contains real tokens)
- `legacy/` folder (experimental code)
- `node_modules/` folder

## Migration Process

1. **Data Preparation**: CSV → JSON conversion with proper Prismic formatting
2. **Import**: Batch creation of people documents via Migration API
3. **Verification**: Check that documents were created successfully
4. **Publishing**: Manual publishing of Migration Release in Prismic dashboard

## Notes

- Documents created via Migration API are placed in a "Migration Release" in draft state
- You must manually publish the release in Prismic dashboard to make documents visible
- The Migration API is separate from the Content API and has different visibility rules