#!/bin/bash

# Quick API Test Script for Restaurant POS Backend
# Usage: ./quick-test.sh YOUR_RAILWAY_BACKEND_URL

if [ -z "$1" ]; then
    echo "❌ Please provide your Railway backend URL"
    echo "Usage: ./quick-test.sh https://your-app-name.railway.app"
    exit 1
fi

BASE_URL="$1"
echo "🚀 Testing Restaurant POS Backend API"
echo "📍 Base URL: $BASE_URL"
echo "=========================================="

# Test 1: Health Check
echo -e "\n🏥 Testing Health Check..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HEALTH_CODE" = "200" ]; then
    echo "✅ Health Check: PASS"
    echo "   Response: $HEALTH_BODY"
else
    echo "❌ Health Check: FAIL (HTTP $HEALTH_CODE)"
    echo "   Response: $HEALTH_BODY"
fi

# Test 2: Admin Login
echo -e "\n🔐 Testing Admin Login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/user/login" \
    -H "Content-Type: application/json" \
    -d '{"phone":"0908578100","password":"01090109"}')

LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$LOGIN_CODE" = "200" ]; then
    echo "✅ Admin Login: PASS"
    # Extract token (assuming response has a token field)
    TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo "   Token received: ${TOKEN:0:20}..."
        
        # Test 3: Protected Endpoint
        echo -e "\n🛡️ Testing Protected Endpoint..."
        PROTECTED_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/user/profile" \
            -H "Authorization: Bearer $TOKEN")
        
        PROTECTED_CODE=$(echo "$PROTECTED_RESPONSE" | tail -n1)
        PROTECTED_BODY=$(echo "$PROTECTED_RESPONSE" | head -n -1)
        
        if [ "$PROTECTED_CODE" = "200" ]; then
            echo "✅ Protected Endpoint: PASS"
        else
            echo "❌ Protected Endpoint: FAIL (HTTP $PROTECTED_CODE)"
            echo "   Response: $PROTECTED_BODY"
        fi
        
        # Test 4: Get Categories
        echo -e "\n📂 Testing Get Categories..."
        CATEGORIES_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/category" \
            -H "Authorization: Bearer $TOKEN")
        
        CATEGORIES_CODE=$(echo "$CATEGORIES_RESPONSE" | tail -n1)
        CATEGORIES_BODY=$(echo "$CATEGORIES_RESPONSE" | head -n -1)
        
        if [ "$CATEGORIES_CODE" = "200" ]; then
            echo "✅ Get Categories: PASS"
        else
            echo "❌ Get Categories: FAIL (HTTP $CATEGORIES_CODE)"
            echo "   Response: $CATEGORIES_BODY"
        fi
        
        # Test 5: Get Dishes
        echo -e "\n🍽️ Testing Get Dishes..."
        DISHES_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/dish" \
            -H "Authorization: Bearer $TOKEN")
        
        DISHES_CODE=$(echo "$DISHES_RESPONSE" | tail -n1)
        DISHES_BODY=$(echo "$DISHES_RESPONSE" | head -n -1)
        
        if [ "$DISHES_CODE" = "200" ]; then
            echo "✅ Get Dishes: PASS"
        else
            echo "❌ Get Dishes: FAIL (HTTP $DISHES_CODE)"
            echo "   Response: $DISHES_BODY"
        fi
        
        # Test 6: Get Tables
        echo -e "\n🪑 Testing Get Tables..."
        TABLES_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/table" \
            -H "Authorization: Bearer $TOKEN")
        
        TABLES_CODE=$(echo "$TABLES_RESPONSE" | tail -n1)
        TABLES_BODY=$(echo "$TABLES_RESPONSE" | head -n -1)
        
        if [ "$TABLES_CODE" = "200" ]; then
            echo "✅ Get Tables: PASS"
        else
            echo "❌ Get Tables: FAIL (HTTP $TABLES_CODE)"
            echo "   Response: $TABLES_BODY"
        fi
        
        # Test 7: Get Orders
        echo -e "\n📋 Testing Get Orders..."
        ORDERS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/order" \
            -H "Authorization: Bearer $TOKEN")
        
        ORDERS_CODE=$(echo "$ORDERS_RESPONSE" | tail -n1)
        ORDERS_BODY=$(echo "$ORDERS_RESPONSE" | head -n -1)
        
        if [ "$ORDERS_CODE" = "200" ]; then
            echo "✅ Get Orders: PASS"
        else
            echo "❌ Get Orders: FAIL (HTTP $ORDERS_CODE)"
            echo "   Response: $ORDERS_BODY"
        fi
        
    else
        echo "❌ No token received from login"
    fi
else
    echo "❌ Admin Login: FAIL (HTTP $LOGIN_CODE)"
    echo "   Response: $LOGIN_BODY"
fi

echo -e "\n=========================================="
echo "🎉 Quick API Test Complete!"
echo "For detailed testing, run: node api-test.js"
