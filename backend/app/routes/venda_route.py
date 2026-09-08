from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.venda_controller import VendaController


venda_bp = Blueprint(
    "vendas",
    __name__,
    url_prefix="/api/vendas"
)


@venda_bp.route("", methods=["POST"])
@jwt_required()
def criar_venda():
    return VendaController.criar()


@venda_bp.route("", methods=["GET"])
@jwt_required()
def listar_vendas():
    return VendaController.listar()


@venda_bp.route("/<int:venda_id>", methods=["GET"])
@jwt_required()
def buscar_venda(venda_id):
    return VendaController.buscar_por_id(venda_id)


@venda_bp.route("/cliente/<int:cliente_id>", methods=["GET"])
@jwt_required()
def buscar_vendas_por_cliente(cliente_id):
    return VendaController.buscar_por_cliente(cliente_id)


@venda_bp.route("/receita/<int:receita_id>", methods=["GET"])
@jwt_required()
def buscar_vendas_por_receita(receita_id):
    return VendaController.buscar_por_receita(receita_id)


@venda_bp.route("/talao/<int:numero_talao>", methods=["GET"])
@jwt_required()
def buscar_venda_por_talao(numero_talao):
    return VendaController.buscar_por_numero_talao(numero_talao)


@venda_bp.route("/<int:venda_id>", methods=["PATCH"])
@jwt_required()
def atualizar_venda(venda_id):
    return VendaController.atualizar(venda_id)


@venda_bp.route("/<int:venda_id>", methods=["DELETE"])
@jwt_required()
def deletar_venda(venda_id):
    return VendaController.deletar(venda_id)