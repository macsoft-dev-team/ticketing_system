const mqtt = require('mqtt');

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://mqtt.macsoftautomations.in';
const USERNAME = process.env.MQTT_USERNAME || 'cmsadmin';
const PASSWORD = process.env.MQTT_PASSWORD || 'cmsadmin';
const BUZZER_TOPIC = process.env.MQTT_BUZZER_TOPIC || 'cms/buzzer';

let client = null;
let currentBuzzerStatus = null; // 0 or 1

/**
 * Initialize and get MQTT client singleton
 */
const getClient = () => {
  if (client) return client;

  try {
    client = mqtt.connect(BROKER_URL, {
      username: USERNAME,
      password: PASSWORD,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: true,
      clientId: `ticketing_server_${Math.random().toString(16).substring(2, 8)}`,
    });

    client.on('connect', () => {
      console.log(`📡 [MQTT] Connected to broker: ${BROKER_URL}`);
    });

    client.on('reconnect', () => {
      console.log('🔄 [MQTT] Reconnecting to broker...');
    });

    client.on('error', (err) => {
      console.error('❌ [MQTT] Connection error:', err.message);
    });

    client.on('offline', () => {
      console.warn('⚠️ [MQTT] Client went offline');
    });

    client.on('close', () => {
      // quiet on normal closure
    });

  } catch (error) {
    console.error('❌ [MQTT] Failed to initialize MQTT client:', error);
  }

  return client;
};

/**
 * Publish buzzer status to MQTT topic
 * @param {number} status 0 (OFF) or 1 (ON)
 * @param {boolean} force Force publish even if status hasn't changed
 * @returns {Promise<boolean>}
 */
const publishBuzzerStatus = (status, force = false) => {
  return new Promise((resolve) => {
    const numericStatus = Number(status) ? 1 : 0;

    // Skip if status hasn't changed and not forced
    if (!force && currentBuzzerStatus === numericStatus) {
      return resolve(true);
    }

    const mqttClient = getClient();
    if (!mqttClient || !mqttClient.connected) {
      console.warn(`⚠️ [MQTT] Cannot publish BSTS:${numericStatus} - client not connected`);
      return resolve(false);
    }

    const payload = JSON.stringify({ BSTS: numericStatus });

    mqttClient.publish(BUZZER_TOPIC, payload, { qos: 1, retain: true }, (err) => {
      if (err) {
        console.error(`❌ [MQTT] Error publishing to ${BUZZER_TOPIC}:`, err.message);
        return resolve(false);
      }
      currentBuzzerStatus = numericStatus;
      console.log(`📢 [MQTT] Published to ${BUZZER_TOPIC}: ${payload}`);
      return resolve(true);
    });
  });
};

/**
 * Turn buzzer ON via MQTT
 */
const sendBuzzOn = (force = false) => publishBuzzerStatus(1, force);

/**
 * Turn buzzer OFF via MQTT
 */
const sendBuzzOff = (force = false) => publishBuzzerStatus(0, force);

/**
 * Get current buzzer status
 */
const getCurrentStatus = () => currentBuzzerStatus;

// Initialize connection on module load
getClient();

module.exports = {
  getClient,
  publishBuzzerStatus,
  sendBuzzOn,
  sendBuzzOff,
  getCurrentStatus,
  BUZZER_TOPIC,
};
