<?php
declare(strict_types=1);

// OME's independent licensure API. It shares OME's database and administrator
// session, but never opens a connection to the former PAPs website.
date_default_timezone_set('UTC');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

final class LicensureError extends RuntimeException {
    public function __construct(int $status, string $message) { parent::__construct($message, $status); }
}
require_once __DIR__ . '/private/auth.php';
function lic_fail(int $status, string $message): never { throw new LicensureError($status, $message); }
function lic_send(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
    exit;
}
function lic_body(): array {
    if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) lic_fail(415, 'JSON body required');
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 500000) lic_fail(413, 'Request too large');
    $raw = file_get_contents(PHP_SAPI === 'cli' ? 'php://stdin' : 'php://input');
    if ($raw === false || strlen($raw) > 500000) lic_fail(413, 'Request too large');
    try { $value = json_decode($raw, true, 512, JSON_THROW_ON_ERROR); }
    catch (JsonException) { lic_fail(400, 'Invalid JSON'); }
    if (!is_array($value)) lic_fail(400, 'JSON object required');
    return $value;
}
function lic_text(mixed $value, int $max): string {
    if (!is_string($value)) return '';
    $value = trim($value);
    if (function_exists('mb_strlen') && mb_strlen($value, 'UTF-8') > $max) lic_fail(400, 'Text is too long');
    if (!function_exists('mb_strlen') && strlen($value) > $max) lic_fail(400, 'Text is too long');
    return $value;
}
function lic_int(mixed $value, int $min = 0): int {
    if (!is_int($value) || $value < $min) lic_fail(400, 'Invalid number');
    return $value;
}
function lic_admin(PDO $db): bool {
    return (ome_current_user($db)['role'] ?? null) === 'admin';
}
function lic_exists(PDO $db, string $table, string $column, int $id): bool {
    $q = $db->prepare("SELECT 1 FROM $table WHERE $column = ?");
    $q->execute([$id]);
    return $q->fetchColumn() !== false;
}
function lic_topnotcher_values(array $input): array {
    $rank = lic_int($input['rank_position'] ?? null, 1);
    $name = lic_text($input['full_name'] ?? null, 255);
    if ($name === '') lic_fail(400, 'Topnotcher name is required');
    $rating = $input['rating'] ?? null;
    if ($rating === '') $rating = null;
    if ($rating !== null && (!is_numeric($rating) || (float) $rating < 0 || (float) $rating > 100)) lic_fail(400, 'Rating must be from 0 to 100');
    return [$rank, $name, $rating === null ? null : round((float) $rating, 2)];
}
function lic_period_label(mixed $value): string {
    $label = lic_text($value, 100);
    if (!preg_match('/^([A-Za-z]+(?:\s*(?:&|and|\/|-)\s*[A-Za-z]+)?)\s+((?:19|20)\d{2})$/i', $label, $matches)) {
        lic_fail(400, 'Enter an exam month and year, such as March 2026');
    }
    $months = ['jan', 'january', 'feb', 'february', 'mar', 'march', 'apr', 'april', 'may',
        'jun', 'june', 'jul', 'july', 'aug', 'august', 'sep', 'sept', 'september',
        'oct', 'october', 'nov', 'november', 'dec', 'december'];
    foreach (preg_split('/\s*(?:&|and|\/|-)\s*/i', $matches[1]) as $month) {
        if (!in_array(strtolower($month), $months, true)) lic_fail(400, 'Enter a valid exam month');
    }
    return $label;
}

