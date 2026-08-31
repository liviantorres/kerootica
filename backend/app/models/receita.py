from app.extensions import db
from datetime import datetime


class Receita(db.Model):

    __tablename__ = "receitas"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    cliente_id = db.Column(
        db.Integer,
        db.ForeignKey("clientes.id"),
        nullable=False
    )

    optometrista = db.Column(
        db.String(60),
        nullable=False
    )

    tipo_lente = db.Column(
        db.String(25),
        nullable=False
    )

    tratamento = db.Column(
        db.String(50)
    )

    ceratometria_od = db.Column(
        db.String(25)
    )

    ceratometria_oe = db.Column(
        db.String(25)
    )

    observacao = db.Column(
        db.Text
    )

    condicao_motora = db.Column(
        db.String(30)
    )

    lagrima = db.Column(
        db.String(20)
    )

    data_retorno = db.Column(
        db.Date
    )

    data_receita = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    cliente = db.relationship(
            "Cliente",
            backref="receitas"
        )
    