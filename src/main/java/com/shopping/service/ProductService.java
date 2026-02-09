package com.shopping.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.shopping.dao.ProductDAO;
import com.shopping.model.Product;

@Service
@Transactional
public class ProductService {

    @Autowired
    private ProductDAO productDAO;

    public void addProduct(Product product) {
        productDAO.save(product);
    }

    public List<Product> getProducts() {
        return productDAO.getAll();
    }
    public Product getProductById(int id) {
        return productDAO.getById(id);
    }
}
