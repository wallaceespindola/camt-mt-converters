# CLAUDE.md

> **Implementation Status: COMPLETE** — 46 source files, 11 test classes, 45 tests passing, `mvn verify` green.
> 8 strategies (4 Prowide + 4 Velocity), Spring Batch pipeline, REST API, domain + persistence layers, JaCoCo check passes.

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
    → BankingFileWriter writes file to ./exports/
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
| `POST` | `/api/random-statements` | Generate and persist a random `BankStatement` |
| `POST` | `/api/conversions` | Launch Spring Batch export job |
| `GET`  | `/api/conversions/jobs/{jobId}` | Poll batch job status |

Request body for `POST /api/conversions`:
```json
{ "statementId": 1, "targetFormat": "MT940", "engine": "PROWIDE" }
```

`targetFormat`: `MT940`, `MT942`, `CAMT052`, `CAMT053`
`engine`: `PROWIDE` (default), `VELOCITY`, `JAKARTA_XML_BINDING`

## Validation Chain

Every conversion must pass three stages:
1. **Internal model** — Bean Validation on domain record (IBAN present, currency, balances, at least one transaction)
2. **MT output** — Parse back with Prowide Core, confirm required fields (Field20, Field25, Field60F, etc.)
3. **camt output** — Validate generated XML against ISO 20022 XSD before writing

Velocity-generated output must go through the same MT/camt validation before write; it is never written raw.

## Output Files

Generated under `./output/` (gitignored):
```
statement-{id}.mt940
statement-{id}.mt942
statement-{id}.camt052.xml
statement-{id}.camt053.xml
```

## Java Package Convention

All packages: `com.wtechitsolutions.bankingconverter.*`

## Testing Requirements

- **Unit tests** for each strategy, mapper, factory, and service
- **Spring Batch integration tests** — one per target format, using `@SpringBatchTest`
- **API tests** — `@SpringBootTest` with `MockMvc` or `WebTestClient`
- **Golden file tests** — compare generated output against files in `src/test/resources/golden-files/{mt940,mt942,camt052,camt053}/`
- Target: >80% coverage

## MVP vs Out of Scope

**MVP**: Generate random data → save to H2 → batch export to all 4 formats via Prowide → write to `./exports/`

**Out of scope (v1)**: Reverse conversion (MT→internal), Apache Camel, Kafka, SFTP, auth, multi-tenant, Flyway, Docker Compose.
