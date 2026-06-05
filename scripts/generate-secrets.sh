#!/bin/bash
# Generates AES-256-CBC key and IV for development
# Usage: source ./scripts/generate-secrets.sh

KEY=$(openssl rand -base64 32)
IV=$(openssl rand -base64 16)

echo "Encryption__Key=$KEY"
echo "Encryption__IV=$IV"
echo ""
echo "Add these to your .env file or environment variables."
echo "NEVER commit these values to source control."
