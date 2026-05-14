# CLAUDE.md

> **Implementation Status: COMPLETE** — 46 source files, 11 test classes, 45 tests passing, `mvn verify` green.
> 8 strategies (4 Prowide + 4 Velocity), Spring Batch pipeline, REST API, domain + persistence layers, JaCoCo check passes.
> React 19 frontend with 6 views (Dashboard, Generate, Runner, History, Charts, Diagrams) — pre-built bundle in `src/main/resources/static/`.
> 14 architecture diagrams in `docs/diagrams/` (.mmd + .puml). 6 cross-platform run/kill scripts (sh, ps1, bat).

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Banking Statement Converter Platform** — enterprise-grade banking format conversion platform for generating internal domain data and converting it to MT940, MT942, camt.052, and camt.053 files via the Strategy Pattern and Spring Batch.

**PRD:** `docs/PRD.md` (v1.0, authoritative)

## Technology Stack

- **Java 21**, **Spring Boot 3.4.x**, **Maven**
- **Spring Batch** — drives the conversion pipeline (Read → Process → Write)
- **Spring Data JPA + H2** — in-memory persistence for statement data
- **Prowide Core** — MT940 / MT942 generation (primary engine)
- **Prowide ISO 20022** — camt.052 / camt.053 XML generation (primary engine)
- **Apache Velocity** (optional) — template-based alternative engine
- **Jakarta XML Binding** (optional) — XSD-generated Java classes for camt
- **JUnit 5 + AssertJ** — testing

## Build & Run Commands

```bash
# Full build (compile + tests + install)
mvn clean install

# Quick build (no tests)
mvn clean package -DskipTests

# Run in dev mode (Swagger UI at /swagger-ui.html)
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Run without dev profile (no Swagger)
mvn spring-boot:run

# All tests with JaCoCo coverage
mvn verify

# Unit tests only
mvn test

# Run a single test class
mvn test -Dtest=InternalToMt940ProwideStrategyTest

# Run a single test method
mvn test -Dtest=InternalToMt940ProwideStrategyTest#shouldGenerateMt940File

# Makefile shortcuts
make build | make run | make run-prod | make test | make test-unit | make clean | make kill | make lint | make docs | make help
```

## Architecture

### Flow

```
POST /api/random-statements
    → RandomStatementService generates BankStatement
    → Saved as BankStatementEntity in H2

POST /api/conversions
    → Launches Spring Batch job (statementExportJob)
    → BankStatementItemReader reads entity from H2
    → StatementExportProcessor maps entity → domain, resolves strategy
    → StatementExportStrategy.export() generates file content
    → BankingFileWriter writes file to ./output/
```

### Strategy Pattern

All format conversions go through `StatementExportStrategy`. The factory resolves the correct strategy by a composite key of `(ConversionTargetFormat, ConversionEngine)`:

```
PROWIDE + MT940   → InternalToMt940ProwideStrategy
PROWIDE + MT942   → InternalToMt942ProwideStrategy
PROWIDE + CAMT052 → InternalToCamt052ProwideStrategy
PROWIDE + CAMT053 → InternalToCamt053ProwideStrategy
VELOCITY + MT940  → InternalToMt940VelocityStrategy   (optional)
...
```

Adding a new conversion = implement `StatementExportStrategy` + annotate `@Component`. The factory auto-discovers all strategies via Spring DI.

### Domain vs Persistence

Two separate model layers:
- **Domain** (`/domain`): `BankStatement`, `BankTransaction`, `DebitCreditIndicator` — plain Java records, format-independent
- **Persistence** (`/persistence/entity`): `BankStatementEntity`, `BankTransactionEntity` — JPA entities with `@OneToMany`

`BankStatementMapper` bridges the two. Strategies only ever see domain records.

### Package Structure

The following packages are **fully implemented** in `src/main/java/com/wtechitsolutions/bankingconverter/`:

