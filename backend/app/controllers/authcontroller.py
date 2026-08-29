from flask import jsonify, request
from app.services.usuario_service import UsuarioService


class AuthController:

    @staticmethod
    def login():
        dados = request.json

        try:
            usuario, token = UsuarioService.autenticar_usuario(
                dados.get("email_login"),
                dados.get("senha")
            )
            return jsonify({
                "token": token,
                "usuario":{
                    "id": usuario.id,
                    "nome": usuario.nome,
                    "email_login": usuario.email_login,
                    "perfil": usuario.perfil
                }
            }), 200
        
        except ValueError as err:
            return jsonify({
                "erro": str(err)
            }), 401
