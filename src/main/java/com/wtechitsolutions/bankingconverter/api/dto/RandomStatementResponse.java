package com.wtechitsolutions.bankingconverter.api.dto;

import java.time.Instant;

/**
 * Response DTO returned by the random statement generation endpoint.
 *
 * @param firstStatementId      the database ID of the first persisted {@code BankStatementEntity},
 *                              or {@code null} if no statements were generated
 * @param statementsGenerated   total number of statements created in this generation run
 * @param transactionsGenerated total number of transactions created across all statements
 * @param accountsGenerated     size of the account (IBAN) pool used for this run
 * @param timestamp             the instant at which this response was produced (ISO 8601)
 */
public record RandomStatementResponse(
        Long firstStatementId,
        int statementsGenerated,
        int transactionsGenerated,
        int accountsGenerated,
        Instant timestamp) {}
