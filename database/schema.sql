CREATE DATABASE IF NOT EXISTS namii_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE namii_db;

-- USUARIOS
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CLIENTE', 'VENDEDOR') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ESTABLECIMIENTOS
CREATE TABLE establishments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    description VARCHAR(255) NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    cover_photo_url VARCHAR(500) NULL,
    manual_status ENUM('OPEN', 'CLOSED') NULL,
    manual_status_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_establishment_category (category),
    INDEX idx_establishment_location (latitude, longitude)
) ENGINE=InnoDB;

-- HORARIOS
CREATE TABLE business_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    day_of_week TINYINT NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    opens_at TIME NULL,
    closes_at TIME NULL,

    UNIQUE KEY uq_establishment_day (
        establishment_id,
        day_of_week
    ),

    CONSTRAINT chk_day_of_week
        CHECK (day_of_week BETWEEN 1 AND 7),

    FOREIGN KEY (establishment_id)
        REFERENCES establishments(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- PRODUCTOS
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(20) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    photo_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_product_price CHECK (price >= 0),

    FOREIGN KEY (establishment_id)
        REFERENCES establishments(id)
        ON DELETE CASCADE,

    INDEX idx_product_menu (establishment_id, category)
) ENGINE=InnoDB;

-- FAVORITOS
CREATE TABLE favorites (
    user_id INT NOT NULL,
    establishment_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, establishment_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (establishment_id)
        REFERENCES establishments(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- CALIFICACIONES
CREATE TABLE ratings (
    user_id INT NOT NULL,
    establishment_id INT NOT NULL,
    stars TINYINT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, establishment_id),

    CONSTRAINT chk_rating_stars
        CHECK (stars BETWEEN 1 AND 5),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (establishment_id)
        REFERENCES establishments(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;