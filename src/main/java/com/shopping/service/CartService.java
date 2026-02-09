package com.shopping.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shopping.dao.CartDAO;
import com.shopping.model.Cart;
import com.shopping.model.CartItem;
import java.util.List;

@Service
@Transactional
public class CartService {

    @Autowired
    private CartDAO cartDAO;


    public void addToCart(int userId, int productId, int qty) {
        Cart cart = cartDAO.getCartByUserId(userId);
        cartDAO.addItem(cart, productId, qty);
    }

    public List<CartItem> viewCart(int userId) {
        Cart cart = cartDAO.getCartByUserId(userId);
        return cartDAO.getItems(cart.getId());
    }
}
