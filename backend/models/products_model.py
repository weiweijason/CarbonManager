# backend/models/products_model.py
from typing import Optional
from db_connection import get_db

def create_product(
    organization_id: int,
    owner_user_id: int,
    type_id: int,
    name: str,
    serial_number: Optional[str],
    code: Optional[str],
    total_production: Optional[float] = None,
    production_unit: Optional[str] = None,
    unit_weight: Optional[float] = None,
    product_weight: Optional[float] = None,
    proportion: Optional[float] = None,
    allocation_basis: Optional[str] = None,
) -> int:
    sql = """
        INSERT INTO products 
            (organization_id,
            owner_user_id,
            type_id, 
            name, 
            serial_number, 
            code,
            total_production,
            production_unit,
            unit_weight,
            product_weight,
            proportion,
            allocation_basis)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                sql,
                (organization_id, owner_user_id, type_id, name, serial_number, code,
                 total_production, production_unit, unit_weight, product_weight,
                 proportion, allocation_basis),
            )
            conn.commit()
            return cur.lastrowid
        finally:
            cur.close()

def list_products(organization_id: int, owner_user_id: int, product_type_id: int) -> list[dict]:
    sql = """
        SELECT 
            p.id, 
            p.owner_user_id,
            p.name, 
            p.serial_number, 
            p.total_emission, 
            p.total_production,
            p.production_unit,
            p.unit_weight,
            p.product_weight,
            p.proportion,
            p.allocation_basis,
            p.created_at, 
            p.ended_at, 
            p.code
        FROM products p
        WHERE p.organization_id = %s
          AND p.owner_user_id = %s
          AND p.type_id = %s
        ORDER BY p.created_at DESC
    """
    with get_db() as conn:
        cur = conn.cursor(dictionary=True)
        try:
            cur.execute(
                sql, 
                (organization_id, owner_user_id, product_type_id),
            )
            return cur.fetchall()
        finally:
            cur.close()
    
# -------------- UPDATE A PRODUCT ---------------
def update_product(
    product_id: int,
    owner_user_id: int,
    type_id: Optional[int],
    name: str,
    serial_number: Optional[str],
    code: Optional[str],
    total_production: Optional[float] = None,
    production_unit: Optional[str] = None,
    unit_weight: Optional[float] = None,
    product_weight: Optional[float] = None,
    proportion: Optional[float] = None,
    allocation_basis: Optional[str] = None,
) -> bool:
    sql = """
        UPDATE products
        SET type_id = %s,
            name = %s,
            serial_number = %s,
            code = %s,
            total_production = %s,
            production_unit = %s,
            unit_weight = %s,
            product_weight = %s,
            proportion = %s,
            allocation_basis = %s
        WHERE id = %s AND owner_user_id = %s
    """
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                sql,
                (type_id, name, serial_number, code, total_production, production_unit,
                 unit_weight, product_weight, proportion, allocation_basis,
                 product_id, owner_user_id),
            )
            conn.commit()
            return cur.rowcount > 0
        finally:
            cur.close()

# -------------- FETCH A PRODUCT BY ID ---------------
def fetch_product(product_id: int) -> Optional[dict]:
    sql = """
        SELECT 
            id, 
            organization_id, 
            owner_user_id,
            type_id, 
            name, 
            serial_number, 
            total_emission, 
            total_production,
            production_unit,
            unit_weight,
            product_weight,
            proportion,
            allocation_basis,
            created_at, 
            ended_at, 
            code
        FROM products
        WHERE id = %s
        LIMIT 1
    """
    with get_db() as conn:
        cur = conn.cursor(dictionary=True)
        try:
            cur.execute(sql, (product_id,))
            return cur.fetchone()
        finally:
            cur.close()


def fetch_product_for_owner(product_id: int, owner_user_id: int) -> Optional[dict]:
    sql = """
        SELECT 
            id,
            organization_id,
            owner_user_id,
            type_id,
            name,
            serial_number,
            total_emission,
            total_production,
            production_unit,
            unit_weight,
            product_weight,
            proportion,
            allocation_basis,
            created_at,
            ended_at,
            code
        FROM products
        WHERE id = %s AND owner_user_id = %s
        LIMIT 1
    """
    with get_db() as conn:
        cur = conn.cursor(dictionary=True)
        try:
            cur.execute(sql, (product_id, owner_user_id))
            return cur.fetchone()
        finally:
            cur.close()
          
          
# -------------- DELETE A PRODUCT ---------------
def delete_product(product_id: int, owner_user_id: int) -> bool:
    sql = """
        DELETE FROM products
        WHERE id = %s AND owner_user_id = %s
    """
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute(sql, (product_id, owner_user_id))
            conn.commit()
            return cur.rowcount > 0
        finally:
            cur.close()
            