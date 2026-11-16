package com.shopping.repository;

import com.shopping.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Integer> {
    List<Address> findByUserIdOrderByDefaultAddressDescCreatedAtDesc(Integer userId);
    Optional<Address> findByIdAndUserId(Integer id, Integer userId);
    List<Address> findByUserIdAndDefaultAddressTrue(Integer userId);
}
