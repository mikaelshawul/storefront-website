const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const port = 3000;
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/storefront';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define MongoDB Schemas and Models
const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  productDescription: { type: String, required: true },
  productCategory: { type: String, required: true },
  productUnit: { type: String, required: true },
  productPrice: { type: String, required: true },
  productWeight: { type: String, required: true }
});

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 }
});

const shopperSchema = new mongoose.Schema({
  shopperEmail: { type: String, required: true, unique: true },
  shopperName: { type: String, required: true },
  shopperPhone: { type: String },
  shopperAge: { type: Number, required: true },
  shopperAddress: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: Number, required: true, unique: true },
  shipping: {
    country: String,
    state: String,
    city: String,
    zipCode: String,
    address: String,
    carrier: String,
    method: String
  },
  billing: {
    name: String,
    country: String,
    state: String,
    city: String,
    zipCode: String,
    address: String,
    cardType: String,
    cardNumber: String,
    cardExpiry: String,
    cardCVV: String
  },
  cartContents: [
    {
      productId: String,
      quantity: Number,
      product: {
        productId: String,
        productDescription: String,
        productCategory: String,
        productUnit: String,
        productPrice: String,
        productWeight: String
      }
    }
  ],
  status: { type: String, default: "Ordered" }
});

const returnSchema = new mongoose.Schema({
  orderNumber: { type: Number, required: true },
  shipping: {
    country: String,
    state: String,
    city: String,
    zipCode: String,
    address: String,
    carrier: String,
    method: String
  },
  billing: {
    name: String,
    country: String,
    state: String,
    city: String,
    zipCode: String,
    address: String,
    cardType: String,
    cardNumber: String,
    cardExpiry: String,
    cardCVV: String
  },
  cartContents: [
    {
      productId: String,
      quantity: Number,
      product: {
        productId: String,
        productDescription: String,
        productCategory: String,
        productUnit: String,
        productPrice: String,
        productWeight: String
      }
    }
  ],
  status: { type: String, default: "Returned" }
});

// Create Models
const Product = mongoose.model('Product', productSchema);
const CartItem = mongoose.model('CartItem', cartItemSchema);
const Shopper = mongoose.model('Shopper', shopperSchema);
const Order = mongoose.model('Order', orderSchema);
const Return = mongoose.model('Return', returnSchema);

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

// Product routes
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/products/search', async (req, res) => {
  try {
    const searchName = req.query.name.toLowerCase();
    const products = await Product.find({
      productDescription: { $regex: searchName, $options: 'i' }
    });
    
    if (products.length > 0) {
      res.json({ product: products });
    } else {
      res.json({ message: "Product not found" });
    }
  } catch (err) {
    console.error('Error searching products:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).send('Server Error');
  }
});

app.put('/products/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const updatedProduct = await Product.findOneAndUpdate(
      { productId: productId },
      req.body,
      { new: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).send('Product not found');
    }
    
    res.json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).send('Server Error');
  }
});

app.delete('/products/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Delete product
    const deleteResult = await Product.deleteOne({ productId: productId });
    
    if (deleteResult.deletedCount === 0) {
      return res.status(404).send('Product not found');
    }
    
    // Remove from cart
    await CartItem.deleteMany({ productId: productId });
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).send('Server Error');
  }
});

// Cart routes
app.get('/cart', async (req, res) => {
  try {
    const cartItems = await CartItem.find({});
    
    // Enrich cart items with product details
    const enrichedCart = await Promise.all(cartItems.map(async (item) => {
      const product = await Product.findOne({ productId: item.productId });
      return product ? { 
        productId: item.productId,
        quantity: item.quantity,
        product: product
      } : null;
    }));
    
    res.json(enrichedCart.filter(Boolean));
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/cart', async (req, res) => {
  try {
    const newItem = req.body;
    
    // Validate product exists
    const productExists = await Product.findOne({ productId: newItem.productId });
    
    if (!productExists) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Check if item already exists in cart
    const existingItem = await CartItem.findOne({ productId: newItem.productId });
    
    if (existingItem) {
      // Update quantity
      existingItem.quantity += newItem.quantity;
      await existingItem.save();
      res.status(200).json(existingItem);
    } else {
      // Add new item
      const cartItem = new CartItem({
        productId: newItem.productId,
        quantity: newItem.quantity
      });
      await cartItem.save();
      res.status(201).json(cartItem);
    }
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).send('Server Error');
  }
});

app.put('/cart/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const updatedItem = await CartItem.findOneAndUpdate(
      { productId: productId },
      { quantity: req.body.quantity },
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).send('Cart item not found');
    }
    
    res.json(updatedItem);
  } catch (err) {
    console.error('Error updating cart item:', err);
    res.status(500).send('Server Error');
  }
});

app.delete('/cart/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    await CartItem.deleteOne({ productId: productId });
    res.status(204).send();
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).send('Server Error');
  }
});

app.delete('/cart', async (req, res) => {
  try {
    await CartItem.deleteMany({});
    res.status(204).send();
  } catch (err) {
    console.error('Error emptying cart:', err);
    res.status(500).send('Server Error');
  }
});

// Shopper routes
app.get('/shoppers', async (req, res) => {
  try {
    const shoppers = await Shopper.find({});
    res.json(shoppers);
  } catch (err) {
    console.error('Error fetching shoppers:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/shoppers', async (req, res) => {
  try {
    const newShopper = req.body;
    const existingShopper = await Shopper.findOne({ shopperEmail: newShopper.shopperEmail });
    
    if (existingShopper) {
      return res.status(409).json({
        error: 'Email already exists',
        message: 'This email is already registered'
      });
    }
    
    const shopper = new Shopper(newShopper);
    await shopper.save();
    res.status(201).json(shopper);
  } catch (err) {
    console.error('Error adding shopper:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Order routes
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({});
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).send('Server Error');
  }
});

app.put('/orders/:orderNumber', async (req, res) => {
  try {
    const orderNumber = parseInt(req.params.orderNumber);
    const updatedOrder = await Order.findOneAndUpdate(
      { orderNumber: orderNumber },
      req.body,
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).send('Order not found');
    }
    
    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).send('Server Error');
  }
});

// Return routes
app.get('/returns', async (req, res) => {
  try {
    const returns = await Return.find({});
    res.json(returns);
  } catch (err) {
    console.error('Error fetching returns:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/returns', async (req, res) => {
  try {
    const newReturn = new Return(req.body);
    await newReturn.save();
    res.status(201).json(newReturn);
  } catch (err) {
    console.error('Error creating return:', err);
    res.status(500).send('Server Error');
  }
});

// Serve the front-end HTML file from 'frontend' folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'shopper_storefront.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});