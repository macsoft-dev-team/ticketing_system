import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Edit3, Trash2, Activity, RefreshCw, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { vfdTelemetryApi } from '../../lib/services/vfdService.js';

const KPI_TARGET_OPTIONS = [
  { value: '', label: 'None (General Telemetry)' },
  { value: 'pvVoltage', label: 'PV / Input Voltage (pvVoltage)' },
  { value: 'motorVoltage', label: 'Motor Voltage / OPV (motorVoltage)' },
  { value: 'motorPower', label: 'Motor Power (motorPower)' },
  { value: 'current', label: 'Motor / DC Current (current)' },
  { value: 'dcCurrent', label: 'DC Current (dcCurrent)' },
  { value: 'frequency', label: 'Output Frequency (frequency)' },
  { value: 'temperature', label: 'VFD Temperature (temperature)' },
  { value: 'totalEnergy', label: 'Total Energy (totalEnergy)' },
  { value: 'todayEnergy', label: 'Today Energy (todayEnergy)' },
  { value: 'totalFlow', label: 'Total Flow (totalFlow)' },
  { value: 'todayFlow', label: 'Today Flow (todayFlow)' },
  { value: 'totalHours', label: 'Total Run Hours (totalHours)' },
  { value: 'todayHours', label: 'Today Run Hours (todayHours)' },
  { value: 'faultCode', label: 'Fault Code (faultCode)' },
  { value: 'statusCode', label: 'Status Code (statusCode)' },
];

