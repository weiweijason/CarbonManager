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
) -> int:
    sql = """
        INSERT INTO products 
            (organization_id,
            owner_user_id,
            type_id, 
            name, 
            serial_number, 
            code)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                sql,
                (organization_id, owner_user_id, type_id, name, serial_number, code),
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
) -> bool:
    sql = """
        UPDATE products
        SET type_id = %s,
            name = %s,
            serial_number = %s,
            code = %s
        WHERE id = %s AND owner_user_id = %s
    """
    with get_db() as conn:
        cur = conn.cursor()
        try:
            cur.execute(
                sql,
                (type_id, name, serial_number, code, product_id, owner_user_id),
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
            