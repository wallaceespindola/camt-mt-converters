package com.wtechitsolutions.bankingconverter.api.dto;

import java.time.Instant;

/**
 * Response DTO representing the current or final state of a Spring Batch job execution,
 * as returned by the job history and job-by-ID endpoints.
 *
 * @param jobId           the Spring Batch job execution ID
 * @param status          the batch status string (e.g., {@code COMPLETED}, {@code FAILED})
 * @param exitDescription the exit description from the batch {@code ExitStatus}, if any
 * @param targetFormat    the output format resolved from job parameters, or {@code UNKNOWN}
 * @param engine          the conversion engine resolved from job parameters, or {@code UNKNOWN}
 * @param outputFile      the name of the generated output file stored in step execution context
 * @param createTime      when the job execution was created (UTC)
 * @param startTime       when the job execution started (UTC), or {@code null} if not yet started
 * @param endTime         when the job execution ended (UTC), or {@code null} if still running
 * @param durationMs      wall-clock duration of the job in milliseconds, or {@code 0} if incomplete
 * @param timestamp       the instant at which this response was produced (ISO 8601)
 */
public record ConversionJobStatusResponse(
        Long jobId,
        String status,
        String exitDescription,
        String targetFormat,
        String engine,
        String outputFile,
        Instant createTime,
        Instant startTime,
        Instant endTime,
        long durationMs,
        Instant timestamp) {}
