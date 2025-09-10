const axios = require('axios');

// Configuration
const BASE_URL = 'YOUR_RAILWAY_BACKEND_URL'; // Replace with your actual Railway URL
const ADMIN_CREDENTIALS = {
    phone: '0908578100',
    password: '01090109'
};

// Test data
const testData = {
    category: {
        name: 'Test Category',
        description: 'Test category for API testing'
    },
    dish: {
        name: 'Test Dish',
        description: 'Test dish for API testing',
        price: 150,
        category: '', // Will be set after category creation
        image: 'test-image.jpg'
    },
    table: {
        tableNumber: 'T001',
        capacity: 4,
        status: 'available'
    },
    customer: {
        name: 'Test Customer',
        phone: '1234567890',
        email: 'test@example.com'
    }
};

class APITester {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = null;
        this.testResults = [];
    }

    async makeRequest(method, endpoint, data = null, headers = {}) {
        try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return { success: true, data: response.data, status: response.status };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status || 500
            };
        }
    }

    logTest(testName, result) {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${testName}`);
        if (!result.success) {
            console.log(`   Error: ${JSON.stringify(result.error)}`);
        }
        this.testResults.push({ testName, result });
    }

    async testHealthCheck() {
        console.log('\n🏥 Testing Health Check...');
        const result = await this.makeRequest('GET', '/');
        this.logTest('Health Check', result);
        return result.success;
    }

    async testAdminLogin() {
        console.log('\n🔐 Testing Admin Login...');
        const result = await this.makeRequest('POST', '/api/user/login', ADMIN_CREDENTIALS);
        
        if (result.success && result.data.token) {
            this.token = result.data.token;
            console.log('   Token received:', this.token.substring(0, 20) + '...');
        }
        
        this.logTest('Admin Login', result);
        return result.success;
    }

    async testProtectedEndpoint() {
        console.log('\n🛡️ Testing Protected Endpoint...');
        if (!this.token) {
            console.log('❌ FAIL No token available for protected endpoint test');
            return false;
        }

        const result = await this.makeRequest('GET', '/api/user/profile', null, {
            'Authorization': `Bearer ${this.token}`
        });
        
        this.logTest('Protected Endpoint Access', result);
        return result.success;
    }

    async testCategories() {
        console.log('\n📂 Testing Categories...');
        
        // Create category
        const createResult = await this.makeRequest('POST', '/api/category', testData.category, {
            'Authorization': `Bearer ${this.token}`
        });
        this.logTest('Create Category', createResult);
        
        if (createResult.success) {
            testData.dish.category = createResult.data._id;
            
            // Get categories
            const getResult = await this.makeRequest('GET', '/api/category', null, {
                'Authorization': `Bearer ${this.token}`
            });
            this.logTest('Get Categories', getResult);
            
            return createResult.success;
        }
        
        return false;
    }

    async testDishes() {
        console.log('\n🍽️ Testing Dishes...');
        
        if (!testData.dish.category) {
            console.log('❌ FAIL No category ID available for dish test');
            return false;
        }
        
        // Create dish
        const createResult = await this.makeRequest('POST', '/api/dish', testData.dish, {
            'Authorization': `Bearer ${this.token}`
        });
        this.logTest('Create Dish', createResult);
        
        if (createResult.success) {
            // Get dishes
            const getResult = await this.makeRequest('GET', '/api/dish', null, {
                'Authorization': `Bearer ${this.token}`
            });
            this.logTest('Get Dishes', getResult);
            
            return createResult.success;
        }
        
        return false;
    }

    async testTables() {
        console.log('\n🪑 Testing Tables...');
        
        // Create table
        const createResult = await this.makeRequest('POST', '/api/table', testData.table, {
            'Authorization': `Bearer ${this.token}`
        });
        this.logTest('Create Table', createResult);
        
        if (createResult.success) {
            // Get tables
            const getResult = await this.makeRequest('GET', '/api/table', null, {
                'Authorization': `Bearer ${this.token}`
            });
            this.logTest('Get Tables', getResult);
            
            return createResult.success;
        }
        
        return false;
    }

    async testCustomers() {
        console.log('\n👥 Testing Customers...');
        
        // Create customer
        const createResult = await this.makeRequest('POST', '/api/customer', testData.customer, {
            'Authorization': `Bearer ${this.token}`
        });
        this.logTest('Create Customer', createResult);
        
        if (createResult.success) {
            // Get customers
            const getResult = await this.makeRequest('GET', '/api/customer', null, {
                'Authorization': `Bearer ${this.token}`
            });
            this.logTest('Get Customers', getResult);
            
            return createResult.success;
        }
        
        return false;
    }

    async testOrders() {
        console.log('\n📋 Testing Orders...');
        
        // Get orders (should work even if empty)
        const getResult = await this.makeRequest('GET', '/api/order', null, {
            'Authorization': `Bearer ${this.token}`
        });
        this.logTest('Get Orders', getResult);
        
        return getResult.success;
    }

    async testMembers() {
        console.log('\n👤 Testing Members...');
        
        // Get members (should work even if empty)
        const getResult = await this.makeRequest('GET', '/api/member', null, {
            'Authorization': `Bearer ${this.token}`
        });
        this.logTest('Get Members', getResult);
        
        return getResult.success;
    }

    async runAllTests() {
        console.log('🚀 Starting API Tests for Restaurant POS Backend');
        console.log(`📍 Base URL: ${this.baseURL}`);
        console.log('=' * 50);

        const tests = [
            () => this.testHealthCheck(),
            () => this.testAdminLogin(),
            () => this.testProtectedEndpoint(),
            () => this.testCategories(),
            () => this.testDishes(),
            () => this.testTables(),
            () => this.testCustomers(),
            () => this.testOrders(),
            () => this.testMembers()
        ];

        for (const test of tests) {
            try {
                await test();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
            } catch (error) {
                console.log(`❌ FAIL Test failed with error: ${error.message}`);
            }
        }

        this.printSummary();
    }

    printSummary() {
        console.log('\n' + '=' * 50);
        console.log('📊 TEST SUMMARY');
        console.log('=' * 50);
        
        const passed = this.testResults.filter(r => r.result.success).length;
        const failed = this.testResults.filter(r => !r.result.success).length;
        
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.result.success)
                .forEach(r => console.log(`   - ${r.testName}`));
        }
        
        console.log('\n🎉 API Testing Complete!');
    }
}

// Usage
async function main() {
    if (BASE_URL === 'YOUR_RAILWAY_BACKEND_URL') {
        console.log('❌ Please update BASE_URL with your actual Railway backend URL');
        console.log('Example: https://your-app-name.railway.app');
        return;
    }

    const tester = new APITester(BASE_URL);
    await tester.runAllTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = APITester;
