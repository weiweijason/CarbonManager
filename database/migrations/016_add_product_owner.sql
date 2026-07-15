-- 016_add_product_owner.sql
-- Enforce per-user product ownership.

ALTER TABLE products
    ADD COLUMN owner_user_id BIGINT UNSIGNED NULL AFTER organization_id;

UPDATE products p
JOIN (
    SELECT u.organization_id, MIN(u.id) AS owner_user_id
    FROM users u
    WHERE u.organization_id IS NOT NULL
    GROUP BY u.organization_id
) s ON s.organization_id = p.organization_id
SET p.owner_user_id = s.owner_user_id
WHERE p.owner_user_id IS NULL;

ALTER TABLE products
    MODIFY COLUMN owner_user_id BIGINT UNSIGNED NOT NULL,
    ADD CONSTRAINT fk_products_owner_user
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    ADD KEY idx_products_owner_user (owner_user_id);
