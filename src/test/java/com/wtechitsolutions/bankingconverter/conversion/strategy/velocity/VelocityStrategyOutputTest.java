package com.wtechitsolutions.bankingconverter.conversion.strategy.velocity;

import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;
import com.wtechitsolutions.bankingconverter.conversion.GeneratedBankingFile;
import com.wtechitsolutions.bankingconverter.conversion.StatementExportStrategyFactory;
import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import com.wtechitsolutions.bankingconverter.domain.DebitCreditIndicator;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class VelocityStrategyOutputTest {

    @Autowired
    StatementExportStrategyFactory factory;

    private BankStatement buildTestStatement() {
        BankTransaction tx = new BankTransaction(
                1L, LocalDate.now(), LocalDate.now(),
                new BigDecimal("250.00"), "EUR",
                DebitCreditIndicator.DEBIT, "TXN-VELO-01",
                "Test Party", "Velocity test payment", "PMNT"
        );
        return new BankStatement(
                1L, "STMT-VELO-001", "DE89370400440532013000", "EUR",
                LocalDate.now(), new BigDecimal("5000.00"), new BigDecimal("4750.00"),
                List.of(tx)
        );
    }

    @ParameterizedTest
    @EnumSource(value = ConversionTargetFormat.class)
    void velocity_output_is_not_blank_for_all_formats(ConversionTargetFormat fmt) {
        GeneratedBankingFile file = factory.getStrategy(fmt, ConversionEngine.VELOCITY)
                .export(buildTestStatement());
        assertThat(file.content()).isNotBlank();
        assertThat(file.fileName()).isNotBlank();
    }
}
