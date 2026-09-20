CREATE DATABASE IF NOT EXISTS mobiles2
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mobiles2;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_tokens_hash (token_hash),
  KEY idx_auth_tokens_user (user_id),
  KEY idx_auth_tokens_expiry (expires_at),
  CONSTRAINT fk_auth_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO users (email, name, password_hash)
VALUES (
  'admin@mobiles2.local',
  'Administrador',
  '$2y$10$2Zda5xl7p9BZYeAcelUKQeN67vkEk5GtIu6sp7QU8Pol3UgNEFEHS'
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  names VARCHAR(150) NOT NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(190) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contact_messages_email (email),
  KEY idx_contact_messages_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS regions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(80) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_regions_slug (slug),
  UNIQUE KEY uq_regions_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS urban_legends (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  region_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  summary TEXT NOT NULL,
  content LONGTEXT NOT NULL,
  source VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_urban_legends_region (region_id),
  CONSTRAINT fk_urban_legends_region
    FOREIGN KEY (region_id) REFERENCES regions (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO regions (slug, name, description)
VALUES
  ('norteamerica', 'Norteamerica', 'Relatos de carreteras, pueblos abandonados y apariciones nocturnas.'),
  ('latinoamerica', 'Latinoamerica', 'Leyendas populares, espiritus protectores y misterios de cada comunidad.'),
  ('europa', 'Europa', 'Castillos, bosques antiguos y relatos transmitidos durante generaciones.'),
  ('asia', 'Asia', 'Historias urbanas modernas mezcladas con mitos y tradiciones ancestrales.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO urban_legends (region_id, title, summary, content)
SELECT id,
       'El autoestopista fantasma',
       'Una persona aparece de noche en una carretera y pide que la lleven a casa.',
       'Cuando el conductor llega al destino indicado, el pasajero ha desaparecido. En algunas versiones, la familia confirma que murio anos atras.'
FROM regions
WHERE slug = 'norteamerica'
  AND NOT EXISTS (
    SELECT 1 FROM urban_legends WHERE title = 'El autoestopista fantasma'
  );

INSERT INTO urban_legends (region_id, title, summary, content)
SELECT id,
       'La Llorona',
       'Una figura vestida de blanco recorre rios y calles durante la noche.',
       'La historia cuenta que busca a sus hijos y que su lamento anuncia una aparicion cercana. Es una de las leyendas mas extendidas de la region.'
FROM regions
WHERE slug = 'latinoamerica'
  AND NOT EXISTS (
    SELECT 1 FROM urban_legends WHERE title = 'La Llorona'
  );

INSERT INTO urban_legends (region_id, title, summary, content)
SELECT id,
       'La dama de blanco',
       'Una aparicion se presenta cerca de castillos, puentes y caminos antiguos.',
       'Segun el lugar, la dama puede ser un espiritu que protege un secreto o una advertencia para quienes viajan solos durante la noche.'
FROM regions
WHERE slug = 'europa'
  AND NOT EXISTS (
    SELECT 1 FROM urban_legends WHERE title = 'La dama de blanco'
  );

INSERT INTO urban_legends (region_id, title, summary, content)
SELECT id,
       'Kuchisake-onna',
       'Una mujer con cubrebocas pregunta a los caminantes si la consideran hermosa.',
       'La leyenda japonesa dice que su respuesta determina la siguiente pregunta y que la aparicion persigue a quienes intentan escapar.'
FROM regions
WHERE slug = 'asia'
  AND NOT EXISTS (
    SELECT 1 FROM urban_legends WHERE title = 'Kuchisake-onna'
  );

/*INSERT INTO urban_legends (region_id, title, summary, content)
SELECT id,
       'La rata con tinner',
       'Es la rata con tinner, que mas puedo decir',
       ' Hace un tiempo estuve rentando un depa junto con un primo, pero el vato estaba bien pinche loco sexual, seguido llegaba con lavacoches, inditos, morritos vendechicles, indigentes y hasta centroamericanos de las vías del tren. Mi primo, muy buen samaritano, les daba de tragar, los dejaba bañarse, o hasta les rolaba ropa o tenis; todo eso a cambio de cojer o mínimo dejarse mamar la riata.

Admito que al principio no me gustaba mucho la idea, y prefería encerrarme en mi cuarto oyendo música, fumarme un porro o lo que fuera, menos oler a los vagabundos. Pero mi primo iba trayendo weyes más cabrones, yonkis, dementes maltripeados y pues me pedía que lo cuidara por si se ponían agresivos, además que él se apendejaba bastante con los poppers jajaja. Acepté de mala gana, aunque le fui agarrando el gusto y el morbo de ver a cabrones de la calle cojerse sin condón a mi primo.

Una vez, estando yo en la cocina, llegó mi primo y me dio un tufo culerisimo pero cabrooon. Ya pensaba yo que se había traído un cadáver o algo así, cuando me asomo y trajo al pinche vagabundo mas pinche yonki llevado a la verga que se pueden imaginar. Todo mugroso, piojoso, con el pelo hecho rastas como de mugre y mierda, tembloroso con la mirada perdida, y con una chamarra dura de tanta suciedad.

Le dimos una maruchan al wey, y mientras tragaba le dije a mi primo "numaaa te pasas de cabron" y nomas me dice "jaja ya se". En eso el vato este se mete la mano a la chamarra y agarro mi fusca por si las moscas. Pero nel, el wey nomas saca una pinche ratota muerta toda tiesa, la empapa de tiner y se pone a inhalarla como estopa. Yo dije "numaaa que pex?!", y mi primo ya estaba bien caliente, como que le prendió esa chingadera y se aventó así a mamarle la verga, sin siquiera bañarlo.

El mugroso estaba ahí de patas abiertas inhalando su ratota, mientras mi primo le quitó el pantalón todo mugriento, y le sacó la verga. La neta la tenía enorme, quizá hasta estuviera rica sin todas esas capas de esmegma ni las ladillas que adornaban sus rastas púbicas. Mi primo se tragaba toda la riata y yo no sabia si excitarme o vomitar, así que opté por fumarme unos porritos.

Mi primo, todo caliente, se desnudó por completo y le ofreció el culo al malviviente, quien sin pensárselo se puso a mamarselo. El pasivote de mi primo estaba en pleno éxtasis, en un estado de trance al sentir su culo mimado por el hocico del indigente. No tardó mucho el vato en ensartarle su macanota, toda dura y sin condón, haciendo gemir y gritar a mi primo como puta en celo, todo entrado en los poppers.

Estaban en el mete y saca, cuando el wey saca su rata, le da un jalón profundo y toma que se la mete en el ano a mi primazo numaaa. Y dale que se lo sigue cojiendo más duro, empujandole la rata al recto. Una cojida cada vez más brutal, y luego de un rato ya el culo de mi primo escurriendo de mecos. El cabron este luego de sacar su riata ya aguada, se chinga lo último de la maruchan y me empieza a gritar. No se ni que vergas balbuceaba, y ya andaba yo bien mariguas, así que nomas le apunté con la fusca y lo mandé corriendito a chingar a su padre. El vato salió todo escamado que ni tiempo tuvo de ponerse los pantalones jajaja. Y pos yo me quedé ahí dormido.

Al rato me despierto con los gritos y quejidos de mi puto primo. Estaba chille y chille que le dolía el culo y las tripas, ni se acordaba de todo lo que le hizo su amante. Yo de buena onda lo ayude para llevarlo al baño, que acabara de cagar los mecos atorados y numaaa que le sale la pinche rata del culo, pero toda despedazada y llena de gusanos. Mi primo casi se desmaya del susto y me pidió que lo llevara a la clínica pa que le hicieran un lavado jajaja pero bien valiente que se sentía en su calentura jeje es neta.'
FROM regions
WHERE slug = 'latinoamerica'
  AND NOT EXISTS (
    SELECT 1 FROM urban_legends WHERE title = 'La rata con tinner'
  );*/
