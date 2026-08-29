from app.extensions import db


class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)

    nome = db.Column(db.String(200), nullable=False)

    email_login = db.Column(
        db.String(150),
        unique=True,
        nullable=False
    )

    senha = db.Column(db.String(255), nullable=False)

    perfil = db.Column(
        db.Enum("admin", "funcionario", name="perfil_usuario"),
        nullable=False
    )

    status = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )