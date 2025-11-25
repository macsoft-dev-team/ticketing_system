import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import useServiceCenter from '../lib/hooks/useServiceCenter';
import axios from 'axios';
import { API_ENDPOINTS } from '../lib/constants/api';

const ServiceCenterAssignmentModal = ({ 
  isOpen, 
  onClose, 
  ticket, 
  onSuccess,
  loading = false 
}) => {
  const { 
    getServiceCenters, 
    assignServiceCenter,
    serviceCenters,
    serviceCenter,
    loading: serviceCenterLoading 
  } = useServiceCenter();
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [states, setStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);

  // Debounced search effect
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      const searchFilters = {};
      if (searchTerm.trim()) searchFilters.search = searchTerm.trim();
      if (stateFilter) searchFilters.stateId = stateFilter;
      
      getServiceCenters(searchFilters)
        .then(result => {
         })
        .catch(err => {
          console.error('❌ Error loading service centers:', err);
          setError(err.message || 'Failed to load service centers');
        });
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [isOpen, getServiceCenters, searchTerm, stateFilter]);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setStateFilter('');
      setError(null);
      setSelectedCenter(null);
    }
  }, [isOpen]);

  // Fetch states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.states);
        setStates(response.data);
      } catch (error) {
        console.error('Error fetching states:', error);
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, []);

  const handleAssign = async () => {
    if (!selectedCenter || !ticket?.id) return;

    setIsAssigning(true);
    setError(null);
    
    try {
      await assignServiceCenter(ticket.id, selectedCenter.centerCode);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(selectedCenter);
      }
      
      onClose();
      setSelectedCenter(null);
    } catch (err) {
      setError(err.message || 'Failed to assign service center');
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;  

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Assign Service Center
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Ticket: {ticket?.ticketCode} • State: {ticket?.state}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Search and Filter Bar */}
            <div className="mb-4">
              <div className="flex gap-3 mb-3">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, code, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="w-48 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    disabled={loadingStates}
                    className={`w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white ${
                      loadingStates ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      {loadingStates ? 'Loading...' : `All States${states.length > 0 ? ` (${states.length})` : ''}`}
                    </option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    {loadingStates ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              
              {(searchTerm || stateFilter) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {searchTerm && `Search: "${searchTerm}"`}
                    {searchTerm && stateFilter && " • "}
                    {stateFilter && `State: "${states.find(s => s.id === parseInt(stateFilter))?.name || stateFilter}"`}
                  </span>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStateFilter('');
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {serviceCenterLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading service centers...</span>
              </div>
            ) : (!serviceCenters || serviceCenters.length === 0) ? (
              <div className="text-center py-8">
                <Building size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  {searchTerm || stateFilter 
                    ? 'No service centers match your search criteria' 
                    : 'No service centers available'
                  }
                </p>
                {(searchTerm || stateFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStateFilter('');
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Clear filters to see all service centers
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {serviceCenters.length} service center(s) available - Sorted by Priority
                    </span>
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <strong>High Priority:</strong> State-specific with low workload (≤5 tickets)
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        <strong>Medium Priority:</strong> State-specific with high workload or Universal with low workload
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                        <strong>Low Priority:</strong> Universal centers with high workload ({'>'}5 tickets)
                      </span>
                    </div>
                  </div>
                </div>

                {serviceCenters.map((center) => (
                  <motion.div
                    key={center.centerCode}
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedCenter?.centerCode === center.centerCode
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCenter(center)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Building size={18} className="text-gray-600" />
                          <h3 className="font-medium text-gray-900">
                            {center.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span 
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                center.priority === 'HIGH' 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : center.priority === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}
                            >
                              {center.priority} Priority
                            </span>
                            <span 
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                center.isStateSpecific 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {center.isStateSpecific 
                                ? 'State Specific' 
                                : center.isUniversal 
                                ? 'Universal' 
                                : 'General'
                              }
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Code:</span>
                            <span className="font-mono">{center.centerCode}</span>
                          </div>
                          
                          {center.address && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} />
                              <span>{center.address}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span>Current workload: {center.currentWorkload || center._count?.assignedTickets || 0} tickets</span>
                            {center.currentWorkload <= 5 && (
                              <span className="text-green-600 text-xs">(Low load)</span>
                            )}
                            {center.currentWorkload > 5 && center.currentWorkload <= 10 && (
                              <span className="text-yellow-600 text-xs">(Medium load)</span>
                            )}
                            {center.currentWorkload > 10 && (
                              <span className="text-red-600 text-xs">(High load)</span>
                            )}
                          </div>

                          {center.serviceableStates && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Serves:</span>
                              <span>{center.serviceableStates}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedCenter?.centerCode === center.centerCode && (
                        <CheckCircle size={20} className="text-blue-600" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={!isAssigning && selectedCenter ? { scale: 1.05 } : {}}
              whileTap={!isAssigning && selectedCenter ? { scale: 0.95 } : {}}
              onClick={handleAssign}
              disabled={!selectedCenter || isAssigning || serviceCenterLoading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedCenter && !isAssigning && !serviceCenterLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAssigning ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Assigning...
                </div>
              ) : (
                'Assign Service Center'
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ServiceCenterAssignmentModal;