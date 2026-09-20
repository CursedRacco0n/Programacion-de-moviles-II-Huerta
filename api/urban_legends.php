<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(['success' => false, 'message' => 'Metodo no permitido.'], 405);
}

$regionSlug = trim((string) ($_GET['region'] ?? ''));
if ($regionSlug === '') {
    respond(['success' => false, 'message' => 'El parametro region es obligatorio.'], 400);
}

try {
    $statement = $pdo->prepare(
        'SELECT
            ul.id,
            r.slug AS region,
            r.name AS origin,
            ul.title,
            ul.summary,
            ul.content AS details,
            ul.source,
            ul.created_at,
            ul.updated_at
         FROM urban_legends ul
         INNER JOIN regions r ON r.id = ul.region_id
         WHERE r.slug = :region
         ORDER BY ul.created_at ASC
         LIMIT 1'
    );
    $statement->execute(['region' => $regionSlug]);
    $legend = $statement->fetch();

    if (!$legend) {
        respond(['success' => false, 'message' => 'No hay leyendas para la region seleccionada.'], 404);
    }

    respond(['success' => true, 'data' => $legend]);
} catch (PDOException $exception) {
    respond(['success' => false, 'message' => 'Error de base de datos.'], 500);
}
