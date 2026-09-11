<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function requestData(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function getMessageId(): ?int
{
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    return $id !== false && $id !== null && $id > 0 ? $id : null;
}

function validateMessage(array $data, bool $partial = false): array
{
    $errors = [];

    if (!$partial || array_key_exists('names', $data)) {
        if (!is_string($data['names'] ?? null) || trim($data['names']) === '') {
            $errors['names'] = 'El nombre es obligatorio.';
        }
    }

    if (!$partial || array_key_exists('email', $data)) {
        if (!filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'El correo no es valido.';
        }
    }

    if (!$partial || array_key_exists('message', $data)) {
        if (!is_string($data['message'] ?? null) || trim($data['message']) === '') {
            $errors['message'] = 'El mensaje es obligatorio.';
        }
    }

    return $errors;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    if ($method === 'GET') {
        $id = getMessageId();

        if ($id !== null) {
            $statement = $pdo->prepare('SELECT * FROM contact_messages WHERE id = :id');
            $statement->execute(['id' => $id]);
            $message = $statement->fetch();

            if (!$message) {
                respond(['success' => false, 'message' => 'Mensaje no encontrado.'], 404);
            }

            respond(['success' => true, 'data' => $message]);
        }

        $statement = $pdo->query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        respond(['success' => true, 'data' => $statement->fetchAll()]);
    }

    if ($method === 'POST') {
        $data = requestData();
        $errors = validateMessage($data);

        if ($errors) {
            respond(['success' => false, 'message' => 'Datos invalidos.', 'errors' => $errors], 422);
        }

        $statement = $pdo->prepare(
            'INSERT INTO contact_messages (names, phone, email, message)
             VALUES (:names, :phone, :email, :message)'
        );
        $statement->execute([
            'names' => trim($data['names']),
            'phone' => trim((string) ($data['phone'] ?? '')) ?: null,
            'email' => trim($data['email']),
            'message' => trim($data['message']),
        ]);

        $id = (int) $pdo->lastInsertId();
        respond(['success' => true, 'id' => $id, 'message' => 'Mensaje guardado.'], 201);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        $id = getMessageId();
        if ($id === null) {
            respond(['success' => false, 'message' => 'El parametro id es obligatorio.'], 400);
        }

        $data = requestData();
        $errors = validateMessage($data, $method === 'PATCH');
        if ($errors) {
            respond(['success' => false, 'message' => 'Datos invalidos.', 'errors' => $errors], 422);
        }

        $fields = [];
        $params = ['id' => $id];
        foreach (['names', 'phone', 'email', 'message'] as $field) {
            if ($method === 'PUT' || array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[$field] = trim((string) ($data[$field] ?? '')) ?: null;
            }
        }

        if (!$fields) {
            respond(['success' => false, 'message' => 'No hay campos para actualizar.'], 422);
        }

        $statement = $pdo->prepare(
            'UPDATE contact_messages SET ' . implode(', ', $fields) . ' WHERE id = :id'
        );
        $statement->execute($params);
        respond(['success' => true, 'message' => 'Mensaje actualizado.']);
    }

    if ($method === 'DELETE') {
        $id = getMessageId();
        if ($id === null) {
            respond(['success' => false, 'message' => 'El parametro id es obligatorio.'], 400);
        }

        $statement = $pdo->prepare('DELETE FROM contact_messages WHERE id = :id');
        $statement->execute(['id' => $id]);
        respond(['success' => true, 'message' => 'Mensaje eliminado.']);
    }

    respond(['success' => false, 'message' => 'Metodo no permitido.'], 405);
} catch (PDOException $exception) {
    respond(['success' => false, 'message' => 'Error de base de datos.'], 500);
}
