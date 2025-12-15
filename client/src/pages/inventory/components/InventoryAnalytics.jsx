import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Package, AlertTriangle } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../../lib/constants/api";

export default function InventoryAnalytics({ inventoryData }) {
  const [analytics, setAnalytics] = useState({
    byCondition: {},
    byCategory: {},
    byCenter: {},
    lowStockTrends: [],
    totalValue: 0
  });

  useEffect(() => {
    if (inventoryData.length > 0) {
      calculateAnalytics();
    }
  }, [inventoryData]);

  const calculateAnalytics = () => {
    const byCondition = {};
    const byCategory = {};
    const byCenter = {};
    
    inventoryData.forEach(item => {
      // By condition
      if (!byCondition[item.condition]) {
        byCondition[item.condition] = { count: 0, quantity: 0 };
      }
      byCondition[item.condition].count++;
      byCondition[item.condition].quantity += item.quantity || 0;
      
      // By category
      if (item.category) {
        if (!byCategory[item.category]) {
          byCategory[item.category] = { count: 0, quantity: 0 };
        }
        byCategory[item.category].count++;
        byCategory[item.category].quantity += item.quantity || 0;
      }
      
      // By center
      if (item.centerCode) {
        if (!byCenter[item.centerCode]) {
          byCenter[item.centerCode] = { 
            count: 0, 
            quantity: 0, 
            name: item.centerName || item.centerCode 
          };
        }
        byCenter[item.centerCode].count++;
        byCenter[item.centerCode].quantity += item.quantity || 0;
      }
    });

    setAnalytics({
      byCondition,
      byCategory,
      byCenter,
      lowStockTrends: inventoryData.filter(item => item.status === "LOW_STOCK"),
      totalValue: inventoryData.reduce((sum, item) => sum + (item.quantity || 0), 0)
    });
  };

  const getConditionColor = (condition) => {
    const colors = {
      'GOOD': 'bg-green-500',
      'DEFECTIVE': 'bg-red-500', 
      'REPAIRABLE': 'bg-yellow-500',
      'SCRAP': 'bg-gray-500'
    };
    return colors[condition] || 'bg-blue-500';
  };

  const renderBarChart = (data, title, colorKey = null) => {
    const entries = Object.entries(data);
    if (entries.length === 0) return null;
    
    const maxValue = Math.max(...entries.map(([, value]) => value.quantity));
    
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          {title}
        </h3>
        <div className="space-y-2">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-20 text-sm text-gray-600 truncate" title={key}>
                {colorKey ? key : (value.name || key)}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div
                  className={`h-4 rounded-full ${colorKey ? getConditionColor(key) : 'bg-blue-500'}`}
                  style={{ width: `${(value.quantity / maxValue) * 100}%` }}
                />
                <span className="absolute right-2 top-0 text-xs text-gray-600 leading-4">
                  {value.quantity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm text-gray-500">Total Items</div>
              <div className="font-semibold">{inventoryData.length}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-sm text-gray-500">Total Quantity</div>
              <div className="font-semibold">{analytics.totalValue}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="text-sm text-gray-500">Low Stock Items</div>
              <div className="font-semibold">{analytics.lowStockTrends.length}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-sm text-gray-500">Categories</div>
              <div className="font-semibold">{Object.keys(analytics.byCategory).length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {renderBarChart(analytics.byCondition, "By Condition", true)}
        {renderBarChart(analytics.byCategory, "By Category")}
        {renderBarChart(analytics.byCenter, "By Service Center")}
      </div>

      {/* Low Stock Alert */}
      {analytics.lowStockTrends.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Low Stock Alert Items
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {analytics.lowStockTrends.slice(0, 6).map((item, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <div className="font-medium text-sm text-gray-800">{item.productname}</div>
                <div className="text-xs text-gray-600">{item.productCode}</div>
                <div className="text-xs text-yellow-700 mt-1">
                  Stock: {item.availableQuantity} / Min: {item.minQty}
                </div>
              </div>
            ))}
          </div>
          {analytics.lowStockTrends.length > 6 && (
            <div className="text-center mt-3">
              <span className="text-sm text-gray-500">
                +{analytics.lowStockTrends.length - 6} more items need attention
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}