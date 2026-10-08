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

try {
    $statement = $pdo->query(
        'SELECT
            r.slug AS region,
            r.name AS origin,
            COUNT(ul.id) AS legend_count
         FROM regions r
         LEFT JOIN urban_legends ul ON ul.region_id = r.id
         GROUP BY r.id, r.slug, r.name
         ORDER BY legend_count DESC, r.name ASC'
    );

    $regions = array_map(static function (array $region): array {
        $region['legend_count'] = (int) $region['legend_count'];
        return $region;
    }, $statement->fetchAll());

    respond([
        'success' => true,
        'data' => $regions,
        'total_legends' => array_sum(array_column($regions, 'legend_count')),
    ]);
} catch (PDOException $exception) {
    respond(['success' => false, 'message' => 'Error de base de datos.'], 500);
}
