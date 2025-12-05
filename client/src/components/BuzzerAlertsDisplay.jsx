import React from 'react';
import { useBuzzerAlerts } from '../lib/contexts/BuzzerAlertsContext';
import './BuzzerAlertsDisplay.css';

const BuzzerAlertsDisplay = () => {
  const { isEnabled, alerts, toggleBuzzer, dismissAlert, clearAllAlerts } = useBuzzerAlerts();

  if (alerts.length === 0) {
    return null;
  }

  const formatTimeAgo = (date) => {
    const now = new Date();
    const alertTime = new Date(date);
    const diffMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="buzzer-alerts-container">
      {/* Buzzer Control Header */}
      <div className="buzzer-control-header">
        <div className="buzzer-status">
          <span className={`buzzer-indicator ${isEnabled ? 'active' : 'inactive'}`}>
            🔔
          </span>
          <span className="buzzer-label">Customer Response Alerts</span>
        </div>
        <div className="buzzer-controls">
      {/*     <button 
            onClick={toggleBuzzer}
            className={`btn-buzzer-toggle ${isEnabled ? 'enabled' : 'disabled'}`}
            title={isEnabled ? 'Disable Buzzer Alerts' : 'Enable Buzzer Alerts'}
          >
            {isEnabled ? '🔊' : '🔇'}
          </button> */}
          {alerts.length > 1 && (
            <button 
              onClick={clearAllAlerts}
              className="btn-clear-all"
              title="Clear All Alerts"
            >
              Clear All ({alerts.length})
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="buzzer-alerts-list">
        {alerts.map((alert) => (
          <div key={alert.id} className="buzzer-alert-item">
            <div className="alert-header">
              <div className="alert-ticket-info">
                <span className="ticket-code">{alert.ticketCode}</span>
                <span className="alert-urgency">
                  {alert.hoursWaiting >= 6 ? '🔥 URGENT' : '⏰ Pending'}
                </span>
              </div>
              <button 
                onClick={() => dismissAlert(alert.id)}
                className="btn-dismiss-alert"
                title="Dismiss Alert"
              >
                ✕
              </button>
            </div>
            
            <div className="alert-content">
              <p className="alert-message">
                Customer last replied <strong>{alert.hoursWaiting} hours ago</strong>
              </p>
              <div className="alert-meta">
                <span className="alert-time">
                  Alert received {formatTimeAgo(alert.receivedAt)}
                </span>
                {alert.assignedTo && (
                  <span className="alert-assigned">
                    Assigned to: {alert.assignedTo}
                  </span>
                )}
              </div>
            </div>

            <div className="alert-actions">
              <button 
                className="btn-view-ticket"
                onClick={() => window.location.href = `/tickets/${alert.ticketId}`}
              >
                View Ticket
              </button>
              {alert.conversationId && (
                <button 
                  className="btn-quick-reply"
                  onClick={() => window.location.href = `/conversations/${alert.conversationId}`}
                >
                  Quick Reply
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuzzerAlertsDisplay;