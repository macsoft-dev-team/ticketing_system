import { useState } from "react";
import { Upload, X, Download, AlertTriangle, Copy } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../../lib/constants/api";
import useProduct from "../../../lib/hooks/useProducts";

export default function BulkImportModal({ open, onClose, onSuccess }) {
  const {products} =useProduct()
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState([]);

  if (!open) return null;

  const sampleJsonData = JSON.stringify([
    {
      productId: 1,
      centerCode: "SC001",
      condition: "GOOD",
      quantity: 100,
      minStock: 10,
      maxStock: 200,
      location: "A1-R1"
    },
    {
      productId: 2,
      centerCode: "SC001",
      condition: "DEFECTIVE",
      quantity: 5,
      minStock: 0,
      maxStock: null,
      location: "A1-R2"
    }
  ], null, 2);

  const copyTemplate = () => {
    navigator.clipboard.writeText(sampleJsonData);
    alert('Template copied to clipboard!');
  };

  const handleJsonChange = (e) => {
    const value = e.target.value;
    setJsonData(value);
    
    // Try to parse and preview JSON
    try {
      if (value.trim()) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setPreview(parsed.slice(0, 5)); // Show first 5 items
          setErrors([]);
        } else {
          setErrors([{ message: 'Data must be an array of inventory objects' }]);
          setPreview([]);
        }
      } else {
        setPreview([]);
        setErrors([]);
      }
    } catch (err) {
      setErrors([{ message: 'Invalid JSON format' }]);
      setPreview([]);
    }
  };

  const handleImport = async () => {
    if (!jsonData.trim()) {
      alert('Please enter JSON data to import');
      return;
    }

    try {
      setLoading(true);
      setErrors([]);

      // Validate JSON before sending
      const parsedData = JSON.parse(jsonData);
      if (!Array.isArray(parsedData)) {
        throw new Error('Data must be an array of inventory objects');
      }

      const response = await axios.post(
        `${API_URL}/inventory/bulk-import`,
        { items: parsedData },
        { withCredentials: true }
      );

      if (response.data.success) {
        onSuccess?.();
        onClose();
        alert(`Successfully imported ${response.data.imported} inventory records`);
      }
    } catch (err) {
      console.error('Import failed', err);
      const errorMessage = err.response?.data?.message || 'Failed to import inventory';
      const errorDetails = err.response?.data?.errors || [];
      
      setErrors(errorDetails);
      if (errorDetails.length === 0) {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setJsonData('');
    setPreview([]);
    setErrors([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-800">Bulk Import Inventory</h2>
          </div>
          <button onClick={handleClose}>
            <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
          
          {/* JSON Template */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-blue-900">JSON Template</h3>
                <p className="text-sm text-blue-700">
                  Copy this template and modify with your data
                </p>
              </div>
              <button
                onClick={copyTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Copy className="w-4 h-4" />
                Copy Template
              </button>
            </div>
            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
              <code>{sampleJsonData}</code>
            </pre>
          </div>

          {/* JSON Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inventory Data (JSON Format)
            </label>
            <textarea
              value={jsonData}
              onChange={handleJsonChange}
              placeholder="Paste your JSON data here..."
              className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Preview (first 5 rows)</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).map(key => (
                        <th key={key} className="px-3 py-2 text-left font-medium text-gray-700">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-t">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-3 py-2 text-gray-600">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-medium text-red-800">Import Errors</h3>
              </div>
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700">
                    Row {error.row}: {error.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
            <h4 className="font-medium text-gray-800 mb-2">JSON Format Requirements:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>productId:</strong> Must be a valid product ID (number)</li>
              <li><strong>centerCode:</strong> Valid service center code (string)</li>
              <li><strong>condition:</strong> "GOOD", "DEFECTIVE", "REPAIRABLE", or "SCRAP"</li>
              <li><strong>quantity:</strong> Non-negative integer</li>
              <li><strong>minStock:</strong> Minimum stock level (number, optional, defaults to 0)</li>
              <li><strong>maxStock:</strong> Maximum stock level (number or null, optional)</li>
              <li><strong>location:</strong> Storage location (string, optional)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            disabled={!jsonData.trim() || loading || errors.length > 0}
            onClick={handleImport}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
}