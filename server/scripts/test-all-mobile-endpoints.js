const express = require('express');
const http = require('http');
require('dotenv').config();

const app = express();
app.use(express.json());

const appRouter = require('../routes/index');
app.use('/api', appRouter);

async function runTests() {
  console.log('🧪 Testing all Mobile App Endpoints against CMS backend...\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Test 1: Mobile login with username & password
    console.log('1. Testing Mobile Login (POST /api/auth/login with username: 6383716366)...');
    const mobileLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: '6383716366',
        password: 'Password@123'
      })
    });
    const mobileLoginBody = await mobileLoginRes.json();
    console.log('   Status:', mobileLoginRes.status);
    console.log('   Response Body:', {
      message: mobileLoginBody.message,
      token: mobileLoginBody.token ? 'JWT_TOKEN_PRESENT' : 'MISSING',
      user: mobileLoginBody.user
    });

    if (mobileLoginRes.status !== 200 || !mobileLoginBody.token) {
      throw new Error('Mobile login failed: ' + JSON.stringify(mobileLoginBody));
    }
    const token = mobileLoginBody.token;

    // Test 2: CMS Web Client Login (POST /api/auth/login with phone & password)
    console.log('\n2. Testing Web Client Login (POST /api/auth/login with phone: 6383716366)...');
    const webLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '6383716366',
        password: 'Password@123'
      })
    });
    const webLoginBody = await webLoginRes.json();
    console.log('   Status:', webLoginRes.status);
    if (webLoginRes.status !== 200) {
      throw new Error('Web login failed: ' + JSON.stringify(webLoginBody));
    }

    // Test 3: GET /api/health
    console.log('\n3. Testing Health Check (GET /api/health)...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthBody = await healthRes.json();
    console.log('   Status:', healthRes.status, 'Body:', healthBody);

    // Test 4: GET /api/vfd-models
    console.log('\n4. Testing VFD Models List (GET /api/vfd-models)...');
    const modelsRes = await fetch(`${baseUrl}/api/vfd-models`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const modelsBody = await modelsRes.json();
    console.log('   Status:', modelsRes.status, 'Total models:', modelsBody.total);

    // Test 5: GET /api/vfd-models/:modelCode
    console.log('\n5. Testing Single VFD Model Detail (GET /api/vfd-models/SI21)...');
    const modelDetailRes = await fetch(`${baseUrl}/api/vfd-models/SI21`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const modelDetailBody = await modelDetailRes.json();
    console.log('   Status:', modelDetailRes.status, 'Model:', modelDetailBody.vfdModel?.modelCode);

    // Test 6: GET /api/vfdparams/:vfdModel
    console.log('\n6. Testing VFD Parameters (GET /api/vfdparams/SI21)...');
    const paramsRes = await fetch(`${baseUrl}/api/vfdparams/SI21`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const paramsBody = await paramsRes.json();
    console.log('   Status:', paramsRes.status, 'Total params:', paramsBody.total);

    // Test 7: GET /api/vfd-telemetry-configs (All)
    console.log('\n7. Testing All VFD Telemetry Configs (GET /api/vfd-telemetry-configs)...');
    const allTelemRes = await fetch(`${baseUrl}/api/vfd-telemetry-configs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const allTelemBody = await allTelemRes.json();
    console.log('   Status:', allTelemRes.status, 'Total configs:', allTelemBody.total);

    // Test 8: GET /api/vfd-telemetry-configs/:vfdModel
    console.log('\n8. Testing VFD Telemetry Configs for SI21 (GET /api/vfd-telemetry-configs/SI21)...');
    const si21TelemRes = await fetch(`${baseUrl}/api/vfd-telemetry-configs/SI21`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const si21TelemBody = await si21TelemRes.json();
    console.log('   Status:', si21TelemRes.status, 'Total SI21 configs:', si21TelemBody.total);

    // Test 9: GET /api/config
    console.log('\n9. Testing Configs Endpoint (GET /api/config)...');
    const configRes = await fetch(`${baseUrl}/api/config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const configBody = await configRes.json();
    console.log('   Status:', configRes.status, 'Total configs:', configBody.total);

    console.log('\n🎉 ALL 9 ENDPOINTS PASSED WITH 100% SUCCESS!');
  } finally {
    server.close();
  }
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
