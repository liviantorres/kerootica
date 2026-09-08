from app.extensions import db
from app.models.venda import Venda

class VendaRepository():

    @staticmethod
    def salvar(venda):
        db.session.add(venda)
        db.session.commit()
        return venda

    @staticmethod
    def buscar_por_id(venda_id):
        return db.session.get(Venda, venda_id)

    @staticmethod
    def buscar_por_cliente(cliente_id):
        return Venda.query.filter_by(cliente_id=cliente_id).order_by(Venda.data_venda.desc()).all()

    @staticmethod
    def buscar_por_receita(receita_id):
        return Venda.query.filter_by(receita_id=receita_id).order_by(Venda.data_venda.desc()).all()

    @staticmethod
    def buscar_por_numero_talao(numero_talao):
        return Venda.query.filter_by(numero_talao=numero_talao).first()

    @staticmethod
    def listar():
        return Venda.query.all()

    @staticmethod
    def atualizar(venda):
        db.session.commit()
        return venda

    @staticmethod
    def deletar(venda):
        db.session.delete(venda)
        db.session.commit()