from app.extensions import db

class Receitaolho(db.Model):

    __tablename__ = "receitas_olhos"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    receita_id = db.Column(
        db.Integer,
        db.ForeignKey("receitas.id"),
        nullable=False
    )

    olho = db.Column(
        db.Enum(
            "direito",
            "esquerdo",
            name="olho"
        ),
        nullable=False
    )

    esferico = db.Column(
        db.Float,
        nullable=True
    )

    cilindrico = db.Column(
        db.Float,
        nullable=True
    )

    eixo = db.Column(
        db.Float,
        nullable=True
    )

    acuidade_visual = db.Column(
        db.Float,
        nullable=True
    )

    receita = db.relationship(
        "Receita",
        backref="olhos"
    )
