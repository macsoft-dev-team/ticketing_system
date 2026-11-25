import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit3, Trash2, Eye, Settings, FileText, Building2 } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { configApi, organisationApi, getStoredUser } from '../../lib/services/vfdService.js';
import { formatDateTime, truncate } from '../../lib/utils/format.js';

export default function ConfigList({ navigate }) {
  const currentUser = getStoredUser();
  const isEngineer = currentUser?.role === 'engineer';
  const userOrgCode = currentUser?.orgCode || '';

  const [data, setData] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [activeConfig, setActiveConfig] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch organisations for Company dropdown
  useEffect(() => {
    organisationApi
      .list({ limit: 100 })
      .then((res) => setOrganisations(res.organisations || []))
      .catch((err) => console.error('Failed to load organisations for config:', err));
  }, []);

  const fetchConfigs = useCallback(
    async (page = 1, search = '', companyFilter = selectedCompanyFilter) => {
      setLoading(true);
      setError('');
      try {
        const params = { page, limit: itemsPerPage, search };
        if (!isEngineer && companyFilter) {
          params.companyId = companyFilter;
        }
        const res = await configApi.list(params);
        setData(res.configs || []);
        setTotalItems(res.total || 0);
        setCurrentPage(res.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to fetch configurations');
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage, isEngineer, selectedCompanyFilter]
  );

  useEffect(() => {
    fetchConfigs(currentPage, searchQuery, selectedCompanyFilter);
  }, [currentPage, searchQuery, selectedCompanyFilter, fetchConfigs]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await configApi.remove(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchConfigs(currentPage, searchQuery);
    } catch (err) {
      alert(err.message || 'Failed to delete configuration');
    }
  };

  const columns = [
    {
      header: 'PROJECT',
      accessor: 'projectId',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {row.projectId}
        </span>
      ),
    },
    {
      header: 'COMPANY',
      accessor: 'companyId',
      sortable: true,
      cell: (row) => <span className="font-semibold text-slate-700">{row.companyId}</span>,
    },
    {
      header: 'HP RATING',
      accessor: 'hp',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
          {row.hp} HP
        </span>
      ),
    },
    {
      header: 'PUMP TYPE',
      accessor: 'type',
      cell: (row) => <span className="text-slate-600 font-medium">{row.type}</span>,
    },
    {
      header: 'AC/DC',
      accessor: 'acDc',
      align: 'center',
      cell: (row) => (
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border">
          {row.acDc}
        </span>
      ),
    },
    {
      header: 'COMMANDS',
      accessor: 'commands',
      cell: (row) => {
        let count = 0;
        try {
          const cmds = typeof row.commands === 'string' ? JSON.parse(row.commands) : row.commands;
          count = Array.isArray(cmds) ? cmds.length : 1;
        } catch {
          count = 1;
        }
        return (
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            {count} commands
          </span>
        );
      },
    },
    {
      header: 'VERSION',
      accessor: 'version',
      align: 'center',
      cell: (row) => <span className="font-mono text-xs text-slate-500">v{row.version || '1.0'}</span>,
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
              setActiveConfig(row);
              setModalMode('view');
              setShowModal(true);
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveConfig(row);
              setModalMode('edit');
              setShowModal(true);
            }}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit Config"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteConfirm(row)}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Config"
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
        icon={Settings}
        title="PUMP PARAMETER CONFIGURATIONS"
        subtitle={
          isEngineer
            ? `ORGANISATION PLAN: ${userOrgCode} • HARDWARE & CONTROLLER`
            : "PRESET PARAMETER ARRAYS FOR BLUETOOTH BULK WRITE"
        }
        actionLabel="New Configuration"
        onAction={() => {
          setActiveConfig(null);
          setModalMode('create');
          setShowModal(true);
        }}
      >
        {isEngineer ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-cyan-500/50 text-cyan-400 text-xs font-bold font-mono">
            <Building2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>MY PLAN: {userOrgCode}</span>
          </div>
        ) : (
          <div className="relative min-w-[190px]">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedCompanyFilter}
              onChange={(e) => {
                setSelectedCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-7 py-2 text-xs font-semibold border border-slate-300 bg-slate-50 text-slate-700 cursor-pointer appearance-none shadow-2xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Companies (Filter)</option>
              {organisations.map((org) => (
                <option key={org.orgCode} value={org.orgCode}>
                  {org.name} ({org.orgCode})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search project, HP, company..."
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
          fetchConfigs(newPage, searchQuery, selectedCompanyFilter);
        }}
        loading={loading}
      />

      {/* Config Modal */}
      {showModal && (
        <ConfigModal
          mode={modalMode}
          config={activeConfig}
          organisations={organisations}
          existingCompanies={[...new Set(data.map((c) => c.companyId).filter(Boolean))]}
          currentUser={currentUser}
          isEngineer={isEngineer}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchConfigs(currentPage, searchQuery, selectedCompanyFilter);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
            <p className="text-xs text-slate-600">
              Delete configuration for Project <strong className="text-slate-900">{deleteConfirm.projectId}</strong> ({deleteConfirm.hp} HP {deleteConfirm.type})?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm cursor-pointer"
              >
                Delete Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigModal({
  mode,
  config,
  organisations = [],
  existingCompanies = [],
  currentUser,
  isEngineer,
  onClose,
  onSaved,
}) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const defaultCompany = isEngineer
    ? (currentUser?.orgCode || 'MACSOFT')
    : (config?.companyId || organisations[0]?.orgCode || 'MACSOFT');

  const [projectId, setProjectId] = useState(config?.projectId || '');
  const [companyId, setCompanyId] = useState(defaultCompany);
  const [customCompany, setCustomCompany] = useState(false);
  const [hp, setHp] = useState(config?.hp || '5');
  const [type, setType] = useState(config?.type || 'Submersible');
  const [acDc, setAcDc] = useState(config?.acDc || 'AC');
  const [oilWater, setOilWater] = useState(config?.oilWater || 'Water');
  const [commands, setCommands] = useState(
    typeof config?.commands === 'string'
      ? config.commands
      : JSON.stringify(config?.commands || ['SET01=100', 'SET02=200'], null, 2)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const companyOptions = React.useMemo(() => {
    return organisations.map((org) => ({
      code: org.orgCode,
      name: org.name,
    }));
  }, [organisations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;
    setSaving(true);
    setError('');

    let parsedCommands = commands;
    try {
      parsedCommands = JSON.parse(commands);
    } catch {
      // Allow raw string
    }

    try {
      await configApi.save({
        projectId,
        companyId: isEngineer ? (currentUser?.orgCode || companyId) : companyId,
        hp,
        type,
        acDc,
        oilWater,
        commands: parsedCommands,
      });
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-950 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-base">
              {isView ? 'Preset Details' : isEdit ? 'Edit Configuration' : 'New Motor Configuration'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project ID</label>
              <input
                type="text"
                required
                disabled={isView || isEdit}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value.toUpperCase())}
                placeholder="e.g. PRJ001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                <span>Company</span>
                {!isView && !isEngineer && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCompany(!customCompany);
                      if (!customCompany) setCompanyId('');
                    }}
                    className="text-[10px] text-amber-600 hover:underline font-normal cursor-pointer"
                  >
                    {customCompany ? 'Choose list' : '+ Custom'}
                  </button>
                )}
              </label>
              {isEngineer ? (
                <div className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-bold text-cyan-800 flex items-center justify-between">
                  <span>{currentUser?.orgCode || companyId}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">(Your Org Plan)</span>
                </div>
              ) : customCompany && !isView ? (
                <input
                  type="text"
                  required
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value.toUpperCase())}
                  placeholder="e.g. MACSOFT"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100 font-medium"
                />
              ) : (
                <select
                  required
                  disabled={isView}
                  value={companyId}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setCustomCompany(true);
                      setCompanyId('');
                    } else {
                      setCompanyId(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
                >
                  <option value="" disabled>-- Select Company --</option>
                  {companyOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name ? `${c.name} (${c.code})` : c.code}
                    </option>
                  ))}
                  <option value="__custom__">+ Other / Enter Custom...</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">HP Rating</label>
              <input
                type="text"
                required
                disabled={isView}
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">AC / DC</label>
              <select
                disabled={isView}
                value={acDc}
                onChange={(e) => setAcDc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
              >
                <option value="AC">AC</option>
                <option value="DC">DC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type</label>
              <input
                type="text"
                required
                disabled={isView}
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Submersible"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Bulk Write Commands (ASCII sequence)
            </label>
            <textarea
              rows={5}
              required
              disabled={isView}
              value={commands}
              onChange={(e) => setCommands(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {isView ? 'Close' : 'Cancel'}
            </button>
            {!isView && (
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-md disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
