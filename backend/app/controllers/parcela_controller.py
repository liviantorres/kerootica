from flask import jsonify, request
from marshmallow import ValidationError

from app.schemas.parcela_schema import ParcelaSchema
from app.services.parcela_service import ParcelaService

parcela_schema = ParcelaSchema()
parcelas_schema = ParcelaSchema(many=True)

class ParcelaController():

    @staticmethod
    def criar():
        try:
            dados = parcela_schema.load(request.get_json())
            parcela = ParcelaService.criar_parcela(dados)

            return jsonify(
                    parcela_schema.dump(parcela)
            ), 201

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
    def listar():
        parcelas = ParcelaService.listar_parcelas()

        return jsonify(
                parcelas_schema.dump(parcelas)
            ), 200

    @staticmethod
    def buscar_por_id(parcela_id):
        try:
            parcela = ParcelaService.buscar_por_id(parcela_id)

            return jsonify(
                parcela_schema.dump(parcela)
            ), 200

        except ValueError as err:
             return jsonify({
                  "erro": str(err)
             }), 404

    @staticmethod
    def buscar_por_venda(venda_id):
        try:
            parcelas = ParcelaService.buscar_por_venda(venda_id)

            return jsonify(
                 parcelas_schema.dump(parcelas)
            ), 200

        except ValueError as err:
             return jsonify({
                  "erro": str(err)
             }), 404

    @staticmethod
    def atualizar_parcela(parcela_id):
        try: 

            dados = parcela_schema.load(
                            request.get_json(), 
                            partial=True

                )
            
            parcela = ParcelaService.atualizar_parcela(parcela_id, dados)
            return jsonify(
                            parcela_schema.dump(parcela)
                        ), 200

        except ValidationError as err:
             return jsonify({
                  "erro": "Dados inválidos",
                  "detalhes": err.messages
             }),400

        except ValueError as err:
             return jsonify({
                  "erro": str(err)
             }), 404

    @staticmethod
    def deletar(parcela_id):
        try:
            ParcelaService.deletar_parcela(parcela_id)

            return jsonify({
                        "mensagem": "Parcela excluída com sucesso."
                    }), 200
        
        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 404


         
              