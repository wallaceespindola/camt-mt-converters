package com.wtechitsolutions.bankingconverter.api.dto;

import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;

import java.time.Instant;

/**
 * Response DTO returned immediately after a conversion job is launched and completes.
 *
 * @param jobId        the Spring Batch job execution ID assigned to this run
 * @param targetFormat the output format used for this conversion
 * @param engine       the conversion engine used for this conversion
 * @param status       the batch status string (e.g., {@code COMPLETED}, {@code FAILED})
 * @param outputFile   the name of the generated output file, or empty string if unavailable
 * @param fileContent  the raw content of the generated file, or empty string if unavailable
 * @param timestamp    the instant at which this response was produced (ISO 8601)
 */
public record ConversionJobResponse(
        Long jobId,
        ConversionTargetFormat targetFormat,
        ConversionEngine engine,
        String status,
        String outputFile,
        String fileContent,
        Instant timestamp) {}
