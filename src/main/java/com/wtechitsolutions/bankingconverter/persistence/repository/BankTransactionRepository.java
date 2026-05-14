package com.wtechitsolutions.bankingconverter.persistence.repository;

import com.wtechitsolutions.bankingconverter.persistence.entity.BankTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BankTransactionRepository extends JpaRepository<BankTransactionEntity, Long> {

    List<BankTransactionEntity> findByStatementId(Long statementId);
}
