package com.wtechitsolutions.bankingconverter.persistence.entity;

import com.wtechitsolutions.bankingconverter.domain.DebitCreditIndicator;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "bank_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankTransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate bookingDate;

    private LocalDate valueDate;

    private BigDecimal amount;

    private String currency;

    @Enumerated(EnumType.STRING)
    private DebitCreditIndicator debitCreditIndicator;

    private String transactionReference;

    private String counterpartyName;

    private String remittanceInformation;

    private String bankTransactionCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "statement_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private BankStatementEntity statement;
}
