#!/bin/bash

# Clear Cache Script
# Use this if you encounter caching issues during development

echo "🧹 Clearing Next.js cache..."

# Kill any running dev servers
echo "📛 Stopping dev servers..."
pkill -f "next dev" 2>/dev/null || true
taskkill //F //IM node.exe 2>/dev/null || true

# Remove Next.js build cache
echo "🗑️  Removing .next directory..."
rm -rf .next

# Remove lock files if they exist
echo "🔓 Removing lock files..."
rm -f .next/dev/lock 2>/dev/null || true

# Clear node_modules/.cache if it exists
echo "🧼 Clearing node_modules cache..."
rm -rf node_modules/.cache 2>/dev/null || true

echo ""
echo "✅ Cache cleared successfully!"
echo ""
echo "To restart development server, run:"
echo "  npm run dev"
echo ""
