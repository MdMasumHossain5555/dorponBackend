const Order = require("./order.model");
const nodemailer = require("nodemailer");
const env = require("../../config/env");
const https = require("https");

const SSL_API_URL_LIVE = "https://securepay.sslcommerz.com/gwprocess/v4/api.php";
const SSL_API_URL_SANDBOX =
  "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

const ORDER_POPULATE = [
  {
    path: "userId",
    select: "first_name last_name email number",
  },
  {
    path: "products.productId",
    select: "name images price",
  },
];

const canSendEmail =
  !!env.smtpHost && !!env.smtpPort && !!env.smtpUser && !!env.smtpPass;

const createTransporter = () => {
  if (!canSendEmail) return null;

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
};

const buildOrderItems = (order) => {
  const items = order.products || [];

  return items.map((item) => {
    const product = item.productId || {};
    const name = product.name || "Product";
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(product.price || 0);
    const lineTotal = unitPrice * quantity;

    return {
      name,
      quantity,
      unitPrice,
      lineTotal,
    };
  });
};

const canUseSslCommerz = !!env.sslStoreId && !!env.sslStorePassword;

const getBackendUrl = () => env.backendUri || `http://localhost:${env.port}`;

const getPaymentRedirectUrl = (path, order) => {
  const frontend = env.frontendUri || "http://localhost:3000";
  const params = new URLSearchParams({
    orderId: String(order?._id || ""),
    tran_id: String(order?.paymentTransactionId || ""),
  });

  return `${frontend}/checkout/${path}?${params.toString()}`;
};

const buildSslPayload = (order) => {
  const backendUrl = getBackendUrl();
  const methodMap = {
    bkash: "bkash",
    nagad: "nagad",
    rocket: "rocket",
    visa: "visacard",
    master: "mastercard",
  };
  const selectedMethod = methodMap[String(order.paymentMethod || "").toLowerCase()];

  const payload = {
    store_id: env.sslStoreId,
    store_passwd: env.sslStorePassword,
    total_amount: Number(order.subtotal || order.totalPrice || 0).toFixed(2),
    currency: "BDT",
    tran_id: order.paymentTransactionId,
    success_url: `${backendUrl}/api/order/payment/success`,
    fail_url: `${backendUrl}/api/order/payment/fail`,
    cancel_url: `${backendUrl}/api/order/payment/cancel`,
    ipn_url: `${backendUrl}/api/order/payment/ipn`,
    shipping_method: "NO",
    product_name: "Dorpon Order",
    product_category: "Ecommerce",
    product_profile: "general",
    cus_name: order.full_name,
    cus_email: order.email,
    cus_add1: order.address,
    cus_phone: order.number,
    value_a: String(order._id),
  };

  if (selectedMethod) {
    payload.multi_card_name = selectedMethod;
  }

  return payload;
};

const createSslSession = async (order) => {
  if (!canUseSslCommerz) {
    throw new Error("SSLCommerz credentials are missing in environment");
  }

  const payload = buildSslPayload(order);
  const gateway = env.sslIsLive ? SSL_API_URL_LIVE : SSL_API_URL_SANDBOX;

  const data = await new Promise((resolve, reject) => {
    const body = new URLSearchParams(payload).toString();
    const url = new URL(gateway);

    const request = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        let raw = "";
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new Error(`SSLCommerz gateway returned ${response.statusCode}`)
            );
            return;
          }

          try {
            resolve(JSON.parse(raw));
          } catch (parseError) {
            reject(new Error("Invalid response from SSLCommerz gateway"));
          }
        });
      }
    );

    request.on("error", (error) => reject(error));
    request.write(body);
    request.end();
  });

  if (!data?.GatewayPageURL) {
    throw new Error(data?.failedreason || "Failed to create SSLCommerz session");
  }

  return data;
};

