export const GST_RULES = {
  Grocery: 5,
  "Pan Center": 28,
  "Masala Spices": 5,
  "Daily Used Product": 12,
  Snacks: 5,
  Biscuits: 5,
  Chocolates: 12,
};

const CATEGORY_ALIASES = {
  grains: "Grocery",
  grocery: "Grocery",
  grocerry: "Grocery",
  "pan center": "Pan Center",
  "masala spices": "Masala Spices",
  "daily used product": "Daily Used Product",
  snacks: "Snacks",
  biscuit: "Biscuits",
  biscuits: "Biscuits",
  chocolate: "Chocolates",
  chocolates: "Chocolates",
};

const toMoney = (value) => Number(Number(value || 0).toFixed(2));

export const normalizeCategory = (category) => {
  const key = String(category || "").trim().toLowerCase();
  if (!key) return "";
  return CATEGORY_ALIASES[key] || String(category || "").trim();
};

export const getGstRateByCategory = (category) => {
  const normalizedCategory = normalizeCategory(category);
  return Number(GST_RULES[normalizedCategory] || 0);
};

export const calculateCartItemBilling = (item = {}) => {
  const quantity = Number(item.quantity || 1);
  const price = Number(item.price || 0);
  const category = normalizeCategory(item.category || "");
  const gstPercent = Number(
    item.gstPercent != null ? item.gstPercent : getGstRateByCategory(category)
  );

  const subtotal = toMoney(price * quantity);
  const gstAmount = toMoney((subtotal * gstPercent) / 100);
  const total = toMoney(subtotal + gstAmount);

  return {
    ...item,
    category,
    quantity,
    price,
    gstPercent,
    subtotal,
    gstAmount,
    total,
  };
};

export const calculateCartBilling = (cart = []) => {
  const billedItems = cart.map((item) => calculateCartItemBilling(item));

  const subtotalBeforeGst = toMoney(
    billedItems.reduce((sum, item) => sum + item.subtotal, 0)
  );
  const totalGst = toMoney(
    billedItems.reduce((sum, item) => sum + item.gstAmount, 0)
  );
  const subtotalAfterGst = toMoney(subtotalBeforeGst + totalGst);

  return {
    items: billedItems,
    subtotalBeforeGst,
    totalGst,
    subtotalAfterGst,
  };
};

export const generateInvoice = ({
  shopName = "Wholesale Store",
  items = [],
  dateTime = new Date().toISOString(),
  deliveryCharge = 0,
  invoiceNumber,
}) => {
  const billing = calculateCartBilling(items);
  const safeDelivery = toMoney(deliveryCharge);
  const finalPayableAmount = toMoney(billing.subtotalAfterGst + safeDelivery);

  return {
    invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
    shopName,
    dateTime,
    items: billing.items,
    totalAmountBeforeGst: billing.subtotalBeforeGst,
    totalGst: billing.totalGst,
    deliveryCharge: safeDelivery,
    finalPayableAmount,
  };
};

export const formatInvoiceText = (invoice) => {
  const lines = [
    `${invoice.shopName}`,
    `Invoice No: ${invoice.invoiceNumber}`,
    `Date: ${new Date(invoice.dateTime).toLocaleString("en-IN")}`,
    "",
    "Items:",
  ];

  invoice.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name || "Item"} | Qty: ${item.quantity} | Price: Rs ${item.price.toFixed(
        2
      )} | GST: ${item.gstPercent}% | GST Amt: Rs ${item.gstAmount.toFixed(2)} | Total: Rs ${item.total.toFixed(2)}`
    );
  });

  lines.push("");
  lines.push(`Total before GST: Rs ${invoice.totalAmountBeforeGst.toFixed(2)}`);
  lines.push(`Total GST: Rs ${invoice.totalGst.toFixed(2)}`);
  lines.push(`Delivery Charge: Rs ${invoice.deliveryCharge.toFixed(2)}`);
  lines.push(`Final Payable Amount: Rs ${invoice.finalPayableAmount.toFixed(2)}`);

  return lines.join("\n");
};
