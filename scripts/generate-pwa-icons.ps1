Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "..\\public\\icons"
New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-Icon($size, $pathOut, $maskable = $false) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $bgRect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bgRect,
    [System.Drawing.Color]::FromArgb(15, 23, 42),
    [System.Drawing.Color]::FromArgb(29, 78, 216),
    45
  )
  $g.FillRectangle($bgBrush, $bgRect)

  $safe = if ($maskable) { $size * 0.18 } else { $size * 0.11 }
  $cardWidth = $size - ($safe * 2)
  $cardHeight = $cardWidth * 0.84
  $cardX = ($size - $cardWidth) / 2
  $cardY = ($size - $cardHeight) / 2
  $radius = [Math]::Max(14, $size * 0.08)

  $shadowPath = New-RoundedPath ($cardX + ($size * 0.018)) ($cardY + ($size * 0.026)) $cardWidth $cardHeight $radius
  $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55, 15, 23, 42))
  $g.FillPath($shadowBrush, $shadowPath)

  $cardPath = New-RoundedPath $cardX $cardY $cardWidth $cardHeight $radius
  $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255))
  $g.FillPath($cardBrush, $cardPath)

  $headerHeight = $cardHeight * 0.24
  $headerRect = New-Object System.Drawing.RectangleF($cardX, $cardY, $cardWidth, $headerHeight)
  $headerBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $headerRect,
    [System.Drawing.Color]::FromArgb(59, 130, 246),
    [System.Drawing.Color]::FromArgb(14, 165, 233),
    0
  )
  $g.FillRectangle($headerBrush, $headerRect)

  $pinSize = $size * 0.045
  $pinY = $cardY + ($headerHeight * 0.22)
  $pinBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(219, 234, 254))
  $pinOffsets = @(
    ($cardX + ($cardWidth * 0.25)),
    ($cardX + ($cardWidth * 0.75) - $pinSize)
  )
  foreach ($offset in $pinOffsets) {
    $g.FillEllipse($pinBrush, $offset, $pinY, $pinSize, $pinSize)
  }

  $gridTop = $cardY + $headerHeight + ($cardHeight * 0.12)
  $gridLeft = $cardX + ($cardWidth * 0.12)
  $cellGap = $cardWidth * 0.05
  $cellSize = ($cardWidth - ($cellGap * 5) - ($cardWidth * 0.24)) / 4
  $gridBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(226, 232, 240))

  for ($row = 0; $row -lt 2; $row++) {
    for ($col = 0; $col -lt 3; $col++) {
      $x = $gridLeft + ($col * ($cellSize + $cellGap))
      $y = $gridTop + ($row * ($cellSize + $cellGap))
      $g.FillRectangle($gridBrush, $x, $y, $cellSize, $cellSize)
    }
  }

  $checkPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(234, 88, 12), [Math]::Max(4, $size * 0.045))
  $checkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $checkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $checkPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $cx1 = $cardX + $cardWidth * 0.56
  $cy1 = $cardY + $cardHeight * 0.56
  $cx2 = $cardX + $cardWidth * 0.66
  $cy2 = $cardY + $cardHeight * 0.68
  $cx3 = $cardX + $cardWidth * 0.86
  $cy3 = $cardY + $cardHeight * 0.44
  $g.DrawLines($checkPen, [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF($cx1, $cy1)),
    (New-Object System.Drawing.PointF($cx2, $cy2)),
    (New-Object System.Drawing.PointF($cx3, $cy3))
  ))

  $bmp.Save($pathOut, [System.Drawing.Imaging.ImageFormat]::Png)

  $checkPen.Dispose()
  $gridBrush.Dispose()
  $pinBrush.Dispose()
  $headerBrush.Dispose()
  $cardBrush.Dispose()
  $shadowBrush.Dispose()
  $shadowPath.Dispose()
  $cardPath.Dispose()
  $bgBrush.Dispose()
  $g.Dispose()
  $bmp.Dispose()
}

Draw-Icon 32 (Join-Path $iconsDir "favicon-32.png")
Draw-Icon 180 (Join-Path $iconsDir "apple-touch-icon.png")
Draw-Icon 192 (Join-Path $iconsDir "icon-192.png")
Draw-Icon 512 (Join-Path $iconsDir "icon-512.png")
Draw-Icon 512 (Join-Path $iconsDir "icon-maskable-512.png") $true

$svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Peptides Calendar">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#0EA5E9"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#bg)"/>
  <rect x="20" y="24" width="88" height="78" rx="18" fill="#FFFFFF"/>
  <rect x="20" y="24" width="88" height="18" rx="18" fill="url(#bar)"/>
  <circle cx="42" cy="32" r="4" fill="#DBEAFE"/>
  <circle cx="86" cy="32" r="4" fill="#DBEAFE"/>
  <rect x="32" y="54" width="11" height="11" fill="#E2E8F0"/>
  <rect x="48" y="54" width="11" height="11" fill="#E2E8F0"/>
  <rect x="64" y="54" width="11" height="11" fill="#E2E8F0"/>
  <rect x="32" y="70" width="11" height="11" fill="#E2E8F0"/>
  <rect x="48" y="70" width="11" height="11" fill="#E2E8F0"/>
  <rect x="64" y="70" width="11" height="11" fill="#E2E8F0"/>
  <path d="M74 70 L82 78 L96 58" fill="none" stroke="#EA580C" stroke-linecap="round" stroke-linejoin="round" stroke-width="7"/>
</svg>
"@

Set-Content -Path (Join-Path $iconsDir "favicon.svg") -Value $svg
