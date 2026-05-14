package com.wtechitsolutions.bankingconverter.api;

import com.wtechitsolutions.bankingconverter.exception.ConversionException;
import com.wtechitsolutions.bankingconverter.exception.JobLaunchException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.stream.Collectors;

/**
 * Global exception handler for all REST controllers.
 *
 * <p>Maps domain and infrastructure exceptions to RFC 9457 {@link ProblemDetail} responses with
 * appropriate HTTP status codes. Every response includes a {@code timestamp} extension property
 * set to {@link Instant#now()} for traceability.
 *
 * <p>Handler precedence (most specific to least specific):
 * <ol>
 *   <li>{@link MethodArgumentNotValidException} — Bean Validation failures → 400</li>
 *   <li>{@link IllegalArgumentException} — invalid business input → 400</li>
 *   <li>{@link ConversionException} — format conversion errors → 422</li>
 *   <li>{@link JobLaunchException} — batch job launch failures → 500</li>
 *   <li>{@link RuntimeException} — unexpected runtime errors → 500</li>
 * </ol>
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles Bean Validation failures from {@code @Valid}-annotated request bodies.
     * Aggregates all field errors into a single descriptive message.
     *
     * @param ex the validation exception raised by Spring MVC
     * @return 400 Bad Request with a summary of all constraint violations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
        problem.setTitle("Validation Failed");
        problem.setProperty("timestamp", Instant.now());
        return ResponseEntity.badRequest().body(problem);
    }

    /**
     * Handles illegal or unsupported argument errors, typically from enum parsing or
     * missing required parameters.
     *
     * @param ex the illegal argument exception
     * @return 400 Bad Request
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Invalid request: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("Invalid Request");
        problem.setProperty("timestamp", Instant.now());
        return ResponseEntity.badRequest().body(problem);
    }

    /**
     * Handles domain-level conversion failures (e.g., unsupported format/engine combination,
     * malformed statement data).
     *
     * @param ex the conversion exception
     * @return 422 Unprocessable Entity
     */
    @ExceptionHandler(ConversionException.class)
    public ResponseEntity<ProblemDetail> handleConversion(ConversionException ex) {
        log.error("Conversion failed: {}", ex.getMessage(), ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        problem.setTitle("Conversion Failed");
        problem.setProperty("timestamp", Instant.now());
        return ResponseEntity.unprocessableEntity().body(problem);
    }

    /**
     * Handles Spring Batch job launch failures — typically caused by infrastructure issues
     * such as the job repository being unavailable or duplicate job parameters.
     *
     * @param ex the job launch exception
     * @return 500 Internal Server Error
     */
    @ExceptionHandler(JobLaunchException.class)
    public ResponseEntity<ProblemDetail> handleJobLaunch(JobLaunchException ex) {
        log.error("Job launch failed", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
        problem.setTitle("Job Launch Error");
        problem.setProperty("timestamp", Instant.now());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }

    /**
     * Catch-all handler for any unhandled {@link RuntimeException}.
     *
     * @param ex the unexpected runtime exception
     * @return 500 Internal Server Error
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ProblemDetail> handleRuntime(RuntimeException ex) {
        log.error("Unexpected error", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
        problem.setTitle("Internal Server Error");
        problem.setProperty("timestamp", Instant.now());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }
}
