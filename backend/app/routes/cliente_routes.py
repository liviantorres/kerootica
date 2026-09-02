from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.cliente_controller import ClienteController
from flasgger import swag_from
import os

cliente_bp = Blueprint(
    "clientes",
    __name__,
    url_prefix="/api/clientes"
)

diretorio_atual = os.path.dirname(os.path.abspath(__file__))
caminho_docs = os.path.join(diretorio_atual, '../docs/clientes/criar_cliente.yml')


@cliente_bp.route("", methods=["POST"])
@jwt_required()
@swag_from(caminho_docs)
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

