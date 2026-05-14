package com.wtechitsolutions.bankingconverter.batch;

import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;
import com.wtechitsolutions.bankingconverter.exception.JobLaunchException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/**
 * Facade service that launches the Spring Batch {@code statementExportJob} and exposes
 * read-only access to job execution history via {@link JobExplorer}.
 *
 * <p>Each invocation of {@link #launch} creates a unique set of job parameters (including a
 * {@code runId} timestamp) so that the same statement can be re-converted without Spring Batch
 * treating the request as a duplicate execution.
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@Service
public class BatchJobService {

    private static final Logger log = LoggerFactory.getLogger(BatchJobService.class);

    private static final int HISTORY_LIMIT = 50;

    private final JobLauncher jobLauncher;
    private final Job statementExportJob;
    private final JobExplorer jobExplorer;

    public BatchJobService(JobLauncher jobLauncher, Job statementExportJob, JobExplorer jobExplorer) {
        this.jobLauncher = jobLauncher;
        this.statementExportJob = statementExportJob;
        this.jobExplorer = jobExplorer;
    }

    /**
     * Launches the statement export batch job synchronously.
     *
     * @param statementId  the database ID of the {@code BankStatementEntity} to convert
     * @param targetFormat the desired output format
     * @param engine       the conversion engine to use
     * @return a {@link BatchJobResult} summarising the completed execution
     * @throws JobLaunchException if the job cannot be launched or fails to execute
     */
    public BatchJobResult launch(Long statementId, ConversionTargetFormat targetFormat, ConversionEngine engine) {
        log.info("Launching batch job: statementId={}, format={}, engine={}", statementId, targetFormat, engine);
        try {
            JobParameters params = new JobParametersBuilder()
                    .addLong("statementId", statementId)
                    .addString("targetFormat", targetFormat.name())
                    .addString("engine", engine.name())
                    .addLong("runId", System.currentTimeMillis())
                    .toJobParameters();

            JobExecution execution = jobLauncher.run(statementExportJob, params);

            String outputFile = execution.getStepExecutions().stream()
                    .findFirst()
                    .map(s -> s.getExecutionContext().getString("outputFile", ""))
                    .orElse("");

            String fileContent = execution.getStepExecutions().stream()
                    .findFirst()
                    .map(s -> s.getExecutionContext().getString("fileContent", ""))
                    .orElse("");

            log.info("Batch job completed: executionId={}, status={}", execution.getId(), execution.getStatus());
            return new BatchJobResult(execution.getId(), execution.getStatus().name(), outputFile, fileContent);

        } catch (Exception ex) {
            log.error("Failed to launch batch job for statementId={}: {}", statementId, ex.getMessage(), ex);
            throw new JobLaunchException("Failed to launch conversion job for statementId=" + statementId, ex);
        }
    }

    /**
     * Returns the most recent {@value #HISTORY_LIMIT} job executions for {@code statementExportJob},
     * ordered by execution ID descending (most recent first).
     *
     * @return list of {@link JobExecution} objects, never {@code null}
     */
    public List<JobExecution> getHistory() {
        return jobExplorer.findJobInstancesByJobName(statementExportJob.getName(), 0, HISTORY_LIMIT)
                .stream()
                .flatMap(instance -> jobExplorer.getJobExecutions(instance).stream())
                .sorted(Comparator.comparingLong(JobExecution::getId).reversed())
                .toList();
    }

    /**
     * Retrieves a single job execution by its Spring Batch execution ID.
     *
     * @param jobId the Spring Batch job execution ID
     * @return the {@link JobExecution}, or {@code null} if not found
     */
    public JobExecution getJobExecution(Long jobId) {
        return jobExplorer.getJobExecution(jobId);
    }

    /**
     * Immutable result record returned after a batch job completes.
     *
     * @param jobExecutionId the Spring Batch job execution ID assigned to this run
     * @param status         the batch status string (e.g., {@code COMPLETED}, {@code FAILED})
     * @param outputFile     the name of the generated output file, or empty string if unavailable
     * @param fileContent    the raw content of the generated file, or empty string if unavailable
     */
    public record BatchJobResult(
            Long jobExecutionId,
            String status,
            String outputFile,
            String fileContent
    ) {}
}
