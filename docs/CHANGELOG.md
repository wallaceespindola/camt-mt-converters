# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Initial project setup with Spring Boot 3.4.x, Spring Batch, Spring Data JPA
- Internal domain model: BankStatement, BankTransaction, DebitCreditIndicator
- H2 in-memory persistence layer with BankStatementEntity, BankTransactionEntity
- Strategy Pattern: StatementExportStrategy interface with StatementExportStrategyFactory
- Four Prowide conversion strategies: MT940, MT942, camt.052, camt.053
- Four Apache Velocity template-based strategies: MT940, MT942, camt.052, camt.053
- Two Jakarta XML Binding strategies: camt.052, camt.053
- Spring Batch pipeline: BankStatementItemReader -> StatementExportProcessor -> BankingFileWriter
- REST API: POST /api/random-statements, POST /api/conversions, GET /api/conversions/jobs
- Spring Actuator health and info endpoints
- Swagger UI (dev profile only)
- GitHub Actions: build, test, CodeQL, release
- Dependabot for Maven and GitHub Actions
- Makefile with build, run, test, clean, kill, lint, docs, help targets
- Golden file examples for MT940, MT942, camt.052, camt.053
