
#!/usr/bin/env sh
set -e

echo "==> Environment check"

# -------------------------
# Node.js
# -------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed."
  echo "Install from: https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v)
echo "Node detected: $NODE_VERSION"

# -------------------------
# pnpm
# -------------------------
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Installing pnpm globally..."
  corepack enable
  corepack prepare pnpm@latest --activate
fi

echo "pnpm detected: $(pnpm -v)"

# -------------------------
# Install deps
# -------------------------
echo "==> Installing dependencies"
pnpm install

# -------------------------
# Prisma
# -------------------------
if [ ! -d "src/generated/prisma" ]; then
  echo "==> Generating Prisma client"
  pnpm prisma generate
fi

echo "==> Running migrations"
pnpm prisma migrate dev

echo "==> Setup complete"
echo "Run: pnpm dev"
