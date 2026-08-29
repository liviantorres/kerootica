from flask import request, jsonify
from app.services.cliente_service import ClienteService
from app.schemas.cliente_schema import ClienteSchema
from marshmallow import ValidationError

cliente_schema = ClienteSchema()

class ClienteController:
    
    @staticmethod
    def criar():
        try:
            # 1. Obtém e valida os dados da requisição
            dados_validados = cliente_schema.load(request.json)
            
            # 2. Chama a camada de negócio
            cliente_criado = ClienteService.criar_cliente(dados_validados)
            
            # 3. Formata e retorna a resposta de sucesso
            return jsonify(cliente_schema.dump(cliente_criado)), 201
            
        except ValidationError as err:
            # Erro de validação de dados (Ex: CPF com tamanho errado)
            return jsonify({"erro": "Dados inválidos", "detalhes": err.messages}), 400
            
        except ValueError as err:
            # Erro de regra de negócio (Ex: CPF já existe)
            return jsonify({"erro": str(err)}), 422