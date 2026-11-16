package com.shopping.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.shopping.model.User;

public interface UserRepository extends JpaRepository<User, Integer> {
	Optional<User> findByUsername(String username);
	Optional<User> findByEmail(String email);
	Optional<User> findFirstByRole(String role);
	boolean existsByUsername(String username);
	boolean existsByEmail(String email);

	@Query("SELECT u FROM User u WHERE u.role = 'USER' AND " +
		   "(LOWER(u.username) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
		   "LOWER(u.email) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
		   "LOWER(COALESCE(u.fullName,'')) LIKE LOWER(CONCAT('%',:q,'%')))")
	Page<User> searchCustomers(@Param("q") String query, Pageable pageable);

	Page<User> findByRoleOrderByCreatedAtDesc(String role, Pageable pageable);
	long countByRole(String role);
	long countByRoleAndCreatedAtAfter(String role, java.time.LocalDateTime date);
}
