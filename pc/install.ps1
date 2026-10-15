# 험프리 시야검사 연습: 인터넷 없이 쓰도록 이 PC에 복사하고,
# 바탕화면에 주소창 없는 크롬 앱 창으로 여는 아이콘을 만든다.
$ErrorActionPreference = 'Stop'
$name  = '험프리 시야검사 연습'
$dest  = Join-Path $env:LOCALAPPDATA 'HFA-Practice'
$files = 'humphrey-vf-demo.html', 'hfa-principles.pdf', 'hfa-icon.ico'

$chrome = @(
  (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe' -ErrorAction SilentlyContinue).'(default)'
  (Get-ItemProperty 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe' -ErrorAction SilentlyContinue).'(default)'
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $chrome) {
  Write-Host '크롬을 찾지 못했습니다. 크롬이 설치되어 있는지 확인하세요.' -ForegroundColor Red
  exit 1
}

# 프로그램 파일 복사. 다시 실행하면 새 버전으로 덮어쓰고, 연습 기록과 설정은 크롬에 남아 그대로 유지된다.
New-Item -ItemType Directory -Force -Path $dest | Out-Null
foreach ($f in $files) {
  $p = Join-Path $PSScriptRoot $f
  if (-not (Test-Path $p)) {
    Write-Host "$f 파일이 없습니다. 압축을 모두 푼 폴더에서 install.bat을 실행하세요." -ForegroundColor Red
    exit 1
  }
  Copy-Item $p $dest -Force
}
Get-ChildItem $dest | Unblock-File

$url = ([Uri](Join-Path $dest 'humphrey-vf-demo.html')).AbsoluteUri
$lnk = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) "$name.lnk"))
$lnk.TargetPath = $chrome
$lnk.Arguments = "--app=`"$url`" --start-maximized"
$lnk.WorkingDirectory = $dest
$lnk.IconLocation = Join-Path $dest 'hfa-icon.ico'
$lnk.Description = "$name (인터넷 없이 실행)"
$lnk.Save()
Write-Host "설치했습니다. 바탕화면의 '$name' 아이콘을 두 번 누르세요." -ForegroundColor Green
