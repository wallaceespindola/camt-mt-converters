package com.wtechitsolutions.bankingconverter.api;

import com.wtechitsolutions.bankingconverter.api.dto.DataResetResponse;
import com.wtechitsolutions.bankingconverter.persistence.repository.BankStatementRepository;
import com.wtechitsolutions.bankingconverter.persistence.repository.BankTransactionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

/**
 * REST controller that wipes all generated data so a fresh generation run can start:
 * bank statements and transactions in H2, Spring Batch job history, and generated
 * files in the output directory.
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@RestController
@RequestMapping("/api/data")
@Tag(name = "Data", description = "Bulk data management")
public class DataResetController {

    private static final Logger log = LoggerFactory.getLogger(DataResetController.class);

    /** Spring Batch metadata tables, ordered so foreign-key children are deleted first. */
    private static final List<String> BATCH_TABLES = List.of(
            "BATCH_STEP_EXECUTION_CONTEXT",
            "BATCH_JOB_EXECUTION_CONTEXT",
            "BATCH_STEP_EXECUTION",
            "BATCH_JOB_EXECUTION_PARAMS",
            "BATCH_JOB_EXECUTION",
            "BATCH_JOB_INSTANCE");

    private final BankStatementRepository statementRepository;
    private final BankTransactionRepository transactionRepository;
    private final JdbcTemplate jdbcTemplate;

    @Value("${banking.converter.output-directory:./output}")
    private String outputDirectory;

    public DataResetController(BankStatementRepository statementRepository,
                               BankTransactionRepository transactionRepository,
                               JdbcTemplate jdbcTemplate) {
        this.statementRepository = statementRepository;
        this.transactionRepository = transactionRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Deletes all generated statement data, all Spring Batch job history, and all files
     * in the output directory ({@code .gitkeep} is preserved).
     *
     * @return a {@link DataResetResponse} with the counts of everything removed
     */
    @DeleteMapping
    @Transactional
    @Operation(
            summary = "Delete all generated data",
            description = "Removes every BankStatement and BankTransaction from H2, clears the "
                    + "Spring Batch job history tables, and deletes all generated files from the "
                    + "output directory. Use this to start a fresh generation run.")
    public ResponseEntity<DataResetResponse> deleteAll() {
        long statements = statementRepository.count();
        long transactions = transactionRepository.count();
        statementRepository.deleteAll();

        long jobs = 0;
        for (String table : BATCH_TABLES) {
            int deleted = jdbcTemplate.update("DELETE FROM " + table);
            if ("BATCH_JOB_INSTANCE".equals(table)) {
                jobs = deleted;
            }
        }

        int files = deleteOutputFiles();
        log.info("Deleted all data: statements={}, transactions={}, jobs={}, files={}",
                statements, transactions, jobs, files);
        return ResponseEntity.ok(new DataResetResponse(statements, transactions, jobs, files, Instant.now()));
    }

    private int deleteOutputFiles() {
        Path dir = Path.of(outputDirectory);
        if (!Files.isDirectory(dir)) {
            return 0;
        }
        try (Stream<Path> entries = Files.list(dir)) {
            int deleted = 0;
            for (Path file : entries.filter(Files::isRegularFile)
                    .filter(f -> !".gitkeep".equals(f.getFileName().toString()))
                    .toList()) {
                Files.delete(file);
                deleted++;
            }
            return deleted;
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to clean output directory " + outputDirectory, e);
        }
    }
}
