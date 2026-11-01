from app.extensions import db
from app.models.venda import Venda
from app.models.receita import Receita
from app.models.receita_olho import ReceitaOlho
from app.models.parcela import Parcela
from app.repositories.venda_repository import VendaRepository


class VendaService:

    @staticmethod
    def criar_venda(dados):
        numero_talao_existe = VendaRepository.buscar_por_numero_talao(
            dados["numero_talao"]
        )

        if numero_talao_existe:
            raise ValueError("Número do talão já está cadastrado.")

        dados_venda = dict(dados)
        nova_receita_dados = dados_venda.pop("nova_receita", None)
        parcelas_dados = dados_venda.pop("parcelas_input", None)

        if dados_venda.get("data_venda") is None:
            dados_venda.pop("data_venda", None)

        try:
            if nova_receita_dados:
                olhos_dados = nova_receita_dados.pop("olhos", [])
                nova_receita_dados["cliente_id"] = dados_venda["cliente_id"]
                if not nova_receita_dados.get("optometrista") and dados_venda.get("optometrista"):
                    nova_receita_dados["optometrista"] = dados_venda["optometrista"]
                elif nova_receita_dados.get("optometrista") and not dados_venda.get("optometrista"):
                    dados_venda["optometrista"] = nova_receita_dados["optometrista"]
                receita = Receita(**nova_receita_dados)
                for olho in olhos_dados:
                    receita.olhos.append(ReceitaOlho(**olho))
                db.session.add(receita)
                db.session.flush()
                dados_venda["receita_id"] = receita.id

            venda = Venda(**dados_venda)
            db.session.add(venda)
            db.session.flush()

            if parcelas_dados:
                for parc in parcelas_dados:
                    nova_parcela = Parcela(venda_id=venda.id, **parc)
                    db.session.add(nova_parcela)

            db.session.commit()
            return venda
        except Exception as err:
            db.session.rollback()
            raise err

    @staticmethod
    def buscar_por_id(venda_id):
        venda = VendaRepository.buscar_por_id(venda_id)

        if not venda:
            raise ValueError("Venda não existe.")

        return venda

    @staticmethod
    def buscar_por_cliente(cliente_id):
        return VendaRepository.buscar_por_cliente(cliente_id)

    @staticmethod
    def buscar_por_receita(receita_id):
        return VendaRepository.buscar_por_receita(receita_id)

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

        if "numero_talao" in dados and dados["numero_talao"] != venda.numero_talao:
            existente = VendaRepository.buscar_por_numero_talao(dados["numero_talao"])
            if existente and existente.id != venda.id:
                raise ValueError("Número do talão já está cadastrado em outra venda.")

        dados_venda = dict(dados)
        nova_receita_dados = dados_venda.pop("nova_receita", None)
        parcelas_dados = dados_venda.pop("parcelas_input", None)

        if "data_venda" in dados_venda and dados_venda["data_venda"] is None:
            dados_venda.pop("data_venda", None)

        try:
            if nova_receita_dados:
                olhos_dados = nova_receita_dados.pop("olhos", [])
                nova_receita_dados["cliente_id"] = dados_venda.get("cliente_id", venda.cliente_id)
                if not nova_receita_dados.get("optometrista") and dados_venda.get("optometrista"):
                    nova_receita_dados["optometrista"] = dados_venda["optometrista"]
                elif nova_receita_dados.get("optometrista") and not dados_venda.get("optometrista"):
                    dados_venda["optometrista"] = nova_receita_dados["optometrista"]
                receita = Receita(**nova_receita_dados)
                for olho in olhos_dados:
                    receita.olhos.append(ReceitaOlho(**olho))
                db.session.add(receita)
                db.session.flush()
                dados_venda["receita_id"] = receita.id

            for campo, valor in dados_venda.items():
                setattr(venda, campo, valor)

            if parcelas_dados is not None:
                venda.parcelas.clear()
                db.session.flush()
                for parc in parcelas_dados:
                    nova_parcela = Parcela(venda_id=venda.id, **parc)
                    db.session.add(nova_parcela)

            db.session.commit()
            return venda
        except Exception as err:
            db.session.rollback()
            raise err

    @staticmethod
    def deletar(venda_id):
        venda = VendaRepository.buscar_por_id(venda_id)

        if not venda:
            raise ValueError("Venda não existe.")

        VendaRepository.deletar(venda)
