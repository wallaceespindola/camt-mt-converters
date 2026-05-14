package com.wtechitsolutions.bankingconverter.batch;

import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;
import com.wtechitsolutions.bankingconverter.conversion.GeneratedBankingFile;
import com.wtechitsolutions.bankingconverter.conversion.StatementExportStrategy;
import com.wtechitsolutions.bankingconverter.conversion.StatementExportStrategyFactory;
import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.mapper.BankStatementMapper;
import com.wtechitsolutions.bankingconverter.persistence.entity.BankStatementEntity;
import com.wtechitsolutions.bankingconverter.validation.InternalStatementValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.annotation.BeforeStep;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

/**
 * Spring Batch {@link ItemProcessor} that converts a {@link BankStatementEntity} into a
 * {@link GeneratedBankingFile} using the conversion strategy selected by the job parameters.
 *
 * <p>Processing pipeline per item:
 * <ol>
 *   <li>Map the JPA entity to the domain record via {@link BankStatementMapper}.</li>
 *   <li>Validate the domain record with {@link InternalStatementValidator}.</li>
 *   <li>Resolve the appropriate {@link StatementExportStrategy} from the factory.</li>
 *   <li>Delegate to the strategy to produce the output file representation.</li>
 * </ol>
 *
 * <p>The {@code targetFormat} and {@code engine} job parameters are resolved once in
 * {@link #beforeStep(StepExecution)} and reused for every item in the chunk.
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@Component
@StepScope
public class StatementExportProcessor implements ItemProcessor<BankStatementEntity, GeneratedBankingFile> {

    private static final Logger log = LoggerFactory.getLogger(StatementExportProcessor.class);

    private final StatementExportStrategyFactory strategyFactory;
    private final BankStatementMapper mapper;
    private final InternalStatementValidator validator;

    private ConversionTargetFormat targetFormat;
    private ConversionEngine engine;

    public StatementExportProcessor(StatementExportStrategyFactory strategyFactory,
                                    BankStatementMapper mapper,
                                    InternalStatementValidator validator) {
        this.strategyFactory = strategyFactory;
        this.mapper = mapper;
        this.validator = validator;
    }

    /**
     * Resolves the {@code targetFormat} and {@code engine} job parameters before the step loop
     * begins. Defaults to {@code MT940} and {@code PROWIDE} respectively when not supplied.
     *
     * @param stepExecution the current step execution
     */
    @BeforeStep
    public void beforeStep(StepExecution stepExecution) {
        String targetFormatStr = stepExecution.getJobParameters().getString("targetFormat", "MT940");
        String engineStr = stepExecution.getJobParameters().getString("engine", "PROWIDE");
        targetFormat = ConversionTargetFormat.valueOf(targetFormatStr);
        engine = ConversionEngine.valueOf(engineStr);
        log.info("Processor initialized: targetFormat={}, engine={}", targetFormat, engine);
    }

    /**
     * Maps, validates, and converts a single {@link BankStatementEntity} into a
     * {@link GeneratedBankingFile}.
     *
     * @param entity the JPA entity read by {@link BankStatementItemReader}
     * @return the generated output file representation
     * @throws Exception if validation fails or the conversion strategy raises an error
     */
    @Override
    public GeneratedBankingFile process(BankStatementEntity entity) throws Exception {
        BankStatement statement = mapper.toDomain(entity);
        validator.validate(statement);
        StatementExportStrategy strategy = strategyFactory.getStrategy(targetFormat, engine);
        log.debug("Exporting statement={} using {}/{}", statement.statementReference(), targetFormat, engine);
        return strategy.export(statement);
    }
}
