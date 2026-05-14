# Contributing

## Development Setup

1. Java 21+, Maven 3.9+
2. Clone the repository
3. Run `mvn clean package -DskipTests` to verify the build

## Branching Strategy

- `main` — stable, CI must pass
- `feature/<name>` — new features
- `fix/<name>` — bug fixes

## Pull Request Process

1. Create a branch from `main`
2. Implement changes with tests
3. Run `mvn verify` — all tests must pass
4. Open a PR using the PR template

## Adding a New Conversion Strategy

1. Implement `StatementExportStrategy` in the appropriate package:
   - Prowide: `conversion/strategy/prowide/`
   - Velocity: `conversion/strategy/velocity/`
   - Jakarta XML Binding: `conversion/strategy/jakartaxb/`
2. Annotate with `@Component` — the factory auto-discovers it
3. Return correct `targetFormat()` and `engine()` values
4. Add unit test in the corresponding test package
5. Add golden file in `docs/examples/<format>/`

## Code Style

- Max line length: 120 characters
- Constructor injection (no @Autowired)
- Java Records for DTOs and domain objects
- Lombok for JPA entity boilerplate
