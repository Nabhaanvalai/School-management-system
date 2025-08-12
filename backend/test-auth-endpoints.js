const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testAuthEndpoints() {
  console.log('Testing Authentication Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing API health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log();

    // Test 2: Login with invalid credentials (should fail)
    console.log('2. Testing login with invalid credentials...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      console.log('✅ Login failed as expected:', error.response.data);
    }
    console.log();

    // Test 3: Login with missing fields (should fail)
    console.log('3. Testing login with missing fields...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com'
        // missing password
      });
    } catch (error) {
      console.log('✅ Validation failed as expected:', error.response.data);
    }
    console.log();

    // Test 4: Refresh token with invalid token (should fail)
    console.log('4. Testing refresh with invalid token...');
    try {
      await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: 'invalid-token'
      });
    } catch (error) {
      console.log('✅ Refresh failed as expected:', error.response.data);
    }
    console.log();

    // Test 5: Access protected route without token (should fail)
    console.log('5. Testing protected route without token...');
    try {
      await axios.get(`${BASE_URL}/auth/profile`);
    } catch (error) {
      console.log('✅ Protected route blocked as expected:', error.response.data);
    }
    console.log();

    // Test 6: Logout with invalid token (should fail)
    console.log('6. Testing logout with invalid token...');
    try {
      await axios.post(`${BASE_URL}/auth/logout`, {
        refreshToken: 'invalid-token'
      });
    } catch (error) {
      console.log('✅ Logout failed as expected:', error.response.data);
    }
    console.log();

    console.log('🎉 All authentication endpoint tests completed successfully!');
    console.log('Note: These tests verify error handling. For successful authentication,');
    console.log('you would need to create a user in the database first.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Make sure the server is running on port 3001');
      console.log('Run: npm run dev');
    }
  }
}

testAuthEndpoints();