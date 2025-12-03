import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../constants/api';

/**
 * Custom hook to fetch active Motor HP options
 * Useful for dropdowns and select inputs
 */
export const useMotorHPOptions = () => {
  const [motorhpOptions, setMotorHPOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMotorHPOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_ENDPOINTS.motorhp}/active`);
        setMotorHPOptions(response.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch Motor HP options');
        setMotorHPOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMotorHPOptions();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_ENDPOINTS.motorhp}/active`);
      setMotorHPOptions(response.data || []);
    } catch (err) {
      console.error('Error refetching Motor HP options:', err);
      setError(err.response?.data?.error || 'Failed to fetch Motor HP options');
      setMotorHPOptions([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    motorhpOptions,
    loading,
    error,
    refetch
  };
};

export default useMotorHPOptions;