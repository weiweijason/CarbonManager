# backend/routes/emissions.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)
    
from models.products_model import fetch_product_for_owner
from models.emissions_model import (
    get_emissions_by_owner,
    get_emissions_by_product_for_owner,
    get_emission_for_owner,
    create_emission,
    update_emission_quantity_for_owner,
    delete_emission_for_owner,
    get_emission_summary_for_owner,
)

from routes.helpers import (
    json_response,
    parse_display_id_safe,
    to_taipei_iso,
)


product_emission_bp = Blueprint("emissions", __name__, url_prefix="/emissions")
emission_bp = Blueprint("emissions", __name__, url_prefix="/emissions")

# Product Emissions routes 
# -------- GET: List emissions from one product --------
@product_emission_bp.get("")
@jwt_required()
def get_all(product_id):    
    uid = int(get_jwt_identity())
    product_id_int, err = parse_display_id_safe(product_id, "PRD")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    if not fetch_product_for_owner(product_id_int, uid):
        return json_response({"status": "404: Product not found"}, 404)
    rows = get_emissions_by_product_for_owner(uid, product_id_int)
    emissions = []
    for r in rows:
        emissions.append({
            "emission_id": r["id"],
            "emission_name": r["name"],
            "stage_id": r["stage_id"],
            "step_id": r["step_id"],
            "tag_id": r["tag_id"],
            "factor_id": r["factor_id"],
            "quantity": r["quantity"],
            "emission_amount": r["emission_amount"],
            "created_at": to_taipei_iso(r["created_at"]),
            "created_by": r["created_by"],
        })
    return json_response({"emissions": emissions}, 200)

# -------- POST: Create emission record for a product --------
@product_emission_bp.post("")
@jwt_required()
def create(product_id):
    uid = int(get_jwt_identity())
    product_id_int, err = parse_display_id_safe(product_id, "PRD")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    if not fetch_product_for_owner(product_id_int, uid):
        return json_response({"status": "404: Product not found"}, 404)
    data = request.get_json()
    name = data.get("name")
    stage_id = data.get("stage_id")
    tag_id, err = parse_display_id_safe(data.get("tag_id"), "TAG")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    step_id, err = parse_display_id_safe(data.get("step_id"), "STP")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    factor_id = data.get("factor_id")
    quantity = data.get("quantity")
    created_by = uid
    create_emission(
            name,
            product_id_int,
            stage_id,
            factor_id,
            quantity,
            tag_id,
            step_id,
            created_by,
    )
    return json_response({"message": "Emission record created"}, 201)

@product_emission_bp.get("/summary")
@jwt_required()
def summary(product_id):
    uid = int(get_jwt_identity())
    product_id_int, err = parse_display_id_safe(product_id, "PRD")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    if not fetch_product_for_owner(product_id_int, uid):
        return json_response({"status": "404: Product not found"}, 404)
    summary = get_emission_summary_for_owner(uid, product_id_int)
    return jsonify(summary), 200

@emission_bp.get("")
@jwt_required()
def get_all_by_org():
    uid = int(get_jwt_identity())
    rows = get_emissions_by_owner(uid)
    emissions = []
    for r in rows:
        emissions.append(
            {
                **r,
                "created_at": to_taipei_iso(r.get("created_at")),
            }
        )
    return jsonify(emissions=emissions), 200

@emission_bp.get("/<string:emission_id>")
@jwt_required()
def get_one(emission_id):
    uid = int(get_jwt_identity())
    emission_id_int, err = parse_display_id_safe(emission_id, "EMS")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    emission = get_emission_for_owner(uid, emission_id_int)
    if not emission:
        return jsonify({"error": "Emission record not found"}), 404
    return json_response({
        "emission_id": emission["id"],
        "emission_name": emission["name"],
        "product_id": emission["product_id"],
        "stage_id": emission["stage_id"],
        "tag_id": emission["tag_id"],
        "step_id": emission["step_id"], 
        "factor_id": emission["factor_id"],
        "quantity": emission["quantity"],
        "emission_amount": emission["emission_amount"],
        "created_at": to_taipei_iso(emission["created_at"]),
        "created_by": emission["created_by"],   
        "transport_origin": emission["transport_origin"],
        "transport_method": emission["transport_method"],
        "distance_per_trip": emission["distance_per_trip"],
        "transport_unit": emission["transport_unit"],
        "usage_ratio": emission["usage_ratio"],
        "allocation_basis": emission["allocation_basis"],
        "fuel_input_per_unit": emission["fuel_input_per_unit"],
        "fuel_input_unit": emission["fuel_input_unit"],
        "land_transport_tkm": emission["land_transport_tkm"],
        "unit_target_amount": emission["unit_target_amount"],
    }, 200)
    
@emission_bp.put("/<string:emission_id>")
@jwt_required()
def update(emission_id):
    uid = int(get_jwt_identity())
    emission_id_int, err = parse_display_id_safe(emission_id, "EMS")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    data = request.get_json()
    quantity = data.get("new_amount")
    ok = update_emission_quantity_for_owner(uid, emission_id_int, quantity)
    if not ok:
        return json_response({"status": "404: Emission record not found"}, 404)
    return json_response({"message": "Emission record updated"}, 200)

@emission_bp.delete("/<string:emission_id>")
@jwt_required()
def delete(emission_id):
    uid = int(get_jwt_identity())
    emission_id_int, err = parse_display_id_safe(emission_id, "EMS")
    if err:
        return json_response({"status": f"400: {err}"}, 400)
    ok = delete_emission_for_owner(uid, emission_id_int)
    if not ok:
        return json_response({"status": "404: Emission record not found"}, 404)
    return json_response({"message": "Emission record deleted"}, 200)

