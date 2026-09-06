from app.models.receita import Receita
from app.models.receita_olho import ReceitaOlho
from app.repositories.receita_repository import ReceitaRepository

class ReceitaService:

    @staticmethod
    def criar_receita(dados):

        olhos = dados.pop("olhos", [])
        receita = Receita(**dados)

        for olho in olhos:
            receita_olho = ReceitaOlho(**olho)
            receita.olhos.append(receita_olho)

        return ReceitaRepository.salvar(receita)

    @staticmethod
    def buscar_receita(receita_id):
        receita = ReceitaRepository.buscar_por_id(receita_id)

        if not receita:
            raise ValueError("Receita não encontrada.")

        return receita

    @staticmethod
    def buscar_por_cliente(cliente_id):
        return ReceitaRepository.buscar_por_cliente(cliente_id)

    @staticmethod
    def listar_receitas():
        return ReceitaRepository.listar()

    @staticmethod
    def atualizar_receita(receita_id, dados):
        receita = ReceitaRepository.buscar_por_id(receita_id)

        if not receita:
            raise ValueError("Receita não encontrada.")

        for campo, valor in dados.items():
            setattr(receita, campo, valor)

        return ReceitaRepository.atualizar(receita)

    @staticmethod
    def deletar_receita(receita_id):
        receita = ReceitaRepository.buscar_por_id(receita_id)
        
        if not receita:
            raise ValueError("Receita não encontrada.")

        return ReceitaRepository.deletar(receita)