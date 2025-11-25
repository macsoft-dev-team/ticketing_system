import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import useServiceCenter from '../lib/hooks/useServiceCenter';

const TestServiceCenterFlow = () => {
  const { 
    getSuggestedServiceCenters, 
    assignServiceCenter,
    getUnassignedTickets,
    getServiceCenterStats,
    loading 
  } = useServiceCenter();
  
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults({});
    
    const results = {};
    
    try {
      // Test 1: Get suggested service centers
       try {
        const suggestedResult = await getSuggestedServiceCenters('Maharashtra');
        results.getSuggestedServiceCenters = {
          success: true,
          data: suggestedResult.payload,
          message: `Found ${suggestedResult.payload?.suggestedServiceCenters?.length || 0} service centers`
        };
      } catch (error) {
        results.getSuggestedServiceCenters = {
          success: false,
          error: error.message
        };
      }

      // Test 2: Get unassigned tickets
       try {
        const unassignedResult = await getUnassignedTickets();
        results.getUnassignedTickets = {
          success: true,
          data: unassignedResult.payload,
          message: `Found ${unassignedResult.payload?.tickets?.length || 0} unassigned tickets`
        };
      } catch (error) {
        results.getUnassignedTickets = {
          success: false,
          error: error.message
        };
      }

      // Test 3: Get service center stats
       try {
        const statsResult = await getServiceCenterStats();
        results.getServiceCenterStats = {
          success: true,
          data: statsResult.payload,
          message: `Found ${statsResult.payload?.serviceCenters?.length || 0} service centers with stats`
        };
      } catch (error) {
        results.getServiceCenterStats = {
          success: false,
          error: error.message
        };
      }

      // Test 4: Test service center assignment (will fail without valid ticket ID)
       try {
        await assignServiceCenter(999999, 'TEST-CENTER-001');
        results.assignServiceCenter = {
          success: false,
          message: 'This should have failed with invalid ticket ID'
        };
      } catch (error) {
        results.assignServiceCenter = {
          success: true, // Expected to fail
          message: `Expected error: ${error.message}`,
          note: 'This test is expected to fail with invalid ticket ID'
        };
      }

    } catch (error) {
      console.error('Test suite error:', error);
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <TestTube size={24} className="text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Service Center Hook Test Suite
        </h2>
      </div>

      <div className="mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runTests}
          disabled={isRunning || loading}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isRunning || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRunning ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Running Tests...
            </div>
          ) : (
            'Run Service Center Tests'
          )}
        </motion.button>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        {Object.entries(testResults).map(([testName, result]) => (
          <motion.div
            key={testName}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 border rounded-lg ${
              result.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {result.success ? (
                <CheckCircle size={18} className="text-green-600" />
              ) : (
                <AlertCircle size={18} className="text-red-600" />
              )}
              <h3 className="font-medium text-gray-900">
                {testName}
              </h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                result.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.success ? 'PASS' : 'FAIL'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              {result.message && (
                <p className="mb-2">{result.message}</p>
              )}
              {result.error && (
                <p className="text-red-600 mb-2">Error: {result.error}</p>
              )}
              {result.note && (
                <p className="text-blue-600 italic">{result.note}</p>
              )}
              {result.data && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">
                    View Response Data
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {Object.keys(testResults).length === 0 && !isRunning && (
        <div className="text-center py-8 text-gray-500">
          <Building size={48} className="mx-auto mb-4 opacity-50" />
          <p>Click "Run Service Center Tests" to test the hook integration</p>
        </div>
      )}
    </motion.div>
  );
};

export default TestServiceCenterFlow;