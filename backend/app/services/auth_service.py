from werkzeug.security import generate_password_hash, check_password_hash

class AuthService:

    @staticmethod
    def gerar_hash_senha(senha):
        return generate_password_hash(senha)

    @staticmethod
    def verificar_senha(senha, senha_hash):
        return check_password_hash(senha_hash, senha)