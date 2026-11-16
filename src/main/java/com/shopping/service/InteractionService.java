package com.shopping.service;

import com.shopping.dto.InteractionRequest;
import com.shopping.model.CustomerInteraction;
import com.shopping.repository.CustomerInteractionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InteractionService {

    @Autowired private CustomerInteractionRepository interactionRepository;
    @Autowired private AdminCustomerService adminCustomerService;

    public List<CustomerInteraction> listForCustomer(Integer customerId) {
        requireCustomer(customerId);
        return interactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional
    public CustomerInteraction create(Integer customerId, InteractionRequest req,
                                      String staffUsername) {
        requireCustomer(customerId);
        CustomerInteraction i = new CustomerInteraction();
        i.setCustomerId(customerId);
        i.setType(req.type());
        i.setDescription(req.description());
        i.setDueDate(req.dueDate());
        i.setStaffUsername(staffUsername);
        return interactionRepository.save(i);
    }

    private void requireCustomer(Integer customerId) {
        if (!adminCustomerService.isCustomer(customerId))
            throw new RuntimeException("Customer not found");
    }
}
