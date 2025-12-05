import React from 'react';
import { useBuzzer } from '../lib/hooks/useBuzzer';
import './BuzzerIndicator.css';

const BuzzerIndicator = ({ onClick }) => {
  const { 
    isEnabled, 
    alertCount, 
    urgentCount, 
    hasAlerts, 
    hasUrgentAlerts,
    toggleBuzzer 
  } = useBuzzer();

  if (!hasAlerts && isEnabled) {
    return (
      <div className="buzzer-indicator-container">
        <button 
          className="buzzer-indicator-button enabled"
          onClick={onClick}
          title="Buzzer Alerts Enabled - No pending alerts"
        >
          🔔
        </button>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="buzzer-indicator-container">
        <button 
          className="buzzer-indicator-button disabled"
          onClick={toggleBuzzer}
          title="Buzzer Alerts Disabled - Click to enable"
        >
          🔇
        </button>
      </div>
    );
  }

  return (
    <div className="buzzer-indicator-container">
      <button 
        className={`buzzer-indicator-button active ${hasUrgentAlerts ? 'urgent' : 'normal'}`}
        onClick={onClick}
        title={`${alertCount} customer${alertCount === 1 ? '' : 's'} waiting for response${urgentCount > 0 ? ` (${urgentCount} urgent)` : ''}`}
      >
        <span className="buzzer-icon">🔔</span>
        <span className="buzzer-badge">
          {alertCount > 99 ? '99+' : alertCount}
        </span>
        {hasUrgentAlerts && <span className="urgent-indicator">🔥</span>}
      </button>
    </div>
  );
};

export default BuzzerIndicator;