from app.models.usuario import Usuario
from app.extensions import db

class UsuarioRepository:

    @staticmethod
    def buscar_por_id(usuario_id):
        return db.session.get(Usuario, usuario_id)

    @staticmethod
    def buscar_por_email(email):
        return Usuario.query.filter_by(email_login = email).first()

    @staticmethod
    def criar(usuario):
        db.session.add(usuario)
        db.session.commit()
        return usuario

    @staticmethod
    def atualizar(usuario):
        db.session.commit()
        return usuario

    @staticmethod
    def listar_todos():
        return Usuario.query.all()