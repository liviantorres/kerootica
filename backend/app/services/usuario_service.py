from app.services.auth_service import AuthService
from app.models.usuario import Usuario
from app.repositories.usuario_repository import UsuarioRepository
from flask_jwt_extended import create_access_token

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

    @staticmethod
    def autenticar_usuario(email, senha):
        usuario = UsuarioRepository.buscar_por_email(email)

        if not usuario:
            raise ValueError("Email inválido.")

        if not usuario.status:
              raise ValueError("Usuário inativo.")

        senha_valida = AuthService.verificar_senha(
              senha,
              usuario.senha
        )

        if not senha_valida:
              raise ValueError("Senha inválida.")

        token = create_access_token(
              identity=str(usuario.id),
              additional_claims ={
                    "perfil": usuario.perfil
              }
        )

        return usuario, token