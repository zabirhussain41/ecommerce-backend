package com.shopping.repository;

import com.shopping.model.CrmTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface CrmTaskRepository extends JpaRepository<CrmTask, Integer> {

    @Query("SELECT t FROM CrmTask t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:assignee IS NULL OR t.assigneeUsername = :assignee) AND " +
           "(:dueBefore IS NULL OR t.dueDate <= :dueBefore) AND " +
           "(:customerId IS NULL OR t.customerId = :customerId)")
    Page<CrmTask> search(@Param("status") CrmTask.TaskStatus status,
                         @Param("priority") CrmTask.Priority priority,
                         @Param("assignee") String assignee,
                         @Param("dueBefore") LocalDate dueBefore,
                         @Param("customerId") Integer customerId,
                         Pageable pageable);

    long countByStatusAndDueDateBefore(CrmTask.TaskStatus status, LocalDate date);
    List<CrmTask> findByCustomerIdOrderByCreatedAtDesc(Integer customerId);
}
