#!/bin/bash

# Altus 4 SDK Repository Setup Script
# This script helps set up the SDK as a standalone GitHub repository

set -e

echo "🚀 Setting up Altus 4 SDK as standalone repository..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the SDK root directory."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "📁 Git repository already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

# Run linting
echo "🔍 Running linting..."
npm run lint

# Check formatting
echo "💅 Checking code formatting..."
npm run format:check

echo ""
echo "✅ Setup complete! Next steps:"
echo ""
echo "1. Create a new GitHub repository:"
echo "   https://github.com/new"
echo ""
echo "2. Add the remote origin:"
echo "   git remote add origin https://github.com/altus4/altus4-sdk-typescript.git"
echo ""
echo "3. Add and commit all files:"
echo "   git add ."
echo "   git commit -m \"feat: initial SDK release\""
echo ""
echo "4. Push to GitHub:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "5. Set up npm publishing:"
echo "   - Add NPM_TOKEN secret to GitHub repository secrets"
echo "   - Create a release on GitHub to trigger publishing"
echo ""
echo "6. Optional: Set up branch protection rules in GitHub"
echo ""
echo "🎉 Your SDK is ready for standalone development!"