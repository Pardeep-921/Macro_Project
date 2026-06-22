-- Phase 4: Customer order headers and order item lines.
-- Manual migration note:
-- The current app already has `orders` and `order_items`, but their columns do not match this target design.
-- Back up or rename existing order tables before applying a strict target schema.

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(100) UNIQUE NOT NULL,
    company_id INT NOT NULL,
    requisition_no VARCHAR(100),
    po_date DATE,
    destination VARCHAR(150) NOT NULL,
    net_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    order_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    review_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
    INDEX idx_order_no (order_no),
    INDEX idx_order_company (company_id),
    INDEX idx_order_status (order_status),
    CONSTRAINT chk_order_status CHECK (order_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'DISPATCHED'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    size_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES item_sizes(id) ON DELETE RESTRICT,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_item (item_id),
    CONSTRAINT chk_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

