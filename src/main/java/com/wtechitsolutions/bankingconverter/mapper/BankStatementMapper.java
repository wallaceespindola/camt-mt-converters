package com.wtechitsolutions.bankingconverter.mapper;

import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import com.wtechitsolutions.bankingconverter.persistence.entity.BankStatementEntity;
import com.wtechitsolutions.bankingconverter.persistence.entity.BankTransactionEntity;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Manual mapper between JPA entities and domain records.
 * Intentionally plain {@code @Component} — no MapStruct annotation processing required.
 */
@Component
public class BankStatementMapper {

    public BankStatement toDomain(BankStatementEntity entity) {
        List<BankTransaction> transactions = entity.getTransactions().stream()
                .map(this::toTransactionDomain)
                .toList();
        return new BankStatement(
                entity.getId(),
                entity.getStatementReference(),
                entity.getAccountIban(),
                entity.getAccountCurrency(),
                entity.getStatementDate(),
                entity.getOpeningBalance(),
                entity.getClosingBalance(),
                transactions
        );
    }

    public BankTransaction toTransactionDomain(BankTransactionEntity entity) {
        return new BankTransaction(
                entity.getId(),
                entity.getBookingDate(),
                entity.getValueDate(),
                entity.getAmount(),
                entity.getCurrency(),
                entity.getDebitCreditIndicator(),
                entity.getTransactionReference(),
                entity.getCounterpartyName(),
                entity.getRemittanceInformation(),
                entity.getBankTransactionCode()
        );
    }
}