const sendOrderConfirmationEmail = async (order) => {
  if (!order?.email) return;

  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP config missing; order confirmation email skipped.");
    return;
  }

  const items = buildOrderItems(order);
  const from = env.smtpFrom || env.smtpUser;

  const lines = items
    .map(
      (item, index) =>
        `${index + 1}. ${item.name} - Qty: ${item.quantity} - Unit: ${item.unitPrice.toFixed(
          2
        )} - Line Total: ${item.lineTotal.toFixed(2)}`
    )
    .join("\n");

  const text = `Hello ${order.full_name},\n\nYour order has been confirmed and marked as delivered.\n\nOrdered items:\n${lines}\n\nSubtotal: ${Number(
    order.subtotal || 0
  ).toFixed(2)}\nShipping: ${Number(order.shippingCost || 0).toFixed(
    2
  )}\nTotal: ${Number(order.totalPrice || 0).toFixed(2)}\n\nThank you for shopping with us.`;

  const htmlRows = items
    .map(
      (item) =>
        `<tr><td style="padding:8px;border:1px solid #ddd;">${item.name}</td><td style="padding:8px;border:1px solid #ddd;">${item.quantity}</td><td style="padding:8px;border:1px solid #ddd;">${item.unitPrice.toFixed(
          2
        )}</td><td style="padding:8px;border:1px solid #ddd;">${item.lineTotal.toFixed(
          2
        )}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937;">
      <h2>Order Confirmed</h2>
      <p>Hello ${order.full_name},</p>
      <p>Your order has been confirmed and marked as delivered.</p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 12px;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Item</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Quantity</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Unit Price</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Total</th>
          </tr>
        </thead>
        <tbody>${htmlRows}</tbody>
      </table>
      <p style="margin-top: 14px;"><strong>Subtotal:</strong> ${Number(
        order.subtotal || 0
      ).toFixed(2)}</p>
      <p><strong>Shipping:</strong> ${Number(order.shippingCost || 0).toFixed(2)}</p>
      <p><strong>Total:</strong> ${Number(order.totalPrice || 0).toFixed(2)}</p>
      <p style="margin-top: 16px;">Thank you for shopping with us.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: order.email,
    subject: `Order Confirmed - ${order._id}`,
    text,
    html,
  });
};

exports.addOrder = async (req, res) => {
  try {
    const {
      userId,
      products,
      totalPrice,
      shippingCost,
      subtotal,
      address,
      email,
      number,
      full_name,
      paymentMethod,
      paymentDetails,
      paymentStatus,
      paymentGateway,
      paymentTransactionId,
    } = req.body;
    const order = new Order({
      userId,
      products,
      totalPrice,
      shippingCost,
      subtotal,
      address,
      email,
      number,
      full_name,
      paymentMethod,
      paymentDetails,
      paymentStatus,
      paymentGateway,
      paymentTransactionId,
    });
    await order.save();
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.initiateSslPayment = async (req, res) => {
  try {
    if (!canUseSslCommerz) {
      return res.status(400).json({
        success: false,
        message:
          "SSLCommerz is not configured. Set SSL_STORE_ID and SSL_STORE_PASSWORD in backend env.",
      });
    }

    const {
      userId,
      products,
      totalPrice,
      shippingCost,
      subtotal,
      address,
      email,
      number,
      full_name,
      paymentMethod,
      paymentDetails,
    } = req.body;

    if (!userId || !full_name || !email || !number || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing customer information for payment",
      });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products found for payment",
      });
    }

    const transactionId = `TXN-${Date.now()}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    const order = new Order({
      userId,
      products,
      totalPrice,
      shippingCost,
      subtotal,
      address,
      email,
      number,
      full_name,
      paymentMethod: paymentMethod || "sslcommerz",
      paymentStatus: "pending",
      paymentGateway: "sslcommerz",
      paymentTransactionId: transactionId,
      paymentDetails: paymentDetails || transactionId,
    });

    await order.save();

    try {
      const session = await createSslSession(order);

      res.status(200).json({
        success: true,
        orderId: order._id,
        transactionId,
        gatewayUrl: session.GatewayPageURL,
      });
    } catch (paymentError) {
      order.paymentStatus = "failed";
      order.updatedAt = new Date();
      await order.save();

      res.status(500).json({
        success: false,
        message: paymentError.message,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderPaymentByTransaction = async ({
  transactionId,
  paymentStatus,
  paymentDetails,
}) => {
  if (!transactionId) return null;

  const order = await Order.findOne({ paymentTransactionId: transactionId });
  if (!order) return null;

  order.paymentStatus = paymentStatus;
  if (paymentDetails) {
    order.paymentDetails = paymentDetails;
  }
  order.updatedAt = new Date();
  await order.save();
  return order;
};

exports.sslPaymentSuccess = async (req, res) => {
  try {
    const transactionId = req.body?.tran_id || req.query?.tran_id;
    const validationId = req.body?.val_id || req.query?.val_id;

    const order = await updateOrderPaymentByTransaction({
      transactionId,
      paymentStatus: "paid",
      paymentDetails: validationId || transactionId,
    });

    const redirectUrl = getPaymentRedirectUrl("success", order || {
      _id: "",
      paymentTransactionId: transactionId,
    });

    return res.redirect(redirectUrl);
  } catch (error) {
    return res.status(500).send("Payment success handling failed");
  }
};

exports.sslPaymentFail = async (req, res) => {
  try {
    const transactionId = req.body?.tran_id || req.query?.tran_id;

    const order = await updateOrderPaymentByTransaction({
      transactionId,
      paymentStatus: "failed",
      paymentDetails: transactionId,
    });

    const redirectUrl = getPaymentRedirectUrl("failed", order || {
      _id: "",
      paymentTransactionId: transactionId,
    });

    return res.redirect(redirectUrl);
  } catch (error) {
    return res.status(500).send("Payment fail handling failed");
  }
};

exports.sslPaymentCancel = async (req, res) => {
  try {
    const transactionId = req.body?.tran_id || req.query?.tran_id;

    const order = await updateOrderPaymentByTransaction({
      transactionId,
      paymentStatus: "failed",
      paymentDetails: transactionId,
    });

    const redirectUrl = getPaymentRedirectUrl("cancelled", order || {
      _id: "",
      paymentTransactionId: transactionId,
    });

    return res.redirect(redirectUrl);
  } catch (error) {
    return res.status(500).send("Payment cancel handling failed");
  }
};

exports.sslPaymentIpn = async (req, res) => {
  try {
    const transactionId = req.body?.tran_id || req.query?.tran_id;
    const status = String(req.body?.status || req.query?.status || "").toUpperCase();

    if (status === "VALID") {
      await updateOrderPaymentByTransaction({
        transactionId,
        paymentStatus: "paid",
        paymentDetails: req.body?.val_id || transactionId,
      });
    }

    return res.status(200).send("IPN received");
  } catch (error) {
    return res.status(500).send("IPN handling failed");
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate(ORDER_POPULATE);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrdersForUser = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).populate(
      ORDER_POPULATE
    );
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(ORDER_POPULATE);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(ORDER_POPULATE);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.status;
    Object.keys(req.body || {}).forEach((key) => {
      order[key] = req.body[key];
    });
    order.updatedAt = new Date();

    await order.save();
    await order.populate(ORDER_POPULATE);

    const isConfirmedNow =
      req.body?.status === "delivered" && previousStatus !== "delivered";

    if (isConfirmedNow) {
      try {
        await sendOrderConfirmationEmail(order);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
