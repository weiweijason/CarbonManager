# backend/routes/products.py
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models.products_model import (
    create_product,
    delete_product,
    fetch_product_for_owner,
    list_products,
    update_product,
)
from models.product_types_model import get_product_type_by_id
from models.steps_model import create_steps, get_steps_under_product_stage
from models.user_model import get_user_organization
from routes.emissions import product_emission_bp
from routes.helpers import (
    display_id,
    json_response,
    parse_display_id_safe,
    to_taipei_iso,
)

# Blueprint for product routes under a product type
product_types_products_bp = Blueprint("products", __name__)

# Blueprint for product routes
product_bp = Blueprint("product_bp", __name__, url_prefix="/products")
product_bp.register_blueprint(product_emission_bp, url_prefix="/<string:product_id>")


def _get_current_user_id() -> int:
    return int(get_jwt_identity())


def _require_owned_product_id(product_id: str, user_id: int) -> tuple[int | None, dict | None]:
    product_id_int, err = parse_display_id_safe(product_id, "PRD")
    if err:
        return None, {"status": f"400: {err}"}
    product = fetch_product_for_owner(product_id_int, user_id)
    if not product:
        return None, {"status": "404: Product not found"}
    return product_id_int, None


# -------- Products under a Product Type routes --------
@product_types_products_bp.get("/products")
@jwt_required()
def get_all(product_type_id):
    uid = _get_current_user_id()
    org = get_user_organization(uid)
    if not org:
        return json_response({"status": "403: user has no organization"}, 403)
    product_type_id_int, err = parse_display_id_safe(product_type_id, "PRT")
    if err:
        return json_response({"status": f"400: {err}"}, 400)

    rows = list_products(org["id"], uid, product_type_id_int)
    products = []
    for r in rows:
        products.append(
            {
                "product_id": display_id("products", r["id"]),
                "product_name": r["name"],
                "owner_user_id": display_id("users", r["owner_user_id"]),
                "serial_number": r["serial_number"],
                "total_emission": r["total_emission"],
                "created_at": to_taipei_iso(r["created_at"]),
                "ended_at": to_taipei_iso(r["ended_at"]),
                "code": r["code"],
            }
        )
    return json_response({"products": products}, 200)


@product_types_products_bp.post("/products")
@jwt_required()
def create(product_type_id):
    uid = _get_current_user_id()
    org = get_user_organization(uid)
    if not org:
        return json_response({"status": "403: user has no organization"}, 403)
    product_type_id_int, err = parse_display_id_safe(product_type_id, "PRT")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    if not get_product_type_by_id(org["id"], product_type_id_int):
        return json_response({"status": "404: Product type not found"}, 404)

    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    if not name:
        return json_response({"status": "400: name is required"}, 400)
    serial_number = data.get("serial_number")
    code = data.get("code")
    new_id = create_product(org["id"], uid, product_type_id_int, name, serial_number, code)
    return json_response(
        {
            "message": "Product created",
            "product_id": display_id("products", new_id),
            "owner_user_id": display_id("users", uid),
        },
        201,
    )


# ------------- By Product ID routes --------------
@product_bp.get("/<string:product_id>")
@jwt_required()
def get(product_id):
    uid = _get_current_user_id()
    product_id_int, error = _require_owned_product_id(product_id, uid)
    if error:
        status = 400 if error["status"].startswith("400") else 404
        return json_response(error, status)
    pd = fetch_product_for_owner(product_id_int, uid)
    return json_response(
        {
            "product_id": display_id("products", pd["id"]),
            "product_name": pd["name"],
            "product_type_id": display_id("product_types", pd["type_id"]),
            "organization_id": display_id("organizations", pd["organization_id"]),
            "owner_user_id": display_id("users", pd["owner_user_id"]),
            "created_at": to_taipei_iso(pd["created_at"]),
            "ended_at": to_taipei_iso(pd["ended_at"]),
        },
        200,
    )


@product_bp.put("/<string:product_id>")
@jwt_required()
def update(product_id):
    uid = _get_current_user_id()
    product_id_int, error = _require_owned_product_id(product_id, uid)
    if error:
        status = 400 if error["status"].startswith("400") else 404
        return json_response(error, status)

    data = request.get_json(force=True)
    product_type_id_int, err = parse_display_id_safe(data.get("product_type_id"), "PRT")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    org = get_user_organization(uid)
    if not org:
        return json_response({"status": "403: user has no organization"}, 403)
    if not get_product_type_by_id(org["id"], product_type_id_int):
        return json_response({"status": "404: Product type not found"}, 404)
    name = (data.get("new_product_name") or "").strip()
    if not name:
        return json_response({"status": "400: new_product_name is required"}, 400)
    serial_number = data.get("serial_number")
    code = data.get("code")
    ok = update_product(product_id_int, uid, product_type_id_int, name, serial_number, code)
    if not ok:
        return json_response({"status": "404: Product not found"}, 404)
    return json_response({"message": "Product updated"}, 200)


@product_bp.delete("/<string:product_id>")
@jwt_required()
def delete(product_id):
    uid = _get_current_user_id()
    product_id_int, err = parse_display_id_safe(product_id, "PRD")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    ok = delete_product(product_id_int, uid)
    if not ok:
        return json_response({"status": "404: Product not found"}, 404)
    return json_response({"message": "Product deleted"}, 200)


# -------- By Product Id: Steps under a Product --------
@product_bp.get("/<string:product_id>/steps/<string:stage_id>")
@jwt_required()
def get_steps(product_id, stage_id):
    uid = _get_current_user_id()
    _, error = _require_owned_product_id(product_id, uid)
    if error:
        status = 400 if error["status"].startswith("400") else 404
        return json_response(error, status)

    product_id_int, _ = parse_display_id_safe(product_id, "PRD")
    rows = get_steps_under_product_stage(product_id_int, stage_id)
    steps = []
    for r in rows:
        steps.append(
            {
                "step_id": display_id("steps", r["id"]),
                "step_name": r["name"],
                "tag_id": display_id("tags", r["tag_id"]),
                "sort_order": r["sort_order"],
                "created_at": to_taipei_iso(r["created_at"]),
            }
        )
    return json_response(steps, 200)


@product_bp.post("/<string:product_id>/steps")
@jwt_required()
def create_step(product_id):
    uid = _get_current_user_id()
    _, error = _require_owned_product_id(product_id, uid)
    if error:
        status = 400 if error["status"].startswith("400") else 404
        return json_response(error, status)

    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    if not name:
        return json_response({"status": "400: name is required"}, 400)
    stage_id = data.get("stage_id")
    tag_id_int, err = parse_display_id_safe(data.get("tag_id"), "TAG")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    sort_order = data.get("sort_order")
    product_id_int, _ = parse_display_id_safe(product_id, "PRD")
    create_steps(product_id_int, stage_id, tag_id_int, name, sort_order)
    return json_response({"message": "Step created under product"}, 201)
