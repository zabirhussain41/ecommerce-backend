package com.shopping.dao;

import java.util.List;

import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.shopping.model.Product;

@Repository
public class ProductDAO {

    @Autowired
    private SessionFactory sessionFactory;

    public void save(Product product) {
        sessionFactory.getCurrentSession().persist(product);
    }

    public List<Product> getAll() {
        return sessionFactory
                .getCurrentSession()
                .createQuery("from Product", Product.class)
                .list();
    }
    public Product getById(int id) {
    	return sessionFactory.getCurrentSession().get(Product.class, id);
    }
    public void update(Product product) {
        sessionFactory.getCurrentSession().merge(product);
    }
}
