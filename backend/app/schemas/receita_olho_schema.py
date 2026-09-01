from marshmallow import Schema, fields, validate

class ReceitaOlhoSchema(Schema):

    id = fields.Int(dump_only=True)
    receita_id = fields.Int(required=True, allow_none=False)

    olho = fields.Str(
        required = True,
        validate = validate.OneOf([
            "direito",
            "esquerdo"
        ])
    )

    esferico = fields.Float(required=False, allow_none=True)
    cilindrico = fields.Float(required=False, allow_none=True)
    eixo = fields.Float(required=False, allow_none=True)
    acuidade_visual = fields.Float(required=False, allow_none=True)