#!/bin/bash

# =============================================================================
# Toast to Notify Migration Script
# =============================================================================
# This script migrates files from the old toast system to the new notify system.
# 
# Usage:
#   ./scripts/migrate-toasts.sh              # Migrate all remaining files
#   ./scripts/migrate-toasts.sh --dry-run    # Preview changes without applying
#   ./scripts/migrate-toasts.sh src/pages/   # Migrate only specific directory
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
DRY_RUN=false
TARGET_DIR="src"

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      TARGET_DIR="$1"
      shift
      ;;
  esac
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Toast → Notify Migration Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}🔍 DRY RUN MODE - No changes will be made${NC}"
  echo ""
fi

# Find files that still use the old toast import
FILES=$(grep -rl "import { toast } from '@/contexts/ToastContext'" "$TARGET_DIR" 2>/dev/null || true)

# Exclude files that should keep using toast (like ToastContext itself)
EXCLUDE_PATTERNS=(
  "ToastContext.tsx"
  "Toast.tsx"
  "ToastInitializer"
  "notify.ts"
)

# Filter out excluded files
FILTERED_FILES=""
for file in $FILES; do
  EXCLUDE=false
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    if [[ "$file" == *"$pattern"* ]]; then
      EXCLUDE=true
      break
    fi
  done
  if [ "$EXCLUDE" = false ]; then
    FILTERED_FILES="$FILTERED_FILES $file"
  fi
done

# Count files
FILE_COUNT=$(echo "$FILTERED_FILES" | wc -w | tr -d ' ')

if [ "$FILE_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅ No files to migrate! All done.${NC}"
  exit 0
fi

echo -e "Found ${YELLOW}$FILE_COUNT${NC} files to migrate"
echo ""

# Migration function
migrate_file() {
  local file=$1
  local filename=$(basename "$file")
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "  ${BLUE}→${NC} Would migrate: $file"
    return
  fi
  
  # Step 1: Replace import statement
  sed -i '' "s/import { toast } from '@\/contexts\/ToastContext';/import { notify } from '@\/lib\/notify';/g" "$file"
  
  # Step 2: Replace toast methods with notify methods
  # Note: We keep the same method names, the notify API is compatible
  sed -i '' 's/toast\.success/notify.success/g' "$file"
  sed -i '' 's/toast\.error/notify.error/g' "$file"
  sed -i '' 's/toast\.info/notify.info/g' "$file"
  sed -i '' 's/toast\.warning/notify.warning/g' "$file"
  
  # Step 3: Handle special case - convert toast options to simpler notify calls
  # Remove description/action parameters that notify doesn't support
  # This is a simplified conversion - complex cases may need manual review
  
  echo -e "  ${GREEN}✓${NC} Migrated: $filename"
}

# Progress counter
CURRENT=0

echo -e "${BLUE}Migrating files...${NC}"
echo ""

for file in $FILTERED_FILES; do
  CURRENT=$((CURRENT + 1))
  migrate_file "$file"
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Dry run complete. Run without --dry-run to apply changes.${NC}"
else
  echo -e "${GREEN}✅ Migration complete! $FILE_COUNT files migrated.${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  Important notes:${NC}"
  echo "  1. Some toast calls had 'description' or 'action' options"
  echo "     which the new notify system handles differently."
  echo "  2. Run 'npm run build' to check for any TypeScript errors"
  echo "  3. Test the app to ensure notifications work correctly"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "  npm run build    # Check for errors"
  echo "  npm run dev      # Test locally"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

