param(
  [ValidateSet('web-mobile', 'wechatgame')][string]$Platform = 'web-mobile',
  [string]$EditorPath = $env:COCOS_CREATOR_PATH
)
$ErrorActionPreference = 'Stop'
if (-not $EditorPath) { $EditorPath = 'E:\cocos\Creator\3.8.8\CocosCreator.exe' }
if (-not (Test-Path -LiteralPath $EditorPath)) { throw 'Set COCOS_CREATOR_PATH to the installed CocosCreator.exe path.' }
$taskRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$taskConfig = Join-Path $taskRoot "config\build-$Platform.json"
$taskLogDir = Join-Path $taskRoot 'logs'
New-Item -ItemType Directory -Force -Path $taskLogDir | Out-Null
$taskLog = Join-Path $taskLogDir "build-$Platform.log"
$taskErrorLog = Join-Path $taskLogDir "build-$Platform.stderr.log"
$taskArguments = @('--project', ('"' + $taskRoot + '"'), '--build', ('"configPath=' + $taskConfig + '"'))
$taskProcess = Start-Process -FilePath $EditorPath -ArgumentList $taskArguments -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $taskLog -RedirectStandardError $taskErrorLog
# Retain the process handle before exit; otherwise Windows PowerShell can lose
# the native exit code when a short-lived CLI process exits between observations.
$null = $taskProcess.Handle
# Wait for the CLI root. Start-Process -Wait also waits for orphan Chromium
# helpers, which can remain alive after Cocos has successfully exited with 36.
$taskProcess.WaitForExit()
$taskExitCode = $taskProcess.ExitCode
Get-Content -LiteralPath $taskLog -Encoding UTF8 -Tail 25
if ($taskExitCode -ne 36 -and $taskExitCode -ne 0) { throw "Cocos build failed with exit code $taskExitCode. See $taskLog and $taskErrorLog" }
Write-Output "Build completed: $taskRoot\build\$Platform"
