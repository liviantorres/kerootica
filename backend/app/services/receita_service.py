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

        return ReceitaRepository.criar(receita)
