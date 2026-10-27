<?php
declare(strict_types=1);

function ome_current_user(PDO $db): ?array {
    $token = $_COOKIE['ome_session'] ?? '';
    if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/', $token)) return null;
    $q = $db->prepare('SELECT u.id, u.full_name, u.email, u.role, u.category FROM user_sessions s JOIN ome_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND u.active = 1');
    $q->execute([hash('sha256', $token)]);
    $user = $q->fetch(PDO::FETCH_ASSOC);
    return $user ?: null;
}

function ome_public_user(?array $user): ?array {
    if ($user === null) return null;
    return ['id' => (int) $user['id'], 'fullName' => $user['full_name'], 'email' => $user['email'], 'role' => $user['role'], 'category' => $user['category']];
}

function ome_set_cookie(string $value, int $expires, array $config): void {
    setcookie('ome_session', $value, [
        'expires' => $expires, 'path' => '/',
        'secure' => str_starts_with((string) ($config['app_origin'] ?? ''), 'https://'),
        'httponly' => true, 'samesite' => 'Strict'
    ]);
}
