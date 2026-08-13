@echo off
REM Q7 -- startet den Gmail-Kanal-Adapter
REM Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\run-poll-gmail.bat

cd /d D:\Projekt2027\Q7_Entwicklung\a_Q7-code
"C:\Program Files\nodejs\node.exe" -r dotenv/config scripts\poll-gmail.js >> scripts\poll-log.txt 2>&1
