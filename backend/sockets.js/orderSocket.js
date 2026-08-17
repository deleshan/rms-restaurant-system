/**
 * @desc    Socket.IO handlers for Real-time Order & Billing Management
 * @param   {Object} io - The Socket.io instance from server.js
 */
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`New connection established: ${socket.id}`);

    /**
     * JOIN CUSTOMER PRIVATE ROOM
     * Scoped by phone number to notify specific users across multiple sessions.
     */
    socket.on('join', (phone) => {
      if (phone) {
        const normalizedPhone = phone.replace(/\D/g, '');
        socket.join(`customer_${normalizedPhone}`);
        console.log(`User joined personal room: customer_${normalizedPhone}`);
      }
    });

    /**
     * JOIN TABLE ROOM
     * Scoped by table ID for active dining session updates.
     */
    socket.on('joinTable', (tableId) => {
      if (!tableId) return;
      const room = `table_${tableId}`;
      socket.join(room);
      console.log(`Client joined active table room: ${room}`);
    });

    /**
     * JOIN ADMIN/KITCHEN ROOM
     * Scoped by restaurantId to ensure data isolation between different restaurants.
     */
    socket.on('join-kitchen-room', (restaurantId) => {
      if (!restaurantId) return;
      const room = `kitchen_${restaurantId}`;
      socket.join(room);
      console.log(`Admin/Kitchen terminal joined room: ${room}`);
    });

    /**
     * NEW ORDER RELAY
     * Triggered when a customer completes checkout.
     */
    socket.on('new-order-placed', (data) => {
      if (!data) return;
      const { order, restaurantId } = data;
      if (restaurantId) {
        const room = `kitchen_${restaurantId}`;
        io.to(room).emit('new-order', order);
        console.log(`Order ${order._id} pushed to Kitchen: ${room}`);
      }
    });

    /**
     * ORDER STATUS & PAYMENT RELAY
     * Updates both the Kitchen Board and the Customer's mobile UI.
     */
    socket.on('update-order-status', (data) => {
      if (!data) return;
      const { orderId, status, isPaid, restaurantId, tableId } = data;
      
      const kitchenRoom = `kitchen_${restaurantId}`;
      const tableRoom = `table_${tableId}`;

      if (restaurantId) {
        // Sync all admin terminals (useful for multi-screen setups)
        io.to(kitchenRoom).emit('ORDER_STATUS_UPDATED', { orderId, status, isPaid });
      }

      if (tableId) {
        // Notify the customer directly (triggers "Food is Ready" or "Paid" screens)
        io.to(tableRoom).emit('status-update', { orderId, status, isPaid });
      }
    });

    /**
     * BILL REQUEST & PREFERENCE RELAY
     * Relays the customer's choice (Email, SMS, or Printed) to the Admin.
     */
    socket.on('request-bill', (data) => {
      if (!data) return;
      const { restaurantId, tableId, orderId, billingPreference } = data;
      
      if (restaurantId) {
        const room = `kitchen_${restaurantId}`;
        io.to(room).emit('bill-requested', { 
          tableId, 
          orderId, 
          billingPreference // 'Email', 'SMS', or 'Printed Bill'
        });
        console.log(`Table ${tableId} requested ${billingPreference} bill in room ${room}`);
      }
    });

    /**
     * DIGITAL BILL SENT SYNC
     * Notifies other admin terminals that a bill has already been sent to prevent duplicates.
     */
    socket.on('bill-sent-notification', (data) => {
      if (!data) return;
      const { restaurantId, orderId, type } = data; 
      if (restaurantId) {
        io.to(`kitchen_${restaurantId}`).emit('BILL_SENT_SUCCESS', { orderId, type });
      }
    });

    /**
     * INVENTORY / "86" RELAY
     * Real-time item availability updates across all terminals.
     */
    socket.on('update-inventory', (data) => {
      if (!data || !data.restaurantId) return;
      io.to(`kitchen_${data.restaurantId}`).emit('INVENTORY_UPDATED', data);
    });

    // Error Handling & Cleanup
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    socket.on('error', (err) => {
      console.error('Socket.io error occurred:', err.message);
    });
  });

  console.log('--- OrderSocket.js System Initialized (Multi-Tenant) ---');
};