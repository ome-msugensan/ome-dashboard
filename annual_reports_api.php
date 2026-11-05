<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
require_once __DIR__ . '/private/auth.php';
function ar_send(int $status, array $data): void { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE); exit; }
try {
    $config = require __DIR__ . '/private/config.php';
    $db = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_port'], $config['db_name']), $config['db_user'], $config['db_password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
    $user = ome_current_user($db);
    if (!$user) ar_send(401, ['error' => 'Please sign in to continue.']);
    $action = $_GET['action'] ?? '';
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && $action === 'data') {
        $rows = $db->query('SELECT id, title, report_year, file_type, drive_file_id FROM annual_reports ORDER BY report_year DESC, id DESC')->fetchAll();
        ar_send(200, ['rows' => $rows, 'canEdit' => $user['role'] === 'admin', 'driveApiKey' => (string) ($config['google_drive_browser_api_key'] ?? ''), 'driveManagerUrl' => (string) ($config['annual_reports_drive_manager_url'] ?? '')]);
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') ar_send(404, ['error' => 'Route not found.']);
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== rtrim((string) ($config['app_origin'] ?? ''), '/')) ar_send(403, ['error' => 'Request origin is not allowed.']);
    if ($user['role'] !== 'admin') ar_send(403, ['error' => 'OME administrator access is required.']);
    if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) ar_send(415, ['error' => 'JSON body required.']);
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 8192) ar_send(413, ['error' => 'Request too large.']);
    $input = json_decode($raw, true);
    if (!is_array($input)) ar_send(400, ['error' => 'Invalid request.']);
    $id = $input['id'] ?? 0;
    if (!is_int($id) || $id < 0) ar_send(400, ['error' => 'Invalid report identifier.']);
    if ($action === 'delete') {
        if (!$id) ar_send(400, ['error' => 'Invalid report identifier.']);
        $q = $db->prepare('DELETE FROM annual_reports WHERE id = ?'); $q->execute([$id]);
        if (!$q->rowCount()) ar_send(404, ['error' => 'Report not found.']);
        ar_send(200, ['ok' => true]);
    }
    if ($action !== 'save') ar_send(404, ['error' => 'Route not found.']);
    $title = is_string($input['title'] ?? null) ? trim($input['title']) : '';
    $fileId = is_string($input['drive_file_id'] ?? null) ? $input['drive_file_id'] : '';
    $type = $input['file_type'] ?? '';
    $year = $input['report_year'] ?? null;
    if ($title === '' || (function_exists('mb_strlen') ? mb_strlen($title, 'UTF-8') : strlen($title)) > 255) ar_send(400, ['error' => 'Enter a report title of at most 255 characters.']);
    if (!preg_match('/^[A-Za-z0-9_-]{10,200}$/D', $fileId)) ar_send(400, ['error' => 'Enter a valid Google Drive link.']);
    if ($type !== 'pdf') ar_send(400, ['error' => 'Only PDF reports can be added.']);
    if ($year !== null && (!is_int($year) || $year < 1900 || $year > 2100)) ar_send(400, ['error' => 'Enter a valid year between 1900 and 2100.']);
    if ($id) {
        $q = $db->prepare('UPDATE annual_reports SET title=?, report_year=?, file_type=?, drive_file_id=? WHERE id=?'); $q->execute([$title, $year, $type, $fileId, $id]);
    } else {
        $q = $db->prepare('INSERT INTO annual_reports (title, report_year, file_type, drive_file_id) VALUES (?, ?, ?, ?)'); $q->execute([$title, $year, $type, $fileId]);
    }
    ar_send(200, ['ok' => true]);
} catch (Throwable $error) {
    error_log('Annual reports: ' . $error->getMessage());
    ar_send(500, ['error' => 'The annual reports library could not be loaded. Check that its database table is installed.']);
}
