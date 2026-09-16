from flask import Blueprint
from backend.app.controllers.auth_controller import AuthController

auth_bp = Blueprint(
    "auth", 
    __name__,
    url_prefix = "/api/auth"
)


@auth_bp.route("/login", methods=["POST"])
def login():
    return AuthController.login()
    

@auth_bp.route("/teste", methods=["GET"])
def teste():
    return "Everton lindo"
