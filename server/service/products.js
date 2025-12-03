const { prisma } = require("../lib/clients");

const getProducts = async (skip, take, filter) => {
  try {
    const params = {};
   
    if (skip) params.skip = (parseInt(skip) - 1) * parseInt(take || 10);
    if (take) params.take = parseInt(take);
    let where = {};
    if (filter) {
      where.OR = [
        { name: { contains: filter } },
        { description: { contains: filter } },
        { brandName: { contains: filter } },
        { productCode: { contains: filter } },
        { category: { contains: filter } },
      ];
    }
    params.where = where;
    const count = await prisma.product.count({ where: params.where });
    const products = await prisma.product.findMany(params);
    return { products, count };
  } catch (error) {
    throw error;
  }
};
const getProductById = async (productId) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    return product;
  } catch (error) {
    throw error;
  }
};

const createProduct = async (productData) => {
  try {
    const newProduct = await prisma.product.create({
      data: productData,
    });
    return newProduct;
  } catch (error) {
    throw error;
  }
};

const updateProduct = async (productId, productData) => {
  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: productData,
    });
    return updatedProduct;
  } catch (error) {
    throw error;
  }
};

const deleteProduct = async (productId) => {
  try {
    await prisma.product.delete({
      where: { id: productId },
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
