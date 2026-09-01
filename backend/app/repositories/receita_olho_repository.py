from app.extensions import db
from app.models.receita_olho import ReceitaOlho

class ReceitaOlhoRepository:

    @staticmethod
    def listar_todos():
        return ReceitaOlho.query.all()

    @staticmethod
    def buscar_por_id(receita_olho_id):
        return db.session.get(ReceitaOlho, receita_olho_id)

    @staticmethod
    def listar_por_receita(receita_id):
        return ReceitaOlho.query.filter_by(receita_id=receita_id).all()

    @staticmethod
    def criar(receita_olho):
        db.session.add(receita_olho)
        db.session.commit()
        return receita_olho

    @staticmethod
    def atualizar(receita_olho):
        db.session.commit()
        return receita_olho

    @staticmethod
    def deletar(receita_olho):
        db.session.delete(receita_olho)
        db.session.commit()

    
