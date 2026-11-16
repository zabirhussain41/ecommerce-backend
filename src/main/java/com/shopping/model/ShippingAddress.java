package com.shopping.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class ShippingAddress {

    private String fullName;
    private String phone;

    @Column(name = "ship_line1")
    private String line1;

    @Column(name = "ship_line2")
    private String line2;

    private String city;
    private String state;
    private String postalCode;
    private String country;

    public static ShippingAddress from(Address a) {
        ShippingAddress s = new ShippingAddress();
        s.fullName = a.getFullName();
        s.phone = a.getPhone();
        s.line1 = a.getAddressLine1();
        s.line2 = a.getAddressLine2();
        s.city = a.getCity();
        s.state = a.getState();
        s.postalCode = a.getPostalCode();
        s.country = a.getCountry();
        return s;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getLine1() { return line1; }
    public void setLine1(String line1) { this.line1 = line1; }
    public String getLine2() { return line2; }
    public void setLine2(String line2) { this.line2 = line2; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
}
