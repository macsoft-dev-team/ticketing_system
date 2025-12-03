// Simple test to check if MotorHP API is working
// You can run this with: node test-motorhp-api.js

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001'; // Adjust port as needed

async function testMotorHPAPI() {
  console.log('Testing MotorHP API endpoints...\n');

  try {
    // Test GET all motor HPs
    console.log('1. Testing GET /motorhp');
    const response = await axios.get(`${API_BASE_URL}/motorhp`);
    console.log('✓ GET /motorhp successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('');

    // Test GET active motor HPs
    console.log('2. Testing GET /motorhp/active');
    const activeResponse = await axios.get(`${API_BASE_URL}/motorhp/active`);
    console.log('✓ GET /motorhp/active successful');
    console.log('Active Motor HPs:', JSON.stringify(activeResponse.data, null, 2));
    console.log('');

    // Test CREATE motor HP
    console.log('3. Testing POST /motorhp');
    const newMotorHP = {
      label: '100HP',
      value: 100,
      sortOrder: 1,
      active: true
    };
    const createResponse = await axios.post(`${API_BASE_URL}/motorhp`, newMotorHP);
    console.log('✓ POST /motorhp successful');
    console.log('Created Motor HP:', JSON.stringify(createResponse.data, null, 2));
    const createdId = createResponse.data.motorhp.id;
    console.log('');

    // Test UPDATE motor HP
    console.log('4. Testing PUT /motorhp/:id');
    const updateData = {
      label: '100HP (Updated)',
      value: 100,
      sortOrder: 2,
      active: true
    };
    const updateResponse = await axios.put(`${API_BASE_URL}/motorhp/${createdId}`, updateData);
    console.log('✓ PUT /motorhp/:id successful');
    console.log('Updated Motor HP:', JSON.stringify(updateResponse.data, null, 2));
    console.log('');

    // Test GET by ID
    console.log('5. Testing GET /motorhp/:id');
    const getByIdResponse = await axios.get(`${API_BASE_URL}/motorhp/${createdId}`);
    console.log('✓ GET /motorhp/:id successful');
    console.log('Motor HP by ID:', JSON.stringify(getByIdResponse.data, null, 2));
    console.log('');

    // Test DELETE motor HP (soft delete)
    console.log('6. Testing DELETE /motorhp/:id');
    const deleteResponse = await axios.delete(`${API_BASE_URL}/motorhp/${createdId}`);
    console.log('✓ DELETE /motorhp/:id successful');
    console.log('Deleted Motor HP:', JSON.stringify(deleteResponse.data, null, 2));
    console.log('');

    console.log('🎉 All MotorHP API tests passed!');

  } catch (error) {
    console.error('❌ API test failed:');
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Add some sample data for testing
async function seedSampleData() {
  console.log('Seeding sample Motor HP data...\n');
  
  const sampleData = [
    { label: '25HP', value: 25, sortOrder: 1, active: true },
    { label: '50HP', value: 50, sortOrder: 2, active: true },
    { label: '75HP', value: 75, sortOrder: 3, active: true },
    { label: '100HP', value: 100, sortOrder: 4, active: true },
    { label: '150HP', value: 150, sortOrder: 5, active: true },
  ];

  try {
    for (const data of sampleData) {
      await axios.post(`${API_BASE_URL}/motorhp`, data);
      console.log(`✓ Created ${data.label}`);
    }
    console.log('\n🌱 Sample data seeded successfully!\n');
  } catch (error) {
    console.error('❌ Failed to seed sample data:');
    console.error('Error:', error.response?.data || error.message);
  }
}

// Check if we should seed data or run tests
const command = process.argv[2];

if (command === 'seed') {
  seedSampleData();
} else {
  testMotorHPAPI();
}

// Usage examples:
// node test-motorhp-api.js         - Run API tests
// node test-motorhp-api.js seed    - Seed sample data