from flask import Blueprint
from app.controllers.authcontroller import AuthController

auth_bp = Blueprint(
    "auth", 
    __name__,
    url_prefix = "/api/auth"
)


@auth_bp.route("/login", methods=["POST"])
def login():
    return AuthController.login()
