from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def admin_required(func):

    @wraps(func)
    def wrapper(*arg, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()

        if claims.get("perfil") != "admin":
            return jsonify({
                "erro" : "Acesso permitido apenas para administradores."

            }), 403

        return func(*arg, **kwargs)

    return wrapper