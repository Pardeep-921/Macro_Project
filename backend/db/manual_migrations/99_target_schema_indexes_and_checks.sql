-- Final target indexes/checks after all roadmap tables exist.
-- Run after manual schema alignment. Some statements may be unnecessary if indexes already exist.

-- Useful verification queries:
-- SHOW TABLES;
-- DESCRIBE companies;
-- DESCRIBE primary_groups;
-- DESCRIBE sub_groups;
-- DESCRIBE items;
-- DESCRIBE orders;
-- DESCRIBE order_items;
-- DESCRIBE supply_challans;

-- Order lifecycle check:
SELECT order_status, COUNT(*) AS order_count
FROM orders
GROUP BY order_status;

-- Item catalog integrity check:
SELECT i.item_code, i.item_name, pg.group_name, sg.sub_group_name, s.size_code, u.unit_name
FROM items i
JOIN primary_groups pg ON pg.id = i.primary_group_id
JOIN sub_groups sg ON sg.id = i.sub_group_id
JOIN item_sizes s ON s.id = i.item_size_id
JOIN item_units u ON u.id = i.unit_id
ORDER BY i.item_code;

