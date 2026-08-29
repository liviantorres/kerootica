from flask import Blueprint

from app.controllers.usuario_controller import UsuarioController

usuario_bp = Blueprint(
    "usuarios",
    __name__,
    url_prefix= "/api/usuarios"
)

@usuario_bp.route("", methods=["POST"])
def criar_usuario():
    return UsuarioController.criar()