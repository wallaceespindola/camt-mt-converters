# Banking Statement Converter Platform

## Product Requirements Document

| Field | Value |
|---|---|
| **Version** | 1.0 |
| **Status** | Ready for Implementation |
| **Language** | English |
| **Author** | Wallace Espindola |
| **Email** | wallace.espindola@gmail.com |
| **LinkedIn** | https://www.linkedin.com/in/wallaceespindola |
| **GitHub** | https://github.com/wallaceespindola/ |
| **Date** | 2026-05-14 |

---

## Table of Contents

**Part I: Context**
1. [Executive Summary](#1-executive-summary)
2. [Business Goals](#2-business-goals)
3. [Banking Domain](#3-banking-domain)
4. [Technical Stack](#4-technical-stack)
5. [Supported Conversion Engines](#5-supported-conversion-engines)

**Part II: Functional Requirements**
6. [Domain Data Management](#6-domain-data-management)
7. [File Generation and Batch Processing](#7-file-generation-and-batch-processing)
8. [REST API](#8-rest-api)
9. [Frontend](#9-frontend)
10. [Actuator and Monitoring](#10-actuator-and-monitoring)

**Part III: Architecture**
11. [System Architecture](#11-system-architecture)
12. [Strategy Pattern Design](#12-strategy-pattern-design)

**Part IV: Non-Functional Requirements**
13. [Performance](#13-performance)
14. [Security](#14-security)
15. [Coding Standards](#15-coding-standards)

**Part V: Testing**
16. [Test Strategy](#16-test-strategy)

**Part VI: Developer Experience and Operations**
17. [Repository Structure](#17-repository-structure)
18. [Developer Experience](#18-developer-experience)
19. [CI/CD Requirements](#19-cicd-requirements)
20. [GitHub Standards](#20-github-standards)
21. [Gitignore Requirements](#21-gitignore-requirements)
22. [CLAUDE.md Maintenance](#22-claudemd-maintenance)

**Part VII: Documentation and Artifacts**
23. [Documentation Requirements](#23-documentation-requirements)
24. [Diagram Requirements](#24-diagram-requirements)
25. [Example Banking Files](#25-example-banking-files)

**Part VIII: Delivery**
26. [Acceptance Criteria](#26-acceptance-criteria)
27. [Conclusion](#27-conclusion)

---

# Part I: Context

---

## 1. Executive Summary

This platform is an enterprise-grade banking statement conversion environment built with Java 21 and Spring technologies. It generates internal banking domain data, persists it to an H2 in-memory database, and converts it to industry-standard banking file formats — MT940, MT942, camt.052, and camt.053 — using three distinct conversion engines orchestrated through Spring Batch and the Strategy Pattern.

The platform serves as a technical laboratory for producing and validating banking statement files conforming to SWIFT MT and ISO 20022 camt standards. Engineers can generate realistic banking domain data, trigger batch conversion jobs via REST, preview generated files, and compare engine outputs side-by-side — all from a single-page frontend.

The secondary purpose is to serve as a reference implementation demonstrating enterprise Spring Batch architecture, restartable jobs, the Strategy Pattern applied to multi-format file generation, and operational observability via Spring Actuator.

---

## 2. Business Goals

The platform shall:

- Generate realistic banking statement datasets for experimentation and format verification
- Convert internal domain models to all four industry-standard banking file formats
- Support multiple conversion engines for each format (Prowide, Velocity, Jakarta XML Binding)
- Validate generated output against official SWIFT MT and ISO 20022 XSD specifications
- Demonstrate restartable Spring Batch job architecture for banking file pipelines
- Provide operational dashboards for job history and generated file preview
- Serve as a reference implementation for banking format conversion architecture
- Support future extensibility for reverse conversion (MT/camt → internal model) and additional formats

---

## 3. Banking Domain

### Supported Output Formats

| Standard | Format | Description | Authority |
|---|---|---|---|
| SWIFT MT | MT940 | Customer Statement Message — end-of-day account statement | SWIFT |
| SWIFT MT | MT942 | Interim Transaction Report — intraday/interim account report | SWIFT |
| ISO 20022 | camt.053 | Bank-to-Customer Statement — end-of-day account statement | ISO / BIS |
| ISO 20022 | camt.052 | Bank-to-Customer Account Report — intraday/interim account report | ISO / BIS |

### Functional Equivalence

The formats map to each other functionally:

| MT Format | ISO 20022 Equivalent | Usage |
|---|---|---|
| MT940 | camt.053 | End-of-day statement |
| MT942 | camt.052 | Intraday/interim report |

### Reference Sources

All format structures shall be derived from:

- Official SWIFT MT940 and MT942 documentation
- ISO 20022 camt.052 and camt.053 XSD schemas
- Prowide Core and Prowide ISO 20022 library documentation
- Publicly available banking reference implementations

---

## 4. Technical Stack

| Area | Technology |
|---|---|
| Language | Java 21 |
| Backend | Spring Boot 3.4.x |
| Batch Engine | Spring Batch |
| Monitoring | Spring Actuator |
| Database | H2 In-Memory |
| ORM | Spring Data JPA |
| API Documentation | OpenAPI V3 + Swagger UI |
| Frontend | Modern SPA (React or equivalent) |
| Build Tool | Maven |
| Testing | JUnit 5 + Mockito + AssertJ |
| CI/CD | GitHub Actions |
| Architecture | Layered REST + Strategy Pattern |

---

## 5. Supported Conversion Engines

### Engine Overview

| Engine | Role | Formats Supported |
|---|---|---|
| Prowide Core | MT message generation | MT940, MT942 |
| Prowide ISO 20022 | camt XML generation | camt.052, camt.053 |
| Apache Velocity | Template-based file generation | MT940, MT942, camt.052, camt.053 |
| Jakarta XML Binding | XSD-schema-driven camt XML generation | camt.052, camt.053 |

### Engine Comparison Matrix

| Engine | Type-Safety | Spring Batch Fit | XML Schema Validation | Operational Risk |
|---|---|---|---|---|
| Prowide Core | High | Excellent | N/A | Low |
| Prowide ISO 20022 | High | Excellent | Built-in | Low |
| Apache Velocity | Low (template) | Good | External XSD required | Low |
| Jakarta XML Binding | High | Good | Built-in (XSD) | Medium |

### Strategic Recommendations

| Scenario | Recommended Engine |
|---|---|
| MT940 / MT942 generation | Prowide Core |
| camt.052 / camt.053 generation | Prowide ISO 20022 |
| Template-driven custom reports | Apache Velocity |
| XSD-schema-driven camt generation | Jakarta XML Binding |
| Default engine for all formats | Prowide (Core + ISO 20022) |

---

# Part II: Functional Requirements

> Requirements in this section carry `FR-xxx` identifiers and are tracked via `- [ ]` checkboxes.

---

## 6. Domain Data Management

### FR-001
- [ ] The frontend shall provide a **Generate Statement Data** button that triggers domain data generation.

### FR-002
- [ ] The backend shall generate the following domain entities on each generation request:
  - `BankStatement` records with statement reference, IBAN, currency, dates, and balances
  - `BankTransaction` records with booking date, value date, amount, debit/credit indicator, references, and remittance information

### FR-002a
- [ ] `POST /api/random-statements` shall accept an optional `loadProfile` query parameter with values `LOW` (default) and `HIGH`. The `LOW` profile generates 1 statement with 10 transactions. The `HIGH` profile generates 10 statements with 100 transactions each. The profile is implemented via a `LoadProfile` enum in `com.wtechitsolutions.bankingconverter.domain`. The frontend shall expose both options as "Low Load" and "High Load" buttons.

### FR-003
- [ ] All generated domain data shall be persisted to the H2 in-memory database.

### FR-004
- [ ] The `POST /api/random-statements` response shall include:

```json
{
  "statementId": 1,
  "statementReference": "STMT-20260514-001",
  "accountIban": "DE89370400440532013000",
  "statementsGenerated": 1,
  "transactionsGenerated": 10,
  "timestamp": "2026-05-14T10:00:00Z"
}
```

---

## 7. File Generation and Batch Processing

### FR-005
- [ ] The frontend shall allow the user to select a **Target Format**: MT940, MT942, CAMT052, or CAMT053.

### FR-006
- [ ] The frontend shall allow the user to select a **Conversion Engine**: PROWIDE (default), VELOCITY, or JAKARTA_XML_BINDING.

### FR-007
- [ ] On submission, the backend shall trigger a Spring Batch job parameterised with the selected `statementId`, `targetFormat`, and `engine`.

### FR-008
- [ ] The batch `ItemReader` shall read a `BankStatementEntity` from H2 by `statementId`, eagerly fetching its transactions via a JPQL join fetch query.

### FR-009
- [ ] The batch `ItemProcessor` shall map the entity to the domain model, dynamically resolve the correct `StatementExportStrategy` based on `(targetFormat, engine)`, and produce a `GeneratedBankingFile`.

### FR-010
- [ ] The batch `ItemWriter` shall write the generated file to the `./output/` directory and return the file name and content to the caller.

### FR-011
- [ ] All Spring Batch jobs shall be restartable from the point of failure.

### FR-012
- [ ] All generated files shall be reproducible: given the same domain data and parameters, the output shall be byte-identical.

### FR-013
- [ ] The system shall record all Spring Batch job executions, including status, duration, parameters, and timestamp.

### FR-014
- [ ] Recorded batch history shall be retrievable via `GET /api/conversions/jobs`.

### FR-015
- [ ] The system shall validate the internal domain model before dispatching to any conversion strategy:
  - Statement reference present
  - IBAN present and non-empty
  - Currency present (ISO 4217 code)
  - Statement date present
  - Opening and closing balances present
  - At least one transaction present
  - Each transaction has amount, booking date, value date, and debit/credit indicator

### FR-016
- [ ] MT output shall be validated after generation by parsing back the MT text with Prowide Core and confirming required fields (Field20, Field25, Field60F/60M, Field62F/62M).

### FR-017
- [ ] camt output shall be validated after generation by checking the XML against the ISO 20022 XSD before writing the file.

---

## 8. REST API

### Endpoints

| ID | Method | Endpoint | Description |
|---|---|---|---|
| FR-018 | POST | `/api/random-statements` | Generate and persist banking domain data; optional `?loadProfile=LOW\|HIGH` |
| FR-019 | POST | `/api/conversions` | Trigger a Spring Batch conversion job; body: `{statementId, targetFormat, engine}` |
| FR-020 | GET | `/api/conversions/jobs` | Retrieve conversion job execution history |
| FR-021 | GET | `/api/conversions/jobs/{jobId}` | Retrieve status and details for a specific job |
| FR-022 | GET | `/actuator/health` | Application health status |
| FR-023 | GET | `/actuator/info` | Application metadata |

### Request / Response Examples

`POST /api/conversions` request:

```json
{
  "statementId": 1,
  "targetFormat": "MT940",
  "engine": "PROWIDE"
}
```

`POST /api/conversions` response:

```json
{
  "jobId": 123,
  "status": "STARTING",
  "timestamp": "2026-05-14T10:00:01Z"
}
```

`GET /api/conversions/jobs/{jobId}` response:

```json
{
  "jobId": 123,
  "status": "COMPLETED",
  "exitDescription": "",
  "targetFormat": "MT940",
  "engine": "PROWIDE",
  "outputFile": "statement-1.mt940",
  "createTime": "2026-05-14T10:00:01Z",
  "startTime": "2026-05-14T10:00:01Z",
  "endTime": "2026-05-14T10:00:03Z",
  "durationMs": 2000,
  "timestamp": "2026-05-14T10:00:03Z"
}
```

### API Standards

### FR-024
- [ ] All API responses shall include a `timestamp` field in ISO-8601 format.

### FR-025
- [ ] All endpoints shall be documented via OpenAPI V3 and accessible through Swagger UI.

### FR-026
- [ ] Swagger UI shall be enabled in the `dev` Spring profile only.

---

## 9. Frontend

### FR-027
- [ ] The frontend shall provide a modern, responsive single-page UI.

### FR-028
- [ ] The frontend shall provide an operational dashboard as the default view showing application health, actuator info, and quick-action buttons.

### FR-029
- [ ] The frontend shall provide a **Statement Generator** panel with "Low Load" and "High Load" buttons and display the generation result (statement ID, transaction count).

### FR-030
- [ ] The frontend shall provide a **Conversion Runner** panel where the user selects a statement ID, target format, and engine, then submits the conversion job and sees the job status.

### FR-031
- [ ] The frontend shall display a **Job History** table showing status, duration, format, engine, and output file name per job.

### FR-032
- [ ] The frontend shall include a **Generated File Viewer** panel that previews the content of a generated file for a selected job.

### FR-033
- [ ] The frontend shall provide navigation links to `/actuator/health`, `/actuator/info`, and Swagger UI.

---

## 10. Actuator and Monitoring

### FR-034
- [ ] `/actuator/info` shall expose: application name, version, and runtime start timestamp.

### FR-035
- [ ] `/actuator/health` shall expose: overall health status.

### FR-036
- [ ] The health endpoint shall include a dedicated H2 database health indicator.

### FR-037
- [ ] The health endpoint shall include a dedicated Spring Batch subsystem health indicator.

---

# Part III: Architecture

> Architecture sections are descriptive. They define how the system is built, not what it delivers.

---

## 11. System Architecture

The system follows a layered REST + Batch architecture. The frontend drives generation and conversion via REST; the backend delegates all file generation to Spring Batch.

### Batch Pipeline

Every conversion flow uses the standard Spring Batch pipeline:

```
BankStatementItemReader → StatementExportProcessor → BankingFileWriter
```

The `BankStatementItemReader` loads the `BankStatementEntity` from H2 by `statementId`. The `StatementExportProcessor` maps the entity to the domain model and resolves the correct `StatementExportStrategy`. The `BankingFileWriter` produces the physical file in `./output/`.

### Two-Layer Domain Model

The domain and persistence layers are strictly separated:

```
Persistence layer (JPA entities):
    BankStatementEntity  ─── @OneToMany ──→  BankTransactionEntity

Domain layer (Java Records):
    BankStatement        ─── List<> ──────→  BankTransaction

BankStatementMapper bridges the two layers.
Strategies receive only domain records — never JPA entities.
```

### Package Structure

```
com.wtechitsolutions.bankingconverter/
├── api/           REST controllers and DTO records
├── batch/         Spring Batch job config, reader, processor, writer
├── conversion/    Strategy interface, enums, factory, GeneratedBankingFile
│   └── strategy/  10 strategy implementations (prowide/, velocity/, jakartaxb/)
├── domain/        BankStatement, BankTransaction, DebitCreditIndicator
├── mapper/        BankStatementMapper, format-specific mappers
├── persistence/
│   ├── entity/    BankStatementEntity, BankTransactionEntity
│   └── repository/ BankStatementRepository (with JPQL join fetch)
├── random/        RandomStatementService
├── validation/    InternalStatementValidator, SwiftMtValidator, Iso20022Validator
├── template/      VelocityRenderer
├── exception/     ConversionException, UnsupportedConversionException, JobLaunchException
└── config/        Spring and Batch configuration
```

### Output

Generated files are written to `./output/` at the project root. This directory is gitignored.

---

## 12. Strategy Pattern Design

All conversion logic is encapsulated behind a single interface:

```java
public interface StatementExportStrategy {
    ConversionTargetFormat targetFormat();
    ConversionEngine engine();
    GeneratedBankingFile export(BankStatement statement);
}
```

The `StatementExportStrategyFactory` resolves the correct strategy at runtime based on job parameters via a composite key `(targetFormat × engine)`. All strategy beans are auto-discovered via Spring DI — no `if`/`switch` chains.

### Strategy Matrix

| Class | Format | Engine |
|---|---|---|
| `InternalToMt940ProwideStrategy` | MT940 | Prowide Core |
| `InternalToMt942ProwideStrategy` | MT942 | Prowide Core |
| `InternalToCamt052ProwideStrategy` | camt.052 | Prowide ISO 20022 |
| `InternalToCamt053ProwideStrategy` | camt.053 | Prowide ISO 20022 |
| `InternalToMt940VelocityStrategy` | MT940 | Apache Velocity |
| `InternalToMt942VelocityStrategy` | MT942 | Apache Velocity |
| `InternalToCamt052VelocityStrategy` | camt.052 | Apache Velocity |
| `InternalToCamt053VelocityStrategy` | camt.053 | Apache Velocity |
| `InternalToCamt052JakartaXmlBindingStrategy` | camt.052 | Jakarta XML Binding |
| `InternalToCamt053JakartaXmlBindingStrategy` | camt.053 | Jakarta XML Binding |

**MVP requires**: the four Prowide strategies. Velocity and Jakarta XML Binding strategies are optional enhancements.

### Output File Naming

```
statement-{statementId}.mt940
statement-{statementId}.mt942
statement-{statementId}.camt052.xml
statement-{statementId}.camt053.xml
```

---

# Part IV: Non-Functional Requirements

> Requirements in this section carry `NFR-xxx` identifiers.

---

## 13. Performance

### NFR-001
- [ ] File generation for a single statement with up to 1,000 transactions shall complete in under 5 seconds.

### NFR-002
- [ ] The HIGH load profile (10 statements × 100 transactions) shall complete all conversions within 60 seconds.

### NFR-003
- [ ] The system shall report job-level timing (start, end, duration) for all batch executions.

---

## 14. Security

### NFR-004
- [ ] CodeQL static analysis scanning shall be enabled via GitHub Actions.

### NFR-005
- [ ] OWASP dependency checks shall run as part of the CI pipeline.

### NFR-006
- [ ] CVE dependency scanning shall be enabled via Dependabot.

### NFR-007
- [ ] Spring Actuator management endpoints shall be secured; only `/health` and `/info` are publicly exposed.

### NFR-008
- [ ] Swagger UI is enabled in the `dev` Spring profile only (see FR-026).

### NFR-009
- [ ] No secrets, credentials, API keys, or environment-specific values shall be committed to the repository.

---

## 15. Coding Standards

### NFR-010
- [ ] The codebase shall adhere to SOLID principles throughout.

### NFR-011
- [ ] Architecture shall be strictly layered: `api` → `batch/conversion` → `domain` → `config`. No cross-layer bypasses.

### NFR-012
- [ ] Domain records and API DTOs shall be kept separate. Java Records are the preferred type for both domain objects and DTOs.

### NFR-013
- [ ] Lombok shall be used to reduce boilerplate in non-record classes (e.g. JPA entities).

### NFR-014
- [ ] Maximum source line length: 120 characters.

### NFR-015
- [ ] Minimum Java version: 21.

### NFR-016
- [ ] All packages shall follow the `com.wtechitsolutions.bankingconverter.*` namespace.

### NFR-017
- [ ] Test coverage target: >80% across all modules, enforced via JUnit 5 + Mockito.

---

# Part V: Testing

> Requirements in this section carry `TS-xxx` identifiers.

---

## 16. Test Strategy

### Test Categories

### TS-001
- [ ] **Unit tests** — strategy classes, domain mappers, validators, random data generators, individual batch components.

### TS-002
- [ ] **Integration tests** — Spring context loading, H2 persistence, end-to-end batch job execution per format × engine combination.

### TS-003
- [ ] **REST API tests** — all endpoints in §8, request/response schema validation, error handling, `timestamp` field presence.

### TS-004
- [ ] **Actuator tests** — `/actuator/health` and `/actuator/info` response structure and content.

### TS-005
- [ ] **Swagger availability test** — Swagger UI and OpenAPI spec endpoint accessible in `dev` profile.

### TS-006
- [ ] **Spring Batch tests** — job launch, step execution, restartability, parameter binding per target format.

### TS-007
- [ ] **Strategy resolution tests** — all 10 strategy classes (§12) resolve correctly for their `targetFormat` × `engine` combination.

### TS-008
- [ ] **Format correctness tests** — each strategy produces output that parses successfully (MT: Prowide Core re-parse; camt: XSD validation pass).

### TS-009
- [ ] **Golden file tests** — generated output compared against reference files in `docs/examples/{mt940,mt942,camt052,camt053}/`.

### TS-010
- [ ] **Validation tests** — `InternalStatementValidator` rejects invalid domain models; `SwiftMtValidator` rejects malformed MT text; `Iso20022Validator` rejects XML that fails XSD.

### TS-011
- [ ] **Cross-engine comparison tests** — for the same input, PROWIDE and VELOCITY strategies produce semantically equivalent output (same account, balances, transaction amounts).

---

# Part VI: Developer Experience and Operations

> Requirements in this section carry `DX-xxx` identifiers.

---

## 17. Repository Structure

```
root/
├── README.md
├── CLAUDE.md
├── Makefile
├── pom.xml
├── .gitignore
├── docs/
│   ├── PRD.md
│   ├── CHANGELOG.md
│   ├── CONTRIBUTING.md
│   ├── architecture.md
│   ├── examples/
│   │   ├── mt940/
│   │   ├── mt942/
│   │   ├── camt052/
│   │   └── camt053/
│   └── diagrams/
│       ├── *.puml
│       └── *.mmd
├── src/
│   ├── main/java/com/wtechitsolutions/bankingconverter/
│   ├── main/resources/
│   │   ├── application.yml
│   │   └── templates/         ← Velocity .vm templates
│   └── test/java/com/wtechitsolutions/bankingconverter/
├── output/                    ← gitignored
└── .github/
    ├── workflows/
    ├── dependabot.yml
    ├── ISSUE_TEMPLATE/
    └── PULL_REQUEST_TEMPLATE.md
```

---

## 18. Developer Experience

### Makefile

The repository shall include a `Makefile`. Running `make` without arguments shall print all available commands with descriptions.

| Command | Description |
|---|---|
| `make build` | Compile and package the project (skips tests) |
| `make run` | Start the application in dev mode (Swagger UI enabled) |
| `make run-prod` | Start the application without dev profile |
| `make test` | Run all test categories with JaCoCo coverage |
| `make test-unit` | Run unit tests only |
| `make test-integration` | Run integration tests only |
| `make clean` | Remove build artifacts and output files |
| `make kill` | Kill running Spring Boot process (free port 8080) |
| `make lint` | Run static analysis and compiler warnings |
| `make docs` | Generate JaCoCo HTML coverage report |
| `make help` | Display all commands and descriptions |

---

## 19. CI/CD Requirements

### DX-001
- [ ] `.github/workflows/build.yml` — compile and package on every push and pull request.

### DX-002
- [ ] `.github/workflows/test.yml` — run all test categories (TS-001 through TS-011).

### DX-003
- [ ] `.github/workflows/codeql.yml` — CodeQL static analysis scanning (see NFR-004).

### DX-004
- [ ] `.github/workflows/release.yml` — create GitHub releases on version tags.

### DX-005
- [ ] `.github/dependabot.yml` — automated dependency update PRs for Maven and GitHub Actions.

---

## 20. GitHub Standards

### DX-006
- [ ] README shall display build, test, and CodeQL status badges.

### DX-007
- [ ] Repository shall maintain a `CHANGELOG.md` updated on each release.

### DX-008
- [ ] `CONTRIBUTING.md` shall document the contribution workflow, branching strategy, and PR process.

### DX-009
- [ ] `.github/ISSUE_TEMPLATE/` shall contain templates for bug reports and feature requests.

### DX-010
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` shall include a standard checklist for reviewers.

---

## 21. Gitignore Requirements

The `.gitignore` shall cover the following categories:

### DX-011 — AI Tool Files
- [ ] Cursor IDE (`.cursor/`, `.cursorignore`, `.cursorrules`)
- [ ] GitHub Copilot (auto-generated `copilot-instructions.md`)
- [ ] Codeium / Windsurf (`.codeium/`, `.windsurf/`)
- [ ] Continue.dev (`.continue/`)
- [ ] Tabnine (`.tabnine`)

### DX-012 — IDE Files
- [ ] IntelliJ IDEA (`.idea/`, `*.iml`, `*.iws`, `*.ipr`, `out/`)
- [ ] VS Code (`.vscode/`, `*.code-workspace`)
- [ ] Eclipse (`.classpath`, `.project`, `.settings/`, `bin/`)
- [ ] NetBeans (`nbproject/`, `nbbuild/`, `nbdist/`, `.nb-gradle/`)

### DX-013 — OS Files
- [ ] macOS (`.DS_Store`, `.AppleDouble`, `.LSOverride`)
- [ ] Windows (`Thumbs.db`, `ehthumbs.db`, `Desktop.ini`, `$RECYCLE.BIN/`)

### DX-014 — Build and Runtime Artifacts
- [ ] Maven (`target/`, `pom.xml.tag`, `pom.xml.releaseBackup`, `pom.xml.versionsBackup`)
- [ ] Java class files (`*.class`)
- [ ] Log files (`*.log`, `logs/`)
- [ ] Application output (`output/`)

### DX-015 — Secrets and Local Configuration
- [ ] Environment files (`.env`, `.env.*`)
- [ ] Key and certificate files (`*.key`, `*.pem`, `*.p12`, `*.jks`)
- [ ] Local Spring profiles (`application-local.yml`, `application-local.properties`)

---

## 22. CLAUDE.md Maintenance

The `CLAUDE.md` file at the repository root provides context to Claude Code. It shall be kept current throughout development.

### DX-016 — Content Requirements
- [ ] Accurate `mvn` and `make` commands that work from the repository root.
- [ ] Current Java package structure under `com.wtechitsolutions.bankingconverter.*`.
- [ ] Strategy class naming convention and the `(targetFormat × engine)` key resolution.
- [ ] All REST API endpoints.
- [ ] How to run specific test types (unit, integration, golden file).
- [ ] Non-obvious constraints or architectural decisions discovered during implementation.

### DX-017 — Update Triggers
`CLAUDE.md` shall be updated after each of the following milestones:

- Initial project scaffold (`pom.xml`, `Makefile`, directory structure created)
- Domain model and persistence layer implemented
- Spring Batch pipeline implemented
- Each conversion engine integration completed (Prowide, Velocity, Jakarta XML Binding)
- Frontend implemented
- CI/CD workflows configured and passing
- Any major architectural decision is made or changed

---

# Part VII: Documentation and Artifacts

> Requirements in this section carry `DOC-xxx` identifiers.

---

## 23. Documentation Requirements

### DOC-001
- [ ] The `docs/` directory shall contain: `PRD.md`, `architecture.md`, `CHANGELOG.md`, and `CONTRIBUTING.md`.

### DOC-002
- [ ] The `README.md` shall contain:
  - Project overview and purpose
  - Architecture explanation with embedded Mermaid diagrams
  - Supported banking standards and formats
  - Conversion engine comparison table
  - Build, run, and test instructions
  - API usage guide with curl examples
  - Swagger UI and Spring Actuator usage guide
  - Links to official SWIFT MT and ISO 20022 documentation
  - Maven repository links for Prowide Core and Prowide ISO 20022

---

## 24. Diagram Requirements

All diagrams shall be provided in both PlantUML (`.puml`) and Mermaid (`.mmd`) formats under `docs/diagrams/`.

### DOC-003
- [ ] `architecture-overview.puml` / `architecture-overview.mmd` — high-level system overview.

### DOC-004
- [ ] `component-diagram.puml` / `component-diagram.mmd` — component relationships and boundaries.

### DOC-005
- [ ] `batch-sequence.puml` / `batch-sequence.mmd` — Spring Batch job execution sequence.

### DOC-006
- [ ] `strategy-class-diagram.puml` / `strategy-class-diagram.mmd` — Strategy Pattern class hierarchy showing all 10 strategies.

### DOC-007
- [ ] `conversion-flow.puml` / `conversion-flow.mmd` — internal domain model to output format conversion flow.

### DOC-008
- [ ] `deployment-diagram.puml` / `deployment-diagram.mmd` — deployment topology.

### DOC-009
- [ ] `database-diagram.puml` / `database-diagram.mmd` — H2 schema and entity relationships (BankStatementEntity, BankTransactionEntity).

### DOC-010
- [ ] The `README.md` shall embed Mermaid diagrams directly (not as image links).

---

## 25. Example Banking Files

Example files shall be placed under `docs/examples/mt940/`, `docs/examples/mt942/`, `docs/examples/camt052/`, and `docs/examples/camt053/`. All examples shall be derived from official SWIFT MT and ISO 20022 documentation.

### DOC-011
- [ ] **Valid files** — correctly formatted MT940, MT942, camt.052, and camt.053 files for golden file tests.

### DOC-012
- [ ] **Malformed files** — intentionally broken files for error-handling and resilience tests.

### DOC-013
- [ ] **Edge-case files** — empty optional fields, maximum-length remittance information, multi-transaction statements.

---

# Part VIII: Delivery

---

## 26. Acceptance Criteria

The project is considered complete only when all of the following are satisfied:

### Functional
- [ ] All FR-001 through FR-037 implemented and verified.
- [ ] All four Prowide strategies (§12) generate format-valid MT940, MT942, camt.052, camt.053 output end-to-end.
- [ ] REST API endpoints (FR-018 through FR-023) return correct responses with `timestamp` fields.
- [ ] Swagger UI accessible in `dev` profile; all endpoints documented.
- [ ] Spring Actuator `/health` and `/info` operational with H2 and Batch indicators.
- [ ] Output files written to `./output/` with correct naming pattern.

### Architecture and Quality
- [ ] All NFR-001 through NFR-017 satisfied.
- [ ] Spring Batch jobs are restartable (FR-011).
- [ ] Generated files are reproducible given same domain data and parameters (FR-012).
- [ ] Domain and persistence layers remain strictly separated; strategies never reference JPA entities.
- [ ] Test coverage exceeds 80% across all modules (NFR-017).

### Testing
- [ ] All TS-001 through TS-011 passing.
- [ ] Strategy resolution tests (TS-007) pass for all 10 strategy/format combinations.
- [ ] Golden file tests (TS-009) pass against `docs/examples/`.
- [ ] Format correctness tests (TS-008) pass: MT re-parse and camt XSD validation green for all Prowide strategies.

### Operations and DevEx
- [ ] All DX-001 through DX-017 implemented.
- [ ] GitHub Actions workflows (DX-001 through DX-004) passing on `main`.
- [ ] Dependabot (DX-005) configured.
- [ ] `.gitignore` complete per DX-011 through DX-015.
- [ ] `Makefile` present with all commands (§18).
- [ ] `CLAUDE.md` reflects current project state (DX-016, DX-017).

### Documentation and Artifacts
- [ ] All DOC-001 through DOC-013 delivered.
- [ ] All 7 diagram types present in both `.puml` and `.mmd` (DOC-003 through DOC-009).
- [ ] README complete per DOC-002 with embedded Mermaid diagrams.
- [ ] All documentation written in English.

---

## 27. Conclusion

This platform is a professional banking format conversion environment focused on producing correct, validated banking statement files in all four major industry formats — MT940, MT942, camt.052, and camt.053 — from a unified internal domain model.

The architecture prioritizes:

- **Modularity** — the Strategy Pattern isolates every format × engine combination behind a single interface, making it trivial to add new engines or output formats
- **Correctness** — three-stage validation (internal model → generation → output re-parse/XSD) ensures every generated file is format-compliant before it reaches disk
- **Observability** — Spring Actuator, job history API, and generated file preview provide full operational visibility
- **Enterprise-grade quality** — restartable batch jobs, CI/CD pipelines, CodeQL, OWASP dependency checks, and structured test coverage ensure the codebase is production-worthy
- **Reference value** — the implementation serves as a concrete, runnable demonstration of Spring Batch, Strategy Pattern, and ISO 20022 / SWIFT MT file generation working together

---

## Appendix A: Domain Model

### BankStatement (domain record)

```java
public record BankStatement(
        Long id,
        String statementReference,
        String accountIban,
        String accountCurrency,
        LocalDate statementDate,
        BigDecimal openingBalance,
        BigDecimal closingBalance,
        List<BankTransaction> transactions
) {}
```

### BankTransaction (domain record)

```java
public record BankTransaction(
        Long id,
        LocalDate bookingDate,
        LocalDate valueDate,
        BigDecimal amount,
        String currency,
        DebitCreditIndicator debitCreditIndicator,
        String transactionReference,
        String counterpartyName,
        String remittanceInformation,
        String bankTransactionCode
) {}
```

### DebitCreditIndicator

```java
public enum DebitCreditIndicator { DEBIT, CREDIT }
```

### ConversionTargetFormat

```java
public enum ConversionTargetFormat { MT940, MT942, CAMT052, CAMT053 }
```

### ConversionEngine

```java
public enum ConversionEngine { PROWIDE, VELOCITY, JAKARTA_XML_BINDING }
```

---

## Appendix B: Out of Scope (v1)

The following features are not required for the first version:

```
Reverse conversion: MT940 / MT942 / camt.052 / camt.053 → internal model
Direct MT940 ↔ camt.053 or MT942 ↔ camt.052 conversion without internal model
Apache Camel integration routes (SFTP, Kafka, JMS)
Real bank connectivity
Production-grade ISO 20022 market-practice validation (beyond XSD)
Authentication and authorization
Multi-tenant support
Persistent production database (Flyway, PostgreSQL)
Download generated file via API endpoint
Audit table for generated files
```
