import { useEffect } from "react";
import { useState } from "react";
import TitleHead from "../../components/TitleHead";
import ReusableTable from "../../components/ui/reusableTable";
import Header from "./components/header";
import axios from "axios";
import { API_URL } from "../../lib/constants/api";
import UploadModal from "../../components/UploadModal";
export default function Products() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    productCode: "",
    description: "",
    brandName: "",
    category: "",
  });
  const [showDelete, setShowDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showUpdateModel, setShowUpdateModel] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [productCounts, setProductCounts] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  const colomsData = [
    { key: "name", label: "Product Name", align: "left" },
    { key: "description", label: "Description", align: "left" },
    { key: "brandName", label: "Brand", align: "left" },
    { key: "productCode", label: "Code", align: "center" },
    { key: "category", label: "Category", align: "left" },
    { key: "status", label: "Status", align: "center" },
  ];

  const handleShow = () => {
    setFormData({
      name: "",
      productCode: "",
      description: "",
      brandName: "",
      category: "",
      status: "",
    });
    setShowForm(true);
  };
  const handleShowDelete = () => {
    setShowDelete(true);
  };
  const handleChangeData = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // submit & create product
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("data", formData);
    try {
      const res = await axios.post(`${API_URL}/products`, formData, {
        withCredentials: true,
      });
      getProduct({ skip: 0, take: 10 }); // Reset to first page
      setCurrentPage(0);
    } catch (error) {
      console.error(error);
    }
    setShowForm(false);
  };
  // get product
  const getProduct = async ({ skip, take, filter }) => {
    try {
      const params = {};
      if (skip && skip > 0) params.skip = skip;
      if (take && take > 0) params.take = take;
      if (filter) params.filter = filter;
      if (searchFilter) params.search = searchFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await axios.get(`${API_URL}/products`, {
        withCredentials: true,
        params
      });
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.currentPage);
      if (res.data.categoryCounts) {
        setProductCounts(res.data.categoryCounts);
      }
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    getProduct({ skip: currentPage, take: 10 });
  }, [searchFilter, categoryFilter]);

  useEffect(() => {
    getProduct({ skip: currentPage, take: 10 });
  }, []);

  // delete product
  const deleteProduct = async (id) => {
    try {
      const res = await axios.delete(`${API_URL}/products/${id}`);
      getProduct({ skip: currentPage, take: 10 }); // Refresh current page
      setShowDelete(false);
    } catch (error) {
      console.error(error);
    }
  };

  // update Product
  const updateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/products/${productToEdit.id}`, formData, { withCredentials: true, });
      getProduct({ skip: currentPage, take: 10 }); // Refresh current page
      setShowUpdateModel(false);
    } catch (error) {
      console.error(error);
    }
  };

  const onPageChange = (page) => {
    getProduct({ skip: page, take: 10 });
  };

  // Handle header actions
  const handleAddProduct = () => {
    handleShow();
  };

  const handleUploadProducts = () => {
    setShowUploadModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setUploadFile(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await axios.post(`${API_URL}/products/upload`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload successful:', res.data);
      getProduct({ skip: 0, take: 10 }); // Refresh products list
      setCurrentPage(0);
      setShowUploadModal(false);
      setUploadFile(null);
      alert('Products uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading products. Please try again.');
    }
  };

  const handleFilterChange = (category) => {
    setCategoryFilter(category);
    setCurrentPage(0); // Reset to first page when filtering
  };

  const handleSearchChange = (search) => {
    setSearchFilter(search);
    setCurrentPage(0); // Reset to first page when searching
  };

  return (
    <div className="">
      <Header
        onAddProduct={handleAddProduct}
        onUploadProducts={handleUploadProducts}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        productCounts={productCounts}
      />
      <section className="px-6 py-4 space-y-3">
        <ReusableTable
          columns={colomsData}
          data={products}
          title="Products"
          headerColor="bg-gray-700"
          headerTextColor="text-white"
          bordered
          currentPage={currentPage}
          totalPages={totalPages}
          searchPlaceholder="Search products..."
          showSearch={false} // Disable table search since we have header search
          onAdd={() => console.log("Add products item")}
          onEdit={(row) => {
            setProductToEdit(row);
            setFormData({
              name: row.name,
              productCode: row.productCode,
              description: row.description,
              brandName: row.brandName,
              category: row.category,
            });
            setShowUpdateModel(true);
          }}
          onDelete={(row) => {
            handleShowDelete();
            setProductToDelete(row);
          }}
          onPageChange={onPageChange}
        />
      </section>
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center px-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-semibold mb-6 uppercase">Create New Product</h2>

            {/* Grid layout for two columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="flex flex-col">
                <label className="font-medium mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChangeData}
                  placeholder="Enter product name"
                  className="border rounded-md py-2 px-3"
                  required
                />
              </div>

              {/* Code */}
              <div className="flex flex-col">
                <label className="font-medium mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  name="productCode"
                  value={formData.productCode}
                  onChange={handleChangeData}
                  placeholder="Enter product code"
                  className="border rounded-md py-2 px-3"
                  required
                />
              </div>

              {/* Description */}
              <div className="flex flex-col sm:col-span-2">
                <label className="font-medium mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChangeData}
                  placeholder="Enter product description"
                  className="border rounded-md py-2 px-3 resize-none h-24"
                  required
                />
              </div>

              {/* Brand */}
              <div className="flex flex-col sm:col-span-2">
                <label className="font-medium mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChangeData}
                  placeholder="Enter brand"
                  className="border rounded-md py-2 px-3"
                  required
                />
              </div>

              {/* Category */}
              <div className="flex flex-col sm:col-span-2">
                <label className="font-medium mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChangeData}
                  className="border rounded-md py-2 px-3"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="MCB">MCB</option>
                  <option value="VFD">VFD</option>
                  <option value="CONNECTOR">CONNECTOR</option>
                  <option value="ENCLOSURE & ACCESSORIES">
                    ENCLOSURE & ACCESSORIES
                  </option>
                  <option value="WIRE">WIRE</option>
                  <option value="RMS">RMS</option>
                  <option value="SPD">SPD</option>
                </select>
              </div>

              {/* Status */}
              <div className="flex flex-col sm:col-span-2">
                <label className="font-medium mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChangeData}
                  className="border rounded-md py-2 px-3"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="DEFECT">Defect</option>
                  <option value="NOT_DEFECT">Not Defect</option>
                </select>
              </div>
            </div>
            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border py-2 px-4 rounded-md text-gray-700 bg-white hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="border py-2 px-4 rounded-md bg-blue-950 text-white hover:bg-blue-900 transition"
              >
                Create Product
              </button>
            </div>
          </form>
        </div>
      )}
      {/* delete form  */}
      {showDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 sm:p-8">
            <p className="text-center text-lg font-medium text-red-600">
              Do you want to delete this  {productToDelete?.name}?
            </p>

            {/* Buttons */}
            <div className="flex justify-center sm:justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="border py-2 px-4 rounded-md text-gray-700 bg-white hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteProduct(productToDelete.id)}
                className="border py-2 px-4 rounded-md bg-blue-950 text-white hover:bg-blue-900 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* update Form */}
      {showUpdateModel && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center px-4">
          <form
            onSubmit={updateProduct}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-semibold mb-6">Update Product</h2>

            {/* Grid layout for two columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="flex flex-col">
                <label className="font-medium mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChangeData}
                  placeholder="Enter product name"
                  className="border rounded-md py-2 px-3"
                  required
                />
              </div>

              {/* Code */}
              <div className="flex flex-col">
                <label className="font-medium mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  name="productCode"
                  value={formData.productCode}
                  onChange={handleChangeData}
                  placeholder="Enter product code"
                  className="border rounded-md py-2 px-3"
                  required
                />
              </div>

              {/* Description */}
              <div className="flex flex-col sm:col-span-2">
                <label className="font-medium mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChangeData}
                  placeholder="Enter product description"
                  className="border rounded-md py-2 px-3 resize-none h-24"
                  required
                />
              </div>

              {/* Brand */}
              <div className="flex flex-col sm:col-span-2">
                <label className="font-medium mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChangeData}
                  placeholder="Enter brand"
                  className="border rounded-md py-2 px-3"
                  required
                />
              </div>

              {/* Category */}
              <div className="flex flex-col sm:col-span-2">
                <label className="font-medium mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChangeData}
                  className="border rounded-md py-2 px-3"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="MCB">MCB</option>
                  <option value="VFD">VFD</option>
                  <option value="CONNECTOR">CONNECTOR</option>
                  <option value="ENCLOSURE_AND_ACCESSORIES">
                    ENCLOSURE & ACCESSORIES
                  </option>
                  <option value="WIRE">WIRE</option>
                  <option value="RMS">RMS</option>
                  <option value="SPD">SPD</option>
                </select>
              </div>
              {/* Status */}
              <div className="flex flex-col sm:col-span-2">
                <label className="font-medium mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChangeData}
                  className="border rounded-md py-2 px-3"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="DEFECT">Defect</option>
                  <option value="NOT_DEFECT">Not Defect</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowUpdateModel(false)
                }
                className="border py-2 px-4 rounded-md text-gray-700 bg-white hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="border py-2 px-4 rounded-md bg-blue-950 text-white hover:bg-blue-900 transition"
              >
                Update Product
              </button>
            </div>
          </form>
        </div>
      )}

      <UploadModal
        title="Upload Products"
        open={showUploadModal}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowUploadModal(false);
            setUploadFile(null);
          }
        }}
        handleFileUpload={handleFileUpload}
        handleUploadSubmit={handleUploadSubmit}
        requiredColumns={['name', 'productCode', 'description', 'brandName', 'category']}
      />
    </div>
  );
}
