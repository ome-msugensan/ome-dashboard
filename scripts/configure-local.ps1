$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$configPath = Join-Path $workspace 'private/config.php'
if (Test-Path -LiteralPath $configPath) { throw 'private/config.php already exists; existing credentials were not changed.' }

function New-RandomPassword {
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$dbPassword = New-RandomPassword
$adminPassword = New-RandomPassword
$piiKeyBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($piiKeyBytes)
$piiKey = [Convert]::ToHexString($piiKeyBytes).ToLowerInvariant()
$env:OME_NEW_ADMIN_PASSWORD = $adminPassword
try { $adminHash = & 'C:\xampp\php\php.exe' -r "echo password_hash(getenv('OME_NEW_ADMIN_PASSWORD'), PASSWORD_DEFAULT);" }
finally { Remove-Item Env:OME_NEW_ADMIN_PASSWORD -ErrorAction SilentlyContinue }
if ($LASTEXITCODE -ne 0 -or -not $adminHash) { throw 'Could not hash the administrator password.' }

$sql = "CREATE USER 'ome_css_app'@'127.0.0.1' IDENTIFIED BY '$dbPassword'; GRANT SELECT, INSERT, UPDATE, DELETE ON ome_css.* TO 'ome_css_app'@'127.0.0.1';"
$sql | & 'C:\xampp\mysql\bin\mysql.exe' -h 127.0.0.1 -P 3306 -u root
if ($LASTEXITCODE -ne 0) { throw 'Could not create the application database user.' }

$config = @"
<?php
return [
    'db_host' => '127.0.0.1',
    'db_port' => 3306,
    'db_name' => 'ome_css',
    'db_user' => 'ome_css_app',
    'db_password' => '$dbPassword',
    'admin_password_hash' => '$adminHash',
    'pii_key' => '$piiKey',
    'app_origin' => 'http://127.0.0.1:8000',
];
"@
Set-Content -LiteralPath $configPath -Value $config -Encoding utf8
Set-Content -LiteralPath (Join-Path $workspace 'private/local-admin-password.php') -Value "<?php return '$adminPassword';" -Encoding utf8
Write-Output 'Local MySQL application user and administrator password were created.'
Write-Output 'The one-time administrator password is in private/local-admin-password.php.'
