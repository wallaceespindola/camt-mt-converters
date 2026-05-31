# Banking Statement Converter — Google Slides

> **How to create Google Slides from this file:**
> 1. Open [Google Slides](https://slides.google.com) → *Blank presentation*
> 2. **File → Import slides** → Upload `banking-converter-slides.pptx`
>    — Google Slides fully imports the PPTX with layout, colours, and tables preserved.
> 3. Or use the slide-by-slide outline below to build manually.

---

## Slide-by-Slide Outline

---

### Slide 1 — Title

**Layout:** Title slide (full-bleed orange gradient background, white card)

| Element | Content |
|---------|---------|
| Heading | Banking Statement Converter |
| Subtitle | MT940 · MT942 · camt.052 · camt.053 |
| Tagline | Spring Boot · Spring Batch · Strategy Pattern |
| Author | Wallace Espindola |
| Links | github.com/wallaceespindola · linkedin.com/in/wallaceespindola |

**Speaker notes:**
Welcome. This presentation covers the Banking Statement Converter Platform — an enterprise reference implementation for generating and converting banking statement files in the four major formats used across European banking infrastructure.

---

### Slide 2 — Agenda

**Layout:** Content with orange header bar

1. The Problem — SWIFT MT & ISO 20022 migration
2. Supported Formats — Four banking file types
3. Architecture — System design overview
4. Tech Stack — Java 21, Spring Boot, Prowide, Velocity
5. Strategy Pattern — Eight conversion strategies
6. Spring Batch Pipeline — How conversion jobs run
7. Conversion Engines — Prowide vs Velocity
8. REST API — Endpoints and usage
9. Frontend — Vanilla HTML/JS SPA
10. Quick Start — Running in seconds
11. Testing — 46 tests, zero failures

---

### Slide 3 — The Problem

**Layout:** Two-column cards (red left, blue right) + amber banner

**Left card — SWIFT MT (Legacy):**
- Text-based tag format
- Used since the 1970s
- `:20:` `:25:` `:61:` `:86:` fields
- MT940 = end-of-day statement
- MT942 = intraday report

**Right card — ISO 20022 (Modern):**
- Structured XML with namespaces
- Mandated by ECB / EPC
- Validated against XSD schemas
- camt.053 = end-of-day statement
- camt.052 = intraday report

**Bottom banner:**
> SWIFT completed MX migration November 2025 — banks must support both formats during transition

**Speaker notes:**
European banking operates across two standards. SWIFT MT is the legacy text-based format that has powered interbank messaging for decades. ISO 20022 is the modern XML-based standard mandated by the European Central Bank and the European Payments Council. SWIFT's coexistence period ended in November 2025, making dual-format support non-negotiable.

---

### Slide 4 — Supported Formats

**Layout:** Orange-header table + info banner

| Standard | Format | Description | Equivalent |
|----------|--------|-------------|------------|
| SWIFT MT | MT940 | End-of-day customer statement | — |
| SWIFT MT | MT942 | Intraday transaction report | — |
| ISO 20022 | camt.053 | Bank-to-customer statement | = MT940 |
| ISO 20022 | camt.052 | Bank-to-customer account report | = MT942 |

**Banner:**
> This platform generates all four formats from a single internal domain model using two conversion engines: Prowide and Apache Velocity

---

### Slide 5 — Architecture Overview

**Layout:** Stacked layer cards (colour-coded by layer)

```
[ HTML/JS SPA ]                              ← orange
[ REST API ]                                 ← blue
[ Spring Batch — Reader → Processor → Writer ] ← green
[ Prowide Engine ] [ Velocity Engine ]        ← red / purple
[ output/ — .mt940 · .mt942 · .camt052.xml · .camt053.xml ] ← grey
```

**Speaker notes:**
The architecture follows a clean separation of concerns. The HTML/JS SPA communicates exclusively through the REST API. Spring Batch handles all conversion work as parameterised jobs. The strategy factory resolves the correct conversion implementation at runtime with O(1) map lookup.

---

### Slide 6 — Tech Stack

**Layout:** Two-column cards

**Backend:**
- Java 21 (LTS)
- Spring Boot 3.5
- Spring Batch 5
- Spring Data JPA + H2
- Prowide Core (MT940/942)
- Prowide ISO 20022 (camt)
- Apache Velocity 2.4
- MapStruct 1.6

**Frontend & Tooling:**
- Vanilla HTML / CSS / JS
- Chart.js 4.4 (charts)
- Mermaid 11 (diagrams)
- Springdoc / OpenAPI 3
- JUnit 5 + AssertJ
- JaCoCo (≥40% coverage)
- Maven 3.9

**Bottom banner:**
> No Node.js. No npm. No framework. Start with: `mvn spring-boot:run`

---

### Slide 7 — Strategy Pattern

**Layout:** Code block + strategy table

**Interface:**
```java
public interface StatementExportStrategy {
    ConversionTargetFormat targetFormat();
    ConversionEngine       engine();
    GeneratedBankingFile   export(BankStatement statement);
}
```

| Strategy Class | Format | Engine |
|----------------|--------|--------|
| InternalToMt940ProwideStrategy | MT940 | PROWIDE |
| InternalToMt942ProwideStrategy | MT942 | PROWIDE |
| InternalToCamt052ProwideStrategy | camt.052 | PROWIDE |
| InternalToCamt053ProwideStrategy | camt.053 | PROWIDE |
| InternalToMt940VelocityStrategy | MT940 | VELOCITY |
| InternalToMt942VelocityStrategy | MT942 | VELOCITY |
| InternalToCamt052VelocityStrategy | camt.052 | VELOCITY |
| InternalToCamt053VelocityStrategy | camt.053 | VELOCITY |

*Adding a new strategy: implement the interface + `@Component` — no factory changes required*

---

### Slide 8 — Spring Batch Pipeline

**Layout:** Stacked step cards

| Step | Detail |
|------|--------|
| POST /api/conversions | `{ statementId, targetFormat, engine }` |
| BatchJobService.launch() | Creates unique jobParameters with runId timestamp |
| BankStatementItemReader | Join-fetch BankStatementEntity + transactions from H2 |
| StatementExportProcessor | Map entity → domain → validate → resolve strategy → export() |
| BankingFileWriter | Write to `./output/statement-N.{mt940\|mt942\|camt052.xml\|camt053.xml}` |
| Response | jobId · status · outputFile · fileContent (preview) |

**Speaker notes:**
Every conversion is a Spring Batch job. The unique runId timestamp prevents Spring Batch from rejecting re-runs of the same statement as duplicate job instances. The processor is the only place strategy resolution happens — everything else is infrastructure.

---

### Slide 9 — Conversion Engines

**Layout:** Two-column cards + validation banner

**Prowide Engine:**
- Strongly-typed Java objects
- `MT940`, `Field60F`, `MxCamt05300108`
- SWIFT / ISO constraints at compile time
- Field re-parse validation (MT)
- XSD validation (camt XML)
- Low risk, high type-safety

**Apache Velocity Engine:**
- Declarative `.vm` templates
- `mt940.vm`, `mt942.vm`, `camt053.vm`
- Human-readable template editing
- Easy to adjust output format
- Same post-generation validation
- Low risk, high flexibility

**Bottom banner:**
> 3-stage validation: 1. Internal model (IBAN, balances) · 2. MT re-parse (Prowide field check) · 3. camt XSD (ISO 20022 schema)

---

### Slide 10 — REST API

**Layout:** Table + code block

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/random-statements | Generate random BankStatement in H2 |
| POST | /api/conversions | Launch Spring Batch export job |
| GET | /api/conversions/jobs | List all job executions (last 50) |
| GET | /api/conversions/jobs/{id} | Poll batch job status by ID |
| GET | /actuator/health | Health + H2 + version indicator |
| GET | /actuator/info | Build metadata (name, version, author) |

```bash
curl -X POST http://localhost:8080/api/conversions \
  -H "Content-Type: application/json" \
  -d '{"statementId":1,"targetFormat":"MT940","engine":"PROWIDE"}'
```

---

### Slide 11 — Frontend

**Layout:** File table + CDN banner + views table

| File | Description |
|------|-------------|
| `index.html` | SPA shell — header, sidebar nav, `<main>` container, footer |
| `css/style.css` | All styling — CSS variables, light/dark theme, cards, tables |
| `js/app.js` | Router, 6 view functions, API fetch calls, chart & diagram logic |

**CDN banner:**
> CDN at runtime: Chart.js 4.4 (charts) · Mermaid 11 (diagrams)

| View | Hash | Description |
|------|------|-------------|
| Dashboard | #dashboard | Health, info, job summary, quick-action cards |
| Generate | #generate | Seed H2 with LOW, MEDIUM, or HIGH load profile |
| Conversion Runner | #convert | Single run or all 8 format/engine combinations |
| History | #history | Auto-refreshing job table (every 15 s) |
| Benchmarks | #benchmarks | Duration by format/engine, timeline, status (30 s) |
| Diagrams | #diagrams | Live Mermaid architecture diagrams |

---

### Slide 12 — Quick Start

**Layout:** Code block + URL table

```bash
# 1. Clone and build
git clone https://github.com/wallaceespindola/camt-mt-converters.git
cd camt-mt-converters && mvn clean install

# 2. Start the application
mvn spring-boot:run
# OR:  ./run.sh  |  .\run.ps1  |  run.bat

# 3. Open the browser
open http://localhost:8080
```

| URL | Description |
|-----|-------------|
| http://localhost:8080 | Web UI — HTML/JS SPA |
| http://localhost:8080/swagger-ui.html | Swagger / OpenAPI docs |
| http://localhost:8080/h2-console | H2 in-memory database console |
| http://localhost:8080/actuator/health | Health endpoint |

---

### Slide 13 — Testing Strategy

**Layout:** Table + green banner

| Test Class | Category | Coverage |
|------------|----------|----------|
| StrategyFactoryTest | Strategy factory | All 8 strategies resolved correctly |
| ProwideStrategyOutputTest | Prowide output | 4 format validations |
| VelocityStrategyOutputTest | Velocity output | 4 format validations |
| GoldenFileTest | Golden file | Output snapshot testing |
| BatchJobIntegrationTest | Batch integration | Full job lifecycle |
| BankStatementMapperTest | Domain mapper | Entity → domain mapping |
| InternalStatementValidatorTest | Validation | IBAN, balances, transactions |
| RandomStatementControllerTest | REST statements | MockMvc, @MockitoBean |
| StatementConversionControllerTest | REST conversions | MockMvc, @MockitoBean |
| ActuatorTest | Actuator | Health + info endpoints |
| SwaggerAvailabilityTest | Swagger | OpenAPI spec accessible |

**Banner:**
> `mvn verify` — runs all 46 tests + JaCoCo coverage check

---

### Slide 14 — Key Takeaways

**Layout:** Orange-label rows

| Topic | Takeaway |
|-------|---------|
| Strategy Pattern | 8 strategies, O(1) factory, zero branching, open for extension |
| Spring Batch | Parameterised jobs, chunk processing, idempotent re-runs |
| Dual-Engine Conversion | Type-safe Prowide + flexible Velocity — same validation gate |
| Single Profile | One `application.yml`, `mvn spring-boot:run` is all you need |
| Zero Frontend Toolchain | Vanilla HTML/JS served directly by Spring Boot — no npm |
| Cross-Platform | Pure ASCII `.sh` / `.ps1` / `.bat` — macOS, Linux, Windows |

**Bottom link:**
> github.com/wallaceespindola/camt-mt-converters

---

### Slide 15 — Thank You

**Layout:** Orange full-bleed background, white centred card

| Element | Content |
|---------|---------|
| Heading | Thank You |
| Sub-heading | Banking Statement Converter Platform |
| Author | Wallace Espindola |
| Email | wallace.espindola@gmail.com |
| LinkedIn | linkedin.com/in/wallaceespindola |
| GitHub | github.com/wallaceespindola |
| Footer | github.com/wallaceespindola/camt-mt-converters |

---

## Recommended Google Slides Theme Settings

| Setting | Value |
|---------|-------|
| Slide size | Widescreen 16:9 (1920 × 1080) |
| Primary colour | #E64A19 (deep orange) |
| Secondary colour | #BF360C (dark orange) |
| Background | #FFFFFF |
| Heading font | Google Sans or Roboto Bold |
| Body font | Google Sans or Roboto Regular |
| Code font | Roboto Mono |

**Quickest path:** Import the `.pptx` — Google Slides preserves all formatting, tables, and colour blocks automatically.
