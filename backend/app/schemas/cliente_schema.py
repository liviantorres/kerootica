from datetime import datetime, timedelta
from marshmallow import Schema, fields, validate, EXCLUDE


class ClienteSchema(Schema):
    class Meta:
        unknown = EXCLUDE

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

    rg = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=30)
    )

    data_nascimento = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=20)
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

    email = fields.Email(
        required=False,
        allow_none=True
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

    endereco = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=150)
    )

    referencia = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=150)
    )

    cn = fields.Bool(
        required=False,
        load_default=False
    )

    ca = fields.Bool(
        required=False,
        load_default=False
    )

    data_cadastro = fields.DateTime(
        dump_only=True
    )

    situacao = fields.Method("obter_situacao", dump_only=True)

    def obter_situacao(self, obj):
        vendas = getattr(obj, "vendas", None) or []
        if not vendas:
            return None

        agora = datetime.utcnow()
        tem_atrasada = False
        tem_pendente = False
        tem_garantia_ativa = False

        for venda in vendas:
            if venda.data_venda and (venda.data_venda + timedelta(days=365)) >= agora:
                tem_garantia_ativa = True

            for parc in (getattr(venda, "parcelas", None) or []):
                if parc.status != "Pago":
                    if parc.status == "Vencido" or (parc.data_vencimento and parc.data_vencimento < agora):
                        tem_atrasada = True
                    else:
                        tem_pendente = True

        if tem_atrasada:
            return "Atrasada"
        if tem_pendente:
            return "Regular"
        if tem_garantia_ativa:
            return "Garantia"
        return "Regular"
