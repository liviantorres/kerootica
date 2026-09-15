from app.extensions import db
from app.models.parcela import Parcela


class ParcelaRepository:

    @staticmethod
    def salvar(parcela):
        db.session.add(parcela)
        db.session.commit()
        return parcela

    @staticmethod
    def listar():
        return Parcela.query.all()

    @staticmethod
    def buscar_por_id(parcela_id):
        return db.session.get(Parcela, parcela_id)

    @staticmethod
    def buscar_por_venda(venda_id):
        return Parcela.query.filter_by(
            venda_id=venda_id
        ).order_by(Parcela.numero_parcela).all()

    @staticmethod
    def atualizar(parcela):
        db.session.commit()
        return parcela

    @staticmethod
    def deletar(parcela):
        db.session.delete(parcela)
        db.session.commit()
