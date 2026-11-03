Add-Type -AssemblyName System.Drawing

function Remove-WhiteBgFloodFill {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$Threshold = 236
    )

    $srcBmp = [System.Drawing.Bitmap]::FromFile($InputPath)
    $w = $srcBmp.Width
    $h = $srcBmp.Height

    $dstBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $srcData = $srcBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $dstData = $dstBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    $stride = [Math]::Abs($srcData.Stride)
    $bytes = $stride * $h
    $rgbValues = New-Object byte[] $bytes

    [System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $rgbValues, 0, $bytes)

    # Visited array: 0 = unvisited, 1 = background (transparent)
    $bgMask = New-Object bool[] ($w * $h)
    $queue = New-Object System.Collections.Generic.Queue[int]

    # Helper function to test if pixel is white
    function Is-WhitePixel($x, $y) {
        $idx = ($y * $stride) + ($x * 4)
        $b = [int]$rgbValues[$idx]
        $g = [int]$rgbValues[$idx + 1]
        $r = [int]$rgbValues[$idx + 2]
        $minC = [Math]::Min($r, [Math]::Min($g, $b))
        $maxC = [Math]::Max($r, [Math]::Max($g, $b))
        return ($minC -ge $Threshold -and ($maxC - $minC) -le 24)
    }

    # Seed all border pixels
    for ($x = 0; $x -lt $w; $x++) {
        # Top border
        if (Is-WhitePixel $x 0) {
            $pos = 0 * $w + $x
            if (-not $bgMask[$pos]) { $bgMask[$pos] = $true; $queue.Enqueue($pos) }
        }
        # Bottom border
        $yBottom = $h - 1
        if (Is-WhitePixel $x $yBottom) {
            $pos = $yBottom * $w + $x
            if (-not $bgMask[$pos]) { $bgMask[$pos] = $true; $queue.Enqueue($pos) }
        }
    }

    for ($y = 0; $y -lt $h; $y++) {
        # Left border
        if (Is-WhitePixel 0 $y) {
            $pos = $y * $w + 0
            if (-not $bgMask[$pos]) { $bgMask[$pos] = $true; $queue.Enqueue($pos) }
        }
        # Right border
        $xRight = $w - 1
        if (Is-WhitePixel $xRight $y) {
            $pos = $y * $w + $xRight
            if (-not $bgMask[$pos]) { $bgMask[$pos] = $true; $queue.Enqueue($pos) }
        }
    }

    # BFS flood fill
    while ($queue.Count -gt 0) {
        $curr = $queue.Dequeue()
        $cy = [Math]::DivRem($curr, $w, [ref]$cx)

        # 4-connected neighbors
        $neighbors = @(
            @($cx + 1, $cy),
            @($cx - 1, $cy),
            @($cx, $cy + 1),
            @($cx, $cy - 1)
        )

        foreach ($n in $neighbors) {
            $nx = $n[0]
            $ny = $n[1]

            if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h) {
                $nPos = $ny * $w + $nx
                if (-not $bgMask[$nPos]) {
                    if (Is-WhitePixel $nx $ny) {
                        $bgMask[$nPos] = $true
                        $queue.Enqueue($nPos)
                    }
                }
            }
        }
    }

    # Apply transparency to background mask
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $pos = $y * $w + $x
            $idx = ($y * $stride) + ($x * 4)

            if ($bgMask[$pos]) {
                $rgbValues[$idx + 3] = [byte]0
            } else {
                # Check if it borders a background pixel for soft anti-aliased edge
                $b = [int]$rgbValues[$idx]
                $g = [int]$rgbValues[$idx + 1]
                $r = [int]$rgbValues[$idx + 2]
                $minC = [Math]::Min($r, [Math]::Min($g, $b))

                if ($minC -ge 225) {
                    $hasBgNeighbor = $false
                    if ($x -gt 0 -and $bgMask[$pos - 1]) { $hasBgNeighbor = $true }
                    elseif ($x -lt $w - 1 -and $bgMask[$pos + 1]) { $hasBgNeighbor = $true }
                    elseif ($y -gt 0 -and $bgMask[$pos - $w]) { $hasBgNeighbor = $true }
                    elseif ($y -lt $h - 1 -and $bgMask[$pos + $w]) { $hasBgNeighbor = $true }

                    if ($hasBgNeighbor) {
                        $alpha = [int]([Math]::Round((255 - $minC) / 30.0 * 255))
                        if ($alpha -lt 40) { $alpha = 0 }
                        if ($alpha -gt 255) { $alpha = 255 }
                        $rgbValues[$idx + 3] = [byte]$alpha
                    }
                }
            }
        }
    }

    [System.Runtime.InteropServices.Marshal]::Copy($rgbValues, 0, $dstData.Scan0, $bytes)

    $srcBmp.UnlockBits($srcData)
    $dstBmp.UnlockBits($dstData)
    $srcBmp.Dispose()

    $dstBmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dstBmp.Dispose()
    Write-Host "Flood-fill transparent PNG saved: $OutputPath"
}

Remove-WhiteBgFloodFill -InputPath "d:\Aurumfx-works\aurum_education\src\assets\boyimage.jpeg" -OutputPath "d:\Aurumfx-works\aurum_education\src\assets\boyimage.png" -Threshold 235
Remove-WhiteBgFloodFill -InputPath "d:\Aurumfx-works\aurum_education\src\assets\girlimage.jpeg" -OutputPath "d:\Aurumfx-works\aurum_education\src\assets\girlimage.png" -Threshold 235

