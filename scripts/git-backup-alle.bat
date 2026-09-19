@echo off
setlocal enabledelayedexpansion

echo ===== Q7 Gesamt-Backup gestartet: %date% %time% =====

REM ---------- 1. Q7-Code ----------
cd /d D:\Projekt2027\Q7_Entwicklung\a_Q7-code
git add -A
git diff --cached --quiet
if %errorlevel%==0 (
    echo %date% %time% - Q7-Code: Keine Aenderungen. >> scripts\git-backup-log.txt
) else (
    git commit -m "Automatisches Backup %date% %time%" >> scripts\git-backup-log.txt
)
git push origin HEAD >> scripts\git-backup-log.txt 2>&1

REM ---------- 2. Q7-ERP ----------
cd /d "D:\Projekt2027\ERP System"
if not exist ".git" (
    echo %date% %time% - Kein Git-Repo gefunden, initialisiere neu. >> git-backup-log.txt
    git init
    (
        echo node_modules/
        echo .env
        echo .env.local
        echo dist/
        echo *.log
        echo git-backup-log.txt
    ) > .gitignore
    git add -A
    git commit -m "Erster Commit - Repo initialisiert"
) else (
    git add -A
    git diff --cached --quiet
    if !errorlevel!==0 (
        echo %date% %time% - ERP: Keine Aenderungen. >> git-backup-log.txt
    ) else (
        git commit -m "Automatisches Backup %date% %time%" >> git-backup-log.txt
    )
)
REM Kein Push fuer ERP - bleibt lokal-only (Entscheidung 19.09.2026)

REM ---------- 3. Q7-Doku ----------
cd /d D:\Projekt2027\Q7_Entwicklung\b_Q7-doku
if not exist ".git" (
    echo %date% %time% - Kein Git-Repo gefunden, initialisiere neu. >> git-backup-log.txt
    git init
    (
        echo git-backup-log.txt
    ) > .gitignore
    git add -A
    git commit -m "Erster Commit - Doku-Repo initialisiert"
) else (
    git add -A
    git diff --cached --quiet
    if !errorlevel!==0 (
        echo %date% %time% - Doku: Keine Aenderungen. >> git-backup-log.txt
    ) else (
        git commit -m "Automatisches Backup %date% %time%" >> git-backup-log.txt
    )
)
git push origin HEAD >> git-backup-log.txt 2>&1

echo ===== Q7 Gesamt-Backup fertig: %date% %time% =====
