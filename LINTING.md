# ESLint and Pre-commit Setup

## Installed Tools

- **ESLint**: Already configured with Next.js
- **Prettier**: Code formatter
- **Husky**: Git hooks manager
- **lint-staged**: Run linters on staged files

## Available Scripts

```bash
# Lint code
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

## Pre-commit Hook

Automatically runs on `git commit`:

- Lints and fixes TypeScript/JavaScript files
- Formats all files with Prettier
- Only runs on staged files (fast!)

## Configuration Files

- `.prettierrc.json` - Prettier settings
- `.prettierignore` - Files to ignore
- `eslint.config.mjs` - ESLint configuration
- `.husky/pre-commit` - Pre-commit hook

## Manual Run

To manually run linting on staged files:

```bash
npx lint-staged
```
