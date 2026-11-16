package com.shopping.controller;

import com.shopping.dto.*;
import com.shopping.model.CrmTask;
import com.shopping.model.CustomerInteraction;
import com.shopping.repository.OrderRepository;
import com.shopping.service.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCustomerController {

    @Autowired private AdminCustomerService customerService;
    @Autowired private InteractionService interactionService;
    @Autowired private TaskService taskService;
    @Autowired private OrderRepository orderRepository;

    // ---------- Customers ----------

    @GetMapping("/customers")
    public Page<CustomerSummary> customers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        String[] parts = sort.split(",");
        Sort s = Sort.by(Sort.Direction.fromString(parts.length > 1 ? parts[1] : "desc"), parts[0]);
        return customerService.list(search, PageRequest.of(page, size, s));
    }

    @GetMapping("/customers/{id}")
    public CustomerSummary customer(@PathVariable Integer id) {
        return customerService.detail(id);
    }

    @GetMapping("/customers/{id}/orders")
    public Page<OrderResponse> customerOrders(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        customerService.detail(id); // 404 if not a customer
        return orderRepository.findByUserId(id, PageRequest.of(page, size,
                Sort.by("createdAt").descending()))
            .map(OrderResponse::from);
    }

    // ---------- Interactions ----------

    @GetMapping("/customers/{id}/interactions")
    public List<CustomerInteraction> interactions(@PathVariable Integer id) {
        return interactionService.listForCustomer(id);
    }

    @PostMapping("/customers/{id}/interactions")
    public CustomerInteraction addInteraction(
            @PathVariable Integer id,
            @Valid @RequestBody InteractionRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return interactionService.create(id, req, userDetails.getUsername());
    }

    // ---------- Tasks ----------

    @GetMapping("/crm/tasks")
    public Page<CrmTask> tasks(
            @RequestParam(required = false) CrmTask.TaskStatus status,
            @RequestParam(required = false) CrmTask.Priority priority,
            @RequestParam(required = false) String assignee,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueBefore,
            @RequestParam(required = false) Integer customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return taskService.search(status, priority, assignee, dueBefore, customerId,
                PageRequest.of(page, size, Sort.by(Sort.Order.asc("dueDate").nullsLast(),
                        Sort.Order.desc("createdAt"))));
    }

    @PostMapping("/crm/tasks")
    public CrmTask createTask(@Valid @RequestBody TaskRequest req,
                              @AuthenticationPrincipal UserDetails userDetails) {
        return taskService.create(req, userDetails.getUsername());
    }

    @PatchMapping("/crm/tasks/{id}")
    public CrmTask updateTask(@PathVariable Integer id,
                              @Valid @RequestBody TaskUpdateRequest req) {
        return taskService.update(id, req);
    }
}
