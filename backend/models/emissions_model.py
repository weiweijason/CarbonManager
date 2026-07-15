# backend/models/emissions_model.py
from db_connection import get_db
from models.factor_model import get_factor

def get_emissions_by_org(organization_id):
    sql = '''
            SELECT e.* FROM emissions e
            JOIN products p ON e.product_id = p.id
            WHERE p.organization_id = %s
        '''
    with get_db() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(sql, (organization_id,))
            return cursor.fetchall()
        finally:
            cursor.close()


def get_emissions_by_owner(owner_user_id: int):
    sql = """
            SELECT e.*
            FROM emissions e
            JOIN products p ON e.product_id = p.id
            WHERE p.owner_user_id = %s
        """
    with get_db() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(sql, (owner_user_id,))
            return cursor.fetchall()
        finally:
            cursor.close()

def get_emissions_by_product(product_id):
    sql = '''
            SELECT * FROM emissions
            WHERE product_id = %s
        '''
    with get_db() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(sql, (product_id,))
            return cursor.fetchall()
        finally:
            cursor.close()


def get_emissions_by_product_for_owner(owner_user_id: int, product_id: int):
    sql = """
            SELECT e.*
            FROM emissions e
            JOIN products p ON p.id = e.product_id
            WHERE e.product_id = %s AND p.owner_user_id = %s
        """
    with get_db() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(sql, (product_id, owner_user_id))
            return cursor.fetchall()
        finally:
            cursor.close()

def get_emissions_by_product_and_stage(product_id, stage_id):
    sql = """
        SELECT *
        FROM emissions e
        WHERE e.product_id = %s AND e.stage_id = %s
    """
    with get_db() as conn:
        cursor = conn.cursor(dictionary=True)
        try:    
            cursor.execute(sql, (product_id, stage_id,))
            return cursor.fetchall()
        finally:
            cursor.close()
   
def get_emission(emission_id: int):
    with get_db() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            sql = "SELECT * FROM emissions WHERE id = %s"
            cursor.execute(sql, (emission_id,))
            return cursor.fetchone()
        finally:
            cursor.close()


def get_emission_for_owner(owner_user_id: int, emission_id: int):
    sql = """
        SELECT e.*
        FROM emissions e
        JOIN products p ON p.id = e.product_id
        WHERE e.id = %s AND p.owner_user_id = %s
        LIMIT 1
    """
    with get_db() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(sql, (emission_id, owner_user_id))
            return cursor.fetchone()
        finally:
            cursor.close()
 
def create_emission(
    name: str,
    product_id: int,
    stage_id: int,
    factor_id: int,
    quantity: float,
    tag_id: int,
    step_id: int,
    created_by: int,
    transport_origin: str | None = None,
    transport_method: str | None = None,
    transport_unit: str | None = None,
    distance_per_trip: float | None = None,
    usage_ratio: float | None = None,
    allocation_basis: str | None = None,
    fuel_input_per_unit: float | None = None,
    fuel_input_unit: str | None = None,
    land_transport_tkm: float | None = None,
    ):
    
    factor = get_factor(factor_id)
    if not factor:
        raise ValueError(f"factor_id={factor_id} does not exist")

    coeff = factor["coefficient"]
    qty = quantity 
    emission_amount = qty * coeff

    with get_db() as conn:
        cursor = conn.cursor(dictionary=True)
        sql = """
            INSERT INTO emissions (
                name,
                product_id,
                stage_id,
                factor_id,
                tag_id,
                created_by,
                quantity,
                transport_origin,
                transport_method,
                distance_per_trip,
                transport_unit,
                usage_ratio,
                allocation_basis,
                fuel_input_per_unit,
                fuel_input_unit,
                land_transport_tkm,
                emission_amount,
                step_id,
                unit_target_amount
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s 
            )
        """
        values = (
            name,
            product_id,
            stage_id,
            factor_id,
            tag_id,
            created_by,
            quantity,
            transport_origin,
            transport_method,
            distance_per_trip,
            transport_unit,
            usage_ratio,
            allocation_basis,
            fuel_input_per_unit,
            fuel_input_unit,
            land_transport_tkm,
            emission_amount,
            step_id,
            None,  # unit_target_amount
        )
        cursor.execute(sql, values)
        conn.commit()
    return cursor.lastrowid

