import { useCallback } from "react";
import {
  fetchProductById,
  fetchProducts,
  setProduct,
  updateProduct,
  createProduct,
  deleteProduct,
  setMode,
  setFilters,
  setCurrentPage,
} from "../features/products";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../components/ui/toast";
import { createErrorHandler } from "../../utils/errorUtils";

const useProduct = () => {
  const dispatch = useDispatch();
  const { product, products, filter, loading, error, mode } =
    useSelector((state) => state.product);
  const { addToast } = useToast();

  const setProductCallback = useCallback(
    (product) => dispatch(setProduct(product)),
    [dispatch]
  );

  const getProductById = useCallback(
    (id) => {
      dispatch(fetchProductById(id));
    },
    [dispatch]
  );

  const getProducts = useCallback(
    (params) => {
      dispatch(fetchProducts(params));
    },
    [dispatch]
  );

  const updateProductCallback = useCallback(
    (product) => {
      const { id, ...productData } = product;
      return dispatch(updateProduct({ id, productData }))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "Success!",
            description: `Product "${product.name}" has been updated successfully.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "update", "product"));
    },
    [dispatch, addToast]
  );

  const createProductCallback = useCallback(
    (product) => {
      return dispatch(createProduct(product))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "Product Created!",
            description: `Great! Your new product "${product.name}" has been created and is ready to use.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "create", "product"));
    },
    [dispatch, addToast]
  );

  const deleteProductCallback = useCallback(
    (id) => {
      return dispatch(deleteProduct(id))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "Product Deleted",
            description:
              "The product has been permanently removed from your system.",
            variant: "destructive",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "delete", "product"));
    },
    [dispatch, addToast]
  );

  const setModeCallback = useCallback(
    (modeKey) => dispatch(setMode(modeKey)),
    [dispatch]
  );

  const fetchProductsCallback = useCallback(
    (params) => {
      dispatch(fetchProducts(params));
    },
    [dispatch]
  );

  const onPageChange = useCallback(
    (page) => {
      dispatch(setCurrentPage(page));
      getProducts({ skip: page, take: 10, filter: filter });
    },
    [dispatch, getProducts, filter]
  );
  const setFiltersCallback = useCallback(
    (filters) => {
      dispatch(setFilters(filters));
    },
    [dispatch]
  );
  return {
    mode,
    product,
    products,
    filter,
    fetchProducts: fetchProductsCallback,
    loading,
    error,
    setProduct: setProductCallback,
    getProductById,
    getProducts,
    updateProduct: updateProductCallback,
    createProduct: createProductCallback,
    deleteProduct: deleteProductCallback,
    setMode: setModeCallback,
    onPageChange,
    setFilters: setFiltersCallback,
  };
};

export default useProduct;
