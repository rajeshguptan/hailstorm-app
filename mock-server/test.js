const http = require('http');

function makeRequest(url, method = 'GET', data = null, customHeaders = {}) {
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
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', (error) => reject(error));

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

const testEndpoints = async () => {
  const baseUrl = 'http://localhost:4010';

  console.log('Testing mock server endpoints...\n');

  // Test 1: Health check
  try {
    const healthResponse = await makeRequest(`${baseUrl}/health`);
    console.log('✅ GET /health:', healthResponse.status);
  } catch (error) {
    console.log('❌ GET /health failed:', error.message);
  }

  // Test 2: Root endpoint
  try {
    const rootResponse = await makeRequest(`${baseUrl}/`);
    console.log('✅ GET /:', rootResponse.status);
  } catch (error) {
    console.log('❌ GET / failed:', error.message);
  }

  // Test 3: HTTP echo
  try {
    const httpResponse = await makeRequest(`${baseUrl}/http/test`);
    console.log('✅ GET /http/test:', httpResponse.status);
  } catch (error) {
    console.log('❌ GET /http/test failed:', error.message);
  }

  // Test 4: Status endpoint
  try {
    const statusResponse = await makeRequest(`${baseUrl}/http/status/201`);
    console.log('✅ GET /http/status/201:', statusResponse.status);
  } catch (error) {
    console.log('❌ GET /http/status/201 failed:', error.message);
  }

  // Test 5: Delay endpoint
  try {
    const delayResponse = await makeRequest(`${baseUrl}/http/delay/100`);
    console.log('✅ GET /http/delay/100:', delayResponse.status);
  } catch (error) {
    console.log('❌ GET /http/delay/100 failed:', error.message);
  }

  // Test 6: Error endpoint
  try {
    const errorResponse = await makeRequest(`${baseUrl}/http/error`);
    console.log('✅ GET /http/error (expects 500):', errorResponse.status);
  } catch (error) {
    console.log('❌ GET /http/error failed:', error.message);
  }

  // Test 7: Basic Auth
  try {
    const basicAuthResponse = await makeRequest(`${baseUrl}/http/auth/basic`, 'GET', null, {
      'Authorization': 'Basic ' + Buffer.from('hailstorm:mock').toString('base64')
    });
    console.log('✅ GET /http/auth/basic (with auth):', basicAuthResponse.status);
  } catch (error) {
    console.log('❌ GET /http/auth/basic failed:', error.message);
  }

  // Test 8: Bearer Auth
  try {
    const bearerAuthResponse = await makeRequest(`${baseUrl}/http/auth/bearer`, 'GET', null, {
      'Authorization': 'Bearer hailstorm-token'
    });
    console.log('✅ GET /http/auth/bearer (with token):', bearerAuthResponse.status);
  } catch (error) {
    console.log('❌ GET /http/auth/bearer failed:', error.message);
  }

  // Test 9: GraphQL
  try {
    const graphqlResponse = await makeRequest(`${baseUrl}/graphql`, 'POST', {
      query: '{ users { id name } }'
    });
    console.log('✅ POST /graphql:', graphqlResponse.status);
  } catch (error) {
    console.log('❌ POST /graphql failed:', error.message);
  }

  // Test 10: JSON-RPC
  try {
    const rpcResponse = await makeRequest(`${baseUrl}/json-rpc`, 'POST', {
      jsonrpc: '2.0',
      method: 'echo',
      params: { test: true },
      id: 1
    });
    console.log('✅ POST /json-rpc:', rpcResponse.status);
  } catch (error) {
    console.log('❌ POST /json-rpc failed:', error.message);
  }

  // Test 11: OAuth
  try {
    const oauthResponse = await makeRequest(`${baseUrl}/oauth/token`, 'POST', {
      grant_type: 'client_credentials'
    });
    console.log('✅ POST /oauth/token:', oauthResponse.status);
  } catch (error) {
    console.log('❌ POST /oauth/token failed:', error.message);
  }

  // Test 12: Users endpoints
  try {
    const usersResponse = await makeRequest(`${baseUrl}/users`);
    console.log('✅ GET /users:', usersResponse.status);
  } catch (error) {
    console.log('❌ GET /users failed:', error.message);
  }

  // Test 13: Create user
  try {
    const createUserResponse = await makeRequest(`${baseUrl}/users`, 'POST', {
      name: 'Test User',
      email: 'test@example.com'
    });
    console.log('✅ POST /users:', createUserResponse.status);
  } catch (error) {
    console.log('❌ POST /users failed:', error.message);
  }

  // Test 14: Rate limiting
  console.log('\nTesting rate limiting...');

  // Set RPS for user creation to 2
  try {
    await makeRequest(`${baseUrl}/rps/user-creation`, 'POST', { rps: 2 });
    console.log('✅ POST /rps/user-creation');
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

testEndpoints().catch(console.error);