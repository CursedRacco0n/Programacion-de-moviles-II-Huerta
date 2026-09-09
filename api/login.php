<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
$plainPassword = $data['password'] ?? '';

if (!$email || !is_string($plainPassword) || $plainPassword === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Correo y contraseña son obligatorios.']);
    exit;
}

$statement = $pdo->prepare(
    'SELECT id, email, name, password_hash FROM users WHERE email = :email AND is_active = 1 LIMIT 1'
);
$statement->execute(['email' => $email]);
$user = $statement->fetch();

if (!$user || !password_verify($plainPassword, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Correo o contraseña incorrectos.']);
    exit;
}

$plainToken = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
$tokenHash = hash('sha256', $plainToken);
$expiresAt = (new DateTimeImmutable('+8 hours'))->format('Y-m-d H:i:s');

$statement = $pdo->prepare(
    'INSERT INTO auth_tokens (user_id, token_hash, expires_at) VALUES (:user_id, :token_hash, :expires_at)'
);
$statement->execute([
    'user_id' => $user['id'],
    'token_hash' => $tokenHash,
    'expires_at' => $expiresAt,
]);

echo json_encode([
    'success' => true,
    'token' => $plainToken,
    'user' => [
        'id' => (int) $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
    ],
]);
