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

// Initialize mermaid once at module level
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
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
        // svg is produced by the mermaid library from a static string constant
        // defined in this module — not from any user input or API response.
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

const SYSTEM_ARCH = `graph TB
  subgraph Frontend["React SPA (MUI + Recharts + Mermaid)"]
    UI[Dashboard / Generate / Runner / History / Charts / Diagrams]
  end
  subgraph API["REST API Layer"]
    RS[POST /api/random-statements]
    CV[POST /api/conversions]
    JH[GET /api/conversions/jobs]
    ACT[GET /actuator/health|info]
  end
  subgraph Batch["Spring Batch Pipeline"]
    IR[BankStatementItemReader]
    IP[StatementExportProcessor]
    IW[BankingFileWriter]
  end
  subgraph Strategy["Strategy Pattern x 8"]
    SF[StatementExportStrategyFactory]
    P4[4 Prowide Strategies]
    V4[4 Velocity Strategies]
  end
  subgraph Data["H2 In-Memory Database"]
    BS[(bank_statements)]
    BT[(bank_transactions)]
  end
  OUTPUT[(output/ files)]
  UI --> API
  RS --> Data
  CV --> Batch
  Batch --> Strategy
  Strategy --> IW --> OUTPUT
  IR --> Data`

const STRATEGY_CLASS = `classDiagram
  class StatementExportStrategy {
    interface
    +targetFormat() ConversionTargetFormat
    +engine() ConversionEngine
    +export(statement) GeneratedBankingFile
    +key() StatementExportStrategyKey
  }
  class InternalToMt940ProwideStrategy { +targetFormat() MT940 +engine() PROWIDE }
  class InternalToMt942ProwideStrategy { +targetFormat() MT942 +engine() PROWIDE }
  class InternalToCamt052ProwideStrategy { +targetFormat() CAMT052 +engine() PROWIDE }
  class InternalToCamt053ProwideStrategy { +targetFormat() CAMT053 +engine() PROWIDE }
  class InternalToMt940VelocityStrategy { +targetFormat() MT940 +engine() VELOCITY }
  class InternalToMt942VelocityStrategy { +targetFormat() MT942 +engine() VELOCITY }
  class InternalToCamt052VelocityStrategy { +targetFormat() CAMT052 +engine() VELOCITY }
  class InternalToCamt053VelocityStrategy { +targetFormat() CAMT053 +engine() VELOCITY }
  class StatementExportStrategyFactory { +getStrategy(format, engine) StatementExportStrategy }
  StatementExportStrategy <|.. InternalToMt940ProwideStrategy
  StatementExportStrategy <|.. InternalToMt942ProwideStrategy
  StatementExportStrategy <|.. InternalToCamt052ProwideStrategy
  StatementExportStrategy <|.. InternalToCamt053ProwideStrategy
  StatementExportStrategy <|.. InternalToMt940VelocityStrategy
  StatementExportStrategy <|.. InternalToMt942VelocityStrategy
  StatementExportStrategy <|.. InternalToCamt052VelocityStrategy
  StatementExportStrategy <|.. InternalToCamt053VelocityStrategy
  StatementExportStrategyFactory --> StatementExportStrategy`

const BATCH_SEQUENCE = `sequenceDiagram
  participant FE as Frontend
  participant RS as RandomStatementController
  participant SVC as RandomStatementService
  participant CV as StatementConversionController
  participant BJS as BatchJobService
  participant IR as BankStatementItemReader
  participant IP as StatementExportProcessor
  participant SF as StrategyFactory
  participant ST as ExportStrategy
  participant IW as BankingFileWriter
  participant DB as H2 Database
  participant FS as output/

  FE->>RS: POST /api/random-statements
  RS->>SVC: generate(LOW or HIGH)
  SVC->>DB: save BankStatementEntity + transactions
  SVC-->>FE: firstStatementId statementsGenerated transactionsGenerated

  FE->>CV: POST /api/conversions statementId targetFormat engine
  CV->>BJS: launch(statementId, targetFormat, engine)
  BJS->>IR: read()
  IR->>DB: findByIdWithTransactions(statementId)
  BJS->>IP: process(entity)
  IP->>SF: getStrategy(targetFormat, engine)
  SF-->>IP: StatementExportStrategy
  IP->>ST: export(BankStatement)
  ST-->>IP: GeneratedBankingFile
  IP->>IW: write(file)
  IW->>FS: write output file
  IW-->>CV: jobId status outputFile fileContent
  CV-->>FE: ConversionJobResponse`

const DB_SCHEMA = `erDiagram
  bank_statements {
    bigint id PK
    varchar statement_reference
    varchar account_iban
    varchar account_currency
    date statement_date
    decimal opening_balance
    decimal closing_balance
  }
  bank_transactions {
    bigint id PK
    bigint statement_id FK
    date booking_date
    date value_date
    decimal amount
    varchar currency
    varchar debit_credit_indicator
    varchar transaction_reference
    varchar counterparty_name
    varchar remittance_information
    varchar bank_transaction_code
  }
  bank_statements ||--o{ bank_transactions : "contains"`

const DIAGRAMS = [
  {
    id: 'mermaid-system-arch',
    title: '1. System Architecture',
    description:
      'End-to-end architecture: React SPA to REST API to Spring Batch to Strategy Pattern to Output files',
    chart: SYSTEM_ARCH,
  },
  {
    id: 'mermaid-strategy-class',
    title: '2. Strategy Pattern — Class Diagram',
    description:
      '8 export strategies (4 formats x 2 engines: Prowide + Velocity) all implementing StatementExportStrategy',
    chart: STRATEGY_CLASS,
  },
  {
    id: 'mermaid-batch-sequence',
    title: '3. Spring Batch Execution — Sequence Diagram',
    description:
      'Full request lifecycle from statement generation through Spring Batch pipeline to file output',
    chart: BATCH_SEQUENCE,
  },
  {
    id: 'mermaid-db-schema',
    title: '4. Database Schema (H2 In-Memory)',
    description:
      'bank_statements to bank_transactions one-to-many relationship stored in H2 during runtime',
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
        Interactive Mermaid diagrams showing system architecture, design patterns, batch execution
        flow, and database schema.
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
