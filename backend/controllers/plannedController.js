const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const parseAmount = (value) => Number(value || 0);
const asDate = (value) => (value ? new Date(value) : new Date());

const parseMongoId = (value) => {
  if (!value || !ObjectId.isValid(value)) return null;
  return new ObjectId(value);
};

const getOrdersCollection = (db) => db.collection("orders");
const getPaymentsCollection = (db) => db.collection("payments");
const getProductsCollection = (db) => db.collection("products");
const getUsersCollection = (db) => db.collection("users");

const sendOtp = async (req, res, next) => {
  try {
    const db = getDB();
    const identifier = String(req.body.email || req.body.phone || "").trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Email or phone is required" });
    }

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.collection("otp_requests").insertOne({
      identifier,
      otp,
      verified: false,
      expiresAt,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "OTP sent successfully",
      data: { identifier, expiresAt },
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const db = getDB();
    const identifier = String(req.body.email || req.body.phone || "").trim();
    const otp = String(req.body.otp || "").trim();

    const record = await db.collection("otp_requests").findOne({
      identifier,
      otp,
      verified: false,
    });

    if (!record) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    await db.collection("otp_requests").updateOne(
      { _id: record._id },
      { $set: { verified: true, verifiedAt: new Date() } }
    );

    res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const db = getDB();
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const resetToken = new ObjectId().toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await db.collection("password_resets").insertOne({
      email,
      resetToken,
      used: false,
      expiresAt,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Password reset initiated",
      data: { email, resetToken, expiresAt },
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const db = getDB();
    const resetToken = String(req.body.resetToken || "").trim();
    const newPassword = String(req.body.password || "").trim();

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: "resetToken and password are required" });
    }

    const request = await db.collection("password_resets").findOne({ resetToken, used: false });
    if (!request) {
      return res.status(404).json({ success: false, message: "Invalid reset token" });
    }

    if (new Date(request.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Reset token expired" });
    }

    await db.collection("logins").updateOne(
      { email: request.email },
      { $set: { password: newPassword, updatedAt: new Date() } }
    );

    await db.collection("registers").updateMany(
      { email: request.email },
      { $set: { password: newPassword, confirmpassword: newPassword, updatedAt: new Date() } }
    );

    await db.collection("password_resets").updateOne(
      { _id: request._id },
      { $set: { used: true, usedAt: new Date() } }
    );

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};

const getProductsByCategory = async (req, res, next) => {
  try {
    const db = getDB();
    const name = String(req.params.name || "").trim();
    const products = await getProductsCollection(db)
      .find({ category: { $regex: `^${name}$`, $options: "i" } })
      .toArray();

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const getProductAvailability = async (req, res, next) => {
  try {
    const db = getDB();
    const id = parseMongoId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await getProductsCollection(db).findOne({ _id: id });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const stock = Number(product.stock || 0);
    res.json({
      success: true,
      data: {
        productId: req.params.id,
        inStock: stock > 0,
        stock,
        moq: Number(product.moq || 1),
      },
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = String(req.body.userId || "").trim();
    const productId = String(req.body.productId || "").trim();
    const quantity = Math.max(1, Number(req.body.quantity || 1));

    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: "userId and productId are required" });
    }

    const carts = db.collection("carts");
    const products = getProductsCollection(db);

    let product = null;
    const objectId = parseMongoId(productId);
    if (objectId) {
      product = await products.findOne({ _id: objectId });
    }
    if (!product) {
      product = await products.findOne({ id: productId });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const item = {
      itemId: new ObjectId().toString(),
      productId,
      quantity,
      name: product.name || "",
      price: Number(product.price || 0),
      moq: Number(product.moq || 1),
      updatedAt: new Date(),
    };

    const existing = await carts.findOne({ userId });
    if (!existing) {
      await carts.insertOne({ userId, items: [item], createdAt: new Date(), updatedAt: new Date() });
      return res.status(201).json({ success: true, message: "Item added to cart", data: item });
    }

    const index = (existing.items || []).findIndex((entry) => String(entry.productId) === productId);
    if (index === -1) {
      await carts.updateOne(
        { userId },
        { $push: { items: item }, $set: { updatedAt: new Date() } }
      );
      return res.status(201).json({ success: true, message: "Item added to cart", data: item });
    }

    const items = [...existing.items];
    items[index] = {
      ...items[index],
      quantity: Number(items[index].quantity || 0) + quantity,
      updatedAt: new Date(),
    };

    await carts.updateOne({ userId }, { $set: { items, updatedAt: new Date() } });
    res.json({ success: true, message: "Cart quantity updated", data: items[index] });
  } catch (error) {
    next(error);
  }
};

const getCartByUserId = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = String(req.params.userId || "").trim();
    const cart = await db.collection("carts").findOne({ userId });

    res.json({
      success: true,
      data: cart || { userId, items: [] },
    });
  } catch (error) {
    next(error);
  }
};

const updateCartByUserId = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = String(req.params.userId || "").trim();
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    await db.collection("carts").updateOne(
      { userId },
      { $set: { userId, items, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    res.json({ success: true, message: "Cart updated" });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const db = getDB();
    const itemId = String(req.params.itemId || "").trim();

    const result = await db.collection("carts").updateMany(
      {},
      { $pull: { items: { itemId } }, $set: { updatedAt: new Date() } }
    );

    res.json({
      success: true,
      message: "Cart item removed",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

const clearCartByUserId = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = String(req.params.userId || "").trim();
    await db.collection("carts").updateOne(
      { userId },
      { $set: { items: [], updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    next(error);
  }
};

const validateCart = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const invalidItems = items.filter((item) => Number(item.quantity || 0) < Number(item.moq || 1));
    res.json({
      success: true,
      data: {
        valid: invalidItems.length === 0,
        invalidItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getOrdersByUserId = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = String(req.params.userId || "").trim();
    const orders = await getOrdersCollection(db).find({ userId }).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const db = getDB();
    const orderId = parseMongoId(req.params.orderId);
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const nextStatus = String(req.body.status || "Pending");
    const result = await getOrdersCollection(db).updateOne(
      { _id: orderId },
      {
        $set: { status: nextStatus, action: req.body.action || nextStatus, statusUpdatedAt: new Date() },
        $push: { statusHistory: { status: nextStatus, at: new Date() } },
      }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order status updated" });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  req.body.status = "Cancelled";
  req.body.action = "Cancelled";
  return updateOrderStatus(req, res, next);
};

const filterOrdersForAdmin = async (req, res, next) => {
  try {
    const db = getDB();
    const filter = {};
    if (req.query.status) {
      filter.status = String(req.query.status);
    }
    if (req.query.payment) {
      filter.payment = String(req.query.payment);
    }
    if (req.query.userId) {
      filter.userId = String(req.query.userId);
    }

    const orders = await getOrdersCollection(db).find(filter).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const generateOrderInvoice = async (req, res, next) => {
  try {
    const db = getDB();
    const orderId = parseMongoId(req.params.orderId);
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await getOrdersCollection(db).findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const invoice = {
      invoiceId: `INV-${req.params.orderId}`,
      orderId: req.params.orderId,
      amount: Number(order.totalAmount || 0),
      generatedAt: new Date(),
      status: "Generated",
    };

    await db.collection("invoices").insertOne(invoice);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

const initiatePayment = async (req, res, next) => {
  try {
    const db = getDB();
    const payment = {
      orderId: String(req.body.orderId || ""),
      amount: parseAmount(req.body.amount),
      method: String(req.body.method || "UPI"),
      status: "Pending",
      gatewayReference: `PAY-${Date.now()}`,
      date: asDate(req.body.date),
      createdAt: new Date(),
    };

    const result = await getPaymentsCollection(db).insertOne(payment);
    res.status(201).json({
      success: true,
      message: "Payment initiated",
      insertedId: result.insertedId,
      data: { ...payment, _id: result.insertedId },
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const db = getDB();
    const id = parseMongoId(req.body.paymentId);
    if (!id) {
      return res.status(400).json({ success: false, message: "Valid paymentId is required" });
    }

    const result = await getPaymentsCollection(db).updateOne(
      { _id: id },
      {
        $set: {
          status: req.body.status || "Completed",
          verificationReference: req.body.verificationReference || "manual-verified",
          verifiedAt: new Date(),
        },
      }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    res.json({ success: true, message: "Payment verified" });
  } catch (error) {
    next(error);
  }
};

const getPaymentsByOrderId = async (req, res, next) => {
  try {
    const db = getDB();
    const orderId = String(req.params.orderId || "");
    const payments = await getPaymentsCollection(db).find({ orderId }).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const db = getDB();
    const id = parseMongoId(req.params.paymentId);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid payment ID" });
    }

    const result = await getPaymentsCollection(db).updateOne(
      { _id: id },
      { $set: { status: req.body.status || "Pending", updatedAt: new Date() } }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    res.json({ success: true, message: "Payment status updated" });
  } catch (error) {
    next(error);
  }
};

const getPaymentReconciliation = async (req, res, next) => {
  try {
    const db = getDB();
    const payments = await getPaymentsCollection(db).find().toArray();

    const summary = payments.reduce(
      (acc, entry) => {
        const amount = Number(entry.amount || 0);
        acc.totalAmount += amount;
        acc.totalCount += 1;
        const status = String(entry.status || "Unknown");
        acc.byStatus[status] = (acc.byStatus[status] || 0) + 1;
        return acc;
      },
      { totalAmount: 0, totalCount: 0, byStatus: {} }
    );

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

const getDeliveryLocations = async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: "anand-main", name: "Anand Main", city: "Anand", state: "Gujarat" },
      { id: "vidyanagar", name: "Vallabh Vidyanagar", city: "Anand", state: "Gujarat" },
      { id: "nadiad", name: "Nadiad", city: "Kheda", state: "Gujarat" },
    ],
  });
};

const estimateDelivery = async (req, res) => {
  const distanceKm = Number(req.body.distanceKm || 0);
  const orderAmount = Number(req.body.orderAmount || 0);
  let estimate = Math.max(20, Math.ceil(distanceKm) * 8);
  if (orderAmount >= 5000) estimate = 0;
  res.json({ success: true, data: { distanceKm, orderAmount, estimatedCharge: estimate } });
};

const validateDeliveryAddress = async (req, res) => {
  const pincode = String(req.body.pincode || "").trim();
  const city = String(req.body.city || "").trim();
  const valid = /^\d{6}$/.test(pincode) && city.length > 1;
  res.json({ success: true, data: { valid, pincode, city } });
};

const getOrderTracking = async (req, res, next) => {
  try {
    const db = getDB();
    const orderId = parseMongoId(req.params.orderId);
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await getOrdersCollection(db).findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      data: {
        orderId: req.params.orderId,
        status: order.status || "Pending",
        timeline: order.statusHistory || [{ status: order.status || "Pending", at: order.updatedAt || order.createdAt || new Date() }],
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateDeliveryAddressByOrder = async (req, res, next) => {
  try {
    const db = getDB();
    const orderId = parseMongoId(req.params.orderId);
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const result = await getOrdersCollection(db).updateOne(
      { _id: orderId },
      {
        $set: {
          deliveryAddress: req.body.deliveryAddress || "",
          city: req.body.city || "",
          pincode: req.body.pincode || "",
          specialInstruction: req.body.specialInstruction || "",
          updatedAt: new Date(),
        },
      }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Delivery address updated" });
  } catch (error) {
    next(error);
  }
};

const bulkDeliveryEstimates = async (req, res) => {
  const locations = Array.isArray(req.body.locations) ? req.body.locations : [];
  const orderAmount = Number(req.body.orderAmount || 0);
  const estimates = locations.map((entry) => {
    const distanceKm = Number(entry.distanceKm || 0);
    let charge = Math.max(20, Math.ceil(distanceKm) * 8);
    if (orderAmount >= 5000) charge = 0;
    return { locationId: entry.locationId || null, distanceKm, estimatedCharge: charge };
  });

  res.json({ success: true, data: estimates });
};

const changeUserPassword = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = parseMongoId(req.params.userId);
    if (!userId) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const newPassword = String(req.body.newPassword || req.body.password || "").trim();
    if (!newPassword) {
      return res.status(400).json({ success: false, message: "newPassword is required" });
    }

    const result = await getUsersCollection(db).updateOne(
      { _id: userId },
      { $set: { password: newPassword, updatedAt: new Date() } }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Password changed" });
  } catch (error) {
    next(error);
  }
};

const addUserAddress = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = parseMongoId(req.params.userId);
    if (!userId) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const address = {
      addressId: new ObjectId().toString(),
      label: req.body.label || "Home",
      line1: req.body.line1 || "",
      line2: req.body.line2 || "",
      city: req.body.city || "",
      state: req.body.state || "",
      pincode: req.body.pincode || "",
      phone: req.body.phone || "",
      createdAt: new Date(),
    };

    await getUsersCollection(db).updateOne(
      { _id: userId },
      { $push: { addresses: address }, $set: { updatedAt: new Date() } }
    );

    res.status(201).json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

const listUserAddresses = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = parseMongoId(req.params.userId);
    if (!userId) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await getUsersCollection(db).findOne({ _id: userId }, { projection: { addresses: 1 } });
    res.json({ success: true, data: user?.addresses || [] });
  } catch (error) {
    next(error);
  }
};

const updateUserAddress = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = parseMongoId(req.params.userId);
    const addressId = String(req.params.addressId || "");
    if (!userId || !addressId) {
      return res.status(400).json({ success: false, message: "Invalid userId/addressId" });
    }

    const user = await getUsersCollection(db).findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const addresses = Array.isArray(user.addresses) ? user.addresses : [];
    const idx = addresses.findIndex((entry) => String(entry.addressId) === addressId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    addresses[idx] = { ...addresses[idx], ...req.body, addressId, updatedAt: new Date() };
    await getUsersCollection(db).updateOne(
      { _id: userId },
      { $set: { addresses, updatedAt: new Date() } }
    );

    res.json({ success: true, data: addresses[idx] });
  } catch (error) {
    next(error);
  }
};

const deleteUserAddress = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = parseMongoId(req.params.userId);
    const addressId = String(req.params.addressId || "");
    if (!userId || !addressId) {
      return res.status(400).json({ success: false, message: "Invalid userId/addressId" });
    }

    await getUsersCollection(db).updateOne(
      { _id: userId },
      { $pull: { addresses: { addressId } }, $set: { updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Address deleted" });
  } catch (error) {
    next(error);
  }
};

const adminDashboard = async (req, res, next) => {
  try {
    const db = getDB();
    const [orders, products, users, payments] = await Promise.all([
      getOrdersCollection(db).countDocuments(),
      getProductsCollection(db).countDocuments(),
      getUsersCollection(db).countDocuments(),
      getPaymentsCollection(db).countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders: orders,
        totalProducts: products,
        totalUsers: users,
        totalPayments: payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminSalesAnalytics = async (req, res, next) => {
  try {
    const db = getDB();
    const orders = await getOrdersCollection(db).find().toArray();
    const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    res.json({ success: true, data: { totalSales, orderCount: orders.length } });
  } catch (error) {
    next(error);
  }
};

const adminProductAnalytics = async (req, res, next) => {
  try {
    const db = getDB();
    const products = await getProductsCollection(db).find().toArray();
    const lowStock = products.filter((entry) => Number(entry.stock || 0) <= Number(entry.moq || 1));
    res.json({ success: true, data: { totalProducts: products.length, lowStockCount: lowStock.length, lowStock } });
  } catch (error) {
    next(error);
  }
};

const adminUserAnalytics = async (req, res, next) => {
  try {
    const db = getDB();
    const users = await getUsersCollection(db).find().toArray();
    res.json({ success: true, data: { totalUsers: users.length } });
  } catch (error) {
    next(error);
  }
};

const adminExportReport = async (req, res, next) => {
  try {
    const db = getDB();
    const [orders, payments] = await Promise.all([
      getOrdersCollection(db).find().toArray(),
      getPaymentsCollection(db).find().toArray(),
    ]);

    const report = {
      generatedAt: new Date(),
      totals: {
        orders: orders.length,
        payments: payments.length,
        revenue: orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
      },
    };

    await db.collection("admin_reports").insertOne(report);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const contactSubmit = async (req, res, next) => {
  try {
    const db = getDB();
    const record = {
      name: req.body.name || "",
      email: req.body.email || "",
      phoneNumber: req.body.phoneNumber || req.body.phone || "",
      subject: req.body.subject || "",
      message: req.body.message || "",
      createdAt: new Date(),
    };

    const result = await db.collection("contacts").insertOne(record);
    res.status(201).json({ success: true, message: "Contact submitted", insertedId: result.insertedId });
  } catch (error) {
    next(error);
  }
};

const sendEmailNotification = async (req, res, next) => {
  try {
    const db = getDB();
    const entry = {
      channel: "email",
      to: req.body.to || req.body.email || "",
      subject: req.body.subject || "Notification",
      message: req.body.message || "",
      status: "queued",
      createdAt: new Date(),
    };

    const result = await db.collection("notifications").insertOne(entry);
    res.status(201).json({ success: true, message: "Email notification queued", insertedId: result.insertedId });
  } catch (error) {
    next(error);
  }
};

const sendSmsNotification = async (req, res, next) => {
  try {
    const db = getDB();
    const entry = {
      channel: "sms",
      to: req.body.to || req.body.phone || "",
      message: req.body.message || "",
      status: "queued",
      createdAt: new Date(),
    };

    const result = await db.collection("notifications").insertOne(entry);
    res.status(201).json({ success: true, message: "SMS notification queued", insertedId: result.insertedId });
  } catch (error) {
    next(error);
  }
};

const listAdminNotifications = async (req, res, next) => {
  try {
    const db = getDB();
    const notifications = await db.collection("notifications").find().sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  getProductsByCategory,
  getProductAvailability,
  addToCart,
  getCartByUserId,
  updateCartByUserId,
  removeCartItem,
  clearCartByUserId,
  validateCart,
  getOrdersByUserId,
  updateOrderStatus,
  cancelOrder,
  filterOrdersForAdmin,
  generateOrderInvoice,
  initiatePayment,
  verifyPayment,
  getPaymentsByOrderId,
  updatePaymentStatus,
  getPaymentReconciliation,
  getDeliveryLocations,
  estimateDelivery,
  validateDeliveryAddress,
  getOrderTracking,
  updateDeliveryAddressByOrder,
  bulkDeliveryEstimates,
  changeUserPassword,
  addUserAddress,
  listUserAddresses,
  updateUserAddress,
  deleteUserAddress,
  adminDashboard,
  adminSalesAnalytics,
  adminProductAnalytics,
  adminUserAnalytics,
  adminExportReport,
  contactSubmit,
  sendEmailNotification,
  sendSmsNotification,
  listAdminNotifications,
};
