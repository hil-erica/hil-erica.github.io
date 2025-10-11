@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ===== Input values =====
set "APPID=***"
set "APIKEY=***"
set "MYID=***"
set "MYROOMID=***"
set "REMOTEID=***,***"
set "BASEURL=https://hil-erica.github.io/Ninjutsu2/kagebunshin.html"

rem ===== Use PowerShell to build the full URL and return it as a single line =====
for /f "usebackq delims=" %%U in (`
  powershell -NoProfile -Command ^
    "Add-Type -AssemblyName System.Web; " ^
    "$ek=[System.Web.HttpUtility]::UrlEncode('%APIKEY%'); " ^
    "$u='%BASEURL%?appid=%APPID%&apikey='+$ek+'&myuserid=%MYID%&myroomid=%MYROOMID%&remoteuserid=%REMOTEID%&capturesize=720'; " ^
    "Write-Output $u"
`) do set "URL=%%U"

echo Final URL:

rem Use delayed expansion (echo(!URL!) so that & is not treated as a command separator
echo(!URL!

rem Launch browser if needed (always quote the entire URL to keep & safe)
rem start "" "%URL%"

:: 必要ならブラウザで開く
"C:\Program Files\Google\Chrome\Application\chrome.exe" "%URL%"  --ignore-certificate-errors

::pause
