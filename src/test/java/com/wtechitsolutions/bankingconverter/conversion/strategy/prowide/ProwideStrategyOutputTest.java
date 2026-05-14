package com.wtechitsolutions.bankingconverter.conversion.strategy.prowide;

import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;
import com.wtechitsolutions.bankingconverter.conversion.GeneratedBankingFile;
import com.wtechitsolutions.bankingconverter.conversion.StatementExportStrategyFactory;
import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import com.wtechitsolutions.bankingconverter.domain.DebitCreditIndicator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class ProwideStrategyOutputTest {

    @Autowired
    StatementExportStrategyFactory factory;

    private BankStatement buildTestStatement() {
        BankTransaction tx = new BankTransaction(
                1L, LocalDate.now(), LocalDate.now(),
                new BigDecimal("500.00"), "EUR",
                DebitCreditIndicator.CREDIT,
                "TXN-001", "Counterparty A", "Test payment", "PMNT"
        );
        return new BankStatement(
                1L, "STMT-TEST-001", "DE89370400440532013000", "EUR",
                LocalDate.now(), new BigDecimal("10000.00"), new BigDecimal("10500.00"),
                List.of(tx)
        );
    }

    @Test
    void mt940_contains_required_swift_tags() {
        GeneratedBankingFile file = factory.getStrategy(ConversionTargetFormat.MT940, ConversionEngine.PROWIDE)
                .export(buildTestStatement());
        assertThat(file.content()).contains(":20:", ":25:", ":28C:", ":60F:", ":61:", ":86:", ":62F:");
        assertThat(file.fileName()).endsWith(".mt940");
        assertThat(file.contentType()).isEqualTo("text/plain");
    }

    @Test
    void mt942_contains_required_swift_tags() {
        GeneratedBankingFile file = factory.getStrategy(ConversionTargetFormat.MT942, ConversionEngine.PROWIDE)
                .export(buildTestStatement());
        assertThat(file.content()).contains(":20:", ":25:", ":28C:", ":61:", ":86:");
        assertThat(file.fileName()).endsWith(".mt942");
    }

    @Test
    void camt052_produces_valid_xml() {
        GeneratedBankingFile file = factory.getStrategy(ConversionTargetFormat.CAMT052, ConversionEngine.PROWIDE)
                .export(buildTestStatement());
        assertThat(file.content()).startsWith("<?xml");
        assertThat(file.content()).contains("camt.052.001.08");
        assertThat(file.content()).contains("<IBAN>DE89370400440532013000</IBAN>");
        assertThat(file.fileName()).endsWith(".camt052.xml");
        assertThat(file.contentType()).isEqualTo("application/xml");
    }

    @Test
    void camt053_contains_balance_elements() {
        GeneratedBankingFile file = factory.getStrategy(ConversionTargetFormat.CAMT053, ConversionEngine.PROWIDE)
                .export(buildTestStatement());
        assertThat(file.content()).contains("camt.053.001.08");
        assertThat(file.content()).contains("OPBD");
        assertThat(file.content()).contains("CLBD");
        assertThat(file.fileName()).endsWith(".camt053.xml");
    }

    @ParameterizedTest
    @EnumSource(value = ConversionTargetFormat.class)
    void prowide_output_is_not_blank_for_all_formats(ConversionTargetFormat fmt) {
        GeneratedBankingFile file = factory.getStrategy(fmt, ConversionEngine.PROWIDE)
                .export(buildTestStatement());
        assertThat(file.content()).isNotBlank();
        assertThat(file.fileName()).isNotBlank();
    }
}
