from marshmallow import Schema, fields


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
        allow_none=True
    )

    status = fields.String(
        dump_only=True
    )

    forma_de_pagamento = fields.String(
        allow_none=True
    )
