<?php
// Copy to config.php and replace every placeholder. config.php is ignored by Git.
return [
    'db_host' => '127.0.0.1',
    'db_port' => 3306,
    'db_name' => 'ome_css',
    'db_user' => 'ome_app',
    'db_password' => 'replace-with-a-strong-database-password',
    // Initial setup passcode only. Individual account passwords are stored in ome_users.
    // Generate with: php -r "echo password_hash('YOUR_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
    'admin_password_hash' => 'replace-with-a-password-hash',
    // Generate with: php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
    'pii_key' => 'replace-with-a-64-character-hex-key',
    'app_origin' => 'http://127.0.0.1:8000',
];
