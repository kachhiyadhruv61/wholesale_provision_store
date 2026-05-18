const express = require("express");
const router = express.Router();
const plannedController = require("../controllers/plannedController");

// Auth (missing endpoints)
router.post("/auth/send-otp", plannedController.sendOtp);
router.post("/auth/verify-otp", plannedController.verifyOtp);
router.post("/auth/forgot-password", plannedController.forgotPassword);

// Product (missing endpoints)
router.get("/products/category/:name", plannedController.getProductsByCategory);
router.get("/products/:id/availability", plannedController.getProductAvailability);

// Cart
router.post("/cart/add", plannedController.addToCart);
router.get("/cart/:userId", plannedController.getCartByUserId);
router.put("/cart/:userId", plannedController.updateCartByUserId);
router.delete("/cart/item/:itemId", plannedController.removeCartItem);
router.delete("/cart/:userId", plannedController.clearCartByUserId);
router.post("/cart/validate", plannedController.validateCart);

// Orders (missing endpoints)
router.get("/orders/user/:userId", plannedController.getOrdersByUserId);
router.put("/orders/:orderId/status", plannedController.updateOrderStatus);
router.put("/orders/:orderId/cancel", plannedController.cancelOrder);
router.get("/orders/admin/filter", plannedController.filterOrdersForAdmin);
router.post("/orders/:orderId/invoice", plannedController.generateOrderInvoice);
router.get("/orders/:orderId/tracking", plannedController.getOrderTracking);

// Payments (missing endpoints)
router.post("/payments/initiate", plannedController.initiatePayment);
router.post("/payments/verify", plannedController.verifyPayment);
router.get("/payments/order/:orderId", plannedController.getPaymentsByOrderId);
router.put("/payments/:paymentId/status", plannedController.updatePaymentStatus);
router.get("/payments/admin/reconciliation", plannedController.getPaymentReconciliation);

// Delivery
router.get("/delivery/locations", plannedController.getDeliveryLocations);
router.post("/delivery/estimate", plannedController.estimateDelivery);
router.post("/delivery/address/validate", plannedController.validateDeliveryAddress);
router.put("/delivery/:orderId/address", plannedController.updateDeliveryAddressByOrder);
router.get("/delivery/estimates/bulk", plannedController.bulkDeliveryEstimates);

// User profile extensions
router.post("/users/:userId/change-password", plannedController.changeUserPassword);
router.post("/users/:userId/addresses", plannedController.addUserAddress);
router.get("/users/:userId/addresses", plannedController.listUserAddresses);
router.put("/users/:userId/addresses/:addressId", plannedController.updateUserAddress);
router.delete("/users/:userId/addresses/:addressId", plannedController.deleteUserAddress);

// Admin analytics
router.get("/admin/dashboard", plannedController.adminDashboard);
router.get("/admin/analytics/sales", plannedController.adminSalesAnalytics);
router.get("/admin/analytics/products", plannedController.adminProductAnalytics);
router.get("/admin/analytics/users", plannedController.adminUserAnalytics);
router.get("/admin/reports/export", plannedController.adminExportReport);

// Contact and notifications
router.post("/contact/submit", plannedController.contactSubmit);
router.post("/notifications/email", plannedController.sendEmailNotification);
router.post("/notifications/sms", plannedController.sendSmsNotification);
router.get("/admin/notifications", plannedController.listAdminNotifications);

module.exports = router;
