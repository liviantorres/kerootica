from app.models.cliente import Cliente
from app.repositories.cliente_repository import ClienteRepository


class ClienteService:

    @staticmethod
    def criar_cliente(dados):
        cpf_existente = ClienteRepository.buscar_por_cpf(
            dados["cpf"]
        )

        if cpf_existente:
            raise ValueError("CPF já cadastrado.")

        ficha_existente = ClienteRepository.buscar_por_numero_ficha(
            dados["numero_ficha"]
        )

        if ficha_existente:
            raise ValueError("Número de ficha já cadastrado.")

        cliente = Cliente(
            numero_ficha=dados["numero_ficha"],
            nome_completo=dados["nome_completo"],
            cpf=dados["cpf"],
            telefone1=dados.get("telefone1"),
            telefone2=dados.get("telefone2"),
            nome_mae=dados.get("nome_mae"),
            nome_pai=dados.get("nome_pai"),
            referencia=dados.get("referencia"),
            email=dados.get("email"),
            endereco=dados.get("endereco")
        )

        return ClienteRepository.criar(cliente)

    @staticmethod
    def buscar_cliente(cliente_id):
        cliente = ClienteRepository.buscar_por_id(cliente_id)

        if not cliente:
            raise ValueError("Cliente não encontrado!")

        return cliente

    @staticmethod
    def buscar_cliente_por_ficha(numero_ficha):
        cliente = ClienteRepository.buscar_por_numero_ficha(numero_ficha)

        if not cliente:
            raise ValueError("Cliente não encontrado!")

        return cliente

    @staticmethod
    def listar_clientes():
        return ClienteRepository.listar_todos()

    @staticmethod
    def atualizar_cliente(cliente_id, dados):
        cliente = ClienteRepository.buscar_por_id(cliente_id)

        if not cliente:
            raise ValueError("Cliente não encontrado.")

        if "cpf" in dados and dados["cpf"] != cliente.cpf:
            cpf_ja_existe = ClienteRepository.buscar_por_cpf(dados["cpf"])

            if cpf_ja_existe:
                raise ValueError("CPF já cadastrado.")

        if "numero_ficha" in dados and dados["numero_ficha"] != cliente.numero_ficha:
            ficha_ja_existe = ClienteRepository.buscar_por_numero_ficha(dados["numero_ficha"])

            if ficha_ja_existe:
                raise ValueError("Número de ficha já cadastrado.")

        campos_atualizaveis = [
            "numero_ficha", 
            "nome_completo", 
            "cpf", 
            "telefone1", 
            "telefone2", 
            "nome_mae", 
            "nome_pai", 
            "referencia", 
            "email", 
            "endereco"
        ]

        for campo in campos_atualizaveis:
            if campo in dados:
                setattr(cliente, campo, dados[campo])

        return ClienteRepository.atualizar(cliente)

    @staticmethod
    def deletar_cliente(cliente_id):
        cliente = ClienteRepository.buscar_por_id(cliente_id)

        if not cliente:
            raise ValueError("Cliente não encontrado!")

        ClienteRepository.deletar(cliente)

        return cliente