const productService = require("../service/products");
const moment = require("moment");
const getProducts = async (req, res) => {
  try {
    const { skip, take, filter } = req.query;
    const { products, count } = await productService.getProducts(
      skip,
      take,
      filter
    );
    const transformProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      brandName: product.brandName,
      productCode: product.productCode,
      category: product.category,
      createdAt: moment(product.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: moment(product.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.status(200).json({
      products: transformProducts,
      totalPages: Math.ceil(count / take),
      currentPage: parseInt(skip) || 1,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await productService.getProductById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createProduct = async (req, res) => {
  const productData = req.body;
  try {
    const newProduct = await productService.createProduct(productData);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const productData = req.body;
  try {
    const updatedProduct = await productService.updateProduct(
      parseInt(id),
      productData
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await productService.deleteProduct(parseInt(id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
