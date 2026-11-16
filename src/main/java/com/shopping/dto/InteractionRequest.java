package com.shopping.dto;

import com.shopping.model.CustomerInteraction;
import java.time.LocalDate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InteractionRequest(
        @NotNull(message = "Interaction type is required")
        CustomerInteraction.InteractionType type,

        @NotBlank(message = "Description is required")
        @Size(max = 5000)
        String description,

        LocalDate dueDate
) {}
