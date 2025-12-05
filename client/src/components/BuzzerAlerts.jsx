import React, { useState } from 'react';
import BuzzerIndicator from './BuzzerIndicator';
import BuzzerAlertsDisplay from './BuzzerAlertsDisplay';
import { useBuzzer } from '../lib/hooks/useBuzzer';

const BuzzerAlerts = () => {
  const [showDisplay, setShowDisplay] = useState(false);
  const { hasAlerts } = useBuzzer();

  const handleToggleDisplay = () => {
    setShowDisplay(!showDisplay);
  };

  // Auto-show display when new alerts come in
  React.useEffect(() => {
    if (hasAlerts && !showDisplay) {
      setShowDisplay(true);
    }
  }, [hasAlerts]);

  return (
    <>
      {/* <BuzzerIndicator onClick={handleToggleDisplay} /> */}
      {showDisplay && hasAlerts && <BuzzerAlertsDisplay />}
    </>
  );
};

export default BuzzerAlerts;