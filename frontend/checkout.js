(function () {
   'use strict';

   document.addEventListener('DOMContentLoaded', function () {
      const shippingForm = document.getElementById('shippingForm');
      const billingForm = document.getElementById('billingForm');
      const shippingCountrySelect = document.getElementById('shippingCountry');
      const shippingStateSelect = document.getElementById('shippingState');
      const billingCountrySelect = document.getElementById('billingCountry');
      const billingStateSelect = document.getElementById('billingState');
      const carrierRadios = document.querySelectorAll('input[name="shippingCarrier"]');
      const shippingMethodsDiv = document.getElementById('shippingMethods');


      const statesByCountry = {
         'USA': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
         'CAN': ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon']

      };


      const shippingMethodsByCarrier = {
         'UPS': ['UPS Ground', 'UPS 2nd Day Air', 'UPS Next Day Air'],
         'FedEx': ['FedEx Ground', 'FedEx Express Saver', 'FedEx 2Day'],
         'USPS': ['USPS First Class', 'USPS Priority Mail', 'USPS Priority Mail Express']

      };


      function populateStates(countrySelect, stateSelect) {
         const selectedCountry = countrySelect.value;
         stateSelect.innerHTML = '<option value="" disabled selected>Select State/Province</option>';
         if (selectedCountry && statesByCountry[selectedCountry]) {
            statesByCountry[selectedCountry].forEach(state => {
               const option = document.createElement('option');
               option.value = state;
               option.textContent = state;
               stateSelect.appendChild(option);
            });
            stateSelect.disabled = false;
         } else {
            stateSelect.disabled = true;
         }
      }


      function displayShippingMethods() {
         const selectedCarrier = document.querySelector('input[name="shippingCarrier"]:checked');
         shippingMethodsDiv.innerHTML = '';

         if (selectedCarrier && shippingMethodsByCarrier[selectedCarrier.value]) {
            shippingMethodsByCarrier[selectedCarrier.value].forEach(method => {
               const formCheck = document.createElement('div');
               formCheck.classList.add('form-check');

               const radioInput = document.createElement('input');
               radioInput.classList.add('form-check-input');
               radioInput.type = 'radio';
               radioInput.name = 'shippingMethod';
               radioInput.id = method.toLowerCase().replace(/ /g, '-');
               radioInput.value = method;
               radioInput.required = true;

               const label = document.createElement('label');
               label.classList.add('form-check-label');
               label.setAttribute('for', radioInput.id);
               label.textContent = method;

               formCheck.appendChild(radioInput);
               formCheck.appendChild(label);
               shippingMethodsDiv.appendChild(formCheck);
            });


            if (!shippingMethodsDiv.querySelector('.invalid-feedback')) {
               const invalidFeedback = document.createElement('div');
               invalidFeedback.classList.add('invalid-feedback');
               invalidFeedback.textContent = 'Please select a shipping method.';
               shippingMethodsDiv.appendChild(invalidFeedback);
            }
         } else if (selectedCarrier) {
            shippingMethodsDiv.innerHTML = '<p>No shipping methods available for the selected carrier.</p>';
         } else {
            shippingMethodsDiv.innerHTML = '<p>Select a shipping carrier to see available methods.</p>';
         }
      }

      // Populate states when the country changes
      shippingCountrySelect.addEventListener('change', function () {
         populateStates(shippingCountrySelect, shippingStateSelect);
      });

      billingCountrySelect.addEventListener('change', function () {
         populateStates(billingCountrySelect, billingStateSelect);
      });

      carrierRadios.forEach(radio => {
         radio.addEventListener('change', displayShippingMethods);
      });

      shippingForm.addEventListener('submit', function (event) {
         if (!shippingForm.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
         } else {
            event.preventDefault();


            const shippingDetails = {
               country: shippingCountrySelect.value,
               state: shippingStateSelect.value,
               city: document.getElementById('shippingCity').value,
               zipCode: document.getElementById('shippingZip').value,
               address: document.getElementById('shippingAddress').value,
               carrier: document.querySelector('input[name="shippingCarrier"]:checked')?.value,
               method: document.querySelector('input[name="shippingMethod"]:checked')?.value,
            };


            localStorage.setItem('shippingDetails', JSON.stringify(shippingDetails));

            console.log('Shipping Details JSON:', JSON.stringify(shippingDetails, null, 2));

            shippingForm.style.display = 'none'; // Hide the shipping form
            billingForm.style.display = 'block'; // Show the billing form
         }
         shippingForm.classList.add('was-validated');
      }, false);

      billingForm.addEventListener('submit', function (event) {
         if (!billingForm.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
         } else {
            event.preventDefault();
      
            const billingDetails = {
               name: document.getElementById('billingName').value,
               country: billingCountrySelect.value,
               state: billingStateSelect.value,
               city: document.getElementById('billingCity').value,
               zipCode: document.getElementById('billingZip').value,
               address: document.getElementById('billingAddress').value,
               cardType: document.getElementById('billingCardType').value,
               cardNumber: document.getElementById('billingCardNumber').value,
               cardExpiry: document.getElementById('billingCardExpiry').value,
               cardCVV: document.getElementById('billingCardCVV').value,
            };
      
            localStorage.setItem('billingDetails', JSON.stringify(billingDetails));
            console.log('Billing Details JSON:', JSON.stringify(billingDetails, null, 2));
      
            // Combine shipping and billing details and send POST request to orders API
            const shippingDetails = JSON.parse(localStorage.getItem('shippingDetails'));
            const billingDetailsFromStorage = JSON.parse(localStorage.getItem('billingDetails'));
      
            $(document).ready(function () {
               let cart = [];
               let orderNumber = 1;
      
               // Fetch cart items from the server
               $.get('/cart', function (cartData) {
                  cart = cartData;
      
                  // Fetch existing orders to determine the next order number
                  $.get('/orders', function (orders) {
                     if (orders.length > 0) {
                        // Get the last order number and increment it
                        const lastOrder = orders[orders.length - 1];
                        orderNumber = (lastOrder.orderNumber || 0) + 1;
                     }
      
                     const orderDetails = {
                        orderNumber: orderNumber, // Add the order number
                        shipping: shippingDetails,
                        billing: billingDetailsFromStorage,
                        cartContents: cart,
                        status: "Ordered",
                     };
      
                     // Send the order details to the server
                     $.ajax({
                        url: '/orders',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(orderDetails),
                        success: function (response) {
                           console.log('Order placed successfully:', response);
                           alert('Order placed successfully!');
      
                           // Clear the cart after order placement
                           $.ajax({
                              url: '/cart',
                              method: 'DELETE',
                              success: function () {
                                 console.log('Cart emptied after order placement');
                                 window.location.href = '/orders.html'; // Redirect to orders page
                              },
                              error: function () {
                                 console.log('Failed to clear cart. Please try again.');
                              },
                           });
                        },
                        error: function (error) {
                           console.error('Error placing order:', error);
                           alert('Failed to place order. Please try again.');
                        },
                     });
                  }).fail(function () {
                     alert('Failed to fetch existing orders.');
                  });
               }).fail(function () {
                  alert('Failed to load cart items.');
               });
            });
         }
         billingForm.classList.add('was-validated');
      }, false);

      

      populateStates(shippingCountrySelect, shippingStateSelect);
      populateStates(billingCountrySelect, billingStateSelect);
      displayShippingMethods();
   });

})();