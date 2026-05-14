package com.wtechitsolutions.bankingconverter.conversion;

import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import com.wtechitsolutions.bankingconverter.domain.DebitCreditIndicator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class GoldenFileTest {

    @Autowired
    StatementExportStrategyFactory factory;

    private BankStatement goldenStatement() {
        BankTransaction credit = new BankTransaction(1L, LocalDate.of(2026, 5, 14), LocalDate.of(2026, 5, 14),
                new BigDecimal("500.00"), "EUR", DebitCreditIndicator.CREDIT,
                "TXN-GOLDEN-001", "Customer A", "Payment from Customer A", "PMNT");
        BankTransaction debit = new BankTransaction(2L, LocalDate.of(2026, 5, 14), LocalDate.of(2026, 5, 14),
                new BigDecimal("200.00"), "EUR", DebitCreditIndicator.DEBIT,
                "TXN-GOLDEN-002", "Supplier B", "Supplier payment", "PMNT");
        return new BankStatement(1L, "STMT-20260514-001",
                "DE89370400440532013000", "EUR",
                LocalDate.of(2026, 5, 14),
                new BigDecimal("10000.00"), new BigDecimal("10300.00"),
                List.of(credit, debit));
    }

    @Test
    void mt940_golden_file_has_required_tags_and_iban() {
        GeneratedBankingFile file = factory.getStrategy(ConversionTargetFormat.MT940, ConversionEngine.PROWIDE)
                .export(goldenStatement());
        assertThat(file.content()).contains(":20:", ":25:", ":60F:", ":61:", ":62F:");
        assertThat(file.content()).contains("DE89370400440532013000");
        assertThat(file.fileName()).isEqualTo("statement-1.mt940");
    }

    @Test
    void mt942_golden_file_has_required_tags() {
        GeneratedBankingFile file = factory.getStrategy(ConversionTargetFormat.MT942, ConversionEngine.PROWIDE)
                .export(goldenStatement());
        assertThat(file.content()).contains(":20:", ":25:", ":61:");
        assertThat(file.fileName()).isEqualTo("statement-1.mt942");
    }

    @Test
    void camt052_golden_file_is_valid_xml_with_iban() {
        GeneratedBankingFile file = factory.getStrategy(ConversionTargetFormat.CAMT052, ConversionEngine.PROWIDE)
                .export(goldenStatement());
        assertThat(file.content()).startsWith("<?xml");
        assertThat(file.content()).contains("camt.052.001.08", "DE89370400440532013000");
        assertThat(file.fileName()).isEqualTo("statement-1.camt052.xml");
    }

    @Test
    void camt053_golden_file_has_balance_and_entries() {
        GeneratedBankingFile file = factory.getStrategy(ConversionTargetFormat.CAMT053, ConversionEngine.PROWIDE)
                .export(goldenStatement());
        assertThat(file.content()).contains("OPBD", "CLBD", "10000", "10300");
        assertThat(file.fileName()).isEqualTo("statement-1.camt053.xml");
    }
}
