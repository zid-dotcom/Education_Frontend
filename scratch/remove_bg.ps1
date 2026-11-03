Add-Type -AssemblyName System.Drawing

function Remove-WhiteBg {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$Threshold = 242,
        [int]$Feather = 16
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

    $minWhite = $Threshold - $Feather

    for ($i = 0; $i -lt $bytes; $i += 4) {
        $b = [int]$rgbValues[$i]
        $g = [int]$rgbValues[$i + 1]
        $r = [int]$rgbValues[$i + 2]

        $minC = [Math]::Min($r, [Math]::Min($g, $b))
        $maxC = [Math]::Max($r, [Math]::Max($g, $b))
        $diff = $maxC - $minC

        if ($minC -ge $Threshold -and $diff -le 16) {
            $rgbValues[$i + 3] = [byte]0
        }
        elseif ($minC -gt $minWhite -and $diff -le 20) {
            $factor = ($Threshold - $minC) / [double]$Feather
            $alpha = [int]([Math]::Round($factor * 255))
            if ($alpha -lt 0) { $alpha = 0 }
            if ($alpha -gt 255) { $alpha = 255 }
            $rgbValues[$i + 3] = [byte]$alpha
        }
    }

    [System.Runtime.InteropServices.Marshal]::Copy($rgbValues, 0, $dstData.Scan0, $bytes)

    $srcBmp.UnlockBits($srcData)
    $dstBmp.UnlockBits($dstData)
    $srcBmp.Dispose()

    $dstBmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dstBmp.Dispose()
    Write-Host "Successfully generated: $OutputPath"
}

Remove-WhiteBg -InputPath "d:\Aurumfx-works\aurum_education\src\assets\boyimage.jpeg" -OutputPath "d:\Aurumfx-works\aurum_education\src\assets\boyimage.png" -Threshold 240 -Feather 18
Remove-WhiteBg -InputPath "d:\Aurumfx-works\aurum_education\src\assets\girlimage.jpeg" -OutputPath "d:\Aurumfx-works\aurum_education\src\assets\girlimage.png" -Threshold 240 -Feather 18

