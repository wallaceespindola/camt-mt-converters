package com.wtechitsolutions.bankingconverter.persistence.repository;

import com.wtechitsolutions.bankingconverter.persistence.entity.BankStatementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BankStatementRepository extends JpaRepository<BankStatementEntity, Long> {

    @Query("""
            select s from BankStatementEntity s
            left join fetch s.transactions
            where s.id = :id
            """)
    Optional<BankStatementEntity> findByIdWithTransactions(@Param("id") Long id);
}
