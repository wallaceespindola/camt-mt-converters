package com.wtechitsolutions.bankingconverter.config;

import com.wtechitsolutions.bankingconverter.conversion.StatementExportStrategy;
import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import com.wtechitsolutions.bankingconverter.domain.DebitCreditIndicator;
import com.wtechitsolutions.bankingconverter.persistence.repository.BankStatementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Warms up all conversion strategies and the JPA layer at application startup so the first
 * user-triggered conversion is not penalized by one-time initialization costs.
 *
 * <p>Without this, the first job of a benchmark run absorbs Prowide SWIFT model classloading
 * (~27 ms), Velocity engine/template initialization (~13 ms), the first Hibernate query and JIT
 * compilation — which skewed the Benchmarks view against whichever combination ran first
 * (always MT940 + PROWIDE in the Run-All-8 order).
 *
 * <p>Exports a synthetic in-memory statement through every (format, engine) pair — no database
 * writes, no batch job, no entry in the conversion history.
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@Component
public class ConversionWarmupRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ConversionWarmupRunner.class);

    private final List<StatementExportStrategy> strategies;
    private final BankStatementRepository statementRepository;

    public ConversionWarmupRunner(List<StatementExportStrategy> strategies,
                                  BankStatementRepository statementRepository) {
        this.strategies = strategies;
        this.statementRepository = statementRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        long start = System.currentTimeMillis();
        BankStatement statement = syntheticStatement();
        for (StatementExportStrategy strategy : strategies) {
            try {
                strategy.export(statement);
            } catch (Exception ex) {
                log.warn("Warmup failed for {}/{}: {}", strategy.targetFormat(), strategy.engine(), ex.getMessage());
            }
        }
        statementRepository.count();
        log.info("Conversion warmup completed in {} ms ({} strategies)",
                System.currentTimeMillis() - start, strategies.size());
    }

    private BankStatement syntheticStatement() {
        BankTransaction tx = new BankTransaction(
                0L, LocalDate.now(), LocalDate.now(),
                new BigDecimal("100.00"), "EUR",
                DebitCreditIndicator.CREDIT,
                "WARMUP-TX", "Warmup Counterparty", "Warmup payment", "PMNT");
        return new BankStatement(
                0L, "WARMUP-STMT", "DE89370400440532013000", "EUR",
                LocalDate.now(), new BigDecimal("0.00"), new BigDecimal("100.00"),
                List.of(tx));
    }
}
