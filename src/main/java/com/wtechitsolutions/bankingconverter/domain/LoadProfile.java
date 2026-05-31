package com.wtechitsolutions.bankingconverter.domain;

public enum LoadProfile {

    /** 10 accounts · 5 statements · 100 transactions (20 tx/statement) */
    LOW(10, 5, 20),

    /** 100 accounts · 50 statements · 1 000 transactions (20 tx/statement) */
    MEDIUM(100, 50, 20),

    /** 1 000 accounts · 500 statements · 10 000 transactions (20 tx/statement) */
    HIGH(1000, 500, 20);

    private final int accountCount;
    private final int statementCount;
    private final int transactionsPerStatement;

    LoadProfile(int accountCount, int statementCount, int transactionsPerStatement) {
        this.accountCount = accountCount;
        this.statementCount = statementCount;
        this.transactionsPerStatement = transactionsPerStatement;
    }

    public int accountCount() {
        return accountCount;
    }

    public int statementCount() {
        return statementCount;
    }

    public int transactionsPerStatement() {
        return transactionsPerStatement;
    }
}
