---
marp: true
theme: default
paginate: true
backgroundColor: '#ffffff'
color: '#212121'
style: |
  section {
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 28px;
  }
  section.title {
    background: linear-gradient(135deg, #E64A19 0%, #BF360C 100%);
    color: #ffffff;
    text-align: center;
  }
  section.title h1 { font-size: 52px; font-weight: 800; margin-bottom: 12px; }
  section.title p  { font-size: 22px; opacity: .85; }
  h1 { color: #E64A19; font-size: 38px; border-bottom: 3px solid #E64A19; padding-bottom: 8px; }
  h2 { color: #BF360C; font-size: 30px; }
  code { background: #f4f4f4; padding: 2px 8px; border-radius: 4px; font-size: 22px; }
  pre  { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; font-size: 18px; }
  table { font-size: 20px; width: 100%; }
  th { background: #E64A19; color: #fff; padding: 8px 12px; }
  td { padding: 6px 12px; border-bottom: 1px solid #e0e0e0; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  footer { font-size: 16px; color: #9e9e9e; }
---

<!-- _class: title -->

# Banking Statement Converter

### MT940 · MT942 · camt.052 · camt.053

**Spring Boot + Spring Batch + Strategy Pattern**

---
*Wallace Espindola · github.com/wallaceespindola*

---

# Agenda

1. **The Problem** — SWIFT MT & ISO 20022 in European Banking
2. **Supported Formats** — Four banking file types
3. **Architecture** — System design overview
4. **Tech Stack** — Java 21, Spring Boot, Prowide, Velocity
5. **Strategy Pattern** — Eight conversion strategies
6. **Spring Batch Pipeline** — How conversion jobs run
7. **Conversion Engines** — Prowide vs Velocity
8. **REST API** — Endpoints and usage
9. **Frontend** — Vanilla HTML/JS SPA
10. **Quick Start** — Running in seconds
11. **Testing** — 46 tests, zero failures

---

# The Problem

## European Banking Has Two Worlds

<div class="cols">

**SWIFT MT (legacy)**
- Text-based tag format
- Used since the 1970s
- `:20:`, `:25:`, `:61:`, `:86:`
- MT940 = end-of-day statement
- MT942 = intraday report

**ISO 20022 (modern)**
- Structured XML
- Mandated by ECB / EPC
- Validated against XSD schemas
- camt.053 = end-of-day statement
- camt.052 = intraday report

</div>

> **SWIFT completed MX migration in November 2025** — banks must support both formats during transition

---

# Supported Formats

| Standard | Format | Type | Replaces |
|----------|--------|------|---------|
| SWIFT MT | **MT940** | End-of-day statement | — |
| SWIFT MT | **MT942** | Intraday report | — |
| ISO 20022 | **camt.053** | End-of-day statement | MT940 |
| ISO 20022 | **camt.052** | Intraday account report | MT942 |

**This platform generates all four formats from a single internal domain model**
using two conversion engines: **Prowide** and **Apache Velocity**

---

# Architecture Overview

```
HTML/JS SPA
     |
  REST API  (/api/random-statements, /api/conversions)
     |
  Spring Batch Job
  ┌──────────────────────────────────────────────┐
  │  ItemReader  →  ItemProcessor  →  ItemWriter  │
  │     H2 DB       StrategyFactory    output/    │
  └──────────────────────────────────────────────┘
          |
  StatementExportStrategyFactory
  ┌─────────────────────────────────┐
  │  Prowide × 4   │  Velocity × 4  │
  │  MT940/942     │  MT940/942     │
  │  camt052/053   │  camt052/053   │
  └─────────────────────────────────┘
```

**Single domain model → 8 output strategies, zero branching in resolution path**

---

# Tech Stack

<div class="cols">

**Backend**
- Java 21 (LTS)
- Spring Boot 3.5
- Spring Batch 5
- Spring Data JPA + H2
- Prowide Core (MT940/942)
- Prowide ISO 20022 (camt)
- Apache Velocity 2.4
- MapStruct 1.6

**Frontend & Tooling**
- Vanilla HTML / CSS / JS
- Chart.js 4.4 (charts)
- Mermaid 11 (diagrams)
- Springdoc / OpenAPI 3
- JUnit 5 + AssertJ
- JaCoCo (≥40% coverage)
- Maven 3.9

</div>

**No Node.js. No npm. No framework. Start with `mvn spring-boot:run`.**

---

# Strategy Pattern — Core Design

## 8 Strategies, One Interface

```java
public interface StatementExportStrategy {
    ConversionTargetFormat targetFormat();
    ConversionEngine engine();
    GeneratedBankingFile export(BankStatement statement);
}
```

| Class | Format | Engine |
|-------|--------|--------|
| `InternalToMt940ProwideStrategy` | MT940 | PROWIDE |
| `InternalToMt942ProwideStrategy` | MT942 | PROWIDE |
| `InternalToCamt052ProwideStrategy` | camt.052 | PROWIDE |
| `InternalToCamt053ProwideStrategy` | camt.053 | PROWIDE |
| `InternalToMt940VelocityStrategy` | MT940 | VELOCITY |
| `InternalToMt942VelocityStrategy` | MT942 | VELOCITY |
| `InternalToCamt052VelocityStrategy` | camt.052 | VELOCITY |
| `InternalToCamt053VelocityStrategy` | camt.053 | VELOCITY |

---

# Strategy Pattern — Factory

## O(1) Resolution, No Branching

```java
@Component
public class StatementExportStrategyFactory {

    private final Map<StatementExportStrategyKey,
                      StatementExportStrategy> strategies;

    public StatementExportStrategy getStrategy(
            ConversionTargetFormat format,
            ConversionEngine engine) {
        return strategies.get(new Key(format, engine));
    }
}
```

**Adding a new strategy = implement the interface + `@Component`**
No factory changes required — Spring DI auto-discovers it at startup.

---

# Spring Batch Pipeline

## Every Conversion Is a Parameterised Job

```
POST /api/conversions
  { statementId: 1, targetFormat: "MT940", engine: "PROWIDE" }
         |
   BatchJobService.launch()
         |
   statementExportJob
         |
  ┌──────────────────────────────────────────┐
  │ BankStatementItemReader                  │
  │   → join-fetch from H2 by statementId    │
  │ StatementExportProcessor                 │
  │   → map entity → domain record           │
  │   → validate (IBAN, currency, balances)  │
  │   → resolve strategy → export            │
  │ BankingFileWriter                        │
  │   → write to ./output/statement-1.mt940  │
  └──────────────────────────────────────────┘
```

Unique `runId` timestamp prevents Spring Batch from rejecting re-runs as duplicates.

---

# Conversion Engines

<div class="cols">

**Prowide Engine**
- Strongly-typed Java objects
- `MT940`, `Field60F`, `MxCamt05300108`
- SWIFT / ISO 20022 constraints enforced at compile time
- Field re-parse validation for MT
- XSD validation for camt XML
- Low risk, high type-safety

**Apache Velocity Engine**
- Declarative `.vm` templates
- `mt940.vm`, `camt053.vm`, ...
- Human-readable template editing
- Same post-generation validation gate
- Easy to adjust output format
- Low risk, high flexibility

</div>

**Both engines pass the same 3-stage validation: internal → MT re-parse → camt XSD**

---

# REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/random-statements` | Generate random BankStatement in H2 |
| `POST` | `/api/conversions` | Launch Spring Batch export job |
| `GET` | `/api/conversions/jobs` | List all job executions |
| `GET` | `/api/conversions/jobs/{id}` | Poll job status |
| `GET` | `/actuator/health` | Health + H2 + version indicator |
| `GET` | `/actuator/info` | Build metadata |

```bash
# Generate + convert in two calls
curl -X POST http://localhost:8081/api/random-statements | jq .firstStatementId

curl -X POST http://localhost:8081/api/conversions \
  -H "Content-Type: application/json" \
  -d '{"statementId":1,"targetFormat":"MT940","engine":"PROWIDE"}' | jq .
```

---

# Frontend — Vanilla HTML/JS SPA

## No React. No npm. No build step.

Three files in `src/main/resources/static/`:

| File | Role |
|------|------|
| `index.html` | Shell: header, sidebar nav, `<main>` container |
| `css/style.css` | CSS variables, layout, cards, tables, chips |
| `js/app.js` | Router, 6 view functions, API calls, charts |

**CDN at runtime (no local install):**
- Chart.js 4.4 — bar/line charts in Benchmarks view
- Mermaid 11 — live architecture diagrams

**6 views:** Dashboard · Generate · Conversion Runner · History · Benchmarks · Diagrams

Served directly by Spring Boot — open `http://localhost:8081`

---

# Quick Start

## Three Commands

```bash
# 1. Clone and build
git clone https://github.com/wallaceespindola/camt-mt-converters.git
cd camt-mt-converters
mvn clean install

# 2. Start the application
mvn spring-boot:run
# OR: ./run.sh  |  .\run.ps1  |  run.bat

# 3. Open the browser
open http://localhost:8081
```

**All endpoints up immediately:**

| URL | What you get |
|-----|-------------|
| `http://localhost:8081` | Web UI |
| `http://localhost:8081/swagger-ui.html` | API docs |
| `http://localhost:8081/h2-console` | Database console |
| `http://localhost:8081/actuator/health` | Health check |

---

# Testing Strategy

## 45 Tests, 0 Failures

| Category | Test Class | Coverage |
|----------|------------|---------|
| Strategy factory | `StrategyFactoryTest` | All 8 strategies resolved |
| Prowide output | `ProwideStrategyOutputTest` | 4 format validations |
| Velocity output | `VelocityStrategyOutputTest` | 4 format validations |
| Golden file | `GoldenFileTest` | Output snapshot testing |
| Batch integration | `BatchJobIntegrationTest` | Full job lifecycle |
| REST API | `RandomStatementControllerTest` | MockMvc |
| REST API | `StatementConversionControllerTest` | MockMvc |
| Actuator | `ActuatorTest` | Health + info endpoints |
| Swagger | `SwaggerAvailabilityTest` | OpenAPI spec accessible |

```bash
mvn verify    # runs all 46 tests + JaCoCo coverage check (≥40%)
```

---

# Key Takeaways

## What This Platform Demonstrates

- **Strategy Pattern** — 8 strategies, O(1) factory, zero branching, open for extension
- **Spring Batch** — parameterised jobs, chunk processing, idempotent re-runs
- **Dual-engine conversion** — type-safe Prowide + flexible Velocity, same validation gate
- **Single profile** — one `application.yml`, `mvn spring-boot:run` is all you need
- **Zero frontend toolchain** — vanilla HTML/JS served directly by Spring Boot
- **Cross-platform scripts** — pure ASCII `.sh` / `.ps1` / `.bat` run on macOS, Linux, Windows

---

**Try it:**
```
https://github.com/wallaceespindola/camt-mt-converters
```

*Wallace Espindola · linkedin.com/in/wallaceespindola · github.com/wallaceespindola*

---

<!-- _class: title -->

# Thank You

**Banking Statement Converter Platform**

github.com/wallaceespindola/camt-mt-converters

*Wallace Espindola*
wallace.espindola@gmail.com
linkedin.com/in/wallaceespindola
