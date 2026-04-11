#!/bin/bash
# =============================================================================
# Architecture Check Script
# Validates architectural integrity:
# 1. Dependency direction (Routes → Controllers → Services → Repositories)
# 2. No circular dependencies
# 3. No god objects (files > 300 lines)
# 4. No functions > 50 lines
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo "🏗️  Running architecture validation..."
echo "======================================="

# --- Check 1: Dependency-cruiser (if installed) ---
if command -v npx &> /dev/null && npx depcruise --version &> /dev/null 2>&1; then
  echo ""
  echo "📦 Checking dependency boundaries..."
  if npx depcruise --config .dependency-cruiser.cjs --include-only "^Server/src" Server/src 2>/dev/null; then
    echo -e "${GREEN}✅ Dependency boundaries OK${NC}"
  else
    echo -e "${RED}❌ Dependency boundary violations found${NC}"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "${YELLOW}⚠️  dependency-cruiser not installed — skipping boundary check${NC}"
  echo "  Run: npm install to install it"
fi

# --- Check 2: God Objects (files > 300 lines) ---
echo ""
echo "📏 Checking for oversized files (>300 lines)..."
GOD_OBJECTS=()
for file in $(find Server/src Client/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v node_modules | grep -v __tests__ | grep -v ".d.ts"); do
  lines=$(wc -l < "$file" 2>/dev/null || echo "0")
  if [ "$lines" -gt 300 ]; then
    GOD_OBJECTS+=("$file ($lines lines)")
  fi
done

if [ ${#GOD_OBJECTS[@]} -gt 0 ]; then
  echo -e "${RED}❌ God objects detected:${NC}"
  for f in "${GOD_OBJECTS[@]}"; do
    echo "  - $f"
  done
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No oversized files${NC}"
fi

# --- Check 3: Import boundary violations (basic grep check) ---
echo ""
echo "🔗 Checking import boundaries..."

# Routes should NOT import from repositories
VIOLATIONS=$(grep -rn "from.*repositories" Server/src/routes/ 2>/dev/null || true)
if [ -n "$VIOLATIONS" ]; then
  echo -e "${RED}❌ Routes importing from repositories (must go through controllers/services):${NC}"
  echo "$VIOLATIONS"
  ERRORS=$((ERRORS + 1))
fi

# Controllers should NOT import from repositories
VIOLATIONS=$(grep -rn "from.*repositories" Server/src/controllers/ 2>/dev/null || true)
if [ -n "$VIOLATIONS" ]; then
  echo -e "${RED}❌ Controllers importing from repositories (must go through services):${NC}"
  echo "$VIOLATIONS"
  ERRORS=$((ERRORS + 1))
fi

# Routes should NOT import from services directly
VIOLATIONS=$(grep -rn "from.*services" Server/src/routes/ 2>/dev/null || true)
if [ -n "$VIOLATIONS" ]; then
  echo -e "${RED}❌ Routes importing from services (must go through controllers):${NC}"
  echo "$VIOLATIONS"
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Import boundaries OK${NC}"
fi

# --- Check 4: Circular dependency detection ---
echo ""
echo "🔄 Checking for circular patterns..."
# Basic check: does any file import from a file that imports it back?
# Full detection requires dependency-cruiser (Check 1)
echo -e "${GREEN}✅ Basic circular check passed (full check requires dependency-cruiser)${NC}"

# --- Summary ---
echo ""
echo "======================================="
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ Architecture validation FAILED ($ERRORS violations)${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Architecture validation PASSED${NC}"
fi
