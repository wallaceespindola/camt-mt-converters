# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

#### Backend
- Spring Boot 3.4.x application with Spring Batch, Spring Data JPA, H2 in-memory database
- Internal domain model: `BankStatement`, `BankTransaction`, `DebitCreditIndicator`, `LoadProfile` (Java records + enum)
- JPA persistence layer: `BankStatementEntity`, `BankTransactionEntity` with `@OneToMany` cascade and JPQL join-fetch query
- `StatementExportStrategy` interface + `StatementExportStrategyFactory` (auto-discovers all `@Component` strategies via Spring DI)
- **4 Prowide strategies**: MT940, MT942, camt.052, camt.053 (Prowide Core + Prowide ISO 20022)
- **4 Apache Velocity strategies**: MT940, MT942, camt.052, camt.053 with `.vm` templates
- Spring Batch pipeline: `BankStatementItemReader` → `StatementExportProcessor` → `BankingFileWriter`
- REST API: `POST /api/random-statements`, `POST /api/conversions`, `GET /api/conversions/jobs`, `GET /api/conversions/jobs/{jobId}`
- `RandomStatementService` with LOW (10 accounts · 5 stmts · 100 txns), MEDIUM (100 accounts · 50 stmts · 1 000 txns), and HIGH (1 000 accounts · 500 stmts · 10 000 txns) load profiles
- `BankStatementMapper`, `InternalStatementValidator`, `VelocityRenderer`
- 3-stage validation chain (internal model → MT re-parse → camt XSD)
- Spring Actuator `/actuator/health` (H2 + custom version indicator) and `/actuator/info`
- Swagger UI enabled in `dev` profile only via SpringDoc OpenAPI
- `GlobalExceptionHandler` returning RFC 9457 `ProblemDetail` with `timestamp`
- `VersionHealthIndicator` exposing app version via health endpoint

#### Frontend
- React 19 + MUI v6 + Recharts + Mermaid SPA with orange color scheme (`#E64A19`)
- 6 views: Dashboard · Generate Statements · Conversion Runner · History · Charts · Diagrams
- Conversion Runner: single run + Run All 8 Combinations (4 formats × Prowide + Velocity) with per-row live progress
- Charts view: avg duration by format, avg duration by engine, timeline, status breakdown
- Diagrams view: 4 Mermaid architecture diagrams rendered live in the browser
- Dark/light mode toggle persisted to `localStorage`
- Pre-built bundle committed to `src/main/resources/static/` — served by Spring Boot at runtime

#### Architecture Diagrams
- 7 diagrams × 2 formats (Mermaid `.mmd` + PlantUML `.puml`) in `docs/diagrams/`:
  architecture-overview, batch-sequence, strategy-class-diagram, conversion-flow, database-diagram, deployment-diagram, component-diagram

#### Developer Experience
- Makefile with 15 targets (build, run, run-prod, test, test-unit, test-integration, clean, kill, lint, docs, run-script, kill-script, build-frontend, dev-frontend, help)
- Cross-platform scripts: `run.sh` / `kill.sh` (macOS + Linux), `run.ps1` / `kill.ps1` (PowerShell Core 7+), `run.bat` / `kill.bat` (Windows 10+ CMD)
- GitHub Actions: build.yml, test.yml, codeql.yml, release.yml
- Dependabot for Maven and GitHub Actions (weekly)
- PR template and issue templates (bug report, feature request)
- Comprehensive `.gitignore` (IDE, OS, AI tools, build artifacts, secrets, frontend)

#### Testing
- 11 test classes, 45 tests — `mvn verify` green
- `StrategyFactoryTest` — all 8 strategies resolve by composite key
- `ProwideStrategyOutputTest` — all 4 formats produce correct output
- `VelocityStrategyOutputTest` — Velocity template rendering for all formats
- `GoldenFileTest` — structural validation of Prowide output
- `BatchJobIntegrationTest` — end-to-end Spring Batch job execution
- `BankStatementMapperTest`, `InternalStatementValidatorTest` — unit
- `RandomStatementControllerTest`, `StatementConversionControllerTest` — MockMvc
- `ActuatorTest` — health/info endpoint assertions
- `SwaggerAvailabilityTest` — Swagger accessible only in dev profile
- JaCoCo coverage check (≥40% instruction) enforced at `mvn verify`

#### Documentation
- `docs/PRD.md` — full Product Requirements Document (v1.0, 949 lines)
- `docs/architecture.md`, `docs/CONTRIBUTING.md`, `docs/CHANGELOG.md`
- Golden file examples: `docs/examples/mt940/`, `mt942/`, `camt052/`, `camt053/`
- `CLAUDE.md` with complete implementation reference

### Changed
- README: added SWIFT MT and ISO 20022 badges, improved Mermaid architecture diagram, React frontend section, cross-platform scripts section, architecture diagrams section
- `.gitignore`: expanded with AI tool files, IDE, OS, secrets, frontend build artifacts

### Removed
- Placeholder `src/main/resources/static/index.html` — replaced by full React SPA bundle
