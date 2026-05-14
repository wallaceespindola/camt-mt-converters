package com.wtechitsolutions.bankingconverter.persistence.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bank_statements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankStatementEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String statementReference;

    private String accountIban;

    private String accountCurrency;

    private LocalDate statementDate;

    private BigDecimal openingBalance;

    private BigDecimal closingBalance;

    @OneToMany(mappedBy = "statement", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BankTransactionEntity> transactions = new ArrayList<>();
}
