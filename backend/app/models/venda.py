from datetime import datetime

from app.extensions import db


class Venda(db.Model):
    __tablename__ = "vendas"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    numero_talao = db.Column(
        db.Integer,
        unique=True,
        nullable=False
    )

    cliente_id = db.Column(
        db.Integer,
        db.ForeignKey("clientes.id"),
        nullable=False
    )

    receita_id = db.Column(
        db.Integer,
        db.ForeignKey("receitas.id"),
        nullable=True
    )

    vendedor = db.Column(
        db.String(25),
        nullable=False
    )

    data_venda = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    laboratorio = db.Column(
        db.String(150),
        nullable=True
    )

    referencia_armacao = db.Column(
        db.String(255),
        nullable=True
    )

    referencia_lente = db.Column(
        db.String(255),
        nullable=True
    )

    valor_armacao = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    valor_lentes = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    valor_anti_reflexo = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    subtotal = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    desconto = db.Column(
        db.Numeric(10, 2),
        default=0,
        nullable=False
    )

    entrada = db.Column(
        db.Numeric(10, 2),
        default=0,
        nullable=False
    )

    total = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    cliente = db.relationship(
        "Cliente",
        back_populates="vendas"
    )

    receita = db.relationship(
        "Receita",
        back_populates="vendas"
    )

    parcelas = db.relationship(
        "Parcela",
        back_populates="venda"
    )