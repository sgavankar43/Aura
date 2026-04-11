#!/bin/bash
# =============================================================================
# Security Audit Script
# Automated security scanning:
# 1. npm audit — dependency vulnerability scan
# 2. Semgrep — SAST (Static Application Security Testing)
# 3. Gitleaks — secrets detection
# 4. Custom checks — hardcoded credentials, eval usage
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

WARNINGS=0
ERRORS=0

echo "🔒 Running security audit..."
echo "=============================="

# Create reports directory
mkdir -p reports/security

# --- Check 1: npm audit ---
echo ""
echo "📦 Scanning dependencies for known vulnerabilities..."
if npm audit --audit-level=high --json > reports/security/npm-audit.json 2>/dev/null; then
  echo -e "${GREEN}✅ No high/critical vulnerabilities in dependencies${NC}"
else
  echo -e "${YELLOW}⚠️  Dependency vulnerabilities found — see reports/security/npm-audit.json${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# --- Check 2: Hardcoded secrets (basic grep) ---
echo ""
echo "🔑 Scanning for hardcoded secrets..."
SECRET_PATTERNS=(
  "password\s*=\s*['\"][^'\"]*['\"]"
  "api_key\s*=\s*['\"][^'\"]*['\"]"
  "apiKey\s*=\s*['\"][^'\"]*['\"]"
  "secret\s*=\s*['\"][^'\"]*['\"]"
  "private_key\s*=\s*['\"][^'\"]*['\"]"
  "AWS_ACCESS_KEY"
  "AKIA[0-9A-Z]{16}"
)

SECRETS_FOUND=false
for pattern in "${SECRET_PATTERNS[@]}"; do
  matches=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
    -E "$pattern" Server/src/ Client/src/ 2>/dev/null | \
    grep -v "node_modules" | grep -v "__tests__" | grep -v ".test." | grep -v ".example" || true)
  if [ -n "$matches" ]; then
    SECRETS_FOUND=true
    echo -e "${RED}❌ Potential secret found:${NC}"
    echo "$matches"
  fi
done

if ! $SECRETS_FOUND; then
  echo -e "${GREEN}✅ No hardcoded secrets detected${NC}"
fi

# --- Check 3: Dangerous function usage ---
echo ""
echo "⚡ Scanning for dangerous patterns..."

# Check for eval()
EVAL_USAGE=$(grep -rn "eval(" Server/src/ Client/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v __tests__ || true)
if [ -n "$EVAL_USAGE" ]; then
  echo -e "${RED}❌ eval() usage detected (code injection risk):${NC}"
  echo "$EVAL_USAGE"
  ERRORS=$((ERRORS + 1))
fi

# Check for Function constructor
FUNC_CONSTRUCTOR=$(grep -rn "new Function(" Server/src/ Client/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v __tests__ || true)
if [ -n "$FUNC_CONSTRUCTOR" ]; then
  echo -e "${RED}❌ Function constructor usage detected:${NC}"
  echo "$FUNC_CONSTRUCTOR"
  ERRORS=$((ERRORS + 1))
fi

# Check for unsafe innerHTML
INNER_HTML=$(grep -rn "innerHTML" Server/src/ Client/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v __tests__ || true)
if [ -n "$INNER_HTML" ]; then
  echo -e "${YELLOW}⚠️  innerHTML usage detected (XSS risk — use textContent or sanitize):${NC}"
  echo "$INNER_HTML"
  WARNINGS=$((WARNINGS + 1))
fi

if [ $ERRORS -eq 0 ] && [ -z "$EVAL_USAGE" ] && [ -z "$FUNC_CONSTRUCTOR" ]; then
  echo -e "${GREEN}✅ No dangerous patterns detected${NC}"
fi

# --- Check 4: Semgrep (if installed) ---
echo ""
if command -v semgrep &> /dev/null; then
  echo "🔍 Running Semgrep SAST scan..."
  if semgrep --config .semgrepconfig.yml Server/src/ --json > reports/security/semgrep.json 2>/dev/null; then
    echo -e "${GREEN}✅ Semgrep scan passed${NC}"
  else
    echo -e "${YELLOW}⚠️  Semgrep findings — see reports/security/semgrep.json${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${YELLOW}⚠️  Semgrep not installed — skipping SAST scan${NC}"
  echo "  Install: pip install semgrep"
fi

# --- Check 5: Gitleaks (if installed) ---
echo ""
if command -v gitleaks &> /dev/null; then
  echo "🕵️  Running Gitleaks secrets detection..."
  if gitleaks detect --config .gitleaks.toml --report-path reports/security/gitleaks.json 2>/dev/null; then
    echo -e "${GREEN}✅ No secrets detected by Gitleaks${NC}"
  else
    echo -e "${RED}❌ Secrets detected — see reports/security/gitleaks.json${NC}"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "${YELLOW}⚠️  Gitleaks not installed — skipping secrets scan${NC}"
  echo "  Install: brew install gitleaks"
fi

# --- Summary ---
echo ""
echo "=============================="
echo "📊 Security Audit Summary:"
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ Security audit FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Security audit PASSED${NC}"
fi
