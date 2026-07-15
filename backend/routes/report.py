# backend/routes/report.py
from flask import current_app, Blueprint, send_file, after_this_request
from pathlib import Path
import tempfile

from flask_jwt_extended import get_jwt_identity, jwt_required

from routes.helpers import parse_display_id_safe
from models.products_model import fetch_product_for_owner
from routes.generate_report import generate_report

report_bp = Blueprint("report", __name__, url_prefix="/report")


@report_bp.get("/<string:product_id>")
@jwt_required()
def download_report(product_id):
    uid = int(get_jwt_identity())
    
    template_path = current_app.config["REPORT_TEMPLATE"]

    tmp = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()
    product_id_int, err = parse_display_id_safe(product_id, "PRD")
    if err:
        return {"error": err}, 400
    pd = fetch_product_for_owner(product_id_int, uid)
    if not pd:
        return {"error": "product not found"}, 404
    generate_report(product_id_int, str(template_path), str(tmp_path))

    @after_this_request
    def remove_temp_file(response):
        try:
            tmp_path.unlink(missing_ok=True)
        except OSError:
            pass
        return response

    return send_file(
        tmp_path,
        as_attachment=True,
        download_name=f"{product_id}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )

