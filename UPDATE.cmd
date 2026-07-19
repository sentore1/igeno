@echo off
echo Updating Supabase packages...
echo.

echo Step 1: Uninstalling deprecated package...
call npm uninstall @supabase/auth-helpers-nextjs

echo.
echo Step 2: Installing new SSR package...
call npm install @supabase/ssr

echo.
echo Step 3: Cleaning Next.js cache...
if exist .next rmdir /s /q .next

echo.
echo ================================================
echo Migration Complete!
echo ================================================
echo.
echo Next steps:
echo 1. Clear your browser storage (F12 -^> Application -^> Clear site data)
echo 2. Run: npm run dev
echo 3. See SUPABASE_MIGRATION.md for usage examples
echo.
pause
