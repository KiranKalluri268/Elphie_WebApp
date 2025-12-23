$svgPath = "d:\Kiran\Elphie_WebApp\frontend\public\dental_chart-01.svg"
$content = Get-Content -Path $svgPath -Raw

# Matrix transform: matrix(0.1,0,0,-0.1,13.464695,237.4629)
$a = 0.1
$b = 0.0
$c = 0.0
$d_matrix = -0.1
$e = 13.464695
$f = 237.4629

# Regex to find paths
$pathRegex = [regex]'(<path[^>]+>)'
$pathMatches = $pathRegex.Matches($content)

$items = @()

foreach ($match in $pathMatches) {
    $tag = $match.Value
    
    # Extract ID
    if ($tag -match 'id="([^"]+)"') {
        $id = $Matches[1]
    } else { continue }

    # Extract d
    if ($tag -match 'd="([^"]+)"') {
        $d = $Matches[1]
        
        # Extract first point (M x y or m x y)
        if ($d -match '[Mm]\s*(-?[\d.]+)[,\s](-?[\d.]+)') {
            $rawX = [float]$Matches[1]
            $rawY = [float]$Matches[2]
            
            # Transform
            $screenX = $a * $rawX + $c * $rawY + $e
            $screenY = $b * $rawX + $d_matrix * $rawY + $f
            
            $items += [PSCustomObject]@{
                OriginalId = $id
                ScreenX = $screenX
                ScreenY = $screenY
            }
        }
    }
}

Write-Host "Found $($items.Count) paths."

if ($items.Count -ne 32) {
    Write-Warning "Expected 32 paths, found $($items.Count)"
}

# Sort by Y (Top Row has smaller Y)
$items = $items | Sort-Object ScreenY

# Split
if ($items.Count -eq 32) {
    $topRow = $items[0..15]
    $bottomRow = $items[16..31]
} else {
    # Approx split
    $avgY = ($items | Measure-Object ScreenY -Average).Average
    $topRow = $items | Where-Object { $_.ScreenY -lt $avgY }
    $bottomRow = $items | Where-Object { $_.ScreenY -ge $avgY }
}

# Map for replacements
$mapping = @{}

# Top Row: Sort X Asc -> 1 to 16
$topRow = $topRow | Sort-Object ScreenX
for ($i = 0; $i -lt $topRow.Count; $i++) {
    $toothNum = $i + 1
    $newId = "tooth-$toothNum"
    $mapping[$topRow[$i].OriginalId] = $newId
    Write-Host "$($topRow[$i].OriginalId) -> $newId (X: $($topRow[$i].ScreenX), Y: $($topRow[$i].ScreenY))"
}

# Bottom Row: Sort X Asc -> 32 down to 17
$bottomRow = $bottomRow | Sort-Object ScreenX
for ($i = 0; $i -lt $bottomRow.Count; $i++) {
    $toothNum = 32 - $i
    $newId = "tooth-$toothNum"
    $mapping[$bottomRow[$i].OriginalId] = $newId
    Write-Host "$($bottomRow[$i].OriginalId) -> $newId (X: $($bottomRow[$i].ScreenX), Y: $($bottomRow[$i].ScreenY))"
}

# Replace in content
$newContent = $content
# We need to be careful not to double replace if ids overlap, but existing ids are path1..32, new are tooth-X.
# We iterate over the mapping.
foreach ($key in $mapping.Keys) {
    $oldPattern = 'id="' + $key + '"'
    $newPattern = 'id="' + $mapping[$key] + '"'
    $newContent = $newContent.Replace($oldPattern, $newPattern)
}

Set-Content -Path $svgPath -Value $newContent -Encoding UTF8
Write-Host "Saved modified SVG."
