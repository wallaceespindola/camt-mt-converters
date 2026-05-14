package com.wtechitsolutions.bankingconverter.domain;

public enum LoadProfile {

    /** 1 statement with 10 transactions */
    LOW(1, 10),

    /** 10 statements with 100 transactions each */
    HIGH(10, 100);

    private final int statementCount;
    private final int transactionsPerStatement;

    LoadProfile(int statementCount, int transactionsPerStatement) {
        this.statementCount = statementCount;
        this.transactionsPerStatement = transactionsPerStatement;
    }

    public int statementCount() {
        return statementCount;
    }

    public int transactionsPerStatement() {
        return transactionsPerStatement;
    }
}
