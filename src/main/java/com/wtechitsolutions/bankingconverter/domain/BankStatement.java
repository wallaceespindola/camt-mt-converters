package com.wtechitsolutions.bankingconverter.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BankStatement(
        Long id,
        String statementReference,
        String accountIban,
        String accountCurrency,
        LocalDate statementDate,
        BigDecimal openingBalance,
        BigDecimal closingBalance,
        List<BankTransaction> transactions
) {}
