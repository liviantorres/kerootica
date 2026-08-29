from app.repositories.cliente_repository import ClienteRepository
from app.models.cliente import Cliente
import uuid

class ClienteService:
    
    @staticmethod
    def criar_cliente(dados: dict) -> Cliente:
        # Regra de negócio 1: Não permitir CPF duplicado
        cliente_existente = ClienteRepository.buscar_por_cpf(dados['cpf'])
        if cliente_existente:
            # Lançamos um erro de negócio puro. Sem conhecer HTTP.
            raise ValueError("Já existe um cliente cadastrado com este CPF.")

        # Regra de negócio 2: Gerar número da ficha automaticamente se não for enviado
        numero_ficha = dados.get('numero_ficha')
        if not numero_ficha:
            numero_ficha = f"FCH-{str(uuid.uuid4())[:8].upper()}"

        novo_cliente = Cliente(
            numero_ficha=numero_ficha,
            nome_completo=dados['nome_completo'],
            cpf=dados['cpf'],
            telefone1=dados['telefone1']
        )
        
        return ClienteRepository.salvar(novo_cliente)