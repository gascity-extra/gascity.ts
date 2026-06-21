# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial monorepo structure with three packages
- Type-safe API client generated from OpenAPI specification
- High-level SDK workflows for city, task, session, and agent management
- Modern Console UI built with TanStack Start
- Development container with all necessary tools
- CI/CD pipeline with GitHub Actions
- Automated code quality checks (SonarCloud, CodeRabbit, Qodo)
- Git hooks for commit message validation

### Security
- Input validation for all user inputs
- Environment variable validation
- Production safeguards (PTY endpoint disabled in production)
- Pinned GitHub Actions to commit SHAs
- Least-privilege permissions in CI/CD workflows
- Cryptographically secure random number generation for correlation IDs

### Fixed
- Uninitialized variables in retry, task, and session workflows
- Hardcoded CSRF tokens
- Conflicting authentication in release workflow
- SonarCloud code quality findings (49 issues resolved)
- CodeRabbit and Qodo review comments (35 comments addressed)

### Changed
- Improved error handling with proper logging
- Refactored unreachable code
- Replaced global with globalThis for better compatibility
- Consolidated duplicate imports
- Improved devcontainer installation scripts
- Enhanced release workflow to handle scoped packages

## [1.0.0] - 2026-06-21

### Added
- Initial release of gascity.ts
- Complete migration to monorepo structure
- @gascity/client package
- @gascity/sdk package
- @gascity/console package
