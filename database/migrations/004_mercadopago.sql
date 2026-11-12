USE autopart_pro;

-- Compatible con bases creadas antes de agregar Mercado Pago. Conserva WOMPI
-- solo para las ventas históricas; la aplicación ya no crea ventas WOMPI.
ALTER TABLE sales
  MODIFY COLUMN payment_method ENUM('CASH','MERCADOPAGO','WOMPI') NOT NULL DEFAULT 'CASH',
  MODIFY COLUMN status ENUM('pending','paid','declined','cancelled') NOT NULL DEFAULT 'pending';

-- Las tablas de pagos y eventos ya existentes son genéricas y sirven para ambos proveedores.
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  sale_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(40) NOT NULL,
  provider_reference VARCHAR(120) NOT NULL,
  provider_transaction_id VARCHAR(120) NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'COP',
  status ENUM('pending','approved','declined','error') NOT NULL DEFAULT 'pending',
  environment ENUM('test','production') NOT NULL DEFAULT 'test',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
  UNIQUE KEY uq_payment_reference (provider, provider_reference),
  INDEX idx_payment_transaction (provider_transaction_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider VARCHAR(40) NOT NULL,
  event_checksum CHAR(64) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_event (provider, event_checksum)
) ENGINE=InnoDB;
