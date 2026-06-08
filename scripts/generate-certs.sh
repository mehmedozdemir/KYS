#!/usr/bin/env bash
# Generates a self-signed TLS certificate for local/dev HTTPS testing.
# For production: replace with a real cert from Let's Encrypt or your CA.

set -euo pipefail

OUT_DIR="${1:-./docker/certs}"
DOMAIN="${2:-localhost}"

mkdir -p "$OUT_DIR"

openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes \
  -keyout "$OUT_DIR/key.pem" \
  -out    "$OUT_DIR/cert.pem" \
  -subj "/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,IP:127.0.0.1"

echo "Certificate generated:"
echo "  cert: $OUT_DIR/cert.pem"
echo "  key:  $OUT_DIR/key.pem"
echo ""
echo "For production, set in .env:"
echo "  SSL_CERT_PATH=$(realpath "$OUT_DIR/cert.pem")"
echo "  SSL_KEY_PATH=$(realpath "$OUT_DIR/key.pem")"
