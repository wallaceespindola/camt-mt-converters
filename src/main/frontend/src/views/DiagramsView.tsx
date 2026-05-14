import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
} from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#00838F',
    primaryTextColor: '#fff',
    primaryBorderColor: '#006064',
    lineColor: '#555555',
    secondaryColor: '#E3F2FD',
    tertiaryColor: '#F3E5F5',
    fontSize: '14px',
  },
  securityLevel: 'loose',
  fontFamily: 'Inter, Roboto, sans-serif',
})

interface MermaidDiagramProps {
  chart: string
  id: string
}

// Safe: mermaid.render() produces sanitized SVG from a static string constant defined
// in this module — it is never sourced from user input or external data.
function MermaidDiagram({ chart, id }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const container = ref.current
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        container.replaceChildren()
        const wrapper = document.createElement('div')
        // eslint-disable-next-line no-unsanitized/property -- safe: mermaid-generated SVG from static source
        wrapper.innerHTML = svg
        container.appendChild(wrapper)
      })
      .catch((err: unknown) => {
        container.replaceChildren()
        const pre = document.createElement('pre')
        pre.style.color = 'red'
        pre.style.fontSize = '12px'
        pre.textContent = `Diagram render error: ${String(err)}`
        container.appendChild(pre)
      })
  }, [chart, id])

  return (
    <Box
      ref={ref}
      sx={{
        overflow: 'auto',
        '& svg': { maxWidth: '100%', height: 'auto' },
        minHeight: 80,
        display: 'flex',
        justifyContent: 'center',
      }}
    />
  )
}

// ── Diagram definitions ─────────────────────────────────────────────────────

const SYSTEM_ARCH = `%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#555555'}}}%%
graph TB
  subgraph Frontend["🖥 React SPA — MUI + Recharts + Mermaid"]
    UI["Dashboard · Generate · Runner · History · Charts · Benchmark · Diagrams"]
  end
  subgraph API["🔌 REST API Layer"]
    RS["RandomStatementController\\nPOST /api/random-statements"]
    CV["StatementConversionController\\nPOST /api/conversions\\nGET /api/conversions/jobs"]
    ACT["Spring Actuator\\n/actuator/health · /actuator/info"]
  end
  subgraph Batch["⚙ Spring Batch Pipeline"]
    JL[JobLauncher]
    JOB[statementExportJob]
    STEP["statementExportStep chunk-size=1"]
    READER[BankStatementItemReader]
    PROC[StatementExportProcessor]
    WRITER[BankingFileWriter]
  end
  subgraph Strategy["🔀 Strategy Pattern × 8 Implementations"]
    SF[StatementExportStrategyFactory]
    P4["Prowide Strategies\\nMT940 · MT942 · camt.052 · camt.053"]
    V4["Velocity Strategies\\nMT940 · MT942 · camt.052 · camt.053"]
  end
  subgraph Data["🗄 H2 In-Memory Database"]
    BS[(bank_statements)]
    BT[(bank_transactions)]
  end
  OUTPUT[("📁 output/\\n*.mt940 · *.mt942\\n*.camt052.xml · *.camt053.xml")]

  UI --> API
  RS --> Data
  CV --> JL --> JOB --> STEP
  STEP --> READER --> Data
  STEP --> PROC --> SF
  SF --> P4
  SF --> V4
  STEP --> WRITER --> OUTPUT

  classDef fe       fill:#E64A19,stroke:#BF360C,color:#fff
  classDef api      fill:#1565C0,stroke:#0D47A1,color:#fff
  classDef batch    fill:#2E7D32,stroke:#1B5E20,color:#fff
  classDef factory  fill:#00838F,stroke:#006064,color:#fff
  classDef prowide  fill:#BF360C,stroke:#7F0000,color:#fff
  classDef velocity fill:#7B1FA2,stroke:#4A148C,color:#fff
  classDef db       fill:#5D4037,stroke:#3E2723,color:#fff
  classDef out      fill:#546E7A,stroke:#37474F,color:#fff

  class UI fe
  class RS,CV,ACT api
  class JL,JOB,STEP,READER,PROC,WRITER batch
  class SF factory
  class P4 prowide
  class V4 velocity
  class BS,BT db
  class OUTPUT out

  style Frontend fill:#FFF3E0,stroke:#E64A19,stroke-width:2px
  style API      fill:#E3F2FD,stroke:#1565C0,stroke-width:2px
  style Batch    fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px
  style Strategy fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
  style Data     fill:#EFEBE9,stroke:#5D4037,stroke-width:2px`

