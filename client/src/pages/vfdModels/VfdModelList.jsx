import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit3, Trash2, Eye, Cpu, AlertTriangle, Activity, Check, Sliders } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { vfdModelApi } from '../../lib/services/vfdService.js';
import { formatDateTime, truncate } from '../../lib/utils/format.js';

export default function VfdModelList({ navigate }) {
  const [data, setData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedModel, setSelectedModel] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchModels = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await vfdModelApi.list({ page, limit: itemsPerPage, search });
      setData(res.vfdModels || []);
      setTotalItems(res.total || 0);
      setCurrentPage(res.page || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch VFD models');
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    fetchModels(currentPage, searchQuery);
  }, [currentPage, searchQuery, fetchModels]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await vfdModelApi.remove(deleteConfirm.modelCode);
      setDeleteConfirm(null);
      fetchModels(currentPage, searchQuery);
    } catch (err) {
      alert(err.message || 'Failed to delete VFD model');
    }
  };

  const columns = [
    {
      header: 'MODEL CODE',
      accessor: 'modelCode',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 border border-blue-200">
          {row.modelCode}
        </span>
      ),
    },
    {
      header: 'MODEL NAME',
      accessor: 'modelName',
      sortable: true,
      cell: (row) => <span className="font-bold text-slate-800">{row.modelName}</span>,
    },
    {
      header: 'MANUFACTURER',
      accessor: 'manufacturer',
      sortable: true,
      cell: (row) => <span className="text-slate-600 font-medium">{row.manufacturer || '—'}</span>,
    },
    {
      header: 'ERROR CODES',
      accessor: 'errorCodes',
      cell: (row) => {
        const count = Object.keys(row.errorCodes || {}).length;
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold">
            <AlertTriangle className="h-3 w-3" />
            {count} Codes
          </span>
        );
      },
    },
    {
      header: 'STATUS CODES',
      accessor: 'statusCodes',
      cell: (row) => {
        const count = row.statusCodes ? Object.keys(row.statusCodes).length : 0;
        if (count === 0) {
          return <span className="text-xs text-slate-400 font-medium">None</span>;
        }
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold">
            <Activity className="h-3 w-3" />
            {count} Codes
          </span>
        );
      },
    },
    {
      header: 'TELEMETRY SCALING',
      accessor: 'telemetryConfigs',
      cell: (row) => {
        const count = row.telemetryConfigs
          ? (Array.isArray(row.telemetryConfigs) ? row.telemetryConfigs.length : Object.keys(row.telemetryConfigs).length)
          : 15;
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
            <Sliders className="h-3 w-3" />
            {count} Rules
          </span>
        );
      },
    },
    {
      header: 'DADD COMMAND',
      accessor: 'daddCommand',
      cell: (row) => (
        <code className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 border border-indigo-200">
          {truncate(row.daddCommand, 24)}
        </code>
      ),
    },
    {
      header: 'UPDATED AT',
      accessor: 'updatedAt',
      cell: (row) => <span className="text-xs text-slate-500">{formatDateTime(row.updatedAt)}</span>,
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
              setSelectedModel(row);
              setModalMode('view');
              setShowModal(true);
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedModel(row);
              setModalMode('edit');
              setShowModal(true);
            }}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
            title="Edit Model"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteConfirm(row)}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Deactivate Model"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Cpu}
        title="VFD Models Configuration"
        subtitle="INVERTER MODELS, TELEMETRY DADD FRAMES, ERROR CODES & MOTOR STATUS"
        actionLabel="New VFD Model"
        onAction={() => {
          setSelectedModel(null);
          setModalMode('create');
          setShowModal(true);
        }}
      >
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by code, name..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
          />
        </div>
      </PageHeader>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
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
          fetchModels(newPage, searchQuery);
        }}
        loading={loading}
      />

      {/* Create / Edit / View Modal */}
      {showModal && (
        <VfdModelModal
          mode={modalMode}
          model={selectedModel}
          existingManufacturers={[...new Set(data.map((m) => m.manufacturer).filter(Boolean))]}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchModels(currentPage, searchQuery);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white p-6 shadow-2xl space-y-4 border border-slate-300">
            <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to deactivate VFD model{' '}
              <strong className="text-slate-900">{deleteConfirm.modelCode}</strong> ({deleteConfirm.modelName})?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm cursor-pointer"
              >
                Delete Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_MANUFACTURERS = [
  'Macsoft Automations',
  'INVT',
  'Fuji Electric / FRENIC',
  'Delta Electronics',
  'Schneider Electric',
  'ABB',
  'Danfoss',
  'Siemens',
  'Frecon',
  'Crompton Greaves',
  'Kirloskar',
  'L&T Electrical & Automation',
];

const PRESETS = {
  si21Errors: {
    "E.SC1:1": "Accel SC",
    "E.SC2:2": "Decel SC",
    "E.SC3:3": "Const Speed SC",
    "E.SC4:4": "Downtime SC",
    "E.OC1:5": "Accel OverCurr",
    "E.OC2:6": "Decel OverCurr",
    "E.OC3:7": "Const Speed OC",
    "E.OU1:9": "Accel OverVolt",
    "E.OU2:10": "Decel OvrVolt",
    "E.OU3:11": "ConstSpeed OV",
    "E.LU:13": "UnderVoltage",
    "E.OL1:14": "MotorOverload",
    "E.OL2:15": "Out PhaseLoss",
    "E.OH1:30": "Rect Overheat",
    "E.OH2:31": "Inv Overheat",
    "E.SGxx:40": "Short Circuit"
  },
  si22Errors: {
    "E.SC1:1": "Short Circuit 1",
    "E.SC2:2": "Short Circuit 2",
    "E.SC3:3": "Short Circuit 3",
    "E.OC1:4": "Accel OverCurr",
    "E.OC2:5": "Decel OverCurr",
    "E.OC3:6": "Const Speed OC",
    "E.OU1:7": "Accel OverVolt",
    "E.OU2:8": "Decel OverVolt",
    "E.OU3:9": "Const Speed OV",
    "E.LU2:10": "UnderVoltage",
    "E.OL1:11": "MotorOverload",
    "E.OLF:14": "Out PhaseLoss",
    "E.OH2:15": "Rect Overheat",
    "E.OH1:16": "Inv Overheat",
    "E.HAL:19": "CurrentDetect"
  },
  hexErrors: {
    "1": "DC Under Volt",
    "2": "DC Over Volt",
    "3": "Over Current",
    "4": "Over Load",
    "5": "Over Temp",
    "6": "Short Circuit",
    "8": "Unbalance",
    "18": "Dry Run"
  },
  motorStatus: {
    "1": "Motor on",
    "2": "Sleep",
    "3": "Low Speed Pro",
    "4": "Dry Run Pro",
    "5": "Over Curr Pro",
    "6": "Min Power Pro",
    "7": "Water Full"
  },
  standardTelemetry: [
    { cmdKey: 'DCV', displayName: 'DC Voltage', scaleFactor: 10.0, decimals: 1, unit: 'V', defaultAddr: '3001', kpiTarget: 'pvVoltage' },
    { cmdKey: 'PWR', displayName: 'Motor Power', scaleFactor: 100.0, decimals: 2, unit: 'kW', defaultAddr: '3003', kpiTarget: 'motorPower' },
    { cmdKey: 'OPC', displayName: 'Motor Current', scaleFactor: 10.0, decimals: 1, unit: 'A', defaultAddr: '3051', kpiTarget: 'current' },
    { cmdKey: 'OPV', displayName: 'Output Voltage', scaleFactor: 10.0, decimals: 1, unit: 'V', defaultAddr: '3000', kpiTarget: 'motorVoltage' },
    { cmdKey: 'FRQ', displayName: 'Frequency', scaleFactor: 100.0, decimals: 2, unit: 'Hz', defaultAddr: '3050', kpiTarget: 'frequency' },
    { cmdKey: 'TEP', displayName: 'Temperature', scaleFactor: 10.0, decimals: 1, unit: '°C', defaultAddr: '3006', kpiTarget: 'temperature' },
    { cmdKey: 'DCA', displayName: 'DC Current', scaleFactor: 100.0, decimals: 2, unit: 'A', defaultAddr: '3002', kpiTarget: 'dcCurrent' },
    { cmdKey: 'CKW', displayName: 'Total Energy', scaleFactor: 10.0, decimals: 1, unit: 'kWh', defaultAddr: '3007', kpiTarget: 'totalEnergy' },
    { cmdKey: 'CWD', displayName: 'Total Flow', scaleFactor: 10.0, decimals: 1, unit: 'kL', defaultAddr: '3008', kpiTarget: 'totalFlow' },
    { cmdKey: 'CHR', displayName: 'Total Run Hours', scaleFactor: 1.0, decimals: 0, unit: 'h', defaultAddr: '3009', kpiTarget: 'totalHours' },
    { cmdKey: 'TKW', displayName: 'Today Energy', scaleFactor: 100.0, decimals: 2, unit: 'kWh', defaultAddr: '3010', kpiTarget: 'todayEnergy' },
    { cmdKey: 'TWD', displayName: 'Today Flow', scaleFactor: 10.0, decimals: 1, unit: 'kL', defaultAddr: '3011', kpiTarget: 'todayFlow' },
    { cmdKey: 'THR', displayName: 'Today Run Hours', scaleFactor: 10.0, decimals: 1, unit: 'h', defaultAddr: '3012', kpiTarget: 'todayHours' },
    { cmdKey: 'FLC', displayName: 'Fault Code', scaleFactor: 1.0, decimals: 0, unit: '', defaultAddr: '3004', kpiTarget: 'faultCode' },
    { cmdKey: 'STS', displayName: 'Status', scaleFactor: 1.0, decimals: 0, unit: '', defaultAddr: '3005', kpiTarget: 'statusCode' },
  ],
};

function VfdModelModal({ mode, model, existingManufacturers = [], onClose, onSaved }) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'errors' | 'status' | 'telemetry'

  const [modelCode, setModelCode] = useState(model?.modelCode || '');
  const [modelName, setModelName] = useState(model?.modelName || '');
  const [manufacturer, setManufacturer] = useState(model?.manufacturer || 'Macsoft Automations');
  const [customManufacturer, setCustomManufacturer] = useState(false);
  const [daddCommand, setDaddCommand] = useState(model?.daddCommand || '');
  const [description, setDescription] = useState(model?.description || '');

  // Error Codes state: Array of { code, message }
  const [errorList, setErrorList] = useState(() => {
    const map = model?.errorCodes || PRESETS.si21Errors;
    return Object.entries(map).map(([code, message]) => ({ code, message }));
  });

  // Status Codes state: Array of { code, message }
  const [hasStatus, setHasStatus] = useState(() => {
    return Boolean(model?.statusCodes && Object.keys(model.statusCodes).length > 0);
  });
  const [statusList, setStatusList] = useState(() => {
    const map = model?.statusCodes || PRESETS.motorStatus;
    return Object.entries(map).map(([code, message]) => ({ code, message }));
  });

  // Telemetry Scaling state: Array of TelemetryConfig
  const [telemetryList, setTelemetryList] = useState(() => {
    if (model?.telemetryConfigs && Array.isArray(model.telemetryConfigs) && model.telemetryConfigs.length > 0) {
      return model.telemetryConfigs;
    }
    return PRESETS.standardTelemetry;
  });

  const [newErrorCode, setNewErrorCode] = useState('');
  const [newErrorDesc, setNewErrorDesc] = useState('');
  const [newStatusCode, setNewStatusCode] = useState('');
  const [newStatusDesc, setNewStatusDesc] = useState('');

  const [newCmdKey, setNewCmdKey] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newScaleFactor, setNewScaleFactor] = useState(10.0);
  const [newUnit, setNewUnit] = useState('V');
  const [newKpiTarget, setNewKpiTarget] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const manufacturerOptions = React.useMemo(() => {
    const list = new Set([...DEFAULT_MANUFACTURERS, ...existingManufacturers]);
    if (model?.manufacturer) list.add(model.manufacturer);
    return Array.from(list);
  }, [existingManufacturers, model]);

  const handleAddError = () => {
    if (!newErrorCode.trim() || !newErrorDesc.trim()) return;
    setErrorList((prev) => [...prev.filter((item) => item.code !== newErrorCode.trim()), {
      code: newErrorCode.trim(),
      message: newErrorDesc.trim(),
    }]);
    setNewErrorCode('');
    setNewErrorDesc('');
  };

  const handleRemoveError = (code) => {
    setErrorList((prev) => prev.filter((item) => item.code !== code));
  };

  const handleAddStatus = () => {
    if (!newStatusCode.trim() || !newStatusDesc.trim()) return;
    setStatusList((prev) => [...prev.filter((item) => item.code !== newStatusCode.trim()), {
      code: newStatusCode.trim(),
      message: newStatusDesc.trim(),
    }]);
    setNewStatusCode('');
    setNewStatusDesc('');
  };

  const handleRemoveStatus = (code) => {
    setStatusList((prev) => prev.filter((item) => item.code !== code));
  };

  const handleAddTelemetry = () => {
    if (!newCmdKey.trim() || !newDisplayName.trim()) return;
    const factor = parseFloat(newScaleFactor) || 1.0;
    const dec = factor === 100.0 ? 2 : (factor === 10.0 ? 1 : 0);
    setTelemetryList((prev) => [
      ...prev.filter((item) => item.cmdKey !== newCmdKey.trim().toUpperCase()),
      {
        cmdKey: newCmdKey.trim().toUpperCase(),
        displayName: newDisplayName.trim(),
        scaleFactor: factor,
        decimals: dec,
        unit: newUnit.trim(),
        kpiTarget: newKpiTarget || null,
        sortOrder: prev.length + 1,
      },
    ]);
    setNewCmdKey('');
    setNewDisplayName('');
  };

  const handleRemoveTelemetry = (cmdKey) => {
    setTelemetryList((prev) => prev.filter((item) => item.cmdKey !== cmdKey));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;

    if (errorList.length === 0) {
      setError('At least one Error Code mapping is required for every VFD model.');
      setActiveTab('errors');
      return;
    }

    setSaving(true);
    setError('');

    const errorCodesObj = {};
    for (const item of errorList) {
      errorCodesObj[item.code] = item.message;
    }

    let statusCodesObj = null;
    if (hasStatus && statusList.length > 0) {
      statusCodesObj = {};
      for (const item of statusList) {
        statusCodesObj[item.code] = item.message;
      }
    }

    try {
      await vfdModelApi.save(
        {
          modelCode,
          modelName,
          manufacturer,
          daddCommand,
          description,
          errorCodes: errorCodesObj,
          statusCodes: statusCodesObj,
          telemetryConfigs: telemetryList,
        },
        isEdit ? model.modelCode : null
      );
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save VFD model');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl bg-white shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 p-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-400" />
            <h3 className="font-bold text-base">
              {isView ? 'VFD Model Details' : isEdit ? 'Edit VFD Model' : 'New VFD Model'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer text-sm">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 border-b-2 cursor-pointer transition-colors ${activeTab === 'general'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            General Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('errors')}
            className={`px-3 py-2 border-b-2 cursor-pointer flex items-center gap-1.5 transition-colors ${activeTab === 'errors'
              ? 'border-rose-600 text-rose-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Error Codes ({errorList.length}) <span className="text-[10px] text-rose-500 font-normal">*Req</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-3 py-2 border-b-2 cursor-pointer flex items-center gap-1.5 transition-colors ${activeTab === 'status'
              ? 'border-cyan-600 text-cyan-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Status Codes ({hasStatus ? statusList.length : '0'}) <span className="text-[10px] text-slate-400 font-normal">Optional</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-2 border-b-2 cursor-pointer flex items-center gap-1.5 transition-colors ${activeTab === 'telemetry'
              ? 'border-indigo-600 text-indigo-600 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Telemetry Scaling ({telemetryList.length}) <span className="text-[10px] text-indigo-600 font-normal">/10, /100</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Model Code</label>
                  <input
                    type="text"
                    required
                    disabled={isView || isEdit}
                    value={modelCode}
                    onChange={(e) => setModelCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SI21"
                    className="w-full px-3 py-2 border border-slate-300 text-xs font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    disabled={isView}
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g. MacSoft SI21 VFD"
                    className="w-full px-3 py-2 border border-slate-300 text-xs disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                    <span>Manufacturer</span>
                    {!isView && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomManufacturer(!customManufacturer);
                          if (!customManufacturer) setManufacturer('');
                        }}
                        className="text-[10px] text-blue-600 hover:underline font-normal cursor-pointer"
                      >
                        {customManufacturer ? 'Choose list' : '+ Custom'}
                      </button>
                    )}
                  </label>
                  {customManufacturer && !isView ? (
                    <input
                      type="text"
                      required
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      placeholder="e.g. Custom Manufacturer"
                      className="w-full px-3 py-2 border border-slate-300 text-xs disabled:bg-slate-100 font-medium"
                    />
                  ) : (
                    <select
                      required
                      disabled={isView}
                      value={manufacturer}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setCustomManufacturer(true);
                          setManufacturer('');
                        } else {
                          setManufacturer(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 text-xs bg-white text-slate-800 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                    >
                      <option value="" disabled>-- Select Manufacturer --</option>
                      {manufacturerOptions.map((mfg) => (
                        <option key={mfg} value={mfg}>
                          {mfg}
                        </option>
                      ))}
                      <option value="__custom__">+ Other / Enter Custom...</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>DADD Telemetry Setup Command</span>
                  <span className="text-[10px] text-slate-400 font-normal font-sans">ASCII Modbus Frame</span>
                </label>
                <textarea
                  rows={3}
                  required
                  disabled={isView}
                  value={daddCommand}
                  onChange={(e) => setDaddCommand(e.target.value)}
                  placeholder="DADD:OPV:3000,DCV:3001,DCA:3002,PWR:3003,FLC:3004,STS:3005..."
                  className="w-full px-3 py-2 border border-slate-300 text-xs font-mono bg-slate-50 text-slate-800 disabled:bg-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  disabled={isView}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Controller specifications and operational notes..."
                  className="w-full px-3 py-2 border border-slate-300 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: ERROR CODES (REQUIRED) */}
          {activeTab === 'errors' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-rose-50 p-2.5 border border-rose-200">
                <div>
                  <h4 className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    VFD Fault / Error Codes Dictionary (Required)
                  </h4>
                  <p className="text-[11px] text-rose-600">
                    When FLC register is read, this dictionary translates the integer fault code into an exact message.
                  </p>
                </div>
                {!isView && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setErrorList(Object.entries(PRESETS.si21Errors).map(([c, m]) => ({ code: c, message: m })))}
                      className="px-2 py-1 text-[10px] font-bold bg-white text-rose-700 border border-rose-300 hover:bg-rose-100 cursor-pointer"
                    >
                      Preset SI21
                    </button>
                    <button
                      type="button"
                      onClick={() => setErrorList(Object.entries(PRESETS.si22Errors).map(([c, m]) => ({ code: c, message: m })))}
                      className="px-2 py-1 text-[10px] font-bold bg-white text-rose-700 border border-rose-300 hover:bg-rose-100 cursor-pointer"
                    >
                      Preset SI22
                    </button>
                    <button
                      type="button"
                      onClick={() => setErrorList(Object.entries(PRESETS.hexErrors).map(([c, m]) => ({ code: c, message: m })))}
                      className="px-2 py-1 text-[10px] font-bold bg-white text-rose-700 border border-rose-300 hover:bg-rose-100 cursor-pointer"
                    >
                      Preset HEX
                    </button>
                  </div>
                )}
              </div>

              {!isView && (
                <div className="flex gap-2 items-center bg-slate-50 p-2 border border-slate-200">
                  <input
                    type="text"
                    value={newErrorCode}
                    onChange={(e) => setNewErrorCode(e.target.value)}
                    placeholder="Code (e.g. E.SC1:1 or 1)"
                    className="w-32 px-2 py-1 text-xs border border-slate-300 font-mono"
                  />
                  <input
                    type="text"
                    value={newErrorDesc}
                    onChange={(e) => setNewErrorDesc(e.target.value)}
                    placeholder="Description (e.g. E.OC1:5 Accel OverCurr)"
                    className="flex-1 px-2 py-1 text-xs border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={handleAddError}
                    className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
                  >
                    + Add Code
                  </button>
                </div>
              )}

              <div className="border border-slate-200 max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-1.5 w-20">Code</th>
                      <th className="px-3 py-1.5">Description</th>
                      {!isView && <th className="px-3 py-1.5 w-16 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {errorList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-slate-400">
                          No error codes defined yet. Use the presets above or add entries manually.
                        </td>
                      </tr>
                    ) : (
                      errorList.map((item) => (
                        <tr key={item.code} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-mono font-bold text-rose-700">{item.code}</td>
                          <td className="px-3 py-1.5 font-medium text-slate-800">{item.message}</td>
                          {!isView && (
                            <td className="px-3 py-1.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveError(item.code)}
                                className="text-red-500 hover:text-red-700 cursor-pointer font-bold"
                              >
                                ✕
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: STATUS CODES (OPTIONAL) */}
          {activeTab === 'status' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-cyan-50 p-2.5 border border-cyan-200">
                <div>
                  <h4 className="text-xs font-bold text-cyan-800 uppercase flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-cyan-600" />
                    Motor Status Codes Dictionary (Optional)
                  </h4>
                  <p className="text-[11px] text-cyan-600">
                    Shared status for SI21 & SI22 (Motor on, Sleep, Dry Run, etc.). Leave empty for models like HEX.
                  </p>
                </div>
                {!isView && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-cyan-900 bg-white px-2 py-1 border border-cyan-300">
                    <input
                      type="checkbox"
                      checked={hasStatus}
                      onChange={(e) => setHasStatus(e.target.checked)}
                      className="cursor-pointer"
                    />
                    Enable Status Codes
                  </label>
                )}
              </div>

              {hasStatus && (
                <>
                  {!isView && (
                    <div className="flex justify-between items-center bg-slate-50 p-2 border border-slate-200">
                      <div className="flex gap-2 items-center flex-1">
                        <input
                          type="text"
                          value={newStatusCode}
                          onChange={(e) => setNewStatusCode(e.target.value)}
                          placeholder="Code (e.g. 1)"
                          className="w-28 px-2 py-1 text-xs border border-slate-300 font-mono"
                        />
                        <input
                          type="text"
                          value={newStatusDesc}
                          onChange={(e) => setNewStatusDesc(e.target.value)}
                          placeholder="Status Description (e.g. 1: Motor on)"
                          className="flex-1 px-2 py-1 text-xs border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={handleAddStatus}
                          className="px-3 py-1 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 cursor-pointer"
                        >
                          + Add Status
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStatusList(Object.entries(PRESETS.motorStatus).map(([c, m]) => ({ code: c, message: m })))}
                        className="ml-2 px-2 py-1 text-[10px] font-bold bg-white text-cyan-700 border border-cyan-300 hover:bg-cyan-100 cursor-pointer"
                      >
                        Load Motor Status Preset
                      </button>
                    </div>
                  )}

                  <div className="border border-slate-200 max-h-56 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-1.5 w-20">Code</th>
                          <th className="px-3 py-1.5">Description</th>
                          {!isView && <th className="px-3 py-1.5 w-16 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {statusList.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-3 py-4 text-center text-slate-400">
                              No status codes defined.
                            </td>
                          </tr>
                        ) : (
                          statusList.map((item) => (
                            <tr key={item.code} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 font-mono font-bold text-cyan-700">{item.code}</td>
                              <td className="px-3 py-1.5 font-medium text-slate-800">{item.message}</td>
                              {!isView && (
                                <td className="px-3 py-1.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStatus(item.code)}
                                    className="text-red-500 hover:text-red-700 cursor-pointer font-bold"
                                  >
                                    ✕
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: TELEMETRY SCALING */}
          {activeTab === 'telemetry' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-indigo-50/70 p-2.5 border border-indigo-200">
                <div>
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                    <Sliders className="h-3.5 w-3.5 text-indigo-700" /> Model Telemetry Scaling & Command Abbreviations
                  </span>
                  <p className="text-[11px] text-indigo-700">
                    Configure scaling factors (/10, /100), engineering units, and KPI mappings for {modelCode || 'this model'}.
                  </p>
                </div>
                {!isView && (
                  <button
                    type="button"
                    onClick={() => setTelemetryList(PRESETS.standardTelemetry)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-100 cursor-pointer shadow-xs"
                  >
                    Load Standard 15 Rules (/10, /100)
                  </button>
                )}
              </div>

              {/* Add new rule row */}
              {!isView && (
                <div className="bg-slate-50 p-2.5 border border-slate-200 space-y-2">
                  <div className="grid grid-cols-6 gap-2">
                    <input
                      type="text"
                      value={newCmdKey}
                      onChange={(e) => setNewCmdKey(e.target.value.toUpperCase())}
                      placeholder="Key (e.g. DCV)"
                      className="px-2 py-1 text-xs border border-slate-300 font-mono font-bold uppercase"
                    />
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      placeholder="Name (e.g. DC Voltage)"
                      className="col-span-2 px-2 py-1 text-xs border border-slate-300"
                    />
                    <select
                      value={newScaleFactor}
                      onChange={(e) => setNewScaleFactor(parseFloat(e.target.value) || 1.0)}
                      className="px-2 py-1 text-xs border border-slate-300 font-mono"
                    >
                      <option value="1">÷ 1 (No Scale)</option>
                      <option value="10">÷ 10 (/10)</option>
                      <option value="100">÷ 100 (/100)</option>
                    </select>
                    <input
                      type="text"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="Unit (V, kW, A)"
                      className="px-2 py-1 text-xs border border-slate-300 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddTelemetry}
                      className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer flex items-center justify-center gap-1"
                    >
                      + Add Rule
                    </button>
                  </div>
                </div>
              )}

              {/* Table of telemetry rules */}
              <div className="border border-slate-200 max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-3 py-1.5 w-20">Key</th>
                      <th className="px-3 py-1.5">Display Name</th>
                      <th className="px-3 py-1.5 w-24">Scale Factor</th>
                      <th className="px-3 py-1.5 w-16">Unit</th>
                      <th className="px-3 py-1.5 w-28">KPI Target</th>
                      {!isView && <th className="px-3 py-1.5 w-14 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {telemetryList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-slate-400">
                          No scaling rules configured. Click "Load Standard 15 Rules".
                        </td>
                      </tr>
                    ) : (
                      telemetryList.map((item) => (
                        <tr key={item.cmdKey} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-mono font-bold text-indigo-700">{item.cmdKey}</td>
                          <td className="px-3 py-1.5 font-medium text-slate-800">{item.displayName}</td>
                          <td className="px-3 py-1.5 font-mono text-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                              ÷ {item.scaleFactor}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">({item.decimals} dec)</span>
                          </td>
                          <td className="px-3 py-1.5 font-mono font-semibold text-slate-600">{item.unit || '—'}</td>
                          <td className="px-3 py-1.5 text-slate-500 font-mono text-[11px]">{item.kpiTarget || '—'}</td>
                          {!isView && (
                            <td className="px-3 py-1.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveTelemetry(item.cmdKey)}
                                className="text-red-500 hover:text-red-700 cursor-pointer font-bold"
                              >
                                ✕
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-400">
              {isView ? 'Read-only view' : '* Error codes required. Status codes optional.'}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {isView ? 'Close' : 'Cancel'}
              </button>
              {!isView && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Model'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
