from marshmallow import Schema, fields, validate, pre_load

FORMAS_PAGAMENTO_VALIDAS = [
    "PIX",
    "Cartão de Crédito",
    "Cartão de Débito",
    "Dinheiro",
    "Promissória"
]

STATUS_PARCELA_VALIDOS = [
    "Pago",
    "Pendente",
    "Vencido"
]


def _normalizar_datas_parcela(data):
    if not isinstance(data, dict):
        return data
    copia = dict(data)
    for campo in ("data_vencimento", "data_pagamento"):
        val = copia.get(campo)
        if isinstance(val, str) and len(val.strip()) == 10 and "T" not in val:
            copia[campo] = f"{val.strip()}T12:00:00"
    return copia


class ParcelaVendaInputSchema(Schema):
    numero_parcela = fields.Integer(required=True)
    valor = fields.Decimal(as_string=True, required=True)
    data_vencimento = fields.DateTime(required=True)
    data_pagamento = fields.DateTime(required=False, allow_none=True)
    status = fields.String(
        required=False,
        load_default="Pendente",
        validate=validate.OneOf(STATUS_PARCELA_VALIDOS)
    )
    forma_de_pagamento = fields.String(
        required=False,
        allow_none=True,
        validate=validate.OneOf(FORMAS_PAGAMENTO_VALIDAS)
    )

    @pre_load
    def normalizar_datas(self, data, **kwargs):
        return _normalizar_datas_parcela(data)


class ParcelaSchema(Schema):
    id = fields.Integer(dump_only=True)

    venda_id = fields.Integer(
        required=True
    )

    numero_parcela = fields.Integer(
        required=True
    )

    valor = fields.Decimal(
        as_string=True,
        required=True
    )

    data_vencimento = fields.DateTime(
        required=True
    )

    data_pagamento = fields.DateTime(
        required=False,
        allow_none=True
    )

    status = fields.String(
        required=False,
        load_default="Pendente",
        validate=validate.OneOf(STATUS_PARCELA_VALIDOS)
    )

    forma_de_pagamento = fields.String(
        required=False,
        allow_none=True,
        validate=validate.OneOf(FORMAS_PAGAMENTO_VALIDAS)
    )

    @pre_load
    def normalizar_datas(self, data, **kwargs):
        return _normalizar_datas_parcela(data)
