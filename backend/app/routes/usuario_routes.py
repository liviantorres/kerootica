from flask import Blueprint

from app.controllers.usuario_controller import UsuarioController
from app.decorators.auth_decorator import admin_required
from flask import request, jsonify

usuario_bp = Blueprint(
    "usuarios",
    __name__,
    url_prefix= "/api/usuarios"
)

@usuario_bp.route("", methods=["POST"])
def criar_usuario():
    return UsuarioController.criar()

@usuario_bp.route("/admin", methods=["GET"])
@admin_required
def area_admin():
    return jsonify({
        "mensagem": "Bem-vindo, administrador!"
    })