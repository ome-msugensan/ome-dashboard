<?php
declare(strict_types=1);

// Same-origin JSON API for the survey. This file runs under PHP/MySQL on both
// the local development server and InfinityFree hosting.
date_default_timezone_set('UTC');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

final class ApiError extends RuntimeException {
    public function __construct(int $status, string $message) { parent::__construct($message, $status); }
}
function reject(int $status, string $message): never { throw new ApiError($status, $message); }
function send(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
    exit;
}
function body(int $limit = 3000000): array {
    if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) reject(415, 'JSON body required');
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $limit) reject(413, 'Request too large');
    $raw = file_get_contents(PHP_SAPI === 'cli' ? 'php://stdin' : 'php://input');
    if ($raw === false || strlen($raw) > $limit) reject(413, 'Request too large');
    try { $value = json_decode($raw, true, 512, JSON_THROW_ON_ERROR); }
    catch (JsonException) { reject(400, 'Invalid JSON'); }
    if (!is_array($value)) reject(400, 'JSON object required');
    return $value;
}
function clean_text(mixed $value, int $max = 1000): string {
    if (!is_string($value)) return '';
    $value = trim($value);
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}
function valid_date(mixed $value): bool {
    if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) return false;
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date !== false && $date->format('Y-m-d') === $value;
}
function comment_text(mixed $value): string {
    $text = clean_text($value, 5000);
    $text = preg_replace('/\S+@\S+/u', '[email removed]', $text);
    return preg_replace('/(\+?63|0)9\d{9}/u', '[number removed]', $text);
}
function validate_row(mixed $input, bool $web, array $form): array {
    if (!is_array($input) || !valid_date($input['date'] ?? null)) reject(400, 'Invalid response date');
    $office = clean_text($input['office'] ?? null, 250);
    if ($office === '') reject(400, 'Office is required');
    $structure = null;
    foreach ($form['structure'] as $item) if ($item['office'] === $office) { $structure = $item; break; }
    if ($web && $structure === null) reject(400, 'Choose a valid office');
    $unit = clean_text($input['unit'] ?? '', 250);
    if ($web && $structure !== null && count($structure['units']) && !in_array($unit, $structure['units'], true)) reject(400, 'Choose a valid unit');
    $service = clean_text($input['service'] ?? '', 500);
    $gender = clean_text($input['gender'] ?? '', 100);
    $type = clean_text($input['type'] ?? '', 100);
    if ($web && ($service === '' || $gender === '' || $type === '')) reject(400, 'Service and client details are required');
    $cc = [];
    foreach (['cc1', 'cc2', 'cc3'] as $name) {
        $n = $input[$name] ?? null;
        if (!is_int($n) || $n < -1 || $n > 5) reject(400, "Invalid $name");
        $cc[$name] = $n;
    }
    if ($web && ($cc['cc1'] < 0 || ($cc['cc1'] !== 3 && ($cc['cc2'] < 0 || $cc['cc3'] < 0)))) reject(400, 'Citizen’s Charter answers are required');
    $sqd = $input['sqd'] ?? null;
    if (!is_array($sqd) || count($sqd) !== 11) reject(400, 'All 11 service ratings are required');
    foreach ($sqd as $rating) if (!is_int($rating) || $rating < 0 || $rating > 5) reject(400, 'Invalid service rating');
    return [
        'id' => '', 'date' => $input['date'], 'office' => $office, 'unit' => $unit,
        'service' => $service, 'gender' => $gender, 'type' => $type,
        'cc1' => $cc['cc1'], 'cc2' => $cc['cc2'], 'cc3' => $cc['cc3'],
        'sqd' => implode('', $sqd), 'comment' => comment_text($input['comment'] ?? ''),
        'routed' => !empty($input['routed']) ? 1 : 0
    ];
}
function insert_response(PDOStatement $statement, array $row, string $source): void {
    $statement->execute([
        $row['id'], $row['date'], $row['office'], $row['unit'], $row['service'],
        $row['gender'], $row['type'], $row['cc1'], $row['cc2'], $row['cc3'],
        $row['sqd'], $row['comment'], $row['routed'], $source
    ]);
}
function response_for_browser(array $row): array {
    return [
        'id' => $row['id'], 'date' => $row['response_date'], 'office' => $row['office'],
        'unit' => $row['unit'], 'service' => $row['service'], 'gender' => $row['gender'],
        'type' => $row['client_type'], 'cc1' => (int) $row['cc1'], 'cc2' => (int) $row['cc2'],
        'cc3' => (int) $row['cc3'], 'sqd' => array_map('intval', str_split($row['sqd'])),
        'comment' => $row['comment'], 'routed' => (bool) $row['routed'], 'source' => $row['source']
    ];
}
require_once __DIR__ . '/private/auth.php';
function is_admin(PDO $db): bool { return (ome_current_user($db)['role'] ?? null) === 'admin'; }
function require_admin(PDO $db): void { if (!is_admin($db)) reject(401, 'Please sign in as an administrator'); }
function require_user(PDO $db): array {
    $user = ome_current_user($db);
    if ($user === null) reject(401, 'Please sign in to continue');
    return $user;
}
function encryption_key(array $config): string {
    $hex = $config['pii_key'] ?? '';
    if (!is_string($hex) || !preg_match('/^[a-fA-F0-9]{64}$/', $hex)) reject(503, 'Personal details encryption is not configured');
    return hex2bin($hex);
}
function encrypt_details(array $details, string $key): string {
    $nonce = random_bytes(12);
    $tag = '';
    $ciphertext = openssl_encrypt(json_encode($details, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $nonce, $tag);
    if ($ciphertext === false) throw new RuntimeException('Could not encrypt personal details');
    return 'v1:' . base64_encode($nonce . $tag . $ciphertext);
}
function decrypt_details(string $value, string $key): array {
    if (!str_starts_with($value, 'v1:')) throw new RuntimeException('Unknown personal details format');
    $bytes = base64_decode(substr($value, 3), true);
    if ($bytes === false || strlen($bytes) < 29) throw new RuntimeException('Invalid personal details');
    $plaintext = openssl_decrypt(substr($bytes, 28), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, substr($bytes, 0, 12), substr($bytes, 12, 16));
    if ($plaintext === false) throw new RuntimeException('Could not decrypt personal details');
    $details = json_decode($plaintext, true, 16, JSON_THROW_ON_ERROR);
    if (!is_array($details)) throw new RuntimeException('Invalid personal details');
    return $details;
}
function auth_attempt(PDO $db, string $key, bool $failed): void {
    if ($failed) {
        $q = $db->prepare('SELECT attempts, reset_at FROM login_attempts WHERE ip_hash = ?');
        $q->execute([$key]);
        $old = $q->fetch();
        $active = $old && strtotime($old['reset_at'] . ' UTC') > time();
        $count = $active ? (int) $old['attempts'] + 1 : 1;
        $db->prepare('INSERT INTO login_attempts (ip_hash, attempts, reset_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)) ON DUPLICATE KEY UPDATE attempts = VALUES(attempts), reset_at = VALUES(reset_at)')->execute([$key, $count]);
        return;
    }
    $db->prepare('DELETE FROM login_attempts WHERE ip_hash = ?')->execute([$key]);
}
function check_auth_rate(PDO $db, string $key): void {
    $q = $db->prepare('SELECT attempts FROM login_attempts WHERE ip_hash = ? AND reset_at > UTC_TIMESTAMP()');
    $q->execute([$key]);
    if ((int) $q->fetchColumn() >= 10) reject(429, 'Too many sign-in attempts; try again in 15 minutes');
}
function valid_password(mixed $value): bool { return is_string($value) && strlen($value) >= 12 && strlen($value) <= 128; }

try {
    $configFile = __DIR__ . '/private/config.php';
    if (!is_file($configFile)) reject(503, 'Database is not configured');
    $config = require $configFile;
    if (!is_array($config)) reject(503, 'Database configuration is invalid');
    $db = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_port'], $config['db_name']),
        $config['db_user'], $config['db_password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $db->exec("SET time_zone = '+00:00'");
    $db->exec('DELETE FROM respondent_details WHERE created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 YEAR)');
    $metadata = json_decode(file_get_contents(__DIR__ . '/private/form.json'), true, 512, JSON_THROW_ON_ERROR);
    $form = $metadata['form'];
    $lists = $metadata['lists'];
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET' && $action === 'health') { $db->query('SELECT 1'); send(200, ['status' => 'ok']); }
    if ($method === 'GET' && $action === 'auth-status') {
        $count = (int) $db->query('SELECT COUNT(*) FROM ome_users')->fetchColumn();
        send(200, ['user' => ome_public_user(ome_current_user($db)), 'setupRequired' => $count === 0]);
    }
    if ($method === 'GET' && $action === 'bootstrap') {
        $user = require_user($db);
        $base = []; $submissions = [];
        foreach ($db->query('SELECT * FROM responses ORDER BY response_date, id') as $row) {
            $value = response_for_browser($row);
            if ($row['source'] === 'web') $submissions[] = $value; else $base[] = $value;
        }
        $saved = $db->query('SELECT settings_json, import_meta_json FROM site_settings WHERE singleton = 1')->fetch();
        $served = [];
        foreach ($db->query('SELECT office, period, clients FROM clients_served') as $row) $served[$row['office'] . '||' . $row['period']] = (int) $row['clients'];
        $findings = [];
        foreach ($db->query('SELECT id,title,office,period,findings,actions,file_name,file_data,DATE_FORMAT(added, \'%Y-%m-%d\') AS added FROM findings ORDER BY added DESC') as $row) {
            $findings[] = [
                'id' => $row['id'], 'title' => $row['title'], 'office' => $row['office'], 'period' => $row['period'],
                'findings' => $row['findings'], 'actions' => $row['actions'], 'fileName' => $row['file_name'],
                'fileData' => $row['file_data'], 'added' => $row['added']
            ];
        }
        send(200, [
            'form' => $form, 'lists' => $lists, 'baseRows' => $base, 'submissions' => $submissions,
            'settings' => json_decode($saved['settings_json'] ?? '{}', true) ?: [],
            'importMeta' => json_decode($saved['import_meta_json'] ?? '{}', true) ?: [],
            'served' => $served, 'findings' => $findings, 'authenticated' => $user['role'] === 'admin',
            'user' => ome_public_user($user)
        ]);
    }
    if ($method === 'GET' && $action === 'respondents') {
        require_admin($db);
        $key = encryption_key($config);
        $records = [];
        foreach ($db->query("SELECT r.id, r.response_date, r.office, r.unit, r.service, d.encrypted_data FROM respondent_details d JOIN responses r ON r.id = d.response_id WHERE r.source = 'web' ORDER BY r.created_at DESC, r.id DESC") as $row) {
            $records[] = array_merge([
                'id' => $row['id'], 'date' => $row['response_date'], 'office' => $row['office'],
                'unit' => $row['unit'], 'service' => $row['service']
            ], decrypt_details($row['encrypted_data'], $key));
        }
        send(200, ['respondents' => $records]);
    }

    if ($method === 'POST' && ($_SERVER['HTTP_ORIGIN'] ?? '') !== rtrim((string) ($config['app_origin'] ?? ''), '/')) reject(403, 'Request origin is not allowed');

    if ($method === 'POST' && $action === 'setup-admin') {
        $input = body(3000);
        $fullName = clean_text($input['fullName'] ?? null, 150);
        $email = strtolower(clean_text($input['email'] ?? null, 254));
        $password = $input['password'] ?? null;
        $passcode = $input['existingPasscode'] ?? null;
        if ($fullName === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !valid_password($password)) reject(400, 'Enter your name, a valid email, and a password of at least 12 characters');
        $ipHash = hash_hmac('sha256', 'setup:' . ($_SERVER['REMOTE_ADDR'] ?? ''), (string) ($config['pii_key'] ?? 'ome'));
        check_auth_rate($db, $ipHash);
        if (!is_string($passcode) || !password_verify($passcode, (string) ($config['admin_password_hash'] ?? ''))) {
            auth_attempt($db, $ipHash, true);
            reject(401, 'The existing admin passcode is incorrect');
        }
        $db->beginTransaction();
        try {
            $db->query('SELECT id FROM ome_auth_setup_lock WHERE id = 1 FOR UPDATE');
            if ((int) $db->query('SELECT COUNT(*) FROM ome_users')->fetchColumn() !== 0) reject(409, 'An administrator has already been created');
            $db->prepare("INSERT INTO ome_users (full_name,email,password_hash,role,category) VALUES (?,?,?,'admin','ome_staff')")->execute([$fullName, $email, password_hash($password, PASSWORD_DEFAULT)]);
            $db->commit();
        } catch (Throwable $e) { $db->rollBack(); throw $e; }
        auth_attempt($db, $ipHash, false);
        send(201, ['ok' => true]);
    }
    if ($method === 'POST' && $action === 'login') {
        $input = body(3000);
        $email = strtolower(clean_text($input['email'] ?? null, 254));
        $password = $input['password'] ?? null;
        $ipHash = hash_hmac('sha256', 'login:' . ($_SERVER['REMOTE_ADDR'] ?? ''), (string) ($config['pii_key'] ?? 'ome'));
        check_auth_rate($db, $ipHash);
        $q = $db->prepare('SELECT id, password_hash FROM ome_users WHERE email = ? AND active = 1');
        $q->execute([$email]);
        $account = $q->fetch();
        if (!is_string($password) || !$account || !password_verify($password, $account['password_hash'])) {
            auth_attempt($db, $ipHash, true);
            reject(401, 'Incorrect email or password');
        }
        auth_attempt($db, $ipHash, false);
        $db->exec('DELETE FROM user_sessions WHERE expires_at <= UTC_TIMESTAMP()');
        $token = bin2hex(random_bytes(32));
        $db->prepare('INSERT INTO user_sessions (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 12 HOUR))')->execute([hash('sha256', $token), $account['id']]);
        ome_set_cookie($token, time() + 12 * 3600, $config);
        send(200, ['ok' => true]);
    }
    if ($method === 'POST' && $action === 'logout') {
        $token = $_COOKIE['ome_session'] ?? '';
        if (is_string($token) && preg_match('/^[a-f0-9]{64}$/', $token)) $db->prepare('DELETE FROM user_sessions WHERE token_hash = ?')->execute([hash('sha256', $token)]);
        ome_set_cookie('', time() - 3600, $config);
        send(200, ['ok' => true]);
    }
    if ($method === 'POST' && $action === 'change-password') {
        $user = require_user($db);
        $input = body(3000);
        $old = $input['currentPassword'] ?? null;
        $new = $input['newPassword'] ?? null;
        if (!valid_password($new)) reject(400, 'The new password must contain at least 12 characters');
        $q = $db->prepare('SELECT password_hash FROM ome_users WHERE id = ?');
        $q->execute([$user['id']]);
        if (!is_string($old) || !password_verify($old, (string) $q->fetchColumn())) reject(401, 'Current password is incorrect');
        if (hash_equals($old, $new)) reject(400, 'Choose a different password');
        $db->beginTransaction();
        try {
            $db->prepare('UPDATE ome_users SET password_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $user['id']]);
            $db->prepare('DELETE FROM user_sessions WHERE user_id = ? AND token_hash <> ?')->execute([$user['id'], hash('sha256', (string) ($_COOKIE['ome_session'] ?? ''))]);
            $db->commit();
        } catch (Throwable $e) { $db->rollBack(); throw $e; }
        send(200, ['ok' => true]);
    }
    if ($method === 'GET' && $action === 'users') {
        require_admin($db);
        $users = $db->query('SELECT id,full_name,email,role,category,active,created_at FROM ome_users ORDER BY created_at DESC,id DESC')->fetchAll();
        send(200, ['users' => $users]);
    }
    if ($method === 'POST' && $action === 'add-user') {
        require_admin($db);
        $input = body(3000);
        $fullName = clean_text($input['fullName'] ?? null, 150);
        $email = strtolower(clean_text($input['email'] ?? null, 254));
        $password = $input['password'] ?? null;
        $role = $input['role'] ?? null;
        $category = $input['category'] ?? null;
        if ($fullName === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !valid_password($password)) reject(400, 'Enter a name, valid email, and password of at least 12 characters');
        if (!in_array($role, ['admin','user'], true) || !in_array($category, ['ome_staff','faculty','staff','student'], true) || (($role === 'admin') !== ($category === 'ome_staff'))) reject(400, 'Admin accounts must be OME staff; user accounts must be faculty, staff, or student');
        try {
            $db->prepare('INSERT INTO ome_users (full_name,email,password_hash,role,category) VALUES (?,?,?,?,?)')->execute([$fullName, $email, password_hash($password, PASSWORD_DEFAULT), $role, $category]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') reject(409, 'An account with this email already exists');
            throw $e;
        }
        send(201, ['ok' => true]);
    }
    if ($method === 'POST' && $action === 'submissions') {
        require_user($db);
        $input = body();
        if (($input['consent'] ?? false) !== true) reject(400, 'Consent is required');
        $details = [
            'legalName' => clean_text($input['legalName'] ?? null, 250),
            'contact' => clean_text($input['contact'] ?? '', 80),
            'email' => clean_text($input['email'] ?? '', 254),
            'staff' => clean_text($input['staff'] ?? '', 250)
        ];
        if ($details['email'] !== '' && !filter_var($details['email'], FILTER_VALIDATE_EMAIL)) reject(400, 'Enter a valid email address');
        $key = encryption_key($config);
        $row = validate_row($input, true, $form);
        $row['id'] = 'CSS-' . strtoupper(bin2hex(random_bytes(6)));
        $db->beginTransaction();
        try {
            $stmt = $db->prepare('INSERT INTO responses (id,response_date,office,unit,service,gender,client_type,cc1,cc2,cc3,sqd,comment,routed,source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            insert_response($stmt, $row, 'web');
            if (implode('', $details) !== '') {
                $db->prepare('INSERT INTO respondent_details (response_id, encrypted_data) VALUES (?, ?)')->execute([$row['id'], encrypt_details($details, $key)]);
            }
            $db->commit();
        } catch (Throwable $e) { $db->rollBack(); throw $e; }
        send(201, ['id' => $row['id']]);
    }

    require_admin($db);
    if ($method === 'POST' && $action === 'import') {
        $input = body(15000000);
        $rows = $input['rows'] ?? null;
        if (!is_array($rows) || count($rows) < 1 || count($rows) > 50000) reject(400, 'Import must contain 1 to 50,000 responses');
        $db->beginTransaction();
        try {
            $db->exec("DELETE FROM responses WHERE source IN ('seed','import')");
            $stmt = $db->prepare('INSERT INTO responses (id,response_date,office,unit,service,gender,client_type,cc1,cc2,cc3,sqd,comment,routed,source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            foreach (array_values($rows) as $i => $inputRow) {
                $row = validate_row($inputRow, false, $form);
                $row['id'] = 'i' . $i;
                insert_response($stmt, $row, 'import');
            }
            $meta = ['source' => clean_text($input['source'] ?? 'CSV import', 250), 'importedAt' => gmdate('c'), 'rows' => count($rows)];
            $db->prepare('UPDATE site_settings SET import_meta_json = ? WHERE singleton = 1')->execute([json_encode($meta, JSON_UNESCAPED_UNICODE)]);
            $db->commit();
        } catch (Throwable $e) { $db->rollBack(); throw $e; }
        send(200, ['imported' => count($rows)]);
    }
    if ($action === 'save-settings' && $method === 'POST') {
        $s = body();
        if (!in_array($s['periodType'] ?? null, ['month','quarter','year'], true) || !is_numeric($s['target'] ?? null) || $s['target'] < 0 || $s['target'] > 100 || !is_int($s['minResponses'] ?? null) || $s['minResponses'] < 1 || !is_array($s['bands'] ?? null) || count($s['bands']) !== 5 || !is_array($s['aliases'] ?? null)) reject(400, 'Invalid reporting settings');
        $bands = [];
        foreach ($s['bands'] as $band) {
            if (!is_array($band) || !is_numeric($band['min'] ?? null) || $band['min'] < 0 || $band['min'] > 100 || clean_text($band['label'] ?? '', 80) === '') reject(400, 'Invalid rating scale');
            $bands[] = ['min' => (float) $band['min'], 'label' => clean_text($band['label'], 80)];
        }
        $aliases = [];
        foreach ($s['aliases'] as $key => $value) if (clean_text((string) $key, 250) !== '' && clean_text($value, 250) !== '') $aliases[clean_text((string) $key, 250)] = clean_text($value, 250);
        $settings = ['periodType' => $s['periodType'], 'target' => (float) $s['target'], 'minResponses' => $s['minResponses'], 'bands' => $bands, 'aliases' => (object) $aliases];
        $db->prepare('UPDATE site_settings SET settings_json = ? WHERE singleton = 1')->execute([json_encode($settings, JSON_UNESCAPED_UNICODE)]);
        send(200, ['ok' => true]);
    }
    if ($action === 'reset-settings' && $method === 'POST') {
        $db->exec("UPDATE site_settings SET settings_json = '{}' WHERE singleton = 1");
        send(200, ['ok' => true]);
    }
    if ($method === 'POST' && $action === 'served') {
        $input = body(2000);
        $office = clean_text($input['office'] ?? '', 250); $period = clean_text($input['period'] ?? '', 20);
        $clients = $input['clients'] ?? null;
        if ($office === '' || !preg_match('/^\d{4}(-Q[1-4]|-\d{2})?$/', $period) || !is_int($clients) || $clients < 0 || $clients > 1000000000) reject(400, 'Invalid clients-served count');
        if ($clients === 0) $db->prepare('DELETE FROM clients_served WHERE office = ? AND period = ?')->execute([$office, $period]);
        else $db->prepare('INSERT INTO clients_served (office,period,clients) VALUES (?,?,?) ON DUPLICATE KEY UPDATE clients = VALUES(clients)')->execute([$office, $period, $clients]);
        send(200, ['ok' => true]);
    }
    if ($method === 'POST' && $action === 'findings') {
        $input = body(1600000);
        $title = clean_text($input['title'] ?? '', 250); $summary = clean_text($input['findings'] ?? '', 10000);
        $filename = clean_text($input['fileName'] ?? '', 250);
        $fileData = $input['fileData'] ?? '';
        if (!is_string($fileData) || strlen($fileData) > 1400000) reject(400, 'Invalid attachment');
        if ($title === '' || $summary === '') reject(400, 'Title and summary are required');
        if ($filename !== '' && !preg_match('/\.(pdf|doc|docx|xls|xlsx)$/i', $filename)) reject(400, 'Unsupported attachment type');
        if ($fileData !== '' && (!preg_match('~^data:(application/pdf|application/(vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet)|msword|vnd\.ms-excel|octet-stream));base64,[A-Za-z0-9+/=]+$~', $fileData) || strlen($fileData) > 1400000)) reject(400, 'Invalid attachment');
        $id = 'f' . bin2hex(random_bytes(10));
        $db->prepare('INSERT INTO findings (id,title,office,period,findings,actions,file_name,file_data) VALUES (?,?,?,?,?,?,?,?)')->execute([$id, $title, clean_text($input['office'] ?? '', 250), clean_text($input['period'] ?? '', 20), $summary, clean_text($input['actions'] ?? '', 10000), $filename, $fileData]);
        send(201, ['id' => $id]);
    }
    if ($method === 'POST' && $action === 'delete-finding') {
        $id = $_GET['id'] ?? '';
        if (!is_string($id) || !preg_match('/^[a-zA-Z0-9]+$/', $id)) reject(400, 'Invalid finding');
        $db->prepare('DELETE FROM findings WHERE id = ?')->execute([$id]);
        send(200, ['ok' => true]);
    }
    reject(404, 'API route not found');
} catch (ApiError $e) {
    send($e->getCode(), ['error' => $e->getMessage()]);
} catch (PDOException $e) {
    error_log('OME database error: ' . $e->getMessage());
    if ($e->getCode() === '42S02' && (str_contains($e->getMessage(), 'ome_users') || str_contains($e->getMessage(), 'user_sessions') || str_contains($e->getMessage(), 'ome_auth_setup_lock'))) {
        send(503, ['error' => 'Account tables are missing. Import db/auth_schema.sql into the OME database.']);
    }
    send(500, ['error' => 'Database error']);
} catch (Throwable $e) {
    error_log('OME API error: ' . $e->getMessage());
    send(500, ['error' => 'Server error']);
}
