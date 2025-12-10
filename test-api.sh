#!/bin/bash

# Script de teste da API ETCD Flowchart

API_URL="http://localhost:3000"

echo "======================================"
echo "Testing ETCD Flowchart API"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ Health check failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 2: Generate Flowchart (minimal)
echo -e "${YELLOW}Test 2: Generate Flowchart (minimal request)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/flowchart" \
  -H "Content-Type: application/json" \
  -d '{"exchange": "moirai.topic.vpn.delete"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Flowchart generated successfully${NC}"
    echo "$body" | jq '.success, .message, .data.resultsCount, .data.files'
else
    echo -e "${RED}✗ Flowchart generation failed (HTTP $http_code)${NC}"
    echo "$body" | jq '.'
fi
echo ""

# Test 3: Generate Flowchart (with custom filename)
echo -e "${YELLOW}Test 3: Generate Flowchart (with custom filename)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/flowchart" \
  -H "Content-Type: application/json" \
  -d '{"exchange": "moirai.topic.vpn.delete", "filename": "test-flow"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Flowchart with custom filename generated${NC}"
    echo "$body" | jq '.success, .message, .data.files'
else
    echo -e "${RED}✗ Failed (HTTP $http_code)${NC}"
    echo "$body" | jq '.'
fi
echo ""

# Test 4: Validation Error (missing exchange)
echo -e "${YELLOW}Test 4: Validation Error (missing exchange)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/flowchart" \
  -H "Content-Type: application/json" \
  -d '{}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 400 ]; then
    echo -e "${GREEN}✓ Validation error correctly returned${NC}"
    echo "$body" | jq '.error, .details'
else
    echo -e "${RED}✗ Expected HTTP 400, got $http_code${NC}"
    echo "$body" | jq '.'
fi
echo ""

# Test 5: Invalid exchange name pattern
echo -e "${YELLOW}Test 5: Invalid exchange name pattern${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/flowchart" \
  -H "Content-Type: application/json" \
  -d '{"exchange": "invalid/exchange/name"}')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 400 ]; then
    echo -e "${GREEN}✓ Invalid pattern correctly rejected${NC}"
    echo "$body" | jq '.error, .details'
else
    echo -e "${RED}✗ Expected HTTP 400, got $http_code${NC}"
    echo "$body" | jq '.'
fi
echo ""

# Test 6: 404 Not Found
echo -e "${YELLOW}Test 6: 404 Not Found${NC}"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/nonexistent")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 404 ]; then
    echo -e "${GREEN}✓ 404 correctly returned${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ Expected HTTP 404, got $http_code${NC}"
fi
echo ""

echo "======================================"
echo "Tests completed"
echo "======================================"
