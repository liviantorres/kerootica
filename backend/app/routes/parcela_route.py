from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.controllers.parcela_controller import ParcelaController

parcela_bp = Blueprint(
    "parcelas",
    __name__,
    url_prefix = "/api/parcelas"
)

@parcela_bp.route("", methods=["POST"])
@jwt_required()
def criar_parcela():
    return ParcelaController.criar()


@parcela_bp.route("", methods=["GET"])
@jwt_required()
def listar_parcelas():
    return ParcelaController.listar()


@parcela_bp.route("/<int:parcela_id>", methods=["GET"])
@jwt_required()
def buscar_parcela(parcela_id):
    return ParcelaController.buscar_por_id(parcela_id)

@parcela_bp.route("/venda/<int:venda_id>", methods=["GET"])
@jwt_required()
def buscar_parcelas_por_venda(venda_id):
    return ParcelaController.buscar_por_venda(venda_id)


@parcela_bp.route("/<int:parcela_id>", methods=["PATCH"])
@jwt_required()
def atualizar_parcela(parcela_id):
    return ParcelaController.atualizar_parcela(parcela_id)


@parcela_bp.route("/<int:parcela_id>", methods=["DELETE"])
@jwt_required()
def deletar_parcela(parcela_id):
    return ParcelaController.deletar(parcela_id)