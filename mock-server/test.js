const http = require('http');

// Simple test script to verify mock server endpoints
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3001';

  console.log('Testing mock server endpoints...\n');

  // Test 1: Health check
  try {
    const healthResponse = await makeRequest(`${baseUrl}/health`);
    console.log('✅ GET /health:', healthResponse.status);
  } catch (error) {
    console.log('❌ GET /health failed:', error.message);
  }

  // Test 2: Get users
  try {
    const usersResponse = await makeRequest(`${baseUrl}/users`);
    console.log('✅ GET /users:', usersResponse.status);
    const users = JSON.parse(usersResponse.data);
    console.log(`   Found ${users.length} users`);
  } catch (error) {
    console.log('❌ GET /users failed:', error.message);
  }

  // Test 3: Create user
  try {
    const createUserResponse = await makeRequest(`${baseUrl}/users`, 'POST', {
      name: 'Test User',
      email: 'test@example.com'
    });
    console.log('✅ POST /users:', createUserResponse.status);
    const newUser = JSON.parse(createUserResponse.data);
    console.log(`   Created user: ${newUser.name} (${newUser.email})`);
  } catch (error) {
    console.log('❌ POST /users failed:', error.message);
  }

  // Test 4: Rate limiting
  console.log('\nTesting rate limiting...');

  // Set RPS for user creation to 2
  try {
    const setRpsResponse = await makeRequest(`${baseUrl}/rps/user-creation`, 'POST', { rps: 2 });
    console.log('✅ POST /rps/user-creation:', setRpsResponse.status);
  } catch (error) {
    console.log('❌ POST /rps/user-creation failed:', error.message);
  }

  // Make requests with rate limiting
  const rateLimitPromises = [];
  for (let i = 0; i < 5; i++) {
    rateLimitPromises.push(
      makeRequest(`${baseUrl}/users`, 'POST', {
        name: `Rate Test User ${i}`,
        email: `rate${i}@example.com`
      }, {
        'X-Request-ID': 'user-creation',
        'X-RPS': '2'
      })
    );
  }

  const rateLimitResults = await Promise.allSettled(rateLimitPromises);
  let successCount = 0;
  let rateLimitedCount = 0;

  rateLimitResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const response = JSON.parse(result.value.data);
      if (result.value.status === 201) {
        successCount++;
        console.log(`✅ Request ${index + 1}: SUCCESS`);
      } else if (result.value.status === 429) {
        rateLimitedCount++;
        console.log(`⏱️  Request ${index + 1}: RATE LIMITED`);
      }
    } else {
      console.log(`❌ Request ${index + 1}: ERROR - ${result.reason.message}`);
    }
  });

  console.log(`\nRate limiting results: ${successCount} allowed, ${rateLimitedCount} rate limited`);

  console.log('\nTest completed!');
};

const makeRequest = (url, method = 'GET', data = null, customHeaders = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

// Run tests
testEndpoints().catch(console.error);