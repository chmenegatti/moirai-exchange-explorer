#!/bin/bash

echo "======================================"
echo "ETCD Flowchart API - Quick Start"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created. Please review and update if needed."
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed successfully"
echo ""

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p json output logs

echo "✓ Directories created"
echo ""

echo "======================================"
echo "Setup Complete! 🎉"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the API server:"
echo "   npm start"
echo ""
echo "2. Or run in development mode:"
echo "   npm run dev"
echo ""
echo "3. Use the CLI to extract ETCD data:"
echo "   npm run cli -- -g"
echo ""
echo "4. Generate a flowchart:"
echo "   npm run cli -- -e moirai.topic.vpn.delete -o resultado"
echo ""
echo "5. Test the API:"
echo "   curl -X POST http://localhost:3000/api/flowchart \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"exchange\": \"moirai.topic.vpn.delete\"}'"
echo ""
echo "Documentation: See README.md for full usage guide"
echo ""
