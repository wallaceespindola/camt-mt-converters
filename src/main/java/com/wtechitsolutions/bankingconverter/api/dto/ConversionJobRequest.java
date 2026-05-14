package com.wtechitsolutions.bankingconverter.api.dto;

import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for the statement conversion endpoint.
 *
 * @param statementId  the database ID of the {@code BankStatementEntity} to convert; must not be null
 * @param targetFormat the desired output format (MT940, MT942, CAMT052, CAMT053); must not be null
 * @param engine       the conversion engine to use (PROWIDE, VELOCITY, JAKARTA_XML_BINDING); must not be null
 */
public record ConversionJobRequest(
        @NotNull Long statementId,
        @NotNull ConversionTargetFormat targetFormat,
        @NotNull ConversionEngine engine) {}
