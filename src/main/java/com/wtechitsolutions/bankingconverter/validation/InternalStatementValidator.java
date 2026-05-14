package com.wtechitsolutions.bankingconverter.validation;

import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import com.wtechitsolutions.bankingconverter.exception.ConversionException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates a {@link BankStatement} domain object before it is passed to a conversion strategy.
 * Collects all validation errors and throws a single {@link ConversionException} if any are found,
 * so callers receive a complete diagnostic rather than one error at a time.
 */
@Component
public class InternalStatementValidator {

    /**
     * Validates the statement and all of its transactions.
     *
     * @param statement the domain record to validate
     * @throws ConversionException if one or more validation rules are violated
     */
    public void validate(BankStatement statement) {
        List<String> errors = new ArrayList<>();

        if (statement.statementReference() == null || statement.statementReference().isBlank()) {
            errors.add("statementReference is required");
        }
        if (statement.accountIban() == null || statement.accountIban().isBlank()) {
            errors.add("accountIban is required");
        }
        if (statement.accountCurrency() == null || statement.accountCurrency().isBlank()) {
            errors.add("accountCurrency is required");
        }
        if (statement.statementDate() == null) {
            errors.add("statementDate is required");
        }
        if (statement.openingBalance() == null) {
            errors.add("openingBalance is required");
        }
        if (statement.closingBalance() == null) {
            errors.add("closingBalance is required");
        }

        if (statement.transactions() == null || statement.transactions().isEmpty()) {
            errors.add("at least one transaction is required");
        } else {
            for (int i = 0; i < statement.transactions().size(); i++) {
                validateTransaction(statement.transactions().get(i), i, errors);
            }
        }

        if (!errors.isEmpty()) {
            throw new ConversionException("Statement validation failed: " + String.join("; ", errors));
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private void validateTransaction(BankTransaction tx, int index, List<String> errors) {
        String prefix = "transaction[" + index + "]";
        if (tx.amount() == null) {
            errors.add(prefix + ".amount is required");
        }
        if (tx.bookingDate() == null) {
            errors.add(prefix + ".bookingDate is required");
        }
        if (tx.valueDate() == null) {
            errors.add(prefix + ".valueDate is required");
        }
        if (tx.debitCreditIndicator() == null) {
            errors.add(prefix + ".debitCreditIndicator is required");
        }
    }
}
