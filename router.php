<?php
// Local PHP development server: expose only the same files intended for web hosting.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if ($path === '/' || $path === '/index.html' || $path === '/api.php' || preg_match('~^/(css|js|img)/[a-zA-Z0-9._-]+$~', $path)) return false;
http_response_code(404);
echo 'Not found';
