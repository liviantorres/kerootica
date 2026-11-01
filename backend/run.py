import os
from app import create_app
from app.extensions import db
from app.repositories.usuario_repository import UsuarioRepository
from app.services.usuario_service import UsuarioService
from flask_cors import CORS

app = create_app()
CORS(app)


def inicializar_banco_e_admin():
    db.create_all()

    admin_nome = os.getenv("ADMIN_NOME", "Administrador")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@kerootica.com")
    admin_senha = os.getenv("ADMIN_PASSWORD", "admin123")

    if admin_email and admin_senha:
        usuario_existente = UsuarioRepository.buscar_por_email(admin_email)
        if not usuario_existente:
            UsuarioService.criar_usuario({
                "nome": admin_nome,
                "email_login": admin_email,
                "senha": admin_senha,
                "perfil": "admin",
                "status": True
            })


with app.app_context():
    inicializar_banco_e_admin()

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
