package com.wtechitsolutions.bankingconverter.config;

import com.wtechitsolutions.bankingconverter.batch.BankStatementItemReader;
import com.wtechitsolutions.bankingconverter.batch.BankingFileWriter;
import com.wtechitsolutions.bankingconverter.batch.BatchJobMetricsListener;
import com.wtechitsolutions.bankingconverter.batch.StatementExportProcessor;
import com.wtechitsolutions.bankingconverter.conversion.GeneratedBankingFile;
import com.wtechitsolutions.bankingconverter.persistence.entity.BankStatementEntity;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * Spring Batch job and step configuration for the banking statement export pipeline.
 *
 * <p>No {@code @EnableBatchProcessing} — Spring Boot 3.x auto-configures the batch infrastructure.
 * Chunk size of 1 processes each {@link BankStatementEntity} individually, which is appropriate
 * given that each statement maps to a distinct output file per format.
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@Configuration
public class BatchConfig {

    private final BankStatementItemReader itemReader;
    private final StatementExportProcessor itemProcessor;
    private final BankingFileWriter itemWriter;
    private final BatchJobMetricsListener metricsListener;

    public BatchConfig(BankStatementItemReader itemReader,
                       StatementExportProcessor itemProcessor,
                       BankingFileWriter itemWriter,
                       BatchJobMetricsListener metricsListener) {
        this.itemReader = itemReader;
        this.itemProcessor = itemProcessor;
        this.itemWriter = itemWriter;
        this.metricsListener = metricsListener;
    }

    @Bean
    public Job statementExportJob(JobRepository jobRepository, Step statementExportStep) {
        return new JobBuilder("statementExportJob", jobRepository)
                .listener(metricsListener)
                .start(statementExportStep)
                .build();
    }

    @Bean
    public Step statementExportStep(JobRepository jobRepository, PlatformTransactionManager txManager) {
        return new StepBuilder("statementExportStep", jobRepository)
                .<BankStatementEntity, GeneratedBankingFile>chunk(1, txManager)
                .reader(itemReader)
                .processor(itemProcessor)
                .writer(itemWriter)
                .build();
    }
}
