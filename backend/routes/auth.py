# backend/routes/auth.py
import re
import logging
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from models.organizations_model import (
    assign_user_to_org,
    create_organization,
    get_organization_by_name,
)
from models.user_model import (
    create_user,
    generate_tokens,
    get_user_by_account,
    get_user_by_id,
    verify_password,
    delete_user,
)
from routes.helpers import display_id, parse_display_id, json_response

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/auth") 

# ---- 密碼強度驗證 ----
def validate_password_strength(password: str) -> tuple[bool, str | None]:
    """驗證密碼強度：至少 8 字元，包含大小寫英文和數字。"""
    if not password or len(password) < 8:
        return False, "密碼至少需要 8 個字元"
    if len(password) > 128:
        return False, "密碼不得超過 128 個字元"
    if not re.search(r'[A-Z]', password):
        return False, "密碼需包含至少一個大寫字母"
    if not re.search(r'[a-z]', password):
        return False, "密碼需包含至少一個小寫字母"
    if not re.search(r'[0-9]', password):
        return False, "密碼需包含至少一個數字"
    return True, None

# ---- Email 格式驗證 ----
def validate_email_format(email: str) -> tuple[bool, str | None]:
    """基本的 email 格式驗證。"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "無效的電子郵件格式"
    return True, None

@auth_bp.post("/register")
@limiter.limit("5 per hour")  # 註冊：每小時最多 5 次
def register():
    data = request.get_json(force=True)
    account = (data.get("account") or "").strip().lower()
    password = data.get("password")
    user_name = (data.get("user_name") or "").strip()
    user_type = (data.get("role") or "customer").strip().lower()
    org_name = (data.get("organization_name") or "").strip() if user_type == "shop" else None

    # 基本欄位驗證
    if not account or not password or not user_name:
        return json_response({"error": "account, password, and user_name are required"}, status=400)
    
    # Email 格式驗證
    email_valid, email_err = validate_email_format(account)
    if not email_valid:
        return json_response({"error": email_err}, status=400)
    
    # 密碼強度驗證
    pwd_valid, pwd_err = validate_password_strength(password)
    if not pwd_valid:
        return json_response({"error": pwd_err}, status=400)
    
    # 使用者名稱長度驗證
    if len(user_name) > 100:
        return json_response({"error": "user_name must be at most 100 characters"}, status=400)
    
    if user_type not in ("customer", "shop"):
        return json_response({"error": "invalid user_type"}, 400)
    if user_type == "shop" and not org_name:
        return json_response({"error": "org_name required for shop registration"}, 400)
    if len(org_name or "") > 200:
        return json_response({"error": "organization_name must be at most 200 characters"}, status=400)
    
    if get_user_by_account(account):
        return json_response({"error": "account already registered"}, 409)
    
    logger.info(f"New user registration: account={account}, user_type={user_type}")

    # Shop Owners
    org_id = None
    if user_type == "shop":
        org = create_organization(org_name)
        org_id = org["id"]

    # create_user
    user_id = create_user(
        account, password, user_name, user_type=user_type, organization_id=org_id
    )

    # tokens embed user_type + organization_id
    tokens = generate_tokens(
        user_id, account, user_type=user_type, organization_id=org_id
    )

    return json_response(
            {
            "status_message": "201: User registered successfully",
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "account": account,
            "user_name": user_name,
            "role": user_type,
            "organization_id": display_id("organizations", org_id) if org_id is not None else None
            },201)
    
@auth_bp.post("/login")
@limiter.limit("10 per hour")  # 登入：每小時最多 10 次
@limiter.limit("3 per minute")  # 防止暴力攻擊：每分鐘最多 3 次
def login():
    data = request.get_json(force=True)
    account = (data.get("account") or "").strip().lower()
    password = data.get("password")
    if not account or not password:
        return json_response({"error":"account and password required"}, status=400,)

    user = get_user_by_account(account)
    if not user:
        return json_response({"error":"invalid credentials"}, status=401,)


    # Expect user to include 'password_hash'
    if not verify_password(user["password_hash"], password):
        return json_response({"error": "invalid credentials"}, status=401)
    
    logger.info(f"User login: account={account}")

    tokens = generate_tokens(
        user["id"],
        account,
        user_type=user["user_type"],
        organization_id=user["organization_id"],
    )
    return json_response({
            "status_message": "200: Login successful",
            "account": account,
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "role":user["user_type"],
            "organization_id": display_id("organizations", user["organization_id"]) if user["organization_id"] is not None else None,
            }, 200,)

@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    claims = get_jwt()
    account = claims.get("account")
    user_type = claims.get("user_type", "customer")
    organization_id = claims.get("organization_id")

    # issue a new short-lived access token
    new_access = create_access_token(
        identity=user_id,
        additional_claims={
            "account": account,
            "user_type": user_type,
            "organization_id": organization_id,
        },
    )
    return json_response({"access_token": new_access}, 200)

@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = get_user_by_id(user_id)
    if not user:
        return json_response({"error": "user not found"}, status=404)
    return json_response(
        {
            "user_id": display_id("users", user["id"]),
            "user_name": user["name"],
            "email_account": user["email_account"], 
            "user_type": user["user_type"],
            "organization_id": display_id("organizations", user["organization_id"]) if user["organization_id"] is not None else None,
        }, 200)

@auth_bp.put("/me")
@jwt_required()
def update_me():
    user_id = int(get_jwt_identity())
    user = get_user_by_id(user_id)
    if not user:
        return json_response({"error": "user not found"}, status=404)
    data = request.get_json(force=True)
    new_user_type = (data.get("user_type") or "").strip().lower()
    new_org_name = data.get("organization_name")
    if new_user_type not in ("customer", "shop"):
        return json_response({"error": "invalid user type"}, status=400)
    if new_org_name is not None and new_user_type == "shop":
        org = get_organization_by_name(new_org_name)
        if not org:
            return json_response({"error 404": "organization not found"}, 404)
        assign_user_to_org(user_id, org["id"])
    return json_response({"status": "200: update successfully"}, 200)

@auth_bp.delete("/me")
@jwt_required()
def delete_me():
    user_id = int(get_jwt_identity())
    user = get_user_by_id(user_id)
    if not user:
        return json_response({"status": "404: user not found"}, 404)
    delete_user(user_id)
    return json_response({"status": "200: user deleted"}, 200)

