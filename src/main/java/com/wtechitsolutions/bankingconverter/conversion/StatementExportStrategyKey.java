package com.wtechitsolutions.bankingconverter.conversion;

public record StatementExportStrategyKey(
        ConversionTargetFormat targetFormat,
        ConversionEngine engine
) {}