export default function VfdTelemetryList({ navigate }) {
  const [models, setModels] = useState(['GLOBAL', 'SI21', 'SI22', 'HEX']);
  const [selectedModel, setSelectedModel] = useState('GLOBAL');
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [activeConfig, setActiveConfig] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    vfdModel: 'GLOBAL',
    cmdKey: '',
    displayName: '',
    unit: '',
    scaleFactor: 1.0,
    decimals: 0,
    defaultAddr: '',
    kpiTarget: '',
    sortOrder: 0,
  });

  // Load models list
  useEffect(() => {
    async function loadModels() {
      try {
        const list = await vfdTelemetryApi.models();
        if (list && list.length > 0) {
          setModels(list);
          if (!selectedModel) {
            setSelectedModel(list[0]);
          }
        }
      } catch {
        // Fallback default models
        setModels(['GLOBAL', 'SI21', 'SI22', 'HEX']);
      }
    }
    loadModels();
  }, []);

  // Fetch configs for selected model
  const fetchConfigs = useCallback(async (model) => {
    if (!model) return;
    setLoading(true);
    setError('');
    try {
      const res = await vfdTelemetryApi.byModel(model);
      setConfigs(res.configs || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch telemetry configurations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedModel) {
      fetchConfigs(selectedModel);
    }
  }, [selectedModel, fetchConfigs]);

  // Filtered configs for display
  const filteredConfigs = useMemo(() => {
    if (!searchQuery.trim()) return configs;
    const q = searchQuery.toLowerCase().trim();
    return configs.filter(
      (c) =>
        (c.cmdKey || '').toLowerCase().includes(q) ||
        (c.displayName || '').toLowerCase().includes(q) ||
        (c.unit || '').toLowerCase().includes(q) ||
        (c.defaultAddr || '').toLowerCase().includes(q) ||
        (c.kpiTarget || '').toLowerCase().includes(q)
    );
  }, [configs, searchQuery]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setIsEdit(false);
    setActiveConfig(null);
    setFormData({
      vfdModel: selectedModel || 'GLOBAL',
      cmdKey: '',
      displayName: '',
      unit: '',
      scaleFactor: 10.0,
      decimals: 1,
      defaultAddr: '',
      kpiTarget: '',
      sortOrder: (configs.length + 1) * 1,
    });
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item) => {
    setIsEdit(true);
    setActiveConfig(item);
    setFormData({
      id: item.id,
      vfdModel: item.vfdModel || selectedModel,
      cmdKey: item.cmdKey || '',
      displayName: item.displayName || '',
      unit: item.unit || '',
      scaleFactor: item.scaleFactor ?? 1.0,
      decimals: item.decimals ?? 0,
      defaultAddr: item.defaultAddr || '',
      kpiTarget: item.kpiTarget || '',
      sortOrder: item.sortOrder ?? 0,
    });
    setShowModal(true);
  };

  // Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.cmdKey.trim() || !formData.displayName.trim()) {
      alert('Command Key and Display Name are required');
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        cmdKey: formData.cmdKey.trim().toUpperCase(),
        scaleFactor: parseFloat(formData.scaleFactor) || 1.0,
        decimals: parseInt(formData.decimals, 10) || 0,
        sortOrder: parseInt(formData.sortOrder, 10) || 0,
      };

      if (isEdit && activeConfig?.id) {
        await vfdTelemetryApi.update(activeConfig.id, payload);
      } else {
        await vfdTelemetryApi.save(payload);
      }

      setShowModal(false);
      fetchConfigs(selectedModel);
    } catch (err) {
      alert(err.message || 'Failed to save telemetry configuration');
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteConfirm?.id) return;
    try {
      await vfdTelemetryApi.remove(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchConfigs(selectedModel);
    } catch (err) {
      alert(err.message || 'Failed to delete telemetry configuration');
    }
  };

  // Preview live math in form
  const previewExampleValue = useMemo(() => {
    const raw = 5500;
    const factor = parseFloat(formData.scaleFactor) || 1.0;
    const dec = parseInt(formData.decimals, 10) || 0;
    const actual = raw / (factor === 0 ? 1.0 : factor);
    const formatted = dec > 0 ? actual.toStringAsFixed(dec) : Math.round(actual).toString();
    return `${formatted} ${formData.unit || ''}`.trim();
  }, [formData.scaleFactor, formData.decimals, formData.unit]);

  const columns = [
    {
      header: 'CMD KEY',
      accessor: 'cmdKey',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 text-sm">
          {row.cmdKey}
        </span>
      ),
    },
    {
      header: 'DISPLAY NAME',
      accessor: 'displayName',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 text-sm">{row.displayName}</span>
          {row.vfdModel === 'GLOBAL' && selectedModel !== 'GLOBAL' && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
              Global Default
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'SCALE FACTOR',
      accessor: 'scaleFactor',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-sm">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            ÷ {row.scaleFactor}
          </span>
          <span className="text-xs text-slate-400">({row.decimals} dec)</span>
        </div>
      ),
    },
    {
      header: 'UNIT',
      accessor: 'unit',
      cell: (row) =>
        row.unit ? (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {row.unit}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      header: 'DEFAULT REGISTER',
      accessor: 'defaultAddr',
      cell: (row) =>
        row.defaultAddr ? (
          <span className="font-mono text-xs text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
            {row.defaultAddr}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      header: 'KPI TILE TARGET',
      accessor: 'kpiTarget',
      cell: (row) =>
        row.kpiTarget ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
            {row.kpiTarget}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        ),
    },
    {
      header: 'ORDER',
      accessor: 'sortOrder',
      cell: (row) => <span className="text-xs text-slate-500 font-mono">{row.sortOrder}</span>,
    },
    {
      header: 'ACTIONS',
      accessor: 'actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit Telemetry Configuration"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteConfirm(row)}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Telemetry Configuration"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Telemetry Scaling & Command Abbreviations"
        description="Configure dynamic Modbus telemetry abbreviations, engineering scale factors (/10, /100), decimal precision, and KPI tile mapping for VFD models."
        icon={Activity}
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchConfigs(selectedModel)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh Telemetry Configs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Telemetry Config
            </button>
          </div>
        }
      />

      {/* Model Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
            <Sliders className="h-3.5 w-3.5" /> Model:
          </span>
          {models.map((m) => {
            const isSelected = selectedModel === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedModel(m)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-indigo-100'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search key, name, unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredConfigs}
          loading={loading}
          emptyMessage={`No telemetry configurations found for ${selectedModel}. Click 'Add Telemetry Config' to configure.`}
        />
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isEdit ? 'Edit Telemetry Configuration' : 'Add Telemetry Configuration'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define engineering scaling rule and abbreviation for {formData.vfdModel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">VFD Model</label>
                  <select
                    value={formData.vfdModel}
                    onChange={(e) => setFormData({ ...formData, vfdModel: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  >
                    {models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Command Key (e.g. DCV, PWR, OPC)
                  </label>
                  <input
                    type="text"
                    value={formData.cmdKey}
                    onChange={(e) => setFormData({ ...formData, cmdKey: e.target.value.toUpperCase() })}
                    placeholder="e.g. DCV"
                    className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g. DC Voltage"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scale Factor</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.scaleFactor}
                    onChange={(e) => setFormData({ ...formData, scaleFactor: e.target.value })}
                    placeholder="10.0"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  <div className="flex gap-1 mt-1">
                    {[1, 10, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData({ ...formData, scaleFactor: preset })}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono"
                      >
                        /{preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Decimals</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={formData.decimals}
                    onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <div className="flex gap-1 mt-1">
                    {[0, 1, 2].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFormData({ ...formData, decimals: d })}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono"
                      >
                        {d} dec
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="V, kW, A, °C..."
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Register Address</label>
                  <input
                    type="text"
                    value={formData.defaultAddr}
                    onChange={(e) => setFormData({ ...formData, defaultAddr: e.target.value })}
                    placeholder="e.g. 3001"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">KPI Tile Target</label>
                  <select
                    value={formData.kpiTarget}
                    onChange={(e) => setFormData({ ...formData, kpiTarget: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {KPI_TARGET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  placeholder="1"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-1">
                <span className="font-semibold text-indigo-900 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" /> Live Scaling Formula Preview:
                </span>
                <p className="text-slate-600">
                  Raw register integer value <span className="font-mono font-bold text-indigo-800">5500</span> scaled
                  by <span className="font-mono font-bold text-indigo-800">÷ {formData.scaleFactor || 1.0}</span> yields:{' '}
                  <span className="font-mono font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                    {previewExampleValue}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {saveLoading ? 'Saving...' : isEdit ? 'Update Configuration' : 'Create Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Delete Telemetry Configuration?</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete the configuration for{' '}
              <span className="font-mono font-bold text-indigo-600">{deleteConfirm.cmdKey}</span> (
              {deleteConfirm.displayName}) on model <span className="font-bold">{deleteConfirm.vfdModel}</span>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
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
