package com.wtechitsolutions.bankingconverter.validation;

import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import com.wtechitsolutions.bankingconverter.domain.DebitCreditIndicator;
import com.wtechitsolutions.bankingconverter.exception.ConversionException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class InternalStatementValidatorTest {

    @InjectMocks
    InternalStatementValidator validator;

    private BankTransaction validTx() {
        return new BankTransaction(1L, LocalDate.now(), LocalDate.now(),
                BigDecimal.TEN, "EUR", DebitCreditIndicator.CREDIT,
                "TXN001", "Party", "Info", "PMNT");
    }

    private BankStatement validStatement() {
        return new BankStatement(1L, "STMT-001", "DE89370400440532013000", "EUR",
                LocalDate.now(), BigDecimal.valueOf(1000), BigDecimal.valueOf(1100), List.of(validTx()));
    }

    @Test
    void valid_statement_passes() {
        assertThatNoException().isThrownBy(() -> validator.validate(validStatement()));
    }

    @Test
    void missing_statement_reference_fails() {
        BankStatement stmt = new BankStatement(1L, null, "IBAN", "EUR",
                LocalDate.now(), BigDecimal.ONE, BigDecimal.ONE, List.of(validTx()));
        assertThatThrownBy(() -> validator.validate(stmt)).isInstanceOf(ConversionException.class)
                .hasMessageContaining("statementReference");
    }

    @Test
    void missing_iban_fails() {
        BankStatement stmt = new BankStatement(1L, "STMT", "", "EUR",
                LocalDate.now(), BigDecimal.ONE, BigDecimal.ONE, List.of(validTx()));
        assertThatThrownBy(() -> validator.validate(stmt)).isInstanceOf(ConversionException.class)
                .hasMessageContaining("accountIban");
    }

    @Test
    void empty_transactions_fails() {
        BankStatement stmt = new BankStatement(1L, "STMT", "IBAN", "EUR",
                LocalDate.now(), BigDecimal.ONE, BigDecimal.ONE, List.of());
        assertThatThrownBy(() -> validator.validate(stmt)).isInstanceOf(ConversionException.class)
                .hasMessageContaining("transaction");
    }
}
