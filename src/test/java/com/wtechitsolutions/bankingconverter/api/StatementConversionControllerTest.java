package com.wtechitsolutions.bankingconverter.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wtechitsolutions.bankingconverter.api.dto.ConversionJobRequest;
import com.wtechitsolutions.bankingconverter.batch.BatchJobService;
import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.StepExecution;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StatementConversionController.class)
class StatementConversionControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    BatchJobService batchJobService;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void convert_returns_200_with_job_id() throws Exception {
        when(batchJobService.launch(any(), any(), any()))
                .thenReturn(new BatchJobService.BatchJobResult(42L, "COMPLETED", "statement-1.mt940", "file content"));

        ConversionJobRequest request = new ConversionJobRequest(1L, ConversionTargetFormat.MT940, ConversionEngine.PROWIDE);

        mockMvc.perform(post("/api/conversions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobId").value(42))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.targetFormat").value("MT940"))
                .andExpect(jsonPath("$.engine").value("PROWIDE"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void jobs_returns_empty_list_when_no_history() throws Exception {
        when(batchJobService.getHistory()).thenReturn(List.of());

        mockMvc.perform(get("/api/conversions/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void get_job_returns_404_for_unknown_id() throws Exception {
        when(batchJobService.getJobExecution(999L)).thenReturn(null);

        mockMvc.perform(get("/api/conversions/jobs/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void get_job_file_returns_content_from_execution_context() throws Exception {
        JobExecution execution = new JobExecution(7L);
        StepExecution step = execution.createStepExecution("exportStep");
        step.getExecutionContext().putString("fileContent", ":20:REF123");
        when(batchJobService.getJobExecution(7L)).thenReturn(execution);

        mockMvc.perform(get("/api/conversions/jobs/7/file"))
                .andExpect(status().isOk())
                .andExpect(content().string(":20:REF123"));
    }

    @Test
    void get_job_file_returns_404_when_no_content() throws Exception {
        when(batchJobService.getJobExecution(8L)).thenReturn(new JobExecution(8L));

        mockMvc.perform(get("/api/conversions/jobs/8/file"))
                .andExpect(status().isNotFound());
    }
}
