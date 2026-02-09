package com.shopping.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import com.shopping.dao.CartDAO;
import com.shopping.dao.OrderDAO;
import com.shopping.model.Cart;
import com.shopping.model.CartItem;
import com.shopping.model.Order;
import com.shopping.model.OrderItem;
import com.shopping.model.Product;
import org.hibernate.SessionFactory;

@Service
@Transactional
public class OrderService {

    @Autowired
    private CartDAO cartDAO;

    @Autowired
    private OrderDAO orderDAO;
    
    @Autowired
    private SessionFactory sessionFactory;

    public String placeOrder(int userId) {

        Cart cart = cartDAO.getCartByUserId(userId);//get cart
        
        List<CartItem> cartItems = cartDAO.getItems(cart.getId());//get cart items

        if (cartItems.isEmpty()) {
            return "Cart is empty";
        }

        Order order = new Order();//create order
        order.setUserId(userId);

        double total = 0;

        for (CartItem ci : cartItems) {    //calculate total + validate products
        	
        	Product product =ci.getProduct();
        	
        	if (product == null) {
                throw new RuntimeException("CartItem has no product!");
            }
        	 if (product.getStock() < ci.getQuantity()) {
                 throw new RuntimeException("Insufficient stock for product: " + product.getName());
             }
            total += ci.getProduct().getPrice()* ci.getQuantity();
        }

        order.setTotalAmount(total);
        orderDAO.saveOrder(order);
        
      //create orderr items+ update stocks
        for (CartItem ci : cartItems) {       
           
        	Product product =ci.getProduct();
        	
        	//update stocks
        	 product.setStock(product.getStock() - ci.getQuantity());
        	 total += product.getPrice()* ci.getQuantity();
        	 
             sessionFactory.getCurrentSession().update(product);
             
        	OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(product);
            oi.setQuantity(ci.getQuantity());
            oi.setPrice(product.getPrice());

            orderDAO.saveOrderItem(oi);
        }
        //clear cart after order
        sessionFactory.getCurrentSession()
        .createQuery("delete from CartItem where cart.id = :cid")
        .setParameter("cid", cart.getId())
        .executeUpdate();

        return "Order placed successfully";
    }
}

