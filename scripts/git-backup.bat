@echo off
cd /d D:\Projekt2027\Q7_Entwicklung\a_Q7-code
git add -A
git diff --cached --quiet
if %errorlevel%==0 (
    echo %date% %time% - Keine Aenderungen - kein Commit noetig. >> scripts\git-backup-log.txt
) else (
    git commit -m "Automatisches Backup %date% %time%" >> scripts\git-backup-log.txt
)