const STRATEGY_CLASS = `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#00838F', 'primaryTextColor': '#fff', 'primaryBorderColor': '#006064', 'lineColor': '#555555'}}}%%
classDiagram
  class StatementExportStrategy {
    <<interface>>
    +targetFormat() ConversionTargetFormat
    +engine() ConversionEngine
    +export(statement) GeneratedBankingFile
    +key() StatementExportStrategyKey
  }
  class StatementExportStrategyFactory {
    +getStrategy(format, engine) StatementExportStrategy
    +hasStrategy(format, engine) boolean
  }
  class AbstractMtProwideStrategy {
    <<abstract>>
    #formatSwiftAmount(amount) String
    #formatField61(tx) String
    #formatField86(tx) String
  }
  class InternalToMt940ProwideStrategy { +targetFormat() MT940 +engine() PROWIDE }
  class InternalToMt942ProwideStrategy { +targetFormat() MT942 +engine() PROWIDE }
  class InternalToCamt052ProwideStrategy { +targetFormat() CAMT052 +engine() PROWIDE }
  class InternalToCamt053ProwideStrategy { +targetFormat() CAMT053 +engine() PROWIDE }
  class InternalToMt940VelocityStrategy { +targetFormat() MT940 +engine() VELOCITY }
  class InternalToMt942VelocityStrategy { +targetFormat() MT942 +engine() VELOCITY }
  class InternalToCamt052VelocityStrategy { +targetFormat() CAMT052 +engine() VELOCITY }
  class InternalToCamt053VelocityStrategy { +targetFormat() CAMT053 +engine() VELOCITY }

  StatementExportStrategy <|.. AbstractMtProwideStrategy
  StatementExportStrategy <|.. InternalToCamt052ProwideStrategy
  StatementExportStrategy <|.. InternalToCamt053ProwideStrategy
  StatementExportStrategy <|.. InternalToMt940VelocityStrategy
  StatementExportStrategy <|.. InternalToMt942VelocityStrategy
  StatementExportStrategy <|.. InternalToCamt052VelocityStrategy
  StatementExportStrategy <|.. InternalToCamt053VelocityStrategy
  AbstractMtProwideStrategy <|-- InternalToMt940ProwideStrategy
  AbstractMtProwideStrategy <|-- InternalToMt942ProwideStrategy
  StatementExportStrategyFactory --> StatementExportStrategy

  style StatementExportStrategy        fill:#00838F,stroke:#006064,color:#fff
  style StatementExportStrategyFactory fill:#00838F,stroke:#006064,color:#fff
  style AbstractMtProwideStrategy      fill:#E65100,stroke:#BF360C,color:#fff
  style InternalToMt940ProwideStrategy fill:#BF360C,stroke:#7F0000,color:#fff
  style InternalToMt942ProwideStrategy fill:#BF360C,stroke:#7F0000,color:#fff
  style InternalToCamt052ProwideStrategy fill:#BF360C,stroke:#7F0000,color:#fff
  style InternalToCamt053ProwideStrategy fill:#BF360C,stroke:#7F0000,color:#fff
  style InternalToMt940VelocityStrategy fill:#7B1FA2,stroke:#4A148C,color:#fff
  style InternalToMt942VelocityStrategy fill:#7B1FA2,stroke:#4A148C,color:#fff
  style InternalToCamt052VelocityStrategy fill:#7B1FA2,stroke:#4A148C,color:#fff
  style InternalToCamt053VelocityStrategy fill:#7B1FA2,stroke:#4A148C,color:#fff`

