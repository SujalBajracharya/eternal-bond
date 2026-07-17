package com.eternalbond.api.repository;

import com.eternalbond.api.model.ProductCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductCatalogRepository extends JpaRepository<ProductCatalog, String> {

    Optional<ProductCatalog> findByIdAndIsActiveTrue(String id);
}
