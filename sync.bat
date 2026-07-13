@echo off
REM BITSians' Day - manually pull latest data from the Google Sheet and rebuild data.js.
REM (The scheduled task "BITSians Day Sheet Sync" does this automatically every 2 hours.)
REM The script logs its own output to data\sync.log
"C:\Users\dilip\AppData\Local\Programs\Python\Python313\python.exe" "d:\xampp\htdocs\Bitsian_day\_build_data.py"
echo.
echo Done. See data\sync.log for details.
pause