def update_emission_quantity(emission_id: int, quantity: float):
    select_sql = "SELECT factor_id FROM emissions WHERE id = %s LIMIT 1"
    update_sql = """
        UPDATE emissions
        SET quantity = %s, emission_amount = %s
        WHERE id = %s
    """
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(select_sql, (emission_id,))
            row = cursor.fetchone()
            if not row:
                return False
            factor_id = row[0]
            factor = get_factor(factor_id)
            if not factor:
                raise ValueError(f"factor_id={factor_id} does not exist")
            emission_amount = quantity * factor["coefficient"]
            cursor.execute(update_sql, (quantity, emission_amount, emission_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()


def update_emission_quantity_for_owner(owner_user_id: int, emission_id: int, quantity: float) -> bool:
    select_sql = """
        SELECT e.factor_id
        FROM emissions e
        JOIN products p ON p.id = e.product_id
        WHERE e.id = %s AND p.owner_user_id = %s
        LIMIT 1
    """
    update_sql = """
        UPDATE emissions e
        JOIN products p ON p.id = e.product_id
        SET e.quantity = %s, e.emission_amount = %s
        WHERE e.id = %s AND p.owner_user_id = %s
    """
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(select_sql, (emission_id, owner_user_id))
            row = cursor.fetchone()
            if not row:
                return False
            factor_id = row[0]
            factor = get_factor(factor_id)
            if not factor:
                raise ValueError(f"factor_id={factor_id} does not exist")
            emission_amount = quantity * factor["coefficient"]
            cursor.execute(update_sql, (quantity, emission_amount, emission_id, owner_user_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()


def delete_emission(emission_id: int):
    sql = '''
        DELETE FROM emissions WHERE id = %s
    '''
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(sql, (emission_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()


def delete_emission_for_owner(owner_user_id: int, emission_id: int) -> bool:
    sql = """
        DELETE e
        FROM emissions e
        JOIN products p ON p.id = e.product_id
        WHERE e.id = %s AND p.owner_user_id = %s
    """
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(sql, (emission_id, owner_user_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()

def calculate_total_emissions_by_product(product_id: int) -> float:
    emissions = get_emissions_by_product(product_id)
    return sum(e["emission_amount"] or 0 for e in emissions)

def calculate_emissions_by_stage(product_id: int) -> dict[int, float]:
    emissions = get_emissions_by_product(product_id)
    stage_totals: dict[int, float] = {}
    for emission in emissions:
        stage_id = emission["stage_id"]
        stage_totals.setdefault(stage_id, 0.0)
        stage_totals[stage_id] += emission["emission_amount"] or 0
    return stage_totals

def get_emission_summary(product_id: int):
    total_sql = """
        SELECT COALESCE(SUM(emission_amount), 0) 
        AS grand_total 
        FROM emissions 
        WHERE product_id = %s
    """
    
    by_stage_sql = """
        SELECT
            e.stage_id,
            s.title AS stage_title,
            COALESCE(SUM(e.emission_amount), 0) AS total    
            FROM emissions e
            JOIN stages s ON e.stage_id = s.id
            WHERE e.product_id = %s
            GROUP BY e.stage_id, s.title
            ORDER BY e.stage_id
    """
    
    by_category_sql =  """
            SELECT
                f.category AS category,
                COALESCE(SUM(e.emission_amount), 0) AS total
            FROM emissions e
            JOIN factors f ON e.factor_id = f.id
            WHERE e.product_id = %s
            GROUP BY f.category
            ORDER BY total DESC
            """
            
    with get_db() as conn:
        cursor = conn.cursor(dictionary=True)

        cursor.execute( total_sql, (product_id,))
        grand_total = cursor.fetchone()["grand_total"]

        cursor.execute(by_stage_sql,(product_id,),)
        by_stage = cursor.fetchall()

        cursor.execute( by_category_sql,(product_id,),)
        by_category = cursor.fetchall()

    return {
        "grand_total": grand_total,
        "by_stage": by_stage,
        "by_category": by_category,
    }


def get_emission_summary_for_owner(owner_user_id: int, product_id: int):
    total_sql = """
        SELECT COALESCE(SUM(e.emission_amount), 0) AS grand_total
        FROM emissions e
        JOIN products p ON p.id = e.product_id
        WHERE e.product_id = %s AND p.owner_user_id = %s
    """

    by_stage_sql = """
        SELECT
            e.stage_id,
            s.title AS stage_title,
            COALESCE(SUM(e.emission_amount), 0) AS total
        FROM emissions e
        JOIN stages s ON e.stage_id = s.id
        JOIN products p ON p.id = e.product_id
        WHERE e.product_id = %s AND p.owner_user_id = %s
        GROUP BY e.stage_id, s.title
        ORDER BY e.stage_id
    """

    by_category_sql = """
        SELECT
            f.category AS category,
            COALESCE(SUM(e.emission_amount), 0) AS total
        FROM emissions e
        JOIN factors f ON e.factor_id = f.id
        JOIN products p ON p.id = e.product_id
        WHERE e.product_id = %s AND p.owner_user_id = %s
        GROUP BY f.category
        ORDER BY total DESC
    """

    with get_db() as conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(total_sql, (product_id, owner_user_id))
            grand_total = cursor.fetchone()["grand_total"]

            cursor.execute(by_stage_sql, (product_id, owner_user_id))
            by_stage = cursor.fetchall()

            cursor.execute(by_category_sql, (product_id, owner_user_id))
            by_category = cursor.fetchall()
        finally:
            cursor.close()

    return {
        "grand_total": grand_total,
        "by_stage": by_stage,
        "by_category": by_category,
    }
    