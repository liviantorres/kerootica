from flask import jsonify, request
from marshmallow import ValidationError

from app.schemas.venda_schema import VendaSchema
from app.services.venda_service import VendaService


venda_schema = VendaSchema()
vendas_schema = VendaSchema(many=True)


class VendaController:

    @staticmethod
    def criar():
        try:
            dados = venda_schema.load(request.get_json())

            venda = VendaService.criar_venda(dados)

            return jsonify(
                venda_schema.dump(venda)
            ), 201

        except ValidationError as err:
            return jsonify({
                "erro": "Dados inválidos",
                "detalhes": err.messages
            }), 400

        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 409

    @staticmethod
    def buscar_por_id(venda_id):
        try:
            venda = VendaService.buscar_por_id(venda_id)

            return jsonify(
                venda_schema.dump(venda)
            ), 200

        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 404

    @staticmethod
    def buscar_por_cliente(cliente_id):
        try:
            vendas = VendaService.buscar_por_cliente(cliente_id)

            return jsonify(
                vendas_schema.dump(vendas)
            ), 200

        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 404

    @staticmethod
    def buscar_por_receita(receita_id):
        try:
            vendas = VendaService.buscar_por_receita(receita_id)

            return jsonify(
                vendas_schema.dump(vendas)
            ), 200

        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 404

    @staticmethod
    def buscar_por_numero_talao(numero_talao):
        try:
            venda = VendaService.buscar_por_numero_talao(
                numero_talao
            )

            return jsonify(
                venda_schema.dump(venda)
            ), 200

        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 404

    @staticmethod
    def listar():
        vendas = VendaService.listar()

        return jsonify(
            vendas_schema.dump(vendas)
        ), 200

    @staticmethod
    def atualizar(venda_id):
        try:
            dados = venda_schema.load(
                request.get_json(),
                partial=True
            )

            venda = VendaService.atualizar(
                venda_id,
                dados
            )

            return jsonify(
                venda_schema.dump(venda)
            ), 200

        except ValidationError as err:
            return jsonify({
                "erro": "Dados inválidos",
                "detalhes": err.messages
            }), 400

        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 404

    @staticmethod
    def deletar(venda_id):
        try:
            VendaService.deletar(venda_id)

            return jsonify({
                "mensagem": "Venda excluída com sucesso."
            }), 200

        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 404