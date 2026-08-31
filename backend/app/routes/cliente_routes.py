from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.cliente_controller import ClienteController


cliente_bp = Blueprint(
    "clientes",
    __name__,
    url_prefix="/api/clientes"
)


@cliente_bp.route("", methods=["POST"])
@jwt_required()
def criar_cliente():
    return ClienteController.criar()


@cliente_bp.route("", methods=["GET"])
@jwt_required()
def listar_clientes():
    return ClienteController.listar()


@cliente_bp.route("/<int:cliente_id>", methods=["GET"])
@jwt_required()
def buscar_cliente(cliente_id):
    return ClienteController.buscar(cliente_id)


@cliente_bp.route("/<int:cliente_id>", methods=["PUT"])
@jwt_required()
def atualizar_cliente(cliente_id):
    return ClienteController.atualizar(cliente_id)


@cliente_bp.route("/<int:cliente_id>", methods=["DELETE"])
@jwt_required()
def deletar_cliente(cliente_id):
    return ClienteController.deletar(cliente_id)

