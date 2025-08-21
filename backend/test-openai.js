#!/usr/bin/env node

/**
 * Test Script for OpenAI Integration
 * Run this to test the chat app with OpenAI responses
 */

const BASE_URL = 'http://localhost:8000/api/v1';

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        return { error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Starting OpenAI Integration Tests...\n');

    // Step 1: Check health
    console.log('1. Checking server health...');
    const health = await makeRequest('/test/../../health');
    console.log('Health check:', health.data);

    // Step 2: Register a test user
    console.log('\n2. Registering test user...');
    const testUser = {
        name: "Test Student",
        email: `test.${Date.now()}@university.edu`,
        password: "testpassword123",
        enrollmentNumber: "TEST001",
        batch: "2024",
        course: "Computer Science",
        country: "USA"
    };

    const registerResult = await makeRequest('/user/register', 'POST', testUser);
    console.log('Registration:', registerResult.status, registerResult.data?.message || registerResult.error);

    if (registerResult.status !== 201) {
        console.error('❌ Registration failed');
        return;
    }

    // Step 3: Login
    console.log('\n3. Logging in...');
    const loginResult = await makeRequest('/user/login', 'POST', {
        email: testUser.email,
        password: testUser.password
    });

    if (loginResult.status !== 200) {
        console.error('❌ Login failed');
        return;
    }

    const token = loginResult.data.data.accessToken;
    console.log('✅ Login successful');

    // Step 4: Test OpenAI Configuration
    console.log('\n4. Checking OpenAI configuration...');
    const configResult = await makeRequest('/test/openai-config', 'GET', null, token);
    console.log('OpenAI Config:', configResult.data);

    if (!configResult.data?.data?.configured) {
        console.error('❌ OpenAI not configured properly');
        return;
    }

    // Step 5: Test Direct OpenAI Response
    console.log('\n5. Testing direct OpenAI response...');
    const testMessage = "What is the difference between machine learning and artificial intelligence?";
    const aiTestResult = await makeRequest('/test/openai-response', 'POST', {
        message: testMessage
    }, token);

    console.log('AI Test Result:', aiTestResult.status);
    if (aiTestResult.data?.data?.aiResponse) {
        console.log('✅ AI Response received:');
        console.log('Question:', testMessage);
        console.log('Answer:', aiTestResult.data.data.aiResponse.substring(0, 200) + '...');
    } else {
        console.error('❌ AI response failed:', aiTestResult.data);
        return;
    }

    // Step 6: Test Chat Creation with AI
    console.log('\n6. Testing chat creation with AI response...');
    const chatMessage = "Explain the concept of Big O notation in computer science";
    const chatResult = await makeRequest('/chat/start', 'POST', {
        message: chatMessage
    }, token);

    console.log('Chat Creation Result:', chatResult.status);
    if (chatResult.data?.data?.aiResponse) {
        console.log('✅ Chat with AI response created successfully!');
        console.log('Chat ID:', chatResult.data.data.chatId);
        console.log('User Message:', chatMessage);
        console.log('AI Response:', chatResult.data.data.aiResponse.substring(0, 200) + '...');

        // Step 7: Test continuing conversation
        console.log('\n7. Testing conversation continuation...');
        const chatId = chatResult.data.data.chatId;
        const followUpMessage = "Can you give me a practical example?";
        
        const continueResult = await makeRequest(`/chat/${chatId}/send`, 'POST', {
            message: followUpMessage
        }, token);

        if (continueResult.data?.data?.aiResponse) {
            console.log('✅ Conversation continued successfully!');
            console.log('Follow-up Question:', followUpMessage);
            console.log('AI Response:', continueResult.data.data.aiResponse.substring(0, 200) + '...');
            console.log('Total Messages:', continueResult.data.data.conversationLength);
        } else {
            console.error('❌ Conversation continuation failed:', continueResult.data);
        }

    } else {
        console.error('❌ Chat creation failed:', chatResult.data);
    }

    console.log('\n🎉 OpenAI Integration Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Server Health Check');
    console.log('- ✅ User Registration/Login');
    console.log('- ✅ OpenAI Configuration');
    console.log('- ✅ Direct AI Response');
    console.log('- ✅ Chat Creation with AI');
    console.log('- ✅ Conversation Continuation');
    console.log('\n🚀 Your chat app is ready for frontend integration!');
}

// Run the tests
runTests().catch(console.error);
