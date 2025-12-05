import { useBuzzerAlerts } from '../contexts/BuzzerAlertsContext';

export const useBuzzer = () => {
  const {
    isEnabled,
    alerts,
    toggleBuzzer,
    dismissAlert,
    clearAllAlerts
  } = useBuzzerAlerts();

  // Get count of active alerts
  const alertCount = alerts.length;
  
  // Get count of urgent alerts (6+ hours waiting)
  const urgentCount = alerts.filter(alert => alert.hoursWaiting >= 6).length;
  
  // Get latest alert
  const latestAlert = alerts.length > 0 
    ? alerts.reduce((latest, current) => 
        new Date(current.receivedAt) > new Date(latest.receivedAt) ? current : latest
      )
    : null;

  // Check if there are any active alerts
  const hasAlerts = alertCount > 0;
  
  // Check if there are urgent alerts
  const hasUrgentAlerts = urgentCount > 0;

  return {
    isEnabled,
    alerts,
    alertCount,
    urgentCount,
    latestAlert,
    hasAlerts,
    hasUrgentAlerts,
    toggleBuzzer,
    dismissAlert,
    clearAllAlerts
  };
};

export default useBuzzer;