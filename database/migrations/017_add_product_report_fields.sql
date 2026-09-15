-- 017_add_product_report_fields.sql
-- Add fields for the "標的產品" section in the report

ALTER TABLE products
ADD COLUMN total_production DOUBLE NULL COMMENT '總產量',
ADD COLUMN production_unit VARCHAR(50) NULL COMMENT '計量單位',
ADD COLUMN unit_weight DOUBLE NULL COMMENT '單件裸裝重量(不含包裝，kg)',
ADD COLUMN product_weight DOUBLE NULL COMMENT '產品總重量(不含包裝，單位:kg)',
ADD COLUMN proportion DOUBLE NULL COMMENT '標的產品佔全廠所有產品的比例',
ADD COLUMN allocation_basis VARCHAR(255) NULL COMMENT '分配比例計算依據(如:個數、面積、長度、重量、體積、工時...等)';
