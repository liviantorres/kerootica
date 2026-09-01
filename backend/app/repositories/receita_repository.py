from app.extensions import db
from app.models.receita import Receita

class ReceitaRepository:

    @staticmethod
    def criar(receita):
        db.session.add(receita)
        db.session.commit()
        return receita

    @staticmethod
    def atualizar(receita):
        db.session.commit()
        return receita

    @staticmethod
    def listar():
        return Receita.query.all()

    @staticmethod
    def buscar_por_id(receita_id):
        return db.session.get(Receita, receita_id)

    @staticmethod
    def listar_por_cliente(cliente_id):
        return Receita.query.filter_by(cliente_id=cliente_id).all()

    @staticmethod
    def deletar(receita):
        db.session.delete(receita)
        db.session.commit()