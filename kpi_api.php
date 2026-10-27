<?php
declare(strict_types=1);

// University KPI Monitoring shares OME's account session and database, but has
// its own tables and endpoints, separate from survey and licensure records.
date_default_timezone_set('UTC');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
require_once __DIR__ . '/private/auth.php';

final class KpiError extends RuntimeException {
    public function __construct(int $status, string $message) { parent::__construct($message, $status); }
}
function kpi_fail(int $status, string $message): void { throw new KpiError($status, $message); }
function kpi_send(int $status, array $data): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
    exit;
}
function kpi_body(): array {
    if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) kpi_fail(415, 'JSON body required');
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 30000) kpi_fail(413, 'Request too large');
    $raw = file_get_contents(PHP_SAPI === 'cli' ? 'php://stdin' : 'php://input');
    if ($raw === false || strlen($raw) > 30000) kpi_fail(413, 'Request too large');
    try { $value = json_decode($raw, false, 32, JSON_THROW_ON_ERROR); }
    catch (JsonException) { kpi_fail(400, 'Invalid JSON'); }
    if (!is_object($value)) kpi_fail(400, 'JSON object required');
    return (array) $value;
}
function kpi_text(mixed $value, int $max): string {
    if (!is_string($value)) kpi_fail(400, 'Invalid text field');
    $value = trim($value);
    $length = function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
    if ($length > $max) kpi_fail(400, 'Text exceeds the allowed length');
    return $value;
}
function kpi_id(mixed $value, int $minimum = 0): int {
    if (!is_int($value) || $value < $minimum) kpi_fail(400, 'Invalid record identifier');
    return $value;
}

