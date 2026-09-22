# ============================================================
# B00 - Sicherung Q7-Code und Q7-ERP
# Git-Tag + saubere ZIP-Kopie (ohne .env*) + SHA-256-Pruefsumme
# Ziel: Google-Drive-Ordner (synchronisiert automatisch in die Cloud)
# ============================================================
# WICHTIG: Dieses Skript LOESCHT NICHTS und AENDERT KEINE Dateien
# in den Repos. Es liest nur und erstellt Kopien.
# ============================================================

$datum      = Get-Date -Format "yyyy-MM-dd_HHmm"
$zielOrdner = "G:\Meine Ablage\Projekte2027"

if (-not (Test-Path -LiteralPath $zielOrdner)) {
    Write-Host "FEHLER: Zielordner nicht gefunden: $zielOrdner" -ForegroundColor Red
    Write-Host "Bitte Pfad in Zeile 11 anpassen und erneut versuchen." -ForegroundColor Red
    exit 1
}

function Sichere-Repo {
    param(
        [string]$RepoPfad,
        [string]$RepoName
    )

    Write-Host "`n=== Sicherung: $RepoName ===" -ForegroundColor Cyan

    if (-not (Test-Path -LiteralPath $RepoPfad)) {
        Write-Host "  FEHLER: Repo-Pfad nicht gefunden: $RepoPfad" -ForegroundColor Red
        return
    }

    Push-Location -LiteralPath $RepoPfad

    # ---- 1. Git-Tag setzen (markiert diesen Stand dauerhaft im Repo) ----
    $tagName = "backup-B00-$datum"
    git tag -a $tagName -m "B00 Sicherung vor Aufraeumarbeiten ($datum)"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Git-Tag gesetzt: $tagName" -ForegroundColor Green
        git push origin $tagName
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Tag zu GitHub gepusht." -ForegroundColor Green
        } else {
            Write-Host "  WARNUNG: Tag-Push zu GitHub fehlgeschlagen (Tag existiert nur lokal)." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  WARNUNG: Git-Tag konnte nicht gesetzt werden (kein Git-Repo?)." -ForegroundColor Yellow
    }

    # ---- 2. Saubere Kopie ohne sensible/unnoetige Dateien ----
    $tempOrdner = Join-Path $env:TEMP "backup_${RepoName}_$datum"
    if (Test-Path -LiteralPath $tempOrdner) { Remove-Item -LiteralPath $tempOrdner -Recurse -Force }

    Write-Host "  Erstelle saubere Kopie (ohne .env*, node_modules, .git)..." -ForegroundColor DarkGray
    robocopy $RepoPfad $tempOrdner /E `
        /XD node_modules .git dist _archiv `
        /XF ".env" ".envsuperuser" ".envalt" "envzuruck" "*.env" `
        /NFL /NDL /NJH /NJS | Out-Null

    # ---- 3. ZIP erstellen ----
    $zipName = "${RepoName}_$datum.zip"
    $zipPfad = Join-Path $zielOrdner $zipName
    Compress-Archive -Path "$tempOrdner\*" -DestinationPath $zipPfad -Force
    Write-Host "  ZIP erstellt: $zipPfad" -ForegroundColor Green

    # ---- 4. SHA-256 Pruefsumme ----
    $hash = Get-FileHash -LiteralPath $zipPfad -Algorithm SHA256
    $hashDatei = "$zipPfad.sha256.txt"
    "$($hash.Hash)  $zipName" | Out-File -LiteralPath $hashDatei -Encoding utf8
    Write-Host "  SHA-256: $($hash.Hash)" -ForegroundColor Green
    Write-Host "  Pruefsumme gespeichert: $hashDatei" -ForegroundColor Green

    # ---- Aufraeumen des Temp-Ordners ----
    Remove-Item -LiteralPath $tempOrdner -Recurse -Force

    Pop-Location
}

Sichere-Repo -RepoPfad "D:\Projekt2027\Q7_Entwicklung\a_Q7-code" -RepoName "Q7-Code"
Sichere-Repo -RepoPfad "D:\Projekt2027\ERP System"                -RepoName "Q7-ERP"

Write-Host "`n=== B00 abgeschlossen ===" -ForegroundColor Cyan
Write-Host "Pruefe in $zielOrdner, dass 2 ZIPs + 2 .sha256.txt-Dateien vorhanden sind."
Write-Host "Google Drive synchronisiert diese automatisch in die Cloud (kann kurz dauern)."
