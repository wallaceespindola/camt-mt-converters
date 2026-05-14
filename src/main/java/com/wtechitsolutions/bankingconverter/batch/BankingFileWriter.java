package com.wtechitsolutions.bankingconverter.batch;

import com.wtechitsolutions.bankingconverter.conversion.GeneratedBankingFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.annotation.AfterStep;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;

@Component
@StepScope
public class BankingFileWriter implements ItemWriter<GeneratedBankingFile> {

    private static final Logger log = LoggerFactory.getLogger(BankingFileWriter.class);

    private final List<GeneratedBankingFile> buffer = new ArrayList<>();

    @Value("${banking.converter.output-directory:./output}")
    private String outputDirectory;

    @Override
    public void write(Chunk<? extends GeneratedBankingFile> chunk) {
        buffer.addAll(chunk.getItems());
    }

    @AfterStep
    public ExitStatus afterStep(StepExecution stepExecution) {
        try {
            Path dir = Path.of(outputDirectory);
            Files.createDirectories(dir);

            for (GeneratedBankingFile file : buffer) {
                Path outputPath = dir.resolve(file.fileName());
                Files.writeString(outputPath, file.content(), StandardCharsets.UTF_8,
                        StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                stepExecution.getExecutionContext().putString("outputFile", file.fileName());
                stepExecution.getExecutionContext().putString("fileContent", file.content());
                log.info("Written output file: {}", outputPath.toAbsolutePath());
            }
            return ExitStatus.COMPLETED;
        } catch (IOException e) {
            log.error("Failed to write output file: {}", e.getMessage(), e);
            return ExitStatus.FAILED;
        }
    }
}
