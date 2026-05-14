package com.wtechitsolutions.bankingconverter.conversion;

import com.wtechitsolutions.bankingconverter.domain.BankStatement;

public interface StatementExportStrategy {

    ConversionTargetFormat targetFormat();

    ConversionEngine engine();

    GeneratedBankingFile export(BankStatement statement);

    default StatementExportStrategyKey key() {
        return new StatementExportStrategyKey(targetFormat(), engine());
    }
}
