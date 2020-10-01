const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

const Product = require("../models/Product");
const User = require("../models/User");
const { profile } = require("console");

exports.productById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err || !product) {
        res.status(400).json({ err: "Product not found" });
      }
      req.product = product;
      next();
    });
};

exports.create = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keppExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(400).json({ err: "Image could not be uploaded" });
    }
    const { name, description, price, category, quantity, shipping } = fields;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({ err: "All fields are requiredd" });
    }
    let product = new Product(fields);

    //1kb = 1000
    //1mb = 1000000

    if (files.photo) {
      // if(files.photo.size > 1000000){
      //if image want to be less then 1mb use this code
      // }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }
    product.save((err, result) => {
      if (err) {
        return res.status(400).json({ err: err.message });
      }

      res.json(result);
    });
  });
};

exports.read = (req, res) => {
  req.product.photo = undefined;
  return res.json(req.product);
};

exports.remove = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err) {
      res.status(400).json({
        err: "Product not deleted",
      });
    }
    res.json({
      //   deletedProduct,
      message: "Product deleted successfully",
    });
  });
};

exports.update = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keppExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(400).json({ err: "Image could not be uploaded" });
    }
    // const { name, description, price, category, quantity, shipping } = fields;
    // if (
    //   !name ||
    //   !description ||
    //   !price ||
    //   !category ||
    //   !quantity ||
    //   !shipping
    // ) {
    //   return res.status(400).json({ err: "All fields are requiredd" });
    // }
    let product = req.product;
    product = _.extend(product, fields);

    //1kb = 1000
    //1mb = 1000000

    if (files.photo) {
      // if(files.photo.size > 1000000){
      //if image want to be less then 1mb use this code
      // }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }
    product.save((err, result) => {
      if (err) {
        return res.status(400).json({ err: err.message });
      }

      res.json(result);
    });
  });
};

/**
 * sell / arrival
 * by sell = //products?sortBy=sold&order=desc&limit=4
 * by arrival = /products?sortBy=createdAt&order=desc&limit=4
 * if no params are sent, then all products are returned
 */

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : "asc"; //desc
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          err: "Products not found",
        });
      }
      res.json(data);
    });
};

/**
 * it will find the products based on the req product category
 * other products that has the same category, will be returned
 */

exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find({ _id: { $ne: req.product }, category: req.product.category })
    .limit(limit)
    .populate("category", "_id name")
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({ err: "Products not found" });
      }
      res.json(data);
    });
};

exports.listCategories = (req, res) => {
  Product.distinct("category", {}, (err, data) => {
    if (err) {
      return res.status(400).json({ err: "Categories not found" });
    }
    res.json(data);
  });
};

/**
 * list products by searfh
 * we will implemet product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkboxand radio buttons
 * we will make api request and show the product to users based on what he wants
 *
 */
exports.listBySearch = (req, res) => {
  let order = req.body.order ? req.body.order : "desc"; //asc
  let sortBy = req.body.sortby ? req.body.sortBy : "_id";
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  //console.log(ordr, sortBy, limit, skip, req.body.filters)
  //console.log("findArgs", findArgs)

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === "price") {
        //gte - greater than price[0-10]
        //lte - less then price
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }
  Product.find(findArgs)
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({ err: "Products not found!" });
      }
      res.json({
        size: data.length,
        data,
      });
    });
};

exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set("Content-Type", req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};

exports.comment = (req, res) => {
  const user = req.profile;
  const productComment = req.product;
  console.log(req.product);
  const newComment = {
    text: req.body.text,
    rating: req.body.rating,
    name: user.name,
    user: req.profile._id,
  };
  console.log(newComment);
  productComment.comments.unshift(newComment);
  productComment.save((err, data) => {
    if (err || !data) {
      res.status(400).json({ err: "comment not posted" });
    }
    res.json(data);
  });
};

exports.removeComment = async (req, res) => {
  let product = await Product.findById(req.params.productId);
  //Pull out comment to delete
  const comment = product.comments.find(
    (comment) => comment._id == req.params.commentId
  );
  //Make sure comment exists
  if (!comment) {
    return res.status(404).json({ msg: "Comment doesnt exists" });
  }
  const removeIndex = product.comments
    .map((comment) => comment.user.toString())
    .indexOf(req.profile._id);
  product.comments.splice(removeIndex, 1);
  await product.save();
  return res.json(product.comments);
};

exports.updateComment = (req, res) => {
  let filterCommentIndex = req.product.comments.findIndex(
    (comment) => comment._id == req.params.commentId
  );
  console.log(req.params.userId, req.product.comments[0].user);
  if (req.product.comments[filterCommentIndex].user != req.params.userId) {
    return res.status(400).json({ err: "Access denied user not matched" });
  }
  product = Product.findOneAndUpdate(
    { "comments._id": req.params.commentId },
    {
      $set: {
        "comments.$.text": req.body.text,
        "comments.$.rating": req.body.rating,
      },
    },
    { new: true },

    (err, data) => {
      if (err) {
        return res.status(400).json({ msg: "Comment not updated" });
      }
      return res.json(data);
    }
  );
};

exports.listSearch = (req, res) => {
  //create query object to hold searh value and category value
  const query = {};
  //assign search value to query.name
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: "i" };

    //assign category value to query.category
    if (req.query.category && req.query.category != "All") {
      query.category = req.query.category;
    }
    //find the product based on the query object with 2 properties
    //search and category
    Product.find(query, (err, products) => {
      if (err) {
        return res.status(400).json({ msg: "Not found searched query" });
      }
      res.json(products);
    }).select("-photo");
  }
};

exports.decreaseQuantity = (req, res, next) => {
  let bulkOps = req.body.order.products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item._id },
        update: { $inc: { quantity: -item.count, sold: +item.count } },
      },
    };
  });
  Product.bulkWrite(bulkOps, {}, (error, products) => {
    if (error) {
      return res.status(400).json({ error: "Could not update product" });
    }
    next();
  });
};
