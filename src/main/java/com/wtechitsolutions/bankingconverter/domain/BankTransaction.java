package com.wtechitsolutions.bankingconverter.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BankTransaction(
        Long id,
        LocalDate bookingDate,
        LocalDate valueDate,
        BigDecimal amount,
        String currency,
        DebitCreditIndicator debitCreditIndicator,
        String transactionReference,
        String counterpartyName,
        String remittanceInformation,
        String bankTransactionCode
) {}