try {
    $configFile = __DIR__ . '/private/config.php';
    if (!is_file($configFile)) kpi_fail(503, 'OME database is not configured');
    $config = require $configFile;
    if (!is_array($config)) kpi_fail(503, 'OME database configuration is invalid');
    $db = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_port'], $config['db_name']),
        $config['db_user'], $config['db_password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $db->exec("SET time_zone = '+00:00'");
    $user = ome_current_user($db);
    if ($user === null) kpi_fail(401, 'Please sign in to continue');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $action = $_GET['action'] ?? '';

    if ($method === 'GET' && $action === 'data') {
        $directions = $db->query('SELECT direction_id, direction_number, title FROM university_kpi_directions ORDER BY direction_number')->fetchAll();
        $indicators = $db->query('SELECT indicator_id, direction_id, indicator_name, baseline_2025, baseline_note, remarks, sort_order, updated_at, target_2026, actual_2026, actual_as_of, target_2027, target_2028, target_2029, target_2030 FROM university_kpi_indicators ORDER BY direction_id, sort_order, indicator_id')->fetchAll();
        $years = $db->query('SELECT indicator_id, report_year, target_value, actual_value, actual_as_of, year_note, updated_at FROM university_kpi_yearly ORDER BY report_year, indicator_id')->fetchAll();
        // Keep source targets visible if the annual table was created before its copy statements ran.
        // An existing annual row, even one intentionally cleared, always takes precedence.
        $existingYears = [];
        foreach ($years as $row) $existingYears[$row['indicator_id'] . ':' . $row['report_year']] = true;
        foreach ($indicators as &$indicator) {
            foreach (range(2026, 2030) as $year) {
                $key = $indicator['indicator_id'] . ':' . $year;
                if (!isset($existingYears[$key])) {
                    $years[] = [
                        'indicator_id' => $indicator['indicator_id'],
                        'report_year' => $year,
                        'target_value' => $indicator['target_' . $year],
                        'actual_value' => $year === 2026 ? $indicator['actual_2026'] : '',
                        'actual_as_of' => $year === 2026 ? $indicator['actual_as_of'] : '',
                        'year_note' => '',
                        'updated_at' => null
                    ];
                }
                unset($indicator['target_' . $year]);
            }
            unset($indicator['actual_2026'], $indicator['actual_as_of']);
        }
        unset($indicator);
        kpi_send(200, ['directions' => $directions, 'indicators' => $indicators, 'years' => $years, 'canEdit' => $user['role'] === 'admin']);
    }
    if ($method !== 'POST') kpi_fail(404, 'KPI route not found');
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== rtrim((string) ($config['app_origin'] ?? ''), '/')) kpi_fail(403, 'Request origin is not allowed');
    if ($user['role'] !== 'admin') kpi_fail(403, 'OME administrator access is required');
    $input = kpi_body();

    if ($action === 'save-direction') {
        $id = kpi_id($input['direction_id'] ?? null, 1);
        $title = kpi_text($input['title'] ?? null, 255);
        if ($title === '') kpi_fail(400, 'Enter a strategic direction title');
        $q = $db->prepare('UPDATE university_kpi_directions SET title = ? WHERE direction_id = ?');
        $q->execute([$title, $id]);
        $exists = $db->prepare('SELECT 1 FROM university_kpi_directions WHERE direction_id = ?');
        $exists->execute([$id]);
        if (!$exists->fetchColumn()) kpi_fail(404, 'Strategic direction not found');
        kpi_send(200, ['ok' => true, 'direction_id' => $id]);
    }

    if ($action === 'save-indicator') {
        $id = kpi_id($input['indicator_id'] ?? 0);
        $directionId = kpi_id($input['direction_id'] ?? null, 1);
        $exists = $db->prepare('SELECT 1 FROM university_kpi_directions WHERE direction_id = ?');
        $exists->execute([$directionId]);
        if (!$exists->fetchColumn()) kpi_fail(404, 'Strategic direction not found');
        $fields = [
            'indicator_name' => 255, 'baseline_2025' => 1000,
            'baseline_note' => 3000, 'remarks' => 5000
        ];
        $values = [];
        foreach ($fields as $field => $max) $values[$field] = kpi_text($input[$field] ?? '', $max);
        if ($values['indicator_name'] === '') kpi_fail(400, 'Enter a KPI name');
        $sortOrder = kpi_id($input['sort_order'] ?? 0);
        $columns = array_keys($fields);
        if ($id > 0) {
            $q = $db->prepare('SELECT 1 FROM university_kpi_indicators WHERE indicator_id = ?');
            $q->execute([$id]);
            if (!$q->fetchColumn()) kpi_fail(404, 'KPI record not found');
            $set = implode(', ', array_map(static fn($name) => "$name = ?", $columns));
            $q = $db->prepare("UPDATE university_kpi_indicators SET direction_id = ?, $set, sort_order = ?, updated_by = ? WHERE indicator_id = ?");
            $q->execute([$directionId, ...array_values($values), $sortOrder, (int) $user['id'], $id]);
        } else {
            // Retain blank legacy columns for compatibility with the original KPI table.
            // Year-specific values live in university_kpi_yearly from this version on.
            $legacyColumns = ['target_2026', 'actual_2026', 'actual_as_of', 'target_2027', 'target_2028', 'target_2029', 'target_2030'];
            $names = implode(', ', array_merge($columns, $legacyColumns));
            $placeholders = implode(', ', array_fill(0, count($columns) + count($legacyColumns), '?'));
            $q = $db->prepare("INSERT INTO university_kpi_indicators (direction_id, $names, sort_order, updated_by) VALUES (?, $placeholders, ?, ?)");
            $q->execute([$directionId, ...array_values($values), ...array_fill(0, count($legacyColumns), ''), $sortOrder, (int) $user['id']]);
            $id = (int) $db->lastInsertId();
        }
        kpi_send(200, ['ok' => true, 'indicator_id' => $id]);
    }
    if ($action === 'save-year') {
        $id = kpi_id($input['indicator_id'] ?? null, 1);
        $year = kpi_id($input['report_year'] ?? null, 2026);
        if ($year > 2100) kpi_fail(400, 'Reporting year must be 2100 or earlier');
        $target = kpi_text($input['target_value'] ?? null, 500);
        $actual = kpi_text($input['actual_value'] ?? null, 1000);
        $asOf = kpi_text($input['actual_as_of'] ?? null, 150);
        $note = kpi_text($input['year_note'] ?? null, 5000);
        $q = $db->prepare('SELECT 1 FROM university_kpi_indicators WHERE indicator_id = ?');
        $q->execute([$id]);
        if (!$q->fetchColumn()) kpi_fail(404, 'KPI record not found');
        $db->beginTransaction();
        try {
            $q = $db->prepare('INSERT INTO university_kpi_yearly (indicator_id, report_year, target_value, actual_value, actual_as_of, year_note, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE target_value = VALUES(target_value), actual_value = VALUES(actual_value), actual_as_of = VALUES(actual_as_of), year_note = VALUES(year_note), updated_by = VALUES(updated_by)');
            $q->execute([$id, $year, $target, $actual, $asOf, $note, (int) $user['id']]);
            if ($year >= 2026 && $year <= 2030) {
                $targetColumn = 'target_' . $year;
                $legacy = $year === 2026
                    ? "UPDATE university_kpi_indicators SET $targetColumn = ?, actual_2026 = ?, actual_as_of = ? WHERE indicator_id = ?"
                    : "UPDATE university_kpi_indicators SET $targetColumn = ? WHERE indicator_id = ?";
                $q = $db->prepare($legacy);
                $q->execute($year === 2026 ? [$target, $actual, $asOf, $id] : [$target, $id]);
            }
            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }
        kpi_send(200, ['ok' => true, 'indicator_id' => $id, 'report_year' => $year]);
    }
    kpi_fail(404, 'KPI route not found');
} catch (KpiError $e) {
    kpi_send($e->getCode(), ['error' => $e->getMessage()]);
} catch (PDOException $e) {
    error_log('OME KPI database error: ' . $e->getMessage());
    if ($e->getCode() === '42S02') {
        $file = str_contains($e->getMessage(), 'university_kpi_yearly')
            ? 'db/university_kpi_yearly_migration.sql'
            : 'db/university_kpi_schema.sql';
        kpi_send(503, ['error' => 'University KPI tables are not installed. Import ' . $file . ' into the OME database.']);
    }
    kpi_send(500, ['error' => 'Database error']);
} catch (Throwable $e) {
    error_log('OME KPI API error: ' . $e->getMessage());
    kpi_send(500, ['error' => 'Server error']);
}