try {
    $configFile = __DIR__ . '/private/config.php';
    if (!is_file($configFile)) lic_fail(503, 'OME database is not configured');
    $config = require $configFile;
    if (!is_array($config)) lic_fail(503, 'OME database configuration is invalid');
    $db = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_port'], $config['db_name']),
        $config['db_user'], $config['db_password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $db->exec("SET time_zone = '+00:00'");
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $action = $_GET['action'] ?? '';

    if ($method === 'GET' && $action === 'data') {
        $user = ome_current_user($db);
        if ($user === null) lic_fail(401, 'Please sign in to continue');
        $programs = $db->query('SELECT program_id, program_key, program_name, exam_title, sort_order, status FROM licensure_programs ORDER BY sort_order, program_name')->fetchAll();
        $periods = $db->query('SELECT period_id, program_id, exam_period_label, sort_order FROM licensure_exam_periods ORDER BY program_id, sort_order, period_id')->fetchAll();
        $results = $db->query('SELECT result_id, period_id, group_type, taker_type, passers, takers, rate FROM licensure_results ORDER BY period_id, result_id')->fetchAll();
        $topnotchers = $db->query('SELECT topnotcher_id, period_id, rank_position, full_name, rating FROM licensure_topnotchers ORDER BY period_id, rank_position, full_name')->fetchAll();
        lic_send(200, compact('programs', 'periods', 'results', 'topnotchers') + ['authenticated' => $user['role'] === 'admin']);
    }
    if ($method !== 'POST') lic_fail(404, 'Licensure route not found');
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== rtrim((string) ($config['app_origin'] ?? ''), '/')) lic_fail(403, 'Request origin is not allowed');
    if (!lic_admin($db)) lic_fail(401, 'Please sign in through OME Admin');
    $input = lic_body();

    if ($action === 'save-program') {
        $id = lic_int($input['program_id'] ?? 0);
        $key = lic_text($input['program_key'] ?? null, 50);
        $name = lic_text($input['program_name'] ?? null, 255);
        $title = lic_text($input['exam_title'] ?? null, 255);
        $order = lic_int($input['sort_order'] ?? 0);
        $status = $input['status'] ?? 'Active';
        if (!preg_match('/^[A-Za-z0-9_-]{2,50}$/', $key) || $name === '' || $title === '' || !in_array($status, ['Active', 'Inactive'], true)) lic_fail(400, 'Complete the program name, key, examination, and status');
        if ($id > 0) {
            $q = $db->prepare('UPDATE licensure_programs SET program_key=?, program_name=?, exam_title=?, sort_order=?, status=? WHERE program_id=?');
            $q->execute([$key, $name, $title, $order, $status, $id]);
            if (!lic_exists($db, 'licensure_programs', 'program_id', $id)) lic_fail(404, 'Program not found');
        } else {
            $q = $db->prepare('INSERT INTO licensure_programs (program_key,program_name,exam_title,sort_order,status) VALUES (?,?,?,?,?)');
            $q->execute([$key, $name, $title, $order, $status]);
            $id = (int) $db->lastInsertId();
        }
        lic_send(200, ['ok' => true, 'program_id' => $id]);
    }

    if ($action === 'save-period') {
        $id = lic_int($input['period_id'] ?? 0);
        $programId = lic_int($input['program_id'] ?? null, 1);
        $label = lic_period_label($input['exam_period_label'] ?? null);
        if (!lic_exists($db, 'licensure_programs', 'program_id', $programId)) lic_fail(404, 'Program not found');
        $duplicate = $db->prepare('SELECT 1 FROM licensure_exam_periods WHERE program_id=? AND exam_period_label=? AND period_id<>? LIMIT 1');
        $duplicate->execute([$programId, $label, $id]);
        if ($duplicate->fetchColumn()) lic_fail(409, 'This program already has an entry for that exam period');
        $metrics = $input['results'] ?? null;
        if (!is_array($metrics) || count($metrics) !== 4) lic_fail(400, 'Enter all four result groups');
        $validated = [];
        foreach (['MSU:First', 'MSU:Overall', 'National:First', 'National:Overall'] as $key) {
            $row = $metrics[$key] ?? null;
            if (!is_array($row)) lic_fail(400, 'Enter all four result groups');
            $passers = lic_int($row['passers'] ?? null);
            $takers = lic_int($row['takers'] ?? null);
            if ($passers > $takers) lic_fail(400, 'Passers cannot exceed takers');
            [$group, $type] = explode(':', $key);
            $validated[] = [$group, $type, $passers, $takers, $takers > 0 ? round($passers / $takers * 100, 2) : 0];
        }
        $top = $input['topnotchers'] ?? [];
        if (!is_array($top) || count($top) > 200) lic_fail(400, 'Too many topnotchers');
        $topValues = []; $names = [];
        foreach ($top as $row) {
            if (!is_array($row)) lic_fail(400, 'Invalid topnotcher');
            $values = lic_topnotcher_values($row);
            $lower = function_exists('mb_strtolower') ? mb_strtolower($values[1], 'UTF-8') : strtolower($values[1]);
            if (isset($names[$lower])) lic_fail(400, 'Topnotcher names must be unique within an exam period');
            $names[$lower] = true;
            $topValues[] = $values;
        }
        $db->beginTransaction();
        try {
            if ($id > 0) {
                $q = $db->prepare('SELECT program_id FROM licensure_exam_periods WHERE period_id = ? FOR UPDATE');
                $q->execute([$id]);
                $old = $q->fetchColumn();
                if ($old === false) lic_fail(404, 'Exam period not found');
                if ((int) $old !== $programId) lic_fail(400, 'The exam period belongs to another program');
                $db->prepare('UPDATE licensure_exam_periods SET exam_period_label=? WHERE period_id=?')->execute([$label, $id]);
                $db->prepare('DELETE FROM licensure_results WHERE period_id=?')->execute([$id]);
                $db->prepare('DELETE FROM licensure_topnotchers WHERE period_id=?')->execute([$id]);
            } else {
                $q = $db->prepare('INSERT INTO licensure_exam_periods (program_id,exam_period_label,sort_order) VALUES (?,?,0)');
                $q->execute([$programId, $label]);
                $id = (int) $db->lastInsertId();
            }
            $q = $db->prepare('INSERT INTO licensure_results (period_id,group_type,taker_type,passers,takers,rate) VALUES (?,?,?,?,?,?)');
            foreach ($validated as $row) $q->execute([$id, ...$row]);
            $q = $db->prepare('INSERT INTO licensure_topnotchers (period_id,rank_position,full_name,rating) VALUES (?,?,?,?)');
            foreach ($topValues as $row) $q->execute([$id, ...$row]);
            $db->commit();
        } catch (Throwable $e) { $db->rollBack(); throw $e; }
        lic_send(200, ['ok' => true, 'period_id' => $id]);
    }

    if ($action === 'delete-period') {
        $id = lic_int($input['period_id'] ?? null, 1);
        $q = $db->prepare('DELETE FROM licensure_exam_periods WHERE period_id=?');
        $q->execute([$id]);
        if ($q->rowCount() === 0) lic_fail(404, 'Exam period not found');
        lic_send(200, ['ok' => true]);
    }

    if ($action === 'save-topnotcher') {
        $id = lic_int($input['topnotcher_id'] ?? 0);
        $periodId = lic_int($input['period_id'] ?? null, 1);
        if (!lic_exists($db, 'licensure_exam_periods', 'period_id', $periodId)) lic_fail(404, 'Exam period not found');
        [$rank, $name, $rating] = lic_topnotcher_values($input);
        if ($id > 0) {
            $q = $db->prepare('UPDATE licensure_topnotchers SET rank_position=?,full_name=?,rating=?,period_id=? WHERE topnotcher_id=?');
            $q->execute([$rank, $name, $rating, $periodId, $id]);
            if (!lic_exists($db, 'licensure_topnotchers', 'topnotcher_id', $id)) lic_fail(404, 'Topnotcher not found');
        } else {
            $q = $db->prepare('INSERT INTO licensure_topnotchers (period_id,rank_position,full_name,rating) VALUES (?,?,?,?)');
            $q->execute([$periodId, $rank, $name, $rating]);
            $id = (int) $db->lastInsertId();
        }
        lic_send(200, ['ok' => true, 'topnotcher_id' => $id]);
    }

    if ($action === 'delete-topnotcher') {
        $id = lic_int($input['topnotcher_id'] ?? null, 1);
        $q = $db->prepare('DELETE FROM licensure_topnotchers WHERE topnotcher_id=?');
        $q->execute([$id]);
        if ($q->rowCount() === 0) lic_fail(404, 'Topnotcher not found');
        lic_send(200, ['ok' => true]);
    }
    lic_fail(404, 'Licensure route not found');
} catch (LicensureError $e) {
    lic_send($e->getCode(), ['error' => $e->getMessage()]);
} catch (PDOException $e) {
    error_log('OME licensure database error: ' . $e->getMessage());
    if ($e->getCode() === '42S02' && (str_contains($e->getMessage(), 'ome_users') || str_contains($e->getMessage(), 'user_sessions'))) lic_send(503, ['error' => 'Account tables are missing. Import db/auth_schema.sql into the OME database.']);
    if ($e->getCode() === '42S02') lic_send(503, ['error' => 'Licensure tables are not installed in the OME database yet']);
    if ($e->getCode() === '23000') lic_send(409, ['error' => 'This program key or topnotcher name already exists']);
    lic_send(500, ['error' => 'Database error']);
} catch (Throwable $e) {
    error_log('OME licensure API error: ' . $e->getMessage());
    lic_send(500, ['error' => 'Server error']);
}
