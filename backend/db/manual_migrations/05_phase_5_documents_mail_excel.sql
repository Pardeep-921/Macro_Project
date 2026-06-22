-- Phase 5: Supply challans, dispatch tracking, and reporting/export metadata.
-- Manual migration note:
-- The current app already has `supply_challans`, but the target roadmap links challans to orders, companies, and carriers.

CREATE TABLE IF NOT EXISTS supply_challans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challan_no VARCHAR(100) UNIQUE NOT NULL,
    order_id INT,
    company_id INT NOT NULL,
    carrier_id INT NOT NULL,
    challan_date DATE NOT NULL,
    supply_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
    FOREIGN KEY (carrier_id) REFERENCES shipping_carriers(id) ON DELETE RESTRICT,
    INDEX idx_challan_no (challan_no),
    INDEX idx_challan_company (company_id),
    INDEX idx_challan_order (order_id),
    INDEX idx_challan_carrier (carrier_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS export_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    exported_by_company_id INT,
    export_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (exported_by_company_id) REFERENCES companies(id) ON DELETE SET NULL,
    INDEX idx_export_type (export_type),
    INDEX idx_export_created_at (created_at)
) ENGINE=InnoDB;

