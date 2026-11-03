<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
require_once __DIR__ . '/private/auth.php';
function pub_send(int $status, array $data): void { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE); exit; }
try {
    $config = require __DIR__ . '/private/config.php';
    $db = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_port'], $config['db_name']), $config['db_user'], $config['db_password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
    $user = ome_current_user($db);
    if (!$user) pub_send(401, ['error' => 'Please sign in to continue.']);
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET' && $action === 'data') {
        $rows = $db->query('SELECT id, publication_title, publication_date, publication_venue, author_name, school, college, department FROM scopus_publications ORDER BY id')->fetchAll();
        pub_send(200, ['rows' => $rows, 'canEdit' => $user['role'] === 'admin']);
    }
    if ($method !== 'POST') pub_send(404, ['error' => 'Route not found.']);
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== rtrim((string) ($config['app_origin'] ?? ''), '/')) pub_send(403, ['error' => 'Request origin is not allowed.']);
    if ($user['role'] !== 'admin') pub_send(403, ['error' => 'OME administrator access is required.']);
    if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) pub_send(415, ['error' => 'JSON body required.']);
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 400000) pub_send(413, ['error' => 'Request too large.']);
    $input = json_decode($raw, true);
    if (!is_array($input)) pub_send(400, ['error' => 'Invalid request.']);
    $id = $input['id'] ?? 0;
    if (!is_int($id) || $id < 0) pub_send(400, ['error' => 'Invalid record identifier.']);
    if ($action === 'delete') {
        if (!$id) pub_send(400, ['error' => 'Invalid record identifier.']);
        $q = $db->prepare('DELETE FROM scopus_publications WHERE id = ?'); $q->execute([$id]);
        if (!$q->rowCount()) pub_send(404, ['error' => 'Record not found.']);
        pub_send(200, ['ok' => true]);
    }
    if ($action === 'save-publication') {
        $authors = $input['authors'] ?? null;
        if (!is_array($authors) || count($authors) < 1 || count($authors) > 50 || array_keys($authors) !== range(0, count($authors) - 1)) pub_send(400, ['error' => 'Add between 1 and 50 authors.']);
        $readField = static function (array $source, string $name, int $limit): string {
            $value = $source[$name] ?? '';
            if (!is_string($value)) pub_send(400, ['error' => 'Invalid field value.']);
            $value = trim($value);
            if ((function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value)) > $limit) pub_send(400, ['error' => 'A field exceeds its maximum length.']);
            return $value;
        };
        $title = $readField($input, 'publication_title', 1000);
        $date = $readField($input, 'publication_date', 100);
        $venue = $readField($input, 'publication_venue', 1000);
        if ($title === '') pub_send(400, ['error' => 'Enter a publication title.']);
        $records = [];
        foreach ($authors as $author) {
            if (!is_array($author)) pub_send(400, ['error' => 'Invalid author record.']);
            $name = $readField($author, 'author_name', 255);
            if ($name === '') pub_send(400, ['error' => 'Enter a name for each author.']);
            $records[] = [$title, $date, $venue, $name, $readField($author, 'school', 500), $readField($author, 'college', 500), $readField($author, 'department', 500)];
        }
        $db->beginTransaction();
        $q = $db->prepare('INSERT INTO scopus_publications (publication_title, publication_date, publication_venue, author_name, school, college, department) VALUES (?, ?, ?, ?, ?, ?, ?)');
        foreach ($records as $record) $q->execute($record);
        $db->commit();
        pub_send(200, ['ok' => true, 'added' => count($records)]);
    }
    if ($action !== 'save') pub_send(404, ['error' => 'Route not found.']);
    $fields = ['publication_title' => 1000, 'publication_date' => 100, 'publication_venue' => 1000, 'author_name' => 255, 'school' => 500, 'college' => 500, 'department' => 500];
    $values = [];
    foreach ($fields as $name => $limit) {
        $value = $input[$name] ?? '';
        if (!is_string($value)) pub_send(400, ['error' => 'Invalid field value.']);
        $value = trim($value);
        if ((function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value)) > $limit) pub_send(400, ['error' => 'A field exceeds its maximum length.']);
        $values[] = $value;
    }
    if ($values[0] === '') pub_send(400, ['error' => 'Enter a publication title.']);
    if ($id) {
        $db->beginTransaction();
        $q = $db->prepare('SELECT publication_venue, author_name, school, college, department FROM scopus_publications WHERE id = ? FOR UPDATE'); $q->execute([$id]);
        $old = $q->fetch();
        if (!$old) { $db->rollBack(); pub_send(404, ['error' => 'Record not found.']); }
        if ($old['author_name'] !== '' && $values[3] === '') { $db->rollBack(); pub_send(400, ['error' => 'An existing author name cannot be cleared.']); }
        $original = $input['original_values'] ?? null;
        $sharedFields = ['publication_venue' => 2, 'author_name' => 3, 'school' => 4, 'college' => 5, 'department' => 6];
        if (!is_array($original)) { $db->rollBack(); pub_send(400, ['error' => 'Reload the page before editing records.']); }
        foreach ($sharedFields as $field => $i) {
            if (!isset($original[$field]) || !is_string($original[$field]) || $original[$field] !== $old[$field]) {
                $db->rollBack(); pub_send(409, ['error' => 'This record changed since you opened it. Reload and review it before saving.']);
            }
        }
        // Replace matching nonempty values independently for each shared field.
        foreach ($sharedFields as $field => $i) {
            if ($old[$field] !== '' && $values[$i] !== $old[$field]) {
                $q = $db->prepare('UPDATE scopus_publications SET ' . $field . ' = ? WHERE BINARY ' . $field . ' = BINARY ?');
                $q->execute([$values[$i], $old[$field]]);
            }
        }
        $q = $db->prepare('UPDATE scopus_publications SET publication_title=?, publication_date=?, publication_venue=?, author_name=?, school=?, college=?, department=? WHERE id=?');
        $q->execute([...$values, $id]);
        $db->commit();
    } else {
        $q = $db->prepare('INSERT INTO scopus_publications (publication_title, publication_date, publication_venue, author_name, school, college, department) VALUES (?, ?, ?, ?, ?, ?, ?)'); $q->execute($values);
    }
    pub_send(200, ['ok' => true]);
} catch (PDOException $e) {
    error_log('Publications database error: ' . $e->getMessage());
    pub_send($e->getCode() === '42S02' ? 503 : 500, ['error' => $e->getCode() === '42S02' ? 'Publication tables are not installed. Import db/publications_schema.sql and db/publications_seed.sql.' : 'Database error.']);
} catch (Throwable $e) { error_log('Publications API error: ' . $e->getMessage()); pub_send(500, ['error' => 'Server error.']); }
