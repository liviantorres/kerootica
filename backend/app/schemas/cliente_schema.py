from marshmallow import Schema, fields, validate


class ClienteSchema(Schema):

    id = fields.Int(
        dump_only=True
    )

    numero_ficha = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=50)
    )

    nome_completo = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=200)
    )

    cpf = fields.Str(
        required=True,
        validate=validate.Length(equal=11)
    )

    telefone1 = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=20)
    )

    telefone2 = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=20)
    )

    nome_mae = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=200)
    )

    nome_pai = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=200)
    )

    referencia = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=150)
    )

    email = fields.Email(
        required=False,
        allow_none=True
    )

    endereco = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=150)
    )

    data_cadastro = fields.DateTime(
        dump_only=True
    )