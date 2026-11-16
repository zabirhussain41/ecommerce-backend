package com.shopping.service;

import com.shopping.dto.TaskRequest;
import com.shopping.dto.TaskUpdateRequest;
import com.shopping.model.CrmTask;
import com.shopping.repository.CrmTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class TaskService {

    @Autowired private CrmTaskRepository taskRepository;
    @Autowired private AdminCustomerService adminCustomerService;

    public Page<CrmTask> search(CrmTask.TaskStatus status, CrmTask.Priority priority,
                                String assignee, LocalDate dueBefore, Integer customerId,
                                Pageable pageable) {
        return taskRepository.search(status, priority, assignee, dueBefore, customerId, pageable);
    }

    @Transactional
    public CrmTask create(TaskRequest req, String createdBy) {
        validateCustomer(req.customerId());
        CrmTask t = new CrmTask();
        t.setTitle(req.title());
        t.setDescription(req.description());
        t.setPriority(req.priority() != null ? req.priority() : CrmTask.Priority.MEDIUM);
        t.setStatus(CrmTask.TaskStatus.PENDING);
        t.setDueDate(req.dueDate());
        t.setCustomerId(req.customerId());
        t.setAssigneeUsername(req.assigneeUsername());
        t.setCreatedBy(createdBy);
        return taskRepository.save(t);
    }

    @Transactional
    public CrmTask update(Integer id, TaskUpdateRequest req) {
        CrmTask t = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found"));

        if (req.title() != null) t.setTitle(req.title());
        if (req.description() != null) t.setDescription(req.description());
        if (req.priority() != null) t.setPriority(req.priority());
        if (req.dueDate() != null) t.setDueDate(req.dueDate());
        if (req.customerId() != null) {
            validateCustomer(req.customerId());
            t.setCustomerId(req.customerId());
        }
        if (req.assigneeUsername() != null) t.setAssigneeUsername(req.assigneeUsername());

        if (req.status() != null && req.status() != t.getStatus()) {
            t.setStatus(req.status());
            if (req.status() == CrmTask.TaskStatus.COMPLETED) {
                t.setCompletedAt(LocalDateTime.now());
            } else {
                t.setCompletedAt(null);
            }
        }

        t.setUpdatedAt(LocalDateTime.now());
        return taskRepository.save(t);
    }

    private void validateCustomer(Integer customerId) {
        if (customerId != null && !adminCustomerService.isCustomer(customerId))
            throw new RuntimeException("Customer not found");
    }
}
