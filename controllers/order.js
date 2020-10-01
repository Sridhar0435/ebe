const { Order, CartItem } = require("../models/Order");

exports.orderById = (req, res, next, id) => {
  Order.findById(id)
    .populate("products.product", "name price")
    .exec((err, order) => {
      if (err || !order) {
        if (err) {
          return res.status(400).json({ error: err });
        }
      }
      req.order = order;
      next();
    });
};

exports.createOrder = (req, res) => {
  //   console.log("Create order:", req.body);
  req.body.order.user = req.profile;
  const order = new Order(req.body.order);
  order.save((error, data) => {
    if (error) {
      return res.status(400).json({ error: error });
    }
    res.json(data);
  });
};

exports.listOrders = (req, res) => {
  Order.find()
    .populate("user", "_id name address createdAt")
    .sort("-created")
    .exec((err, orders) => {
      if (err) {
        return res.status(400).json({ error: err });
      }
      res.json(orders);
    });
};

exports.getStatusValues = (req, res) => {
  res.json(Order.schema.path("status").enumValues);
};

exports.updateOrderStatus = (req, res) => {
  Order.update(
    { _id: req.body.orderId },
    { $set: { status: req.body.status } },
    (err, order) => {
      if (err) {
        return res.status(400).json({ error: err });
      }
      res.json(order);
    }
  );
};