const BATCH_SEQUENCE = `%%{init: {'theme': 'base', 'themeVariables': {'actorBkg': '#1565C0', 'actorBorder': '#0D47A1', 'actorTextColor': '#fff', 'noteBkgColor': '#FFF3E0', 'noteTextColor': '#BF360C', 'noteBorderColor': '#E64A19', 'activationBorderColor': '#E64A19', 'activationBkgColor': '#FFF3E0', 'signalColor': '#333', 'signalTextColor': '#333'}}}%%
sequenceDiagram
  box rgb(255,243,224) Client
    participant FE as React Frontend
  end
  box rgb(227,242,253) REST API
    participant RS as RandomStatementController
    participant CV as StatementConversionController
  end
  box rgb(232,245,233) Service Layer
    participant SVC as RandomStatementService
    participant BJS as BatchJobService
  end
  box rgb(243,229,245) Spring Batch
    participant IR as BankStatementItemReader
    participant IP as StatementExportProcessor
    participant SF as StrategyFactory
    participant ST as ExportStrategy
    participant IW as BankingFileWriter
  end
  box rgb(239,235,233) Storage
    participant DB as H2 Database
    participant FS as output/
  end

  rect rgb(255,243,224)
    Note over FE,DB: Phase 1 — Generate statement data
    FE->>RS: POST /api/random-statements?loadProfile=LOW
    RS->>SVC: generate(LOW)
    SVC->>DB: save BankStatementEntity + BankTransactionEntities
    SVC-->>FE: firstStatementId · statementsGenerated · transactionsGenerated
  end

  rect rgb(232,245,233)
    Note over FE,FS: Phase 2 — Spring Batch conversion job
    FE->>CV: POST /api/conversions {statementId, targetFormat:MT940, engine:PROWIDE}
    CV->>BJS: launch(statementId, MT940, PROWIDE)
    BJS->>IR: @BeforeStep — load statementId from JobParameters
    IR->>DB: findByIdWithTransactions(statementId)
    DB-->>IR: BankStatementEntity + transactions
    BJS->>IP: process(BankStatementEntity)
    IP->>SF: getStrategy(MT940, PROWIDE)
    SF-->>IP: InternalToMt940ProwideStrategy
    IP->>ST: export(BankStatement)
    ST-->>IP: GeneratedBankingFile
    IP->>IW: write([GeneratedBankingFile])
    IW->>FS: write statement-N.mt940
    IW-->>BJS: COMPLETED · outputFile · fileContent
    CV-->>FE: jobId · status:COMPLETED · outputFile · fileContent
  end`

const CONVERSION_FLOW = `%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#555555'}}}%%
flowchart LR
  INPUT["📄 Internal Domain Model\\nBankStatement · BankTransaction"]

  subgraph VALIDATE["🛡 3-Stage Validation"]
    VA["① Internal Model\\nValidator"]
    VB["② MT Re-parse\\nvia Prowide Core"]
    VC["③ camt XSD\\nISO 20022 Schema"]
  end

  subgraph PROWIDE["🔶 Prowide Engine"]
    P1["MT940\\nProwide Core"]
    P2["MT942\\nProwide Core"]
    P3["camt.052\\nProwide ISO 20022"]
    P4["camt.053\\nProwide ISO 20022"]
  end

  subgraph VELOCITY["🟣 Velocity Engine"]
    V1["MT940\\nmt940.vm"]
    V2["MT942\\nmt942.vm"]
    V3["camt.052\\ncamt052.vm"]
    V4["camt.053\\ncamt053.vm"]
  end

  OUT1["📄 statement-N.mt940\\nSWIFT MT940"]
  OUT2["📄 statement-N.mt942\\nSWIFT MT942"]
  OUT3["📋 statement-N.camt052.xml\\nISO 20022"]
  OUT4["📋 statement-N.camt053.xml\\nISO 20022"]

  INPUT --> VALIDATE
  VALIDATE --> PROWIDE
  VALIDATE --> VELOCITY
  P1 --> OUT1
  P2 --> OUT2
  P3 --> OUT3
  P4 --> OUT4
  V1 --> OUT1
  V2 --> OUT2
  V3 --> OUT3
  V4 --> OUT4

  classDef input   fill:#546E7A,stroke:#37474F,color:#fff
  classDef val     fill:#F57F17,stroke:#E65100,color:#fff
  classDef prowide fill:#BF360C,stroke:#7F0000,color:#fff
  classDef vel     fill:#7B1FA2,stroke:#4A148C,color:#fff
  classDef mt      fill:#003087,stroke:#001A52,color:#fff
  classDef camt    fill:#0070AD,stroke:#004E7A,color:#fff

  class INPUT input
  class VA,VB,VC val
  class P1,P2,P3,P4 prowide
  class V1,V2,V3,V4 vel
  class OUT1,OUT2 mt
  class OUT3,OUT4 camt

  style VALIDATE fill:#FFF8E1,stroke:#F57F17,stroke-width:2px
  style PROWIDE  fill:#FBE9E7,stroke:#BF360C,stroke-width:2px
  style VELOCITY fill:#EDE7F6,stroke:#7B1FA2,stroke-width:2px`

