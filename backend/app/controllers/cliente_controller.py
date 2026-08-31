from flask import request, jsonify
from marshmallow import ValidationError

from app.schemas.cliente_schema import ClienteSchema
from app.services.cliente_service import ClienteService


cliente_schema = ClienteSchema()
clientes_schema = ClienteSchema(many=True)


class ClienteController:

    @staticmethod
    def criar():
        try:
            dados = cliente_schema.load(request.get_json())

            cliente = ClienteService.criar_cliente(dados)

            return jsonify(
                cliente_schema.dump(cliente)
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
    def listar():
        clientes = ClienteService.listar_clientes()

        return jsonify(
            clientes_schema.dump(clientes)
        ), 200

    @staticmethod
    def buscar(cliente_id):
        try:
            cliente = ClienteService.buscar_cliente(cliente_id)

            return jsonify(
                cliente_schema.dump(cliente)
            ), 200

        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 404

    @staticmethod
    def atualizar(cliente_id):
        try:
            dados = cliente_schema.load(
                request.get_json(),
                partial=True
            )

            cliente = ClienteService.atualizar_cliente(
                cliente_id,
                dados
            )

            return jsonify(
                cliente_schema.dump(cliente)
            ), 200

        except ValidationError as err:
            return jsonify({
                "erro": "Dados inválidos",
                "detalhes": err.messages
            }), 400

        except ValueError as err:
            mensagem = str(err)

            if mensagem == "Cliente não encontrado.":
                return jsonify({
                    "erro": mensagem
                }), 404

            return jsonify({
                "erro": mensagem
            }), 409

    @staticmethod
    def deletar(cliente_id):
        try:
            ClienteService.deletar_cliente(cliente_id)

            return jsonify({
                "mensagem": "Cliente excluído com sucesso."
            }), 200

        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 404
