package com.shopping.dto;

import com.shopping.model.CrmTask;
import java.time.LocalDate;
import jakarta.validation.constraints.Size;

public record TaskUpdateRequest(
        @Size(max = 200) String title,
        @Size(max = 5000) String description,
        CrmTask.Priority priority,
        CrmTask.TaskStatus status,
        LocalDate dueDate,
        Integer customerId,
        @Size(max = 50) String assigneeUsername
) {}