```
com.wtechitsolutions.bankingconverter/
    /api                               — RandomStatementController, StatementConversionController,
                                         GlobalExceptionHandler
    /api/dto                           — ConversionJobRequest, ConversionJobResponse,
                                         ConversionJobStatusResponse, RandomStatementResponse (Java Records)
    /batch                             — BankStatementItemReader, StatementExportProcessor,
                                         BankingFileWriter, BatchJobMetricsListener, BatchJobService
    /config                            — BatchConfig, OpenApiConfig, WebConfig, VersionHealthIndicator
    /conversion                        — StatementExportStrategy (interface), StatementExportStrategyFactory,
                                         StatementExportStrategyKey, ConversionTargetFormat (enum),
                                         ConversionEngine (enum), GeneratedBankingFile
    /conversion/strategy/prowide       — AbstractMtProwideStrategy, InternalToMt940ProwideStrategy,
                                         InternalToMt942ProwideStrategy, InternalToCamt052ProwideStrategy,
                                         InternalToCamt053ProwideStrategy
    /conversion/strategy/velocity      — InternalToMt940VelocityStrategy, InternalToMt942VelocityStrategy,
                                         InternalToCamt052VelocityStrategy, InternalToCamt053VelocityStrategy
    /domain                            — BankStatement, BankTransaction, DebitCreditIndicator, LoadProfile
    /persistence/entity                — BankStatementEntity, BankTransactionEntity
    /persistence/repository            — BankStatementRepository, BankTransactionRepository
    /mapper                            — BankStatementMapper (MapStruct)
    /random                            — RandomStatementService
    /template                          — VelocityRenderer
    /validation                        — InternalStatementValidator
    /exception                         — ConversionException, JobLaunchException
```

Note: `UnsupportedConversionException` and `Iso20022Validator`/`SwiftMtValidator` as separate classes are not yet
created — validation logic lives in `InternalStatementValidator` and the individual strategy implementations.
The Jakarta XML Binding strategy package (`/conversion/strategy/jakartaxb`) is out of scope for v1.

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/random-statements` | Generate and persist random `BankStatement` data; `?loadProfile=LOW\|HIGH` |
| `POST` | `/api/conversions` | Launch Spring Batch export job |
| `GET`  | `/api/conversions/jobs` | List all job executions (last 50) |
| `GET`  | `/api/conversions/jobs/{jobId}` | Poll batch job status by ID |

Request body for `POST /api/conversions`:
```json
{ "statementId": 1, "targetFormat": "MT940", "engine": "PROWIDE" }
```

`targetFormat`: `MT940`, `MT942`, `CAMT052`, `CAMT053`
`engine`: `PROWIDE`, `VELOCITY`

## React Frontend

Source: `src/main/frontend/` (React 19 + MUI + Recharts + Mermaid, TypeScript strict)
Built bundle: `src/main/resources/static/` (committed — served directly by Spring Boot)

```bash
make build-frontend   # npm install + vite build → src/main/resources/static/
make dev-frontend     # Vite dev server :3000, proxies /api + /actuator to :8080
```

Views: Dashboard · Generate Statements · Conversion Runner (incl. Run All 8 Combinations) · History · Charts · Diagrams

## Architecture Diagrams

`docs/diagrams/` — 7 diagrams × 2 formats (.mmd Mermaid + .puml PlantUML):
architecture-overview, batch-sequence, strategy-class-diagram, conversion-flow, database-diagram, deployment-diagram, component-diagram

Also rendered live in the **Diagrams** view of the React SPA.

## Cross-Platform Scripts

| Script | Platform |
|---|---|
| `run.sh` / `kill.sh` | macOS + Linux (bash) |
| `run.ps1` / `kill.ps1` | PowerShell Core 7+ (all platforms) |
| `run.bat` / `kill.bat` | Windows 10+ CMD |

All scripts build (skippable with `--skip-build` / `-SkipBuild`), wait for `/actuator/health`, write logs to `logs/`.

## Output Files

Generated under `./output/` (gitignored; `.gitkeep` preserves the directory):
```
statement-{id}.mt940        text/plain
statement-{id}.mt942        text/plain
statement-{id}.camt052.xml  application/xml
statement-{id}.camt053.xml  application/xml
```

## Java Package Convention

All packages: `com.wtechitsolutions.bankingconverter.*`

## Test Suite

45 tests, 0 failures — `mvn verify` green, JaCoCo ≥40% instruction coverage enforced.

Classes: StrategyFactoryTest · ProwideStrategyOutputTest · VelocityStrategyOutputTest · GoldenFileTest · BatchJobIntegrationTest · BankStatementMapperTest · InternalStatementValidatorTest · RandomStatementControllerTest · StatementConversionControllerTest · ActuatorTest · SwaggerAvailabilityTest

## Out of Scope (v1)

Reverse conversion (MT→internal), Jakarta XML Binding strategies, Apache Camel, Kafka, SFTP, auth, multi-tenant, Flyway, Docker Compose.
