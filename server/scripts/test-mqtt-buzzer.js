require('dotenv').config();
const mqtt = require('mqtt');
const { sendBuzzOn, sendBuzzOff, BUZZER_TOPIC } = require('../lib/mqttClient');

async function testMqttBuzzer() {
  console.log('🧪 Starting MQTT Buzzer Integration Test...\n');
  console.log(`Topic: ${BUZZER_TOPIC}`);
  console.log(`Broker: ${process.env.MQTT_BROKER_URL || 'mqtt://mqtt.macsoftautomations.in'}`);

  // Create an independent test subscriber to verify messages on the broker
  const subscriber = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://mqtt.macsoftautomations.in', {
    username: process.env.MQTT_USERNAME || 'cmsadmin',
    password: process.env.MQTT_PASSWORD || 'cmsadmin',
    clientId: `test_subscriber_${Date.now()}`
  });

  const receivedMessages = [];

  await new Promise((resolve, reject) => {
    subscriber.on('connect', () => {
      console.log('✅ Test subscriber connected');
      subscriber.subscribe(BUZZER_TOPIC, { qos: 1 }, (err) => {
        if (err) return reject(err);
        console.log(`✅ Subscribed to topic: ${BUZZER_TOPIC}`);
        resolve();
      });
    });

    subscriber.on('message', (topic, message) => {
      const payloadStr = message.toString();
      console.log(`📥 Test subscriber received on [${topic}]: ${payloadStr}`);
      receivedMessages.push(payloadStr);
    });

    subscriber.on('error', (err) => {
      console.error('❌ Subscriber error:', err.message);
    });
  });

  // Test 1: Send Buzz ON (force = true)
  console.log('\n--- Test 1: Sending Buzz ON {"BSTS": 1} ---');
  await sendBuzzOn(true);
  await new Promise((r) => setTimeout(r, 1000));

  // Test 2: Send Buzz OFF (force = true)
  console.log('\n--- Test 2: Sending Buzz OFF {"BSTS": 0} ---');
  await sendBuzzOff(true);
  await new Promise((r) => setTimeout(r, 1000));

  subscriber.end();

  console.log('\n=== Test Summary ===');
  console.log(`Total messages received: ${receivedMessages.length}`);
  const hasOn = receivedMessages.some(m => m.includes('"BSTS":1') || m.includes('"BSTS": 1'));
  const hasOff = receivedMessages.some(m => m.includes('"BSTS":0') || m.includes('"BSTS": 0'));

  if (hasOn && hasOff) {
    console.log('🎉 SUCCESS! Both {"BSTS": 1} and {"BSTS": 0} were published and received.');
  } else {
    console.log('⚠️ Some messages were not received:', receivedMessages);
  }

  process.exit(0);
}

testMqttBuzzer().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
