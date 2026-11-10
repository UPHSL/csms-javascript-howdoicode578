
# CSMS Developer Handbook

## Technology Stack

- Node.js 24
- npm
- JavaScript ES Modules
- Express.js 5
- EJS
- SQLite using `node:sqlite`
- Supertest for HTTP integration testing
- Node.js built-in test runner

## Requirements

Install a compatible Node.js 24 release and npm 11 or later.

Verify the installed versions:

```powershell
node --version
npm --version
git --version
```

## Installation

Clone the repository and navigate to the project directory.

Install the dependencies:

```powershell
npm ci
```

## Running the Application

Start the application:

```powershell
npm start
```

Start development mode with automatic restart:

```powershell
npm run dev
```

The application uses its configured server port. Check the startup output for the local address.

## Running Automated Tests

Run the complete test suite:

```powershell
npm test
```

Run an individual test file:

```powershell
node --test test/<test-file-name>.test.js
```

Run tests in watch mode:

```powershell
npm run test:watch
```

Tests should use isolated database files where appropriate and clean up temporary test data after execution.

## Project Organization

Follow the existing application structure:

- Routes define HTTP endpoint mappings.
- Controllers handle HTTP requests and responses.
- Services implement application and business rules.
- Repositories handle database access.
- Models represent domain entities.
- Views contain EJS templates.
- Middleware handles reusable request processing.
- Utilities provide shared supporting functions.

Avoid placing business logic directly in routes or database operations in views.

## Development Guidelines

1. Implement only requirements within the assigned ticket.
2. Preserve existing functionality and established business rules.
3. Validate user input before performing database mutations.
4. Use parameterized SQL statements.
5. Use POST or another appropriate mutation method for state-changing operations.
6. Keep GET requests read-only.
7. Maintain existing EJS output escaping.
8. Add automated tests for new behavior and regression risks.
9. Avoid unnecessary dependencies and architecture changes.
10. Run the relevant tests before committing changes.

## Database and Local Files

The application uses SQLite for persistence.

The local `data/` directory contains runtime database files and should not be committed to the repository.

Do not delete or overwrite an existing local database during routine development.

Use temporary database files for automated tests whenever appropriate.

## Git Workflow

Check the current branch and working tree:

```powershell
git branch --show-current
git status
```

Create feature branches for assigned work:

```powershell
git switch -c feature/<ticket-name>
```

Review changes before committing:

```powershell
git diff
git status
```

Use descriptive commit messages and follow the repository's established pull request workflow.

## Final Verification

Before submitting a change:

- Run the relevant automated tests.
- Run the full regression suite when required.
- Verify the application starts successfully.
- Check affected application pages and workflows.
- Confirm no local database, secret, or temporary artifact is staged.
- Review the final Git diff.