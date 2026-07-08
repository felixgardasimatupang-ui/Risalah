#!/bin/bash
set -e

echo "Installing opencode CLI..."
npm install -g opencode-ai@latest

echo "Adding npm global bin to PATH..."
echo 'export PATH=$(npm root -g)/.bin:$PATH' >> ~/.bashrc
echo 'export PATH=$(npm root -g)/.bin:$PATH' >> ~/.zshrc

echo "Starting 9router..."
npx -y 9router &

echo "Done! opencode CLI is ready."
