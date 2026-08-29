from app.services.auth_service import AuthService
from app.models.usuario import Usuario
from app.repositories.usuario_repository import UsuarioRepository

class UsuarioService:

    @staticmethod
    def criar_usuario(dados):

        senha_hash= AuthService.gerar_hash_senha(dados["senha"])
        usuario_existente = UsuarioRepository.buscar_por_email(dados['email_login'])

        if usuario_existente:
                    raise ValueError("Já existe um usuário cadastrado com este Email.")
        

        novo_usuario = Usuario(
            nome = dados["nome"],
            email_login=dados["email_login"],
            senha=senha_hash,
            perfil=dados["perfil"],
            status=dados.get("status", True)
        )

        return UsuarioRepository.criar(novo_usuario)