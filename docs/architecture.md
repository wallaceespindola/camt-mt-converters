# Architecture

## System Overview

```
REST API
  |
  v
RandomStatementService --> BankStatementEntity (H2)
  |
  v
Spring Batch Job (statementExportJob)
  |
  v
BankStatementItemReader --> BankStatementEntity
  |
  v
StatementExportProcessor --> BankStatementMapper --> BankStatement (domain)
  |
  v
StatementExportStrategyFactory --> StatementExportStrategy
  |
  v
GeneratedBankingFile
  |
  v
BankingFileWriter --> ./output/
```

## Strategy Matrix

| Strategy Class | Format | Engine |
|---|---|---|
| InternalToMt940ProwideStrategy | MT940 | PROWIDE |
| InternalToMt942ProwideStrategy | MT942 | PROWIDE |
| InternalToCamt052ProwideStrategy | camt.052 | PROWIDE |
| InternalToCamt053ProwideStrategy | camt.053 | PROWIDE |
| InternalToMt940VelocityStrategy | MT940 | VELOCITY |
| InternalToMt942VelocityStrategy | MT942 | VELOCITY |
| InternalToCamt052VelocityStrategy | camt.052 | VELOCITY |
| InternalToCamt053VelocityStrategy | camt.053 | VELOCITY |
| InternalToCamt052JakartaXmlBindingStrategy | camt.052 | JAKARTA_XML_BINDING |
| InternalToCamt053JakartaXmlBindingStrategy | camt.053 | JAKARTA_XML_BINDING |

## Key Design Decisions

- **Domain/Persistence separation**: Strategies only receive domain Records, never JPA entities
- **Strategy auto-discovery**: Spring DI injects all `StatementExportStrategy` beans; factory maps them by key
- **Three-stage validation**: internal model -> generation -> output re-parse/XSD check
- **Restartable batch**: unique `timestamp` parameter ensures each job launch is unique
