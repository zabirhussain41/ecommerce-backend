package com.shopping.repository;

import com.shopping.model.CustomerInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerInteractionRepository extends JpaRepository<CustomerInteraction, Integer> {
    List<CustomerInteraction> findByCustomerIdOrderByCreatedAtDesc(Integer customerId);
}
