$c = Get-Content 'C:\Users\darka\Desktop\HELIX\chat.html' -Raw
$m = [regex]::Match($c, '(?s)<style>(.*?)</style>')
$css = $m.Groups[1].Value
[System.IO.File]::WriteAllText('C:\Users\darka\Desktop\HELIX\chat.css', $css)
Write-Host ("CSS written: " + (Get-Item 'C:\Users\darka\Desktop\HELIX\chat.css').Length + " bytes")
