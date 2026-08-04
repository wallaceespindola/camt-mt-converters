package com.wtechitsolutions.bankingconverter.api.dto;

import java.time.Instant;

/**
 * Response DTO returned by the delete-all-data endpoint.
 *
 * @param statementsDeleted   number of bank statements removed from the database
 * @param transactionsDeleted number of bank transactions removed from the database
 * @param jobsDeleted         number of Spring Batch job instances removed from the history
 * @param filesDeleted        number of generated files removed from the output directory
 * @param timestamp           the instant at which this response was produced (ISO 8601)
 */
public record DataResetResponse(
        long statementsDeleted,
        long transactionsDeleted,
        long jobsDeleted,
        int filesDeleted,
        Instant timestamp) {}
