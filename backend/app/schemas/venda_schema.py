from marshmallow import Schema, fields

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

    data_venda = fields.DateTime(
        dump_only=True
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