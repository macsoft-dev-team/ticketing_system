import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit3, Trash2, Sliders, RefreshCw } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { vfdParameterApi } from '../../lib/services/vfdService.js';

export default function VfdParameterList({ navigate }) {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [data, setData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [activeParam, setActiveParam] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load models on mount
  useEffect(() => {
    async function loadModels() {
      try {
        const list = await vfdParameterApi.modelCodes();
        setModels(list);
        if (list.length > 0 && !selectedModel) {
          setSelectedModel(list[0]);
        }
      } catch (err) {
        setError('Failed to load VFD models');
      }
    }
    loadModels();
  }, []);

  const fetchParams = useCallback(
    async (model, page = 1, search = '') => {
      if (!model) return;
      setLoading(true);
      setError('');
      try {
        const res = await vfdParameterApi.byModel(model, { page, limit: itemsPerPage, search });
        setData(res.parameters || []);
        setTotalItems(res.total || 0);
        setCurrentPage(res.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to fetch parameters');
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage]
  );

  useEffect(() => {
    if (selectedModel) {
      fetchParams(selectedModel, currentPage, searchQuery);
    }
  }, [selectedModel, currentPage, searchQuery, fetchParams]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await vfdParameterApi.remove(deleteConfirm.vfdModel, deleteConfirm.address);
      setDeleteConfirm(null);
      fetchParams(selectedModel, currentPage, searchQuery);
    } catch (err) {
      alert(err.message || 'Failed to delete parameter');
    }
  };

  const columns = [
    {
      header: 'MODBUS ADDRESS',
      accessor: 'address',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
          {row.address}
        </span>
      ),
    },
    {
      header: 'PARAMETER NAME',
      accessor: 'paramName',
      sortable: true,
      cell: (row) => <span className="font-bold text-slate-800">{row.paramName}</span>,
    },
    {
      header: 'DEFAULT / SCALED VALUE',
      accessor: 'value',
      cell: (row) => <span className="font-mono text-xs text-slate-600">{row.value || '—'}</span>,
    },
    {
      header: 'ACTIONS',
      accessor: 'actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setActiveParam(row);
              setIsEdit(true);
              setShowModal(true);
            }}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit Parameter"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteConfirm(row)}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Parameter"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Reusable PageHeader matching reference design */}
      <PageHeader
        icon={Sliders}
        title="VFD MODBUS PARAMETERS"
        subtitle="REGISTER MAP, HEX ADDRESSES & CALIBRATION VALUES"
        actionLabel="Add Register"
        onAction={() => {
          setActiveParam({ vfdModel: selectedModel, paramName: '', address: '', value: '' });
          setIsEdit(false);
          setShowModal(true);
        }}
      >
        {/* Model Selector Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-bold border border-slate-300 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search address, name..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
          />
        </div>
      </PageHeader>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Data Table with Server-Side Pagination */}
      <DataTable
        columns={columns}
        data={data}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(newPage) => {
          setCurrentPage(newPage);
          fetchParams(selectedModel, newPage, searchQuery);
        }}
        loading={loading}
      />

      {/* Parameter Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-950 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-base">
                  {isEdit ? 'Edit Parameter' : 'New Modbus Parameter'}
                </h3>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await vfdParameterApi.save({
                    vfdModel: selectedModel,
                    paramName: activeParam.paramName,
                    address: activeParam.address,
                    value: activeParam.value,
                  });
                  setShowModal(false);
                  fetchParams(selectedModel, currentPage, searchQuery);
                } catch (err) {
                  alert(err.message || 'Failed to save parameter');
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target VFD Model</label>
                <input
                  type="text"
                  disabled
                  value={selectedModel}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-100 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Parameter Name</label>
                <input
                  type="text"
                  required
                  value={activeParam.paramName}
                  onChange={(e) => setActiveParam({ ...activeParam, paramName: e.target.value })}
                  placeholder="e.g. PV Voltage or Fault Code"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Modbus Register Address</label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  value={activeParam.address}
                  onChange={(e) => setActiveParam({ ...activeParam, address: e.target.value })}
                  placeholder="e.g. 3000 or 0x0BB8"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Default / Scaling Value</label>
                <input
                  type="text"
                  value={activeParam.value}
                  onChange={(e) => setActiveParam({ ...activeParam, value: e.target.value })}
                  placeholder="e.g. 0.1 or 50.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-md"
                >
                  Save Parameter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
            <p className="text-xs text-slate-600">
              Delete parameter <strong className="text-slate-900">{deleteConfirm.paramName}</strong> at address{' '}
              <code className="font-mono text-cyan-700">{deleteConfirm.address}</code>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
