from app.repositories.parcela_repository import ParcelaRepository
from app.models.parcela import Parcela

class ParcelaService():

    @staticmethod
    def criar_parcela(dados):
        parcela = Parcela(**dados) 

        return ParcelaRepository.salvar(parcela)

    @staticmethod
    def listar_parcelas():
        return ParcelaRepository.listar()

    @staticmethod
    def buscar_por_id(parcela_id):
        parcela = ParcelaRepository.buscar_por_id(parcela_id) 

        if not parcela: 
            raise ValueError("Parcela não existe.") 
        
        return parcela

    @staticmethod
    def buscar_por_venda(venda_id):
        parcela = ParcelaRepository.buscar_por_venda(venda_id)

        if not parcela:
            raise ValueError("Parcela não existe.")

        return parcela

    @staticmethod
    def atualizar_parcela(parcela_id, dados):
        parcela = ParcelaRepository.buscar_por_id(parcela_id)

        if not parcela:
            raise ValueError("Parcela não existe.")

        for campo, valor in dados.items():
                setattr(parcela, campo, valor)

        return ParcelaRepository.atualizar(dados)

    @staticmethod
    def deletar_parcela(parcela_id):
        parcela = ParcelaRepository.buscar_por_id(parcela_id)
        
        if not parcela:
            raise ValueError("Parcela não existe.")

        return ParcelaRepository.deletar(parcela)