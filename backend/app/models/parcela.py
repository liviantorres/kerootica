from app.extensions import db

class Parcela(db.Model):

    __tablename__ = "parcelas"

    id = db.Column(
        db.Integer,
        primary_key = True
    )

    venda_id = db.Column(
        db.Integer,
        db.ForeignKey("vendas.id"),
        nullable=False
    )

    numero_parcela = db.Column(
        db.Integer,
        nullabel=False
    )

    valor = db.Column(
        db.Numeric(10, 2)
    )

    data_vencimento = db.Column(
        db.DateTime,
        nullable=False
    )

    data_pagamento = db.Column(
        db.DateTime,
    )

    status = db.Column(
        db.Enum("Pago", "Pendente", "Vencido", name="status_parcela"),
        default="Pendente",
        nullable=False,
    )

    forma_de_pagamento = db.Column(
        db.Enum("PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", name="forma_pagamento")
    )

    vendas = db.relationship(
        "Venda",
        back_populates="parcelas"
    )