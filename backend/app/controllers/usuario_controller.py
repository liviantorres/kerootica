from app.schemas.usuario_schema import UsuarioSchema
from app.services.usuario_service import UsuarioService
from flask import request, jsonify
from marshmallow import ValidationError

usuario_schema = UsuarioSchema()

class UsuarioController:

    @staticmethod
    def criar():
        try:
            dados_validados= usuario_schema.load(request.json)
            usuario_criado = UsuarioService.criar_usuario(dados_validados)

            return jsonify(usuario_schema.dump(usuario_criado)),201

        except ValidationError as err:
            return jsonify({"erro": "Dados inválidos", "detalhes": err.messages}), 400

        except ValueError as err:
            return jsonify({"erro": str(err)}), 422