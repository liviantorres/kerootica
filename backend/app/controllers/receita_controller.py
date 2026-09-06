from flask import jsonify, request
from marshmallow import ValidationError

from app.schemas.receita_schema import ReceitaSchema

from app.services.receita_service import ReceitaService

receita_schema = ReceitaSchema()
receitas_schema = ReceitaSchema(many=True)

class ReceitaController:

    @staticmethod
    def criar():
        try:
            dados = receita_schema.load(request.get_json())

            receita = ReceitaService.criar_receita(dados)
            return jsonify(
                receita_schema.dump(receita)
            ), 201
        
        except ValidationError as err:
            return jsonify({
                "erro":"Dados inválidos",
                "detalhes": err.messages
            }), 400

        except ValueError as err:
            return jsonify({
                "erro": str(err) 
            }), 409

    @staticmethod
    def listar():
        receitas = ReceitaService.listar_receitas()

        return jsonify(
            receitas_schema.dump(receitas)
        ), 200

    @staticmethod
    def buscar(receita_id):
        try:
            receita = ReceitaService.buscar_receita(receita_id)

            return jsonify(
                receita_schema.dump(receita)
            ), 200
        
        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 404

    @staticmethod
    def buscar_por_cliente(cliente_id):
        receitas = ReceitaService.buscar_por_cliente(cliente_id)

        return jsonify(
            receitas_schema.dump(receitas)
        ), 200

    @staticmethod
    def atualizar(receita_id):
        try:
            dados = receita_schema.load(
                request.get_json(), 
                partial=True
            )

            receita = ReceitaService.atualizar_receita(receita_id, dados)

            return jsonify(
                receita_schema.dump(receita)
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
    def deletar(receita_id):
        try:
            ReceitaService.deletar_receita(receita_id)

            return jsonify({
                "mensagem": "Receita excluída com sucesso."
            }), 200

        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 404