# Contributing to Repo-rter

First off, thank you for considering contributing to Repo-rter! It's people like you that make open source such a great community.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs
- Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/RAKKUNN/Repo-rter/issues).
- If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements
- Open a new issue with a clear title and a detailed description of the suggested enhancement.
- Explain why this enhancement would be useful to most users.

### Pull Requests
1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Local Development Setup

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server with Tauri:
   ```bash
   npm run tauri dev
   ```

## Code Conventions
- We use **TypeScript** and **React** for the frontend, and **Rust** for the Tauri backend.
- Use 2 spaces for indentation.
- Follow the existing Neo-Brutalist UI patterns (thick borders, specific color palette, pixel-art fonts) when creating new components.
- Use meaningful variable names and add comments for complex logic.

Thank you for contributing!
