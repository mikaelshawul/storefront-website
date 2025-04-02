const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

//install node.js and then run node server.js to start the server

app.use(express.static(path.join(__dirname, 'frontend')));

app.use(express.json());

const productDataFilePath = path.join(__dirname, 'products', 'data.json');
const cartDataFilePath = path.join(__dirname, 'cart', 'data.json');
const shopperDataFilePath = path.join(__dirname, 'shoppers', 'data.json');
const orderDataFilePath = path.join(__dirname, 'orders', 'data.json');
const returnDataFilePath = path.join(__dirname, 'returns', 'data.json');

// Product routes
app.get('/products', (req, res) => {
   fs.readFile(productDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      res.json(JSON.parse(data).products || []);
   });
});

app.get('/products/search', (req, res) => {
   const searchName = req.query.name.toLowerCase();
   fs.readFile(productDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      const products = JSON.parse(data).products || [];
      const filteredProducts = products.filter(product =>
         product.productDescription.toLowerCase().includes(searchName)
      );
      if (filteredProducts.length > 0) {
         res.json({ product: filteredProducts });
      } else {
         res.json({ message: "Product not found" });
      }
   });
});

app.post('/products', (req, res) => {
   console.log(req.body);
   fs.readFile(productDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      let products = JSON.parse(data).products || [];
      products.push(req.body);
      fs.writeFile(productDataFilePath, JSON.stringify({ products }), (err) => {
         if (err) return res.status(500).send('Server Error');
         res.status(201).json(req.body);
      });
   });
});

app.put('/products/:productId', (req, res) => {
   const productId = req.params.productId;
   const updatedProduct = req.body;

   fs.readFile(productDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      let products = JSON.parse(data).products || [];

      const productIndex = products.findIndex(p => p.productId === productId);
      if (productIndex !== -1) {
         products[productIndex] = { ...products[productIndex], ...updatedProduct };
         fs.writeFile(productDataFilePath, JSON.stringify({ products }), (err) => {
            if (err) return res.status(500).send('Server Error');
            res.json(products[productIndex]);
         });
      } else {
         res.status(404).send('Product not found');
      }
   });
});


// Delete product by productId
app.delete('/products/:productId', (req, res) => {
   const productId = req.params.productId;

   // Delete from products
   fs.readFile(productDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      let products = JSON.parse(data).products || [];
      products = products.filter(p => p.productId !== productId);

      // Update cart
      fs.readFile(cartDataFilePath, 'utf8', (err, cartData) => {
         let cart = JSON.parse(cartData).cart || [];
         cart = cart.filter(item => item.productId !== productId);

         fs.writeFile(cartDataFilePath, JSON.stringify({ cart }), (err) => {
            if (err) return res.status(500).send('Server Error');

            fs.writeFile(productDataFilePath, JSON.stringify({ products }), (err) => {
               if (err) return res.status(500).send('Server Error');
               res.status(204).send();
            });
         });
      });
   });
});


// Cart routes

// Get all cart items
app.get('/cart', (req, res) => {
   fs.readFile(cartDataFilePath, 'utf8', (err, cartData) => {
      if (err) return res.status(500).send('Server Error');

      fs.readFile(productDataFilePath, 'utf8', (err, productData) => {
         if (err) return res.status(500).send('Server Error');

         const cartItems = JSON.parse(cartData).cart || [];
         const products = JSON.parse(productData).products || [];

         const enrichedCart = cartItems.map(item => {
            const product = products.find(p => p.productId === item.productId);
            return product ? { ...item, product } : null;
         }).filter(Boolean); // Remove invalid items

         res.json(enrichedCart);
      });
   });
});

// In POST /cart route
app.post('/cart', (req, res) => {
   const newItem = req.body;

   // First validate product exists
   fs.readFile(productDataFilePath, 'utf8', (productErr, productData) => {
      if (productErr) return res.status(500).send('Server Error');

      const products = JSON.parse(productData).products || [];
      const productExists = products.some(p => p.productId === newItem.productId);

      if (!productExists) {
         return res.status(404).json({ error: "Product not found" });
      }

      // Then process cart
      fs.readFile(cartDataFilePath, 'utf8', (cartErr, cartData) => {
         if (cartErr) return res.status(500).send('Server Error');

         let cart = JSON.parse(cartData).cart || [];
         const existingItemIndex = cart.findIndex(item =>
            item.productId === newItem.productId // Fixed here
         );

         if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += newItem.quantity;
         } else {
            cart.push({
               productId: newItem.productId, // Store only ID
               quantity: newItem.quantity
            });
         }

         fs.writeFile(cartDataFilePath, JSON.stringify({ cart }), (err) => {
            if (err) return res.status(500).send('Server Error');
            res.status(201).json(newItem);
         });
      });
   });
});



