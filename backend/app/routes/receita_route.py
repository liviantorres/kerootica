from flask import Blueprint

from app.controllers.receita_controller import ReceitaController
from flask_jwt_extended import jwt_required

receita_bp = Blueprint(
    "receitas",
    __name__,
    url_prefix="/api/receitas"
)

@receita_bp.route("", methods=["POST"])
@jwt_required()
def criar_receita():
    return ReceitaController.criar()

@receita_bp.route("", methods=["GET"])
@jwt_required()
def listar_receitas():
    return ReceitaController.listar()

@receita_bp.route("/cliente/<int:receita_id>", methods=["GET"])
@jwt_required()
def buscar_receita(receita_id):
    return ReceitaController.buscar(receita_id)

@receita_bp.route("/<int:cliente_id>", methods=["GET"])
@jwt_required()
def buscar_por_cliente(cliente_id):
    return ReceitaController.buscar_por_cliente(cliente_id)

@receita_bp.route("/<int:receita_id>", methods=["PATCH"])
@jwt_required()
def atualizar_receita(receita_id):
    return ReceitaController.atualizar(receita_id)

@receita_bp.route("/<int:receita_id>", methods=["DELETE"])
@jwt_required()
def deletar_receita(receita_id):
    return ReceitaController.deletar(receita_id)