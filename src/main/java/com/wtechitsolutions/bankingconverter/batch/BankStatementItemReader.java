package com.wtechitsolutions.bankingconverter.batch;

import com.wtechitsolutions.bankingconverter.persistence.entity.BankStatementEntity;
import com.wtechitsolutions.bankingconverter.persistence.repository.BankStatementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.annotation.BeforeStep;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemReader;
import org.springframework.stereotype.Component;

/**
 * Spring Batch {@link ItemReader} that loads a single {@link BankStatementEntity} — including its
 * transactions via an eager join-fetch query — from the database before step execution begins.
 *
 * <p>Because the pipeline processes one statement per job run, the reader returns the entity exactly
 * once and {@code null} on every subsequent call, which signals Spring Batch that the chunk is
 * exhausted.
 *
 * <p>The required job parameter {@code statementId} is resolved in {@link #beforeStep(StepExecution)}
 * so that the reader is fully initialised before the step's chunk-oriented loop begins.
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@Component
@StepScope
public class BankStatementItemReader implements ItemReader<BankStatementEntity> {

    private static final Logger log = LoggerFactory.getLogger(BankStatementItemReader.class);

    private final BankStatementRepository repository;
    private BankStatementEntity statement;
    private boolean alreadyRead = false;

    public BankStatementItemReader(BankStatementRepository repository) {
        this.repository = repository;
    }

    /**
     * Resolves the {@code statementId} job parameter and pre-loads the statement with all
     * transactions before the step's read-process-write loop starts.
     *
     * @param stepExecution the current step execution, used to access job parameters
     * @throws IllegalArgumentException if {@code statementId} is absent or no matching record exists
     */
    @BeforeStep
    public void beforeStep(StepExecution stepExecution) {
        Long statementId = stepExecution.getJobParameters().getLong("statementId");
        if (statementId == null) {
            throw new IllegalArgumentException("Job parameter 'statementId' is required");
        }
        statement = repository.findByIdWithTransactions(statementId)
                .orElseThrow(() -> new IllegalArgumentException("BankStatement not found: " + statementId));
        log.info("Reader loaded statement: id={}, ref={}, txns={}",
                statement.getId(), statement.getStatementReference(), statement.getTransactions().size());
    }

    /**
     * Returns the pre-loaded statement on the first call, then {@code null} to signal end-of-input.
     *
     * @return the loaded {@link BankStatementEntity}, or {@code null} when already consumed
     */
    @Override
    public BankStatementEntity read() {
        if (alreadyRead) {
            return null;
        }
        alreadyRead = true;
        return statement;
    }
}
