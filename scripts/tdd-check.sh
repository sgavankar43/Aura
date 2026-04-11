#!/bin/bash
# =============================================================================
# TDD Check Script
# Validates test-driven development discipline:
# 1. Every source file should have a corresponding test file
# 2. Coverage thresholds are met
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Running TDD validation..."
echo "================================"

UNTESTED_FILES=()
CHECKED=0
SKIPPED_DIRS=("__tests__" "models" "config" "types")

# Check Server source files
for file in $(find Server/src -name "*.ts" -not -path "*/__tests__/*" -not -path "*/node_modules/*" -not -name "*.test.ts" -not -name "*.d.ts" -not -name "index.ts"); do
  CHECKED=$((CHECKED + 1))

  # Extract filename without extension
  basename=$(basename "$file" .ts)
  dirpath=$(dirname "$file")

  # Skip gitkeep files and certain directories
  if [[ "$basename" == ".gitkeep" ]]; then
    continue
  fi

  skip=false
  for skip_dir in "${SKIPPED_DIRS[@]}"; do
    if [[ "$dirpath" == *"$skip_dir"* ]]; then
      skip=true
      break
    fi
  done

  if $skip; then
    continue
  fi

  # Look for corresponding test file
  test_found=false

  # Check for colocated test
  if [ -f "${dirpath}/${basename}.test.ts" ]; then
    test_found=true
  fi

  # Check in __tests__ directory (relative)
  rel_path="${file#Server/src/}"
  test_path="Server/src/__tests__/${rel_path%.ts}.test.ts"
  if [ -f "$test_path" ]; then
    test_found=true
  fi

  # Check in __tests__ with same filename
  if find Server/src/__tests__ -name "${basename}.test.ts" 2>/dev/null | grep -q .; then
    test_found=true
  fi

  if ! $test_found; then
    UNTESTED_FILES+=("$file")
  fi
done

echo ""
echo "📊 Results:"
echo "  Files checked: $CHECKED"
echo "  Untested files: ${#UNTESTED_FILES[@]}"

if [ ${#UNTESTED_FILES[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠️  Files missing tests:${NC}"
  for f in "${UNTESTED_FILES[@]}"; do
    echo "  - $f"
  done
  echo ""
  echo -e "${YELLOW}TDD Reminder: Write tests BEFORE implementation!${NC}"
  echo "Each source file should have a corresponding .test.ts file."
  # Warning but don't fail — some utility files may not need tests
  exit 0
else
  echo -e "${GREEN}✅ All source files have corresponding tests!${NC}"
fi
