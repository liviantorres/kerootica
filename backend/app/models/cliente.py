from app.extensions import db
from datetime import datetime


class Cliente(db.Model):

    __tablename__ = "clientes"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    numero_ficha = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    nome_completo = db.Column(
        db.String(200),
        nullable=False
    )

    cpf = db.Column(
        db.String(14),
        unique=True,
        nullable=False
    )

    telefone1 = db.Column(db.String(20))
    telefone2 = db.Column(db.String(20))

    nome_mae = db.Column(db.String(200))
    nome_pai = db.Column(db.String(200))

    referencia = db.Column(db.String(150))
    email = db.Column(db.String(150))
    endereco = db.Column(db.String(150))

    data_cadastro = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )