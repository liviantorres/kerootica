from app.extensions import db
from app.models.cliente import Cliente


class ClienteRepository:

    @staticmethod
    def buscar_por_id(cliente_id):
        return db.session.get(Cliente, cliente_id)

    @staticmethod
    def buscar_por_cpf(cpf):
        return Cliente.query.filter_by(cpf=cpf).first()

    @staticmethod
    def buscar_por_numero_ficha(numero_ficha):
        return Cliente.query.filter_by(
            numero_ficha=numero_ficha
        ).first()

    @staticmethod
    def listar_todos():
        return Cliente.query.order_by(
            Cliente.nome_completo
        ).all()

    @staticmethod
    def criar(cliente):
        db.session.add(cliente)
        db.session.commit()
        return cliente

    @staticmethod
    def atualizar(cliente):
        db.session.commit()
        return cliente

    @staticmethod
    def deletar(cliente):
        db.session.delete(cliente)
        db.session.commit()