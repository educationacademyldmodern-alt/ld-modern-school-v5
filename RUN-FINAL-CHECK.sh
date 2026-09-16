#!/usr/bin/env bash
set -e
python3 APPLY-V1142-FINAL.py
node --check public-final.js
node --check website-control.js
node --check dashboard-final.js
git diff --check
echo
echo "=== FINAL STATUS ==="
git status --short
echo
echo "Do NOT push yet. First run SQL in Supabase and test Preview."
