const Product = require("../model/Product");

const productController = {};

productController.createProduct = async (req, res) => {
  try {
    const {
      sku,
      name,
      image,
      size,
      category,
      description,
      price,
      stock,
      status,
    } = req.body;

    const product = new Product({
      sku,
      name,
      image,
      size,
      category,
      description,
      price,
      stock,
      status,
    });

    console.log(product);
    await product.save();
    res.status(200).json({ status: "success", product });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.getProduct = async (req, res) => {
  try {
    const { page, name, PAGE_SIZE } = req.query;
    let response = { status: "success" };

    let cond = name ? { name: { $regex: name, $options: "i" } } : {};
    cond = { ...cond, isDeleted: false };

    let query = Product.find(cond);

    if (page) {
      query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);

      const totalPageNum = await Product.find(cond).count();
      const totalDivided = Math.ceil(totalPageNum / PAGE_SIZE);

      response.totalPageNum = totalDivided;
    }

    const products = await query.exec();

    if (!products) {
      throw new Error("제품을 찾을 수 없습니다.");
    }
    response.products = products;
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      sku,
      name,
      image,
      size,
      category,
      description,
      price,
      stock,
      status,
    } = req.body;

    const product = await Product.findByIdAndUpdate(
      { _id: productId },
      { sku, name, image, size, category, description, price, stock, status },
      { new: true }
    );

    if (!product) throw new Error("상품이 존재하지 않습니다.");
    res.status(200).json({ status: "success", product });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByIdAndUpdate(
      { _id: productId },
      { $set: { isDeleted: true } }
    );

    if (!product) throw new Error("상품이 존재하지 않습니다.");
    res.status(200).json({ status: "success", product });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.getProductOne = async (req, res) => {
  try {
    const productId = req.params.id;

    const productOne = await Product.findOne({ _id: productId });
    if (!productOne) {
      throw new Error("제품을 찾을 수 없습니다.");
    }
    res.status(200).json({ status: "success", productOne });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.checkStock = async (item) => {
  const product = await Product.findById(item.productId);

  if (product.stock[item.size] < item.qty) {
    return {
      isVerify: false,
      message: `${product.name}의 ${item.size} 재고가 부족합니다.`,
    };
  }

  const newStock = { ...product.stock };
  newStock[item.size] -= item.qty;
  product.stock = newStock;

  await product.save();

  return { isVerify: true };
};

productController.checkItemListStock = async (items) => {
  const insufficientStockItem = [];

  await Promise.all(
    items.map(async (i) => {
      const stockCheck = await productController.checkStock(i);
      if (!stockCheck.isVerify) {
        insufficientStockItem.push({ item: i, message: stockCheck.message });
      }
    })
  );

  // map 함수의 인자로 전달된 함수가 비동기 함수인 경우,
  // 비동기 함수 호출은 병렬로 일어남.

  return insufficientStockItem;
};
module.exports = productController;
