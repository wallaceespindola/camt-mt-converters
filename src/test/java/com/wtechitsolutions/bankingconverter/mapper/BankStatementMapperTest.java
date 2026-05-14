package com.wtechitsolutions.bankingconverter.mapper;

import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.DebitCreditIndicator;
import com.wtechitsolutions.bankingconverter.persistence.entity.BankStatementEntity;
import com.wtechitsolutions.bankingconverter.persistence.entity.BankTransactionEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class BankStatementMapperTest {

    @InjectMocks
    BankStatementMapper mapper;

    @Test
    void maps_entity_to_domain() {
        BankTransactionEntity txEntity = BankTransactionEntity.builder()
                .id(10L)
                .bookingDate(LocalDate.now())
                .valueDate(LocalDate.now())
                .amount(BigDecimal.valueOf(500))
                .currency("EUR")
                .debitCreditIndicator(DebitCreditIndicator.CREDIT)
                .transactionReference("TXN-001")
                .counterpartyName("Party A")
                .remittanceInformation("Test payment")
                .bankTransactionCode("PMNT")
                .build();

        BankStatementEntity entity = BankStatementEntity.builder()
                .id(1L)
                .statementReference("STMT-001")
                .accountIban("DE89370400440532013000")
                .accountCurrency("EUR")
                .statementDate(LocalDate.now())
                .openingBalance(BigDecimal.valueOf(10000))
                .closingBalance(BigDecimal.valueOf(10500))
                .transactions(List.of(txEntity))
                .build();

        BankStatement domain = mapper.toDomain(entity);

        assertThat(domain.id()).isEqualTo(1L);
        assertThat(domain.statementReference()).isEqualTo("STMT-001");
        assertThat(domain.accountIban()).isEqualTo("DE89370400440532013000");
        assertThat(domain.transactions()).hasSize(1);
        assertThat(domain.transactions().get(0).amount()).isEqualByComparingTo("500");
        assertThat(domain.transactions().get(0).debitCreditIndicator()).isEqualTo(DebitCreditIndicator.CREDIT);
    }
}
