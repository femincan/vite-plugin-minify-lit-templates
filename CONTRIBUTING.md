# Contributing to vite-plugin-minify-lit-templates

Thank you for your interest in contributing to **vite-plugin-minify-lit-templates**! Your help is greatly appreciated. Please follow the guidelines below to help us keep the project healthy and consistent.

---

## Requirements

- The project uses [Bun](https://bun.com/) for development, testing, and running scripts. Please ensure Bun is installed on your machine to work correctly.

---

## How to Contribute

1. **Fork the repository** and clone your fork locally.

2. **Install the dependencies** with bun:

   ```bash
   bun install
   ```

3. **Create a new branch** for your feature or fix:

   ```bash
   git switch -c feat/my-feature
   ```

4. **Make your changes** and **add tests** if possible.

5. **Run lint and tests** to verify your changes:

   ```bash
   bun run lint
   bun test
   ```

6. **Commit your changes** with a clear and descriptive message in [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) format:

   ```bash
   git commit -m "feat: add option to preserve whitespace in <pre> tags"
   ```

7. **Push your branch** to your fork:

   ```bash
   git push origin feat/my-feature
   ```

8. **Submit a pull request** from your branch to the `main` branch of the original repository.

---

## Guidelines

- **Keep pull requests focused:** Each PR should address a single concern or feature.
- **Write clear commit messages:** Explain why the change is needed — use the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) format for commit messages.
- **Add or update documentation:** If your change affects usage or APIs, update the appropriate documentation.
- **Add tests:** Cover new features or bug fixes with tests whenever possible. Each feature or bug fix should have corresponding tests for better maintainability.
- **Be respectful and constructive:** Be kind to others and aim for positive, helpful collaboration in code reviews and discussions.

---

## Automated Checks

- The CI checks will run on each pull request to verify code style, linting, and tests. Please make sure all checks pass before requesting a review.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).  

---

Thank you for helping improve `vite-plugin-minify-lit-templates`!