const DB_SCHEMA = `%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#5D4037', 'primaryTextColor': '#fff', 'primaryBorderColor': '#3E2723', 'lineColor': '#5D4037', 'attributeBackgroundColorEven': '#FFF8E1', 'attributeBackgroundColorOdd': '#EFEBE9'}}}%%
erDiagram
  bank_statements {
    bigint id PK "Primary Key"
    varchar statement_reference "Unique statement ref"
    varchar account_iban "IBAN — ISO 13616"
    varchar account_currency "ISO 4217 currency code"
    date statement_date "Statement period date"
    decimal opening_balance "Opening balance (Field 60F)"
    decimal closing_balance "Closing balance (Field 62F)"
  }
  bank_transactions {
    bigint id PK "Primary Key"
    bigint statement_id FK "FK to bank_statements"
    date booking_date "Booking date"
    date value_date "Value date"
    decimal amount "Transaction amount"
    varchar currency "ISO 4217 currency code"
    varchar debit_credit_indicator "DEBIT or CREDIT"
    varchar transaction_reference "Transaction ref (Field 61)"
    varchar counterparty_name "Counterparty name"
    varchar remittance_information "Payment narrative (Field 86)"
    varchar bank_transaction_code "BTC domain code"
  }
  bank_statements ||--o{ bank_transactions : "contains"`

const DIAGRAMS = [
  {
    id: 'mermaid-system-arch',
    title: '1. System Architecture',
    description:
      'End-to-end architecture: React SPA → REST API → Spring Batch → Strategy Pattern (8 implementations) → output files',
    chart: SYSTEM_ARCH,
  },
  {
    id: 'mermaid-strategy-class',
    title: '2. Strategy Pattern — Class Diagram',
    description:
      '8 export strategies (4 formats × 2 engines: Prowide + Velocity) all implementing StatementExportStrategy',
    chart: STRATEGY_CLASS,
  },
  {
    id: 'mermaid-batch-sequence',
    title: '3. Spring Batch Execution — Sequence Diagram',
    description:
      'Full request lifecycle: statement generation through Spring Batch pipeline to file output',
    chart: BATCH_SEQUENCE,
  },
  {
    id: 'mermaid-conversion-flow',
    title: '4. Conversion Flow — Engines & Formats',
    description:
      'Internal domain model through 3-stage validation into Prowide and Velocity engines producing 4 output formats',
    chart: CONVERSION_FLOW,
  },
  {
    id: 'mermaid-db-schema',
    title: '5. Database Schema (H2 In-Memory)',
    description:
      'bank_statements ↔ bank_transactions one-to-many relationship with SWIFT MT field annotations',
    chart: DB_SCHEMA,
  },
]

export default function DiagramsView() {
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
        <AccountTreeIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4" fontWeight={700}>
          Architecture Diagrams
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Interactive Mermaid diagrams — architecture, design patterns, batch execution flow,
        conversion pipeline, and database schema. All color-coded by layer.
      </Typography>

      <Grid container spacing={3}>
        {DIAGRAMS.map((diagram) => (
          <Grid item xs={12} key={diagram.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="primary" mb={0.5}>
                  {diagram.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {diagram.description}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <MermaidDiagram chart={diagram.chart} id={diagram.id} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
