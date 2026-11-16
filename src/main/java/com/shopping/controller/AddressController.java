package com.shopping.controller;

import com.shopping.dto.AddressRequest;
import com.shopping.model.Address;
import com.shopping.model.User;
import com.shopping.repository.AddressRepository;
import com.shopping.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    @Autowired private AddressRepository addressRepository;
    @Autowired private UserRepository userRepository;

    private Integer getUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"))
            .getId();
    }

    private Address ownedAddress(Integer userId, Integer id) {
        return addressRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new RuntimeException("Address not found"));
    }

    private void apply(Address a, AddressRequest req) {
        a.setLabel(req.label());
        a.setFullName(req.fullName());
        a.setPhone(req.phone());
        a.setAddressLine1(req.addressLine1());
        a.setAddressLine2(req.addressLine2());
        a.setCity(req.city());
        a.setState(req.state());
        a.setPostalCode(req.postalCode());
        a.setCountry(req.country());
        if (req.defaultAddress() != null) a.setDefaultAddress(req.defaultAddress());
    }

    @GetMapping
    public List<Address> list(@AuthenticationPrincipal UserDetails userDetails) {
        return addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(getUserId(userDetails));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@AuthenticationPrincipal UserDetails userDetails,
                                    @Valid @RequestBody AddressRequest req) {
        Integer userId = getUserId(userDetails);
        Address address = new Address();
        address.setUserId(userId);
        apply(address, req);
        if (address.isDefaultAddress()) clearDefaults(userId);
        if (addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtDesc(userId).isEmpty())
            address.setDefaultAddress(true);
        return ResponseEntity.ok(addressRepository.save(address));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@AuthenticationPrincipal UserDetails userDetails,
                                    @PathVariable Integer id,
                                    @Valid @RequestBody AddressRequest req) {
        Integer userId = getUserId(userDetails);
        Address address = ownedAddress(userId, id);
        apply(address, req);
        if (address.isDefaultAddress()) clearDefaults(userId, id);
        return ResponseEntity.ok(addressRepository.save(address));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal UserDetails userDetails,
                                    @PathVariable Integer id) {
        Integer userId = getUserId(userDetails);
        addressRepository.delete(ownedAddress(userId, id));
        return ResponseEntity.ok(Map.of("message", "Address deleted"));
    }

    private void clearDefaults(Integer userId) { clearDefaults(userId, null); }

    private void clearDefaults(Integer userId, Integer exceptId) {
        for (Address a : addressRepository.findByUserIdAndDefaultAddressTrue(userId)) {
            if (exceptId == null || !a.getId().equals(exceptId)) {
                a.setDefaultAddress(false);
                addressRepository.save(a);
            }
        }
    }
}
