package com.shopping.dao;

import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.shopping.model.Order;
import com.shopping.model.OrderItem;

@Repository
public class OrderDAO {

    @Autowired
    private SessionFactory sessionFactory;

    public void saveOrder(Order order) {
        sessionFactory.getCurrentSession().persist(order);
    }

    public void saveOrderItem(OrderItem item) {
        sessionFactory.getCurrentSession().persist(item);
    }
}
