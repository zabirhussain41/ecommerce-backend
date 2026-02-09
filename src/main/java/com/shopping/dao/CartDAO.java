package com.shopping.dao;

import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.shopping.model.Cart;
import com.shopping.model.CartItem;
import com.shopping.model.Product;

import java.util.List;

@Repository
public class CartDAO {

    @Autowired
    private SessionFactory sessionFactory;

    public Cart getCartByUserId(int userId) {

        List<Cart> carts = sessionFactory.getCurrentSession()
                .createQuery("from Cart where userId = :uid", Cart.class)
                .setParameter("uid", userId)
                .list();

        if (carts.isEmpty()) {
            Cart cart = new Cart();
            cart.setUserId(userId);
            sessionFactory.getCurrentSession().persist(cart);
            return cart;
        }
        return carts.get(0);
    }


    public void addItem(Cart cart, int productId, int quantity) {

        Product product = sessionFactory
                .getCurrentSession()
                .get(Product.class, productId);
        if (product == null) {
            throw new RuntimeException("Product not found");
        }

        CartItem item = new CartItem();
        item.setCart(cart);
        item.setProduct(product);   
        item.setQuantity(quantity);

        sessionFactory.getCurrentSession().persist(item);
    }

    public List<CartItem> getItems(int cartId) {
        return sessionFactory.getCurrentSession()
                .createQuery("from CartItem where cart.id = :cid", CartItem.class)
                .setParameter("cid", cartId)
                .list();
    }


		
	
}
