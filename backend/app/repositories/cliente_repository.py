from app.models.cliente import Cliente
from app.extensions import db

class ClienteRepository:
    
    @staticmethod
    def buscar_por_cpf(cpf: str) -> Cliente:
        return Cliente.query.filter_by(cpf=cpf).first()

    @staticmethod
    def salvar(cliente: Cliente) -> Cliente:
        db.session.add(cliente)
        db.session.commit()
        return cliente