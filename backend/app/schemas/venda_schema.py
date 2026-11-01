from marshmallow import Schema, fields, pre_load
from app.schemas.cliente_schema import ClienteSchema
from app.schemas.receita_schema import ReceitaSchema
from app.schemas.receita_olho_schema import ReceitaOlhoSchema
from app.schemas.parcela_schema import ParcelaSchema, ParcelaVendaInputSchema


class NovaReceitaVendaInputSchema(Schema):
    cliente_id = fields.Int(required=False, allow_none=True)
    optometrista = fields.Str(required=False, allow_none=True)
    tipo_lente = fields.Str(required=False, allow_none=True)
    tratamento = fields.Str(required=False, allow_none=True)
    ceratometria_od = fields.Str(required=False, allow_none=True)
    ceratometria_oe = fields.Str(required=False, allow_none=True)
    observacao = fields.Str(required=False, allow_none=True)
    condicao_motora = fields.Str(required=False, allow_none=True)
    lagrima = fields.Str(required=False, allow_none=True)
    data_retorno = fields.Date(required=False, allow_none=True)
    olhos = fields.Nested(ReceitaOlhoSchema, many=True, required=False, load_default=list)


class VendaSchema(Schema):

    id = fields.Int(dump_only=True)

    numero_talao = fields.Int(required=True)

    cliente_id = fields.Int(required=True)

    receita_id = fields.Int(
        required=False,
        allow_none=True
    )

    vendedor = fields.Str(
        required=True
    )

    optometrista = fields.Str(
        required=False,
        allow_none=True
    )

    data_venda = fields.DateTime(
        required=False,
        allow_none=True
    )

    laboratorio = fields.Str(
        required=False,
        allow_none=True
    )

    referencia_armacao = fields.Str(
        required=False,
        allow_none=True
    )

    referencia_lente = fields.Str(
        required=False,
        allow_none=True
    )

    valor_armacao = fields.Decimal(
        as_string=True,
        required=False,
        allow_none=True
    )

    valor_lentes = fields.Decimal(
        as_string=True,
        required=False,
        allow_none=True
    )

    custo_armacao = fields.Decimal(
        as_string=True,
        required=False,
        allow_none=True
    )

    custo_lentes = fields.Decimal(
        as_string=True,
        required=False,
        allow_none=True
    )

    valor_anti_reflexo = fields.Decimal(
        as_string=True,
        required=False,
        allow_none=True
    )

    subtotal = fields.Decimal(
        as_string=True,
        required=True
    )

    desconto = fields.Decimal(
        as_string=True,
        required=False,
        allow_none=True
    )

    entrada = fields.Decimal(
        as_string=True,
        required=False,
        allow_none=True
    )

    total = fields.Decimal(
        as_string=True,
        required=True
    )

    # Campos opcionais de entrada para criação/atualização atômica (Receita + Venda + Parcelas)
    nova_receita = fields.Nested(
        NovaReceitaVendaInputSchema,
        required=False,
        allow_none=True,
        load_only=True
    )

    parcelas_input = fields.Nested(
        ParcelaVendaInputSchema,
        many=True,
        required=False,
        allow_none=True,
        load_only=True,
        data_key="parcelas"
    )

    # Campos retornados na resposta da venda
    cliente = fields.Nested(
        ClienteSchema,
        dump_only=True
    )

    receita = fields.Nested(
        ReceitaSchema,
        dump_only=True
    )

    parcelas = fields.Nested(
        ParcelaSchema,
        many=True,
        dump_only=True
    )

    @pre_load
    def normalizar_data_venda(self, data, **kwargs):
        if isinstance(data, dict):
            val = data.get("data_venda")
            if isinstance(val, str):
                val_str = val.strip()
                if not val_str:
                    data.pop("data_venda", None)
                elif len(val_str) == 10 and "T" not in val_str:
                    data["data_venda"] = f"{val_str}T12:00:00"
        return data
