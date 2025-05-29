#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Publishing create-titan package...${NC}"

# Navigate to the package directory
cd packages/create-titan

# Manually update the version in package.json
# This avoids using the version script which seems problematic
echo -e "${GREEN}Incrementing version in package.json...${NC}"
# You've already incremented the version in the file directly, so no command needed here

# Build the package
echo -e "${GREEN}Building package...${NC}"
bun run build

# Publish to npm
echo -e "${GREEN}Publishing to npm...${NC}"
bun publish --no-git-checks

# Navigate back
cd ../..

echo -e "${GREEN}Done! Package published successfully!${NC}" 