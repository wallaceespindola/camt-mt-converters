package com.wtechitsolutions.bankingconverter.conversion.strategy.prowide;

import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import com.wtechitsolutions.bankingconverter.domain.DebitCreditIndicator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

abstract class AbstractMtProwideStrategy {

    protected static final DateTimeFormatter SWIFT_DATE = DateTimeFormatter.ofPattern("yyMMdd");
    protected static final DateTimeFormatter SWIFT_ENTRY_DATE = DateTimeFormatter.ofPattern("MMdd");

    protected String formatSwiftAmount(BigDecimal amount) {
        if (amount == null) return "0,";
        BigDecimal abs = amount.abs();
        long intPart = abs.longValue();
        int fracPart = abs.subtract(BigDecimal.valueOf(intPart)).multiply(BigDecimal.valueOf(100)).intValue();
        return intPart + "," + String.format("%02d", Math.abs(fracPart));
    }

    protected String formatBalanceLine(BankStatement stmt, BigDecimal balance, LocalDate date, boolean credit) {
        String direction = credit ? "C" : "D";
        return direction + date.format(SWIFT_DATE) + stmt.accountCurrency() + formatSwiftAmount(balance);
    }

    protected String formatField61(BankTransaction tx) {
        String valueDate = tx.valueDate().format(SWIFT_DATE);
        String dc = DebitCreditIndicator.CREDIT.equals(tx.debitCreditIndicator()) ? "C" : "D";
        String amount = formatSwiftAmount(tx.amount());
        String ref = tx.transactionReference() != null
                ? tx.transactionReference().substring(0, Math.min(16, tx.transactionReference().length()))
                : "NONREF";
        return valueDate + dc + amount + "NMSC" + ref;
    }

    protected String formatField86(BankTransaction tx) {
        String info = tx.remittanceInformation() != null ? tx.remittanceInformation() : "";
        return info.length() > 65 ? info.substring(0, 65) : info;
    }

    protected String truncate(String value, int maxLen) {
        if (value == null) return "";
        return value.length() > maxLen ? value.substring(0, maxLen) : value;
    }
}