// Update item in the cart by productId
app.put('/cart/:productId', (req, res) => {
   const productId = req.params.productId;
   const updatedItem = req.body; // Should include the updated quantity (and possibly other data)

   fs.readFile(cartDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');

      let cart = JSON.parse(data).cart || [];

      // Find the item based on the productId and ensure product exists
      let itemIndex = cart.findIndex(item => item.productId === productId);

      if (itemIndex !== -1) {
         // Ensure we are updating the quantity property while preserving product details
         cart[itemIndex].quantity = updatedItem.quantity;

         // Keep the existing product details and just update the quantity
         fs.writeFile(cartDataFilePath, JSON.stringify({ cart }), (err) => {
            if (err) return res.status(500).send('Server Error');
            res.json(cart[itemIndex]);
         });
      } else {
         res.status(404).send('Cart item not found');
      }
   });
});


// Delete item from the cart by productId
app.delete('/cart/:productId', (req, res) => {
   const productId = req.params.productId;

   fs.readFile(cartDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      let cart = JSON.parse(data).cart || [];
      cart = cart.filter(item => item.productId !== productId);

      fs.writeFile(cartDataFilePath, JSON.stringify({ cart }), (err) => {
         if (err) return res.status(500).send('Server Error');
         res.status(204).send();
      });
   });
});

// Empty the cart (remove all items)
app.delete('/cart', (req, res) => {
   fs.writeFile(cartDataFilePath, JSON.stringify({ cart: [] }), (err) => {
      if (err) return res.status(500).send('Server Error');
      res.status(204).send();  // 204 No Content to indicate successful removal
   });
});

// Shopper Routes

// Get all shoppers
app.get('/shoppers', (req, res) => {
   fs.readFile(shopperDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      res.json(JSON.parse(data).shoppers || []);
   });
});

// Add a new shopper
app.post('/shoppers', (req, res) => {
   const newShopper = req.body;

   fs.readFile(shopperDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).json({ error: 'Server Error' });

      const shoppers = JSON.parse(data).shoppers || [];
      const existingShopper = shoppers.find(s => s.shopperEmail === newShopper.shopperEmail);

      if (existingShopper) {
         return res.status(409).json({  // Use 409 Conflict for duplicates
            error: 'Email already exists',
            message: 'This email is already registered'
         });
      }

      shoppers.push(newShopper);

      fs.writeFile(shopperDataFilePath, JSON.stringify({ shoppers }), (err) => {
         if (err) return res.status(500).json({ error: 'Server Error' });
         res.status(201).json(newShopper);  // Success response
      });
   });
});

//Order routes
app.get('/orders', (req, res) => {
   fs.readFile(orderDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      res.json(JSON.parse(data).orders || []);
   });
});

app.post('/orders', (req, res) => {
   const newOrder = req.body;

   fs.readFile(orderDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      let orders = JSON.parse(data).orders || [];
      orders.push(newOrder);
      fs.writeFile(orderDataFilePath, JSON.stringify({ orders }), (err) => {
         if (err) return res.status(500).send('Server Error');
         res.status(201).json(newOrder);
      });
   });
});

app.put('/orders/:orderNumber', (req, res) => {
   const updatedOrder = req.body;
   const orderNumber = parseInt(req.params.orderNumber);

   fs.readFile(orderDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      let orders = JSON.parse(data).orders || [];

      // Find the order by orderNumber and update it
      const orderIndex = orders.findIndex(order => order.orderNumber === orderNumber);
      if (orderIndex === -1) {
         return res.status(404).send('Order not found');
      }

      orders[orderIndex] = updatedOrder;

      fs.writeFile(orderDataFilePath, JSON.stringify({ orders }), (err) => {
         if (err) return res.status(500).send('Server Error');
         res.status(200).json(updatedOrder);
      });
   });
});

//Return routes
app.get('/returns', (req, res) => {
   fs.readFile(returnDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      res.json(JSON.parse(data).returns || []);
   });
});

app.post('/returns', (req, res) => {
   const newReturn = req.body;

   fs.readFile(returnDataFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Server Error');
      let returns = JSON.parse(data).returns || [];
      returns.push(newReturn);
      fs.writeFile(returnDataFilePath, JSON.stringify({ returns }), (err) => {
         if (err) return res.status(500).send('Server Error');
         res.status(201).json(newReturn);
      });
   });
});

// Serve the front-end HTML file from 'frontend' folder
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'frontend', 'shopper_storefront.html'));
});

app.listen(port, () => {
   console.log(`Server running on http://localhost:${port}`);
});