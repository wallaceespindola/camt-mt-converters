package com.wtechitsolutions.bankingconverter.batch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobExecutionListener;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Spring Batch {@link JobExecutionListener} that logs job lifecycle events and computes wall-clock
 * duration for every execution of the statement export job.
 *
 * <p>Duration is derived from the job's own {@link JobExecution#getStartTime()} and
 * {@link JobExecution#getEndTime()} rather than from a manually captured start timestamp, which
 * keeps this listener stateless and safe for concurrent job executions in the same JVM.
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@Component
public class BatchJobMetricsListener implements JobExecutionListener {

    private static final Logger log = LoggerFactory.getLogger(BatchJobMetricsListener.class);

    /**
     * Logs job start details, including the job execution id and all resolved job parameters.
     *
     * @param jobExecution the current job execution
     */
    @Override
    public void beforeJob(JobExecution jobExecution) {
        log.info("Starting batch job: id={}, params={}", jobExecution.getId(), jobExecution.getJobParameters());
    }

    /**
     * Logs the final job status and wall-clock duration in milliseconds after the job completes,
     * fails, or is abandoned. Duration is reported as {@code 0} when either timestamp is absent.
     *
     * @param jobExecution the completed job execution
     */
    @Override
    public void afterJob(JobExecution jobExecution) {
        LocalDateTime start = jobExecution.getStartTime();
        LocalDateTime end = jobExecution.getEndTime();
        long durationMs = (start != null && end != null) ? Duration.between(start, end).toMillis() : 0;
        log.info("Batch job completed: id={}, status={}, durationMs={}",
                jobExecution.getId(), jobExecution.getStatus(), durationMs);
    }
}
