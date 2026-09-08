from app.models.venda import Venda
from app.repositories.venda_repository import VendaRepository


class VendaService:

    @staticmethod
    def criar_venda(numero_talao, dados):
        numero_talao_existe = VendaRepository.buscar_por_numero_talao(
            numero_talao
        )

        if numero_talao_existe:
            raise ValueError("Número do talão já está cadastrado.")

        venda = Venda(**dados)

        return VendaRepository.salvar(venda)

    @staticmethod
    def buscar_por_id(venda_id):
        venda = VendaRepository.buscar_por_id(venda_id)

        if not venda:
            raise ValueError("Venda não existe.")

        return venda

    @staticmethod
    def buscar_por_cliente(cliente_id):
        vendas = VendaRepository.buscar_por_cliente(cliente_id)

        if not vendas:
            raise ValueError("Nenhuma venda encontrada para este cliente.")

        return vendas

    @staticmethod
    def buscar_por_receita(receita_id):
        vendas = VendaRepository.buscar_por_receita(receita_id)

        if not vendas:
            raise ValueError("Nenhuma venda encontrada para esta receita.")

        return vendas

    @staticmethod
    def buscar_por_numero_talao(numero_talao):
        venda = VendaRepository.buscar_por_numero_talao(numero_talao)

        if not venda:
            raise ValueError("Venda não existe.")

        return venda

    @staticmethod
    def listar():
        return VendaRepository.listar()

    @staticmethod
    def atualizar(venda_id, dados):
        venda = VendaRepository.buscar_por_id(venda_id)

        if not venda:
            raise ValueError("Venda não existe.")

        for campo, valor in dados.items():
            setattr(venda, campo, valor)

        return VendaRepository.atualizar(venda)

    @staticmethod
    def deletar(venda_id):
        venda = VendaRepository.buscar_por_id(venda_id)

        if not venda:
            raise ValueError("Venda não existe.")

        VendaRepository.deletar(venda)