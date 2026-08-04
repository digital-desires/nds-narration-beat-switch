@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
    python "nbs_template_editor.py"
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    py "nbs_template_editor.py"
    goto :eof
)

echo Python was not found on PATH.
echo Install Python 3 from https://www.python.org/downloads/ and try again.
pause
