$path = "D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\aufgaben\[id]\AufgabeDetail.tsx"
[string[]]$raw = Get-Content -LiteralPath $path -Encoding UTF8
if ($null -eq $raw) {
    Write-Host "FEHLER: Datei nicht gefunden oder leer unter $path" -ForegroundColor Red
    exit 1
}
$lines = [System.Collections.Generic.List[string]]::new($raw)

function Insert-ResOkCheck {
    param($lines, $insertAfterIndex, $message)
    $block = @(
        ''
        "    if (!res.ok) {"
        "      alert(`"Fehler: $message`");"
        "      return;"
        "    }"
    )
    for ($i = $block.Count - 1; $i -ge 0; $i--) {
        $lines.Insert($insertAfterIndex + 1, $block[$i])
    }
}

# Reihenfolge: von unten nach oben, damit sich frueher berechnete Indizes nicht verschieben

# 9. anhangLoeschen (Zeile 265, Einzeiler -> umgebaut)
$lines[266] = '    const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}/anhaenge/${anhangId}`, { method: "DELETE" });'
Insert-ResOkCheck $lines 266 "Anhang konnte nicht geloescht werden. Bitte erneut versuchen."

# 8. teilaufgabeAnlegen (Zeile 207)
$lines[210] = $lines[210] -replace 'await fetch\(', 'const res = await fetch('
Insert-ResOkCheck $lines 214 "Teilaufgabe konnte nicht angelegt werden. Bitte erneut versuchen."

# 7. kommentarSenden (Zeile 193)
$lines[196] = $lines[196] -replace 'await fetch\(', 'const res = await fetch('
Insert-ResOkCheck $lines 200 "Kommentar konnte nicht gespeichert werden. Bitte erneut versuchen."

# 6. terminAnfordern (Zeile 174)
$lines[177] = $lines[177] -replace 'await fetch\(', 'const res = await fetch('
Insert-ResOkCheck $lines 184 "Termin konnte nicht angefragt werden. Bitte erneut versuchen."

# 5. weiterleiten (Zeile 158)
$lines[160] = $lines[160] -replace 'await fetch\(', 'const res = await fetch('
Insert-ResOkCheck $lines 167 "Aufgabe konnte nicht weitergeleitet werden. Bitte erneut versuchen."

# 4. tagsAktualisieren (Zeile 134)
$lines[134] = $lines[134] -replace 'await fetch\(', 'const res = await fetch('
Insert-ResOkCheck $lines 138 "Tags konnten nicht aktualisiert werden. Bitte erneut versuchen."

# 3. farbeAendern (Zeile 125)
$lines[125] = $lines[125] -replace 'await fetch\(', 'const res = await fetch('
Insert-ResOkCheck $lines 129 "Farbe konnte nicht geaendert werden. Bitte erneut versuchen."

# 2. prioritaetAendern (Zeile 116)
$lines[116] = $lines[116] -replace 'await fetch\(', 'const res = await fetch('
Insert-ResOkCheck $lines 120 "Prioritaet konnte nicht geaendert werden. Bitte erneut versuchen."

# 1. statusAendern (Zeile 107)
$lines[107] = $lines[107] -replace 'await fetch\(', 'const res = await fetch('
Insert-ResOkCheck $lines 111 "Status konnte nicht geaendert werden. Bitte erneut versuchen."

[System.IO.File]::WriteAllLines($path, $lines, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Fertig. Zeige Diff..."
Set-Location "D:\Projekt2027\Q7_Entwicklung\a_Q7-code"
git diff "app\aufgaben\[id]\AufgabeDetail.tsx" | Out-File neun-fixes-diff.txt
notepad neun-fixes-diff.txt
