import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import novoClienteIcon from '../assets/icons/novo_cliente.svg';
import setaDireita from '../assets/icons/seta_direita.svg';
import { ModalNovoCliente } from '../components/ModalNovoCliente';
import { gerarPDFCompraCompleta } from '../utils/gerarPdfDocumentos';
import './styles/Vendas.css';

const getDataPadraoVencimento = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
};

const initialReceitaState = {
    optometrista: '',
    tipo_lente: '',
    tratamento: '',
    ceratometria_od: '',
    ceratometria_oe: '',
    condicao_motora: '',
    lagrima: '',
    data_retorno: '',
    observacao: '',
    od_esferico: '',
    od_cilindrico: '',
    od_eixo: '',
    od_acuidade: '',
    oe_esferico: '',
    oe_cilindrico: '',
    oe_eixo: '',
    oe_acuidade: ''
};

export default function Vendas() {
    const location = useLocation();
    const { usuario } = useAuth();

    const [clientes, setClientes] = useState([]);
    const [loadingClientes, setLoadingClientes] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [vendaIniciada, setVendaIniciada] = useState(false);
    const [isModalNovoClienteOpen, setIsModalNovoClienteOpen] = useState(false);

    // Estado da Venda (conforme VendaSchema do backend)
    const [vendaForm, setVendaForm] = useState({
        numero_talao: '',
        vendedor: usuario?.nome || 'Administrador',
        laboratorio: '',
        referencia_armacao: '',
        referencia_lente: '',
        valor_armacao: '',
        valor_lentes: '',
        valor_anti_reflexo: '',
        desconto: '',
        entrada: ''
    });

    // Estado de Receita na Venda ('nenhuma' | 'existente' | 'nova')
    const [modoReceita, setModoReceita] = useState('nenhuma');
    const [receitasCliente, setReceitasCliente] = useState([]);
    const [receitaSelecionadaId, setReceitaSelecionadaId] = useState('');
    const [novaReceita, setNovaReceita] = useState(initialReceitaState);

    // Estado de Pagamento e Parcelas (conforme ParcelaSchema do backend)
    const [formaPagamento, setFormaPagamento] = useState('PIX');
    const [qtdParcelas, setQtdParcelas] = useState(1);
    const [primeiroVencimento, setPrimeiroVencimento] = useState(getDataPadraoVencimento());

    // Feedback de salvamento
    const [salvandoVenda, setSalvandoVenda] = useState(false);
    const [erroVenda, setErroVenda] = useState('');
    const [vendaConcluida, setVendaConcluida] = useState(null);

    useEffect(() => {
        carregarClientes();
    }, []);

    useEffect(() => {
        if (usuario?.nome && !vendaForm.vendedor) {
            setVendaForm(prev => ({ ...prev, vendedor: usuario.nome }));
        }
    }, [usuario]);

    // Caso venha da tela de detalhes de Clientes clicando em "Nova venda"
    useEffect(() => {
        if (location.state?.cliente) {
            setClienteSelecionado(location.state.cliente);
            setVendaIniciada(true);
            carregarReceitasDoCliente(location.state.cliente.id);
        }
    }, [location.state]);

    const carregarClientes = async () => {
        try {
            setLoadingClientes(true);
            const response = await api.get('/api/clientes');
            setClientes(response.data);
        } catch (error) {
            console.error('Erro ao buscar clientes para venda:', error);
        } finally {
            setLoadingClientes(false);
        }
    };

    const carregarReceitasDoCliente = async (clienteId) => {
        try {
            const response = await api.get(`/api/receitas/${clienteId}`);
            const lista = Array.isArray(response.data) ? response.data : [];
            setReceitasCliente(lista);
            if (lista.length > 0) {
                setReceitaSelecionadaId(String(lista[0].id));
            } else {
                setReceitaSelecionadaId('');
            }
        } catch (error) {
            setReceitasCliente([]);
            setReceitaSelecionadaId('');
        }
    };

    // Formata o CPF para exibição (000.000.000-00)
    const formatarCPF = (cpf) => {
        if (!cpf) return '-';
        const clean = cpf.toString().replace(/\D/g, '');
        if (clean.length !== 11) return cpf;
        return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
    };

    // Formata o Telefone para exibição ((00) 00000-0000)
    const formatarTelefone = (tel) => {
        if (!tel) return '-';
        const clean = tel.toString().replace(/\D/g, '');
        if (clean.length === 11) {
            return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
        }
        if (clean.length === 10) {
            return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
        }
        return tel;
    };

    const formatarMoeda = (valor) => {
        const num = Number(valor) || 0;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Cálculos automáticos de Subtotal, Total e Saldo a Parcelar
    const vArmacao = parseFloat(vendaForm.valor_armacao) || 0;
    const vLentes = parseFloat(vendaForm.valor_lentes) || 0;
    const vAntiReflexo = parseFloat(vendaForm.valor_anti_reflexo) || 0;
    const vDesconto = parseFloat(vendaForm.desconto) || 0;
    const vEntrada = parseFloat(vendaForm.entrada) || 0;

    const subtotalCalculado = Math.max(0, vArmacao + vLentes + vAntiReflexo);
    const totalCalculado = Math.max(0, subtotalCalculado - vDesconto);
    const saldoRestante = Math.max(0, totalCalculado - vEntrada);

    // Gera prévia de parcelas conforme o saldo restante
    const gerarPreviaParcelas = () => {
        if (saldoRestante <= 0 || qtdParcelas <= 0) return [];
        const parcelas = [];
        const valorBase = Math.floor((saldoRestante / qtdParcelas) * 100) / 100;
        const diferencaCentavos = Number((saldoRestante - valorBase * qtdParcelas).toFixed(2));

        const dataBase = primeiroVencimento ? new Date(`${primeiroVencimento}T12:00:00`) : new Date();

        for (let i = 1; i <= qtdParcelas; i++) {
            const venc = new Date(dataBase);
            venc.setMonth(dataBase.getMonth() + (i - 1));
            const valorParcela = i === 1 ? Number((valorBase + diferencaCentavos).toFixed(2)) : valorBase;

            parcelas.push({
                numero_parcela: i,
                valor: valorParcela,
                data_vencimento_iso: venc.toISOString(),
                data_vencimento_br: venc.toLocaleDateString('pt-BR')
            });
        }
        return parcelas;
    };

    const previaParcelas = gerarPreviaParcelas();

    // Filtra clientes em tempo real pela barra de busca
    const clientesFiltrados = clientes.filter(cliente => {
        if (!searchTerm.trim()) return true;

        const termo = searchTerm.toLowerCase().trim();
        const termoNumerico = searchTerm.replace(/\D/g, '');

        const nome = (cliente.nome_completo || '').toLowerCase();
        const cpf = (cliente.cpf || '').toLowerCase();
        const cpfLimpo = (cliente.cpf || '').replace(/\D/g, '');
        const ficha = (cliente.numero_ficha || '').toLowerCase();
        const tel1 = (cliente.telefone1 || '').replace(/\D/g, '');
        const tel2 = (cliente.telefone2 || '').replace(/\D/g, '');

        return nome.includes(termo) ||
               cpf.includes(termo) ||
               (termoNumerico && cpfLimpo.includes(termoNumerico)) ||
               ficha.includes(termo) ||
               (termoNumerico && tel1.includes(termoNumerico)) ||
               (termoNumerico && tel2.includes(termoNumerico));
    });

    // Quando cadastra um novo cliente pelo modal, já seleciona e inicia a venda imediatamente
    const handleClienteCadastrado = async (novoCliente) => {
        await carregarClientes();
        if (novoCliente && novoCliente.id) {
            setClienteSelecionado(novoCliente);
            setVendaIniciada(true);
            setVendaConcluida(null);
            carregarReceitasDoCliente(novoCliente.id);
        }
    };

    const handleSelecionarCliente = (cliente) => {
        setClienteSelecionado(cliente);
    };

    const handleIniciarVenda = () => {
        if (clienteSelecionado) {
            setVendaIniciada(true);
            setVendaConcluida(null);
            setErroVenda('');
            carregarReceitasDoCliente(clienteSelecionado.id);
        }
    };

    const handleTrocarCliente = () => {
        setVendaIniciada(false);
        setVendaConcluida(null);
        setErroVenda('');
    };

    const handleVendaChange = (e) => {
        const { name, value } = e.target;
        setVendaForm(prev => ({ ...prev, [name]: value }));
        if (erroVenda) setErroVenda('');
    };

    const handleNovaReceitaChange = (e) => {
        const { name, value } = e.target;
        setNovaReceita(prev => ({ ...prev, [name]: value }));
        if (erroVenda) setErroVenda('');
    };

    const resetarFormularioVenda = () => {
        setVendaForm({
            numero_talao: '',
            vendedor: usuario?.nome || 'Administrador',
            laboratorio: '',
            referencia_armacao: '',
            referencia_lente: '',
            valor_armacao: '',
            valor_lentes: '',
            valor_anti_reflexo: '',
            desconto: '',
            entrada: ''
        });
        setModoReceita('nenhuma');
        setNovaReceita(initialReceitaState);
        setQtdParcelas(1);
        setPrimeiroVencimento(getDataPadraoVencimento());
        setErroVenda('');
    };

    const handleFinalizarVenda = async (e) => {
        e.preventDefault();
        setErroVenda('');

        const numTalao = parseInt(vendaForm.numero_talao, 10);
        if (!numTalao || numTalao <= 0) {
            setErroVenda('Informe um Número de Talão válido (numérico).');
            return;
        }

        if (!vendaForm.vendedor.trim()) {
            setErroVenda('Informe o nome do(a) vendedor(a).');
            return;
        }

        if (subtotalCalculado <= 0) {
            setErroVenda('Informe o valor de pelo menos um item (Armação, Lentes ou Antirreflexo).');
            return;
        }

        setSalvandoVenda(true);

        try {
            let receitaIdFinal = null;
            let receitaObjFinal = null;

            // 1. Se selecionou receita existente
            if (modoReceita === 'existente' && receitaSelecionadaId) {
                receitaIdFinal = parseInt(receitaSelecionadaId, 10);
                receitaObjFinal = receitasCliente.find(r => r.id === receitaIdFinal) || null;
            }

            // 2. Se escolheu cadastrar nova receita agora
            if (modoReceita === 'nova') {
                const payloadReceita = {
                    cliente_id: clienteSelecionado.id,
                    optometrista: novaReceita.optometrista.trim() || null,
                    tipo_lente: novaReceita.tipo_lente.trim() || null,
                    tratamento: novaReceita.tratamento.trim() || null,
                    ceratometria_od: novaReceita.ceratometria_od.trim() || null,
                    ceratometria_oe: novaReceita.ceratometria_oe.trim() || null,
                    condicao_motora: novaReceita.condicao_motora.trim() || null,
                    lagrima: novaReceita.lagrima.trim() || null,
                    data_retorno: novaReceita.data_retorno || null,
                    observacao: novaReceita.observacao.trim() || null,
                    olhos: [
                        {
                            olho: 'direito',
                            esferico: novaReceita.od_esferico !== '' ? parseFloat(novaReceita.od_esferico) : null,
                            cilindrico: novaReceita.od_cilindrico !== '' ? parseFloat(novaReceita.od_cilindrico) : null,
                            eixo: novaReceita.od_eixo !== '' ? parseFloat(novaReceita.od_eixo) : null,
                            acuidade_visual: novaReceita.od_acuidade !== '' ? parseFloat(novaReceita.od_acuidade) : null
                        },
                        {
                            olho: 'esquerdo',
                            esferico: novaReceita.oe_esferico !== '' ? parseFloat(novaReceita.oe_esferico) : null,
                            cilindrico: novaReceita.oe_cilindrico !== '' ? parseFloat(novaReceita.oe_cilindrico) : null,
                            eixo: novaReceita.oe_eixo !== '' ? parseFloat(novaReceita.oe_eixo) : null,
                            acuidade_visual: novaReceita.oe_acuidade !== '' ? parseFloat(novaReceita.oe_acuidade) : null
                        }
                    ]
                };

                const resReceita = await api.post('/api/receitas', payloadReceita);
                receitaIdFinal = resReceita.data.id;
                receitaObjFinal = resReceita.data;
            }

            // 3. Cria a Venda no backend (/api/vendas)
            const payloadVenda = {
                numero_talao: numTalao,
                cliente_id: clienteSelecionado.id,
                receita_id: receitaIdFinal,
                vendedor: vendaForm.vendedor.trim().slice(0, 25),
                laboratorio: vendaForm.laboratorio.trim() || null,
                referencia_armacao: vendaForm.referencia_armacao.trim() || null,
                referencia_lente: vendaForm.referencia_lente.trim() || null,
                valor_armacao: vArmacao > 0 ? vArmacao.toFixed(2) : null,
                valor_lentes: vLentes > 0 ? vLentes.toFixed(2) : null,
                valor_anti_reflexo: vAntiReflexo > 0 ? vAntiReflexo.toFixed(2) : null,
                subtotal: subtotalCalculado.toFixed(2),
                desconto: vDesconto.toFixed(2),
                entrada: vEntrada.toFixed(2),
                total: totalCalculado.toFixed(2)
            };

            const resVenda = await api.post('/api/vendas', payloadVenda);
            const vendaCriada = resVenda.data;

            // 4. Cria as Parcelas no backend (/api/parcelas) se houver saldo restante
            const parcelasCriadasLista = [];
            if (previaParcelas.length > 0) {
                for (const p of previaParcelas) {
                    const resParc = await api.post('/api/parcelas', {
                        venda_id: vendaCriada.id,
                        numero_parcela: p.numero_parcela,
                        valor: p.valor.toFixed(2),
                        data_vencimento: p.data_vencimento_iso,
                        forma_de_pagamento: formaPagamento
                    });
                    parcelasCriadasLista.push(resParc.data);
                }
            }

            setVendaConcluida({
                ...vendaCriada,
                parcelas_criadas: previaParcelas.length,
                forma_de_pagamento: formaPagamento,
                receita_obj: receitaObjFinal,
                parcelas_lista: parcelasCriadasLista
            });
            resetarFormularioVenda();
        } catch (error) {
            const msg = error.response?.data?.erro ||
                        error.response?.data?.detalhes ||
                        'Erro ao registrar a venda. Verifique os dados informados.';
            setErroVenda(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSalvandoVenda(false);
        }
    };

    return (
        <div className="page-container vendas-container">
            <div className="vendas-top-bar">
                <div className="page-titles">
                    <h2>Vendas</h2>
                    <p>Busque o cliente para iniciar uma nova venda ou cadastre-o rapidamente</p>
                </div>

                {/* Indicador de etapas da venda */}
                <div className="vendas-stepper">
                    <div className={`step-item ${!vendaIniciada ? 'active' : 'completed'}`}>
                        <span className="step-number">{vendaIniciada ? '✓' : '1'}</span>
                        <span className="step-label">1. Selecionar Cliente</span>
                    </div>
                    <div className="step-divider" />
                    <div className={`step-item ${vendaIniciada ? 'active' : ''}`}>
                        <span className="step-number">2</span>
                        <span className="step-label">2. Dados da Venda</span>
                    </div>
                </div>
            </div>

            {/* ETAPA 1: BUSCAR E SELECIONAR O CLIENTE */}
            {!vendaIniciada ? (
                <div className="vendas-etapa-cliente">
                    <div className="vendas-busca-card">
                        <div className="vendas-busca-header">
                            <div>
                                <h3>Identificar Cliente</h3>
                                <p>Pesquise por nome, CPF, número da ficha ou telefone</p>
                            </div>
                            <button 
                                className="btn-primary" 
                                onClick={() => setIsModalNovoClienteOpen(true)}
                            >
                                <img src={novoClienteIcon} alt="Novo Cliente" className="icon" />
                                Cadastrar Novo Cliente
                            </button>
                        </div>

                        <div className="vendas-search-wrapper">
                            <input
                                type="text"
                                className="search-input vendas-search-input"
                                placeholder="Digite o nome, CPF, nº da ficha ou telefone do cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            {searchTerm && (
                                <button 
                                    className="btn-limpar-busca" 
                                    onClick={() => setSearchTerm('')}
                                    title="Limpar pesquisa"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Lista de resultados */}
                        <div className="vendas-clientes-lista">
                            {loadingClientes ? (
                                <div className="vendas-empty-state">
                                    <p>Carregando clientes...</p>
                                </div>
                            ) : clientesFiltrados.length === 0 ? (
                                <div className="vendas-empty-state">
                                    <p className="empty-title">
                                        {searchTerm
                                            ? `Nenhum cliente encontrado para "${searchTerm}".`
                                            : 'Nenhum cliente cadastrado no sistema.'}
                                    </p>
                                    <span className="empty-subtitle">
                                        Cadastre o cliente agora mesmo sem sair desta tela e prossiga direto para a venda.
                                    </span>
                                    <button 
                                        className="btn-primary btn-cadastrar-direto"
                                        onClick={() => setIsModalNovoClienteOpen(true)}
                                    >
                                        <img src={novoClienteIcon} alt="Novo Cliente" className="icon" />
                                        Cadastrar Cliente e Iniciar Venda
                                    </button>
                                </div>
                            ) : (
                                <div className="vendas-lista-scroll">
                                    {clientesFiltrados.slice(0, 8).map(cliente => {
                                        const isSelected = clienteSelecionado?.id === cliente.id;
                                        const inicial = cliente.nome_completo
                                            ? cliente.nome_completo.trim().charAt(0).toUpperCase()
                                            : 'C';

                                        return (
                                            <div
                                                key={cliente.id}
                                                className={`venda-cliente-item ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleSelecionarCliente(cliente)}
                                            >
                                                <div className="venda-cliente-info-principal">
                                                    <div className="venda-cliente-avatar">
                                                        {inicial}
                                                    </div>
                                                    <div className="venda-cliente-textos">
                                                        <div className="venda-cliente-nome-linha">
                                                            <strong>{cliente.nome_completo}</strong>
                                                            <span className="venda-ficha-tag">
                                                                Ficha {cliente.numero_ficha}
                                                            </span>
                                                        </div>
                                                        <div className="venda-cliente-sub">
                                                            <span>CPF: {formatarCPF(cliente.cpf)}</span>
                                                            <span>•</span>
                                                            <span>Tel: {formatarTelefone(cliente.telefone1)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="venda-cliente-acao">
                                                    {isSelected ? (
                                                        <span className="badge-selecionado">Selecionado ✓</span>
                                                    ) : (
                                                        <button 
                                                            type="button" 
                                                            className="btn-selecionar-item"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelecionarCliente(cliente);
                                                            }}
                                                        >
                                                            Selecionar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Rodapé de confirmação do cliente selecionado para iniciar a venda */}
                        <div className="vendas-confirmacao-bar">
                            {clienteSelecionado ? (
                                <>
                                    <div className="cliente-selecionado-resumo">
                                        <span className="resumo-label">Cliente selecionado:</span>
                                        <strong>{clienteSelecionado.nome_completo}</strong>
                                        <span className="resumo-cpf">
                                            (CPF: {formatarCPF(clienteSelecionado.cpf)} • Ficha {clienteSelecionado.numero_ficha})
                                        </span>
                                    </div>
                                    <button 
                                        className="btn-primary btn-iniciar-venda"
                                        onClick={handleIniciarVenda}
                                    >
                                        Iniciar Venda
                                        <img src={setaDireita} alt="Avançar" className="icon-seta-branca" />
                                    </button>
                                </>
                            ) : (
                                <div className="cliente-nao-selecionado-msg">
                                    Selecione um cliente na lista acima ou cadastre um novo cliente para iniciar a venda.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* ETAPA 2: FORMULÁRIO COMPLETO DE VENDA (SINCRONIZADO COM O BACKEND) */
                <div className="vendas-etapa-dados">
                    {/* Banner do cliente ativo */}
                    <div className="venda-cliente-ativo-banner">
                        <div className="venda-cliente-ativo-esq">
                            <div className="venda-cliente-avatar grande">
                                {clienteSelecionado?.nome_completo?.trim().charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div>
                                <div className="venda-cliente-nome-linha">
                                    <h3>{clienteSelecionado?.nome_completo}</h3>
                                    <span className="venda-ficha-tag">
                                        Ficha {clienteSelecionado?.numero_ficha}
                                    </span>
                                </div>
                                <div className="venda-cliente-sub">
                                    <span><strong>CPF:</strong> {formatarCPF(clienteSelecionado?.cpf)}</span>
                                    <span>•</span>
                                    <span><strong>Telefone:</strong> {formatarTelefone(clienteSelecionado?.telefone1)}</span>
                                    {clienteSelecionado?.data_nascimento && (
                                        <>
                                            <span>•</span>
                                            <span><strong>Nascimento:</strong> {clienteSelecionado.data_nascimento}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button className="btn-secondary btn-trocar-cliente" onClick={handleTrocarCliente}>
                            Trocar cliente
                        </button>
                    </div>

                    {vendaConcluida ? (
                        <div className="venda-sucesso-card">
                            <div className="sucesso-icone">✓</div>
                            <h3>Venda registrada com sucesso!</h3>
                            <p>
                                Talão <strong>#{vendaConcluida.numero_talao}</strong> registrado para{' '}
                                <strong>{clienteSelecionado?.nome_completo}</strong> no valor total de{' '}
                                <strong>{formatarMoeda(vendaConcluida.total)}</strong>.
                            </p>
                            {vendaConcluida.parcelas_criadas > 0 && (
                                <span className="sucesso-sub">
                                    {vendaConcluida.parcelas_criadas} parcela(s) gerada(s) via {vendaConcluida.forma_de_pagamento}.
                                </span>
                            )}
                            <div className="sucesso-acoes">
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => gerarPDFCompraCompleta(
                                        clienteSelecionado,
                                        vendaConcluida,
                                        vendaConcluida.receita_obj,
                                        vendaConcluida.parcelas_lista || []
                                    )}
                                >
                                    📄 Salvar PDF / Imprimir Ordem de Serviço
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-secondary"
                                    onClick={() => setVendaConcluida(null)}
                                >
                                    Nova venda para este cliente
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-secondary"
                                    onClick={() => {
                                        setVendaConcluida(null);
                                        setClienteSelecionado(null);
                                        setVendaIniciada(false);
                                    }}
                                >
                                    Iniciar venda para outro cliente
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleFinalizarVenda} className="venda-form-grid">
                            {/* Coluna Esquerda: Identificação, Receita e Itens */}
                            <div className="venda-col-principal">
                                {erroVenda && <div className="venda-erro-alert">{erroVenda}</div>}

                                {/* Card 1: Dados Gerais da Venda */}
                                <div className="venda-section-card">
                                    <h4 className="venda-section-title">1. Identificação da Venda</h4>
                                    <div className="venda-row-3">
                                        <div className="venda-field">
                                            <label htmlFor="numero_talao">Nº do Talão *</label>
                                            <input
                                                id="numero_talao"
                                                name="numero_talao"
                                                type="number"
                                                min="1"
                                                placeholder="Ex: 1001"
                                                value={vendaForm.numero_talao}
                                                onChange={handleVendaChange}
                                                required
                                            />
                                        </div>

                                        <div className="venda-field">
                                            <label htmlFor="vendedor">Vendedor(a) *</label>
                                            <input
                                                id="vendedor"
                                                name="vendedor"
                                                type="text"
                                                maxLength={25}
                                                placeholder="Nome do vendedor"
                                                value={vendaForm.vendedor}
                                                onChange={handleVendaChange}
                                                required
                                            />
                                        </div>

                                        <div className="venda-field">
                                            <label htmlFor="laboratorio">Laboratório (opcional)</label>
                                            <input
                                                id="laboratorio"
                                                name="laboratorio"
                                                type="text"
                                                maxLength={150}
                                                placeholder="Ex: Lab Óptico Central"
                                                value={vendaForm.laboratorio}
                                                onChange={handleVendaChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Receita Óptica */}
                                <div className="venda-section-card">
                                    <div className="venda-section-header-flex">
                                        <h4 className="venda-section-title">2. Receita Óptica</h4>
                                        <div className="receita-modo-pills">
                                            <button
                                                type="button"
                                                className={`modo-pill ${modoReceita === 'nenhuma' ? 'active' : ''}`}
                                                onClick={() => setModoReceita('nenhuma')}
                                            >
                                                Sem receita
                                            </button>
                                            <button
                                                type="button"
                                                className={`modo-pill ${modoReceita === 'existente' ? 'active' : ''}`}
                                                onClick={() => setModoReceita('existente')}
                                            >
                                                Receita existente ({receitasCliente.length})
                                            </button>
                                            <button
                                                type="button"
                                                className={`modo-pill ${modoReceita === 'nova' ? 'active' : ''}`}
                                                onClick={() => setModoReceita('nova')}
                                            >
                                                + Nova receita
                                            </button>
                                        </div>
                                    </div>

                                    {modoReceita === 'nenhuma' && (
                                        <p className="receita-hint">
                                            Nenhuma receita será vinculada a esta venda. Caso deseje vincular, selecione uma existente ou cadastre uma nova acima.
                                        </p>
                                    )}

                                    {modoReceita === 'existente' && (
                                        <div className="receita-existente-box">
                                            {receitasCliente.length === 0 ? (
                                                <div className="receita-vazia-box">
                                                    <span>Este cliente ainda não possui receitas cadastradas.</span>
                                                    <button
                                                        type="button"
                                                        className="btn-link-azul"
                                                        onClick={() => setModoReceita('nova')}
                                                    >
                                                        Cadastrar nova receita agora →
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="venda-field">
                                                    <label htmlFor="receita_id">Selecione a receita do cliente:</label>
                                                    <select
                                                        id="receita_id"
                                                        value={receitaSelecionadaId}
                                                        onChange={(e) => setReceitaSelecionadaId(e.target.value)}
                                                    >
                                                        {receitasCliente.map(rec => {
                                                            const dataBr = rec.data_receita
                                                                ? new Date(rec.data_receita).toLocaleDateString('pt-BR')
                                                                : '';
                                                            return (
                                                                <option key={rec.id} value={rec.id}>
                                                                    Receita #{rec.id} {dataBr ? `- ${dataBr}` : ''} | Optometrista: {rec.optometrista || 'Não informado'} | Lente: {rec.tipo_lente || '-'}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {modoReceita === 'nova' && (
                                        <div className="nova-receita-form">
                                            <div className="venda-row-4">
                                                <div className="venda-field">
                                                    <label>Optometrista</label>
                                                    <input
                                                        name="optometrista"
                                                        type="text"
                                                        maxLength={60}
                                                        placeholder="Nome do profissional"
                                                        value={novaReceita.optometrista}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                </div>
                                                <div className="venda-field">
                                                    <label>Tipo de Lente</label>
                                                    <input
                                                        name="tipo_lente"
                                                        type="text"
                                                        maxLength={25}
                                                        placeholder="Ex: Multifocal, Visão Simples"
                                                        value={novaReceita.tipo_lente}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                </div>
                                                <div className="venda-field">
                                                    <label>Tratamento</label>
                                                    <input
                                                        name="tratamento"
                                                        type="text"
                                                        maxLength={50}
                                                        placeholder="Ex: Antirreflexo, Filtro Azul"
                                                        value={novaReceita.tratamento}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                </div>
                                                <div className="venda-field">
                                                    <label>Data de Retorno</label>
                                                    <input
                                                        name="data_retorno"
                                                        type="date"
                                                        value={novaReceita.data_retorno}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                </div>
                                            </div>

                                            {/* Tabela de Dioptria: Olho Direito e Olho Esquerdo */}
                                            <div className="olhos-grid-box">
                                                <div className="olhos-grid-header">
                                                    <span>Olho</span>
                                                    <span>Esférico</span>
                                                    <span>Cilíndrico</span>
                                                    <span>Eixo (°)</span>
                                                    <span>Acuidade Visual</span>
                                                </div>

                                                <div className="olhos-grid-row">
                                                    <span className="olho-badge">OD (Direito)</span>
                                                    <input
                                                        name="od_esferico"
                                                        type="number"
                                                        step="0.25"
                                                        placeholder="0.00"
                                                        value={novaReceita.od_esferico}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                    <input
                                                        name="od_cilindrico"
                                                        type="number"
                                                        step="0.25"
                                                        placeholder="0.00"
                                                        value={novaReceita.od_cilindrico}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                    <input
                                                        name="od_eixo"
                                                        type="number"
                                                        step="1"
                                                        placeholder="0"
                                                        value={novaReceita.od_eixo}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                    <input
                                                        name="od_acuidade"
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="1.0"
                                                        value={novaReceita.od_acuidade}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                </div>

                                                <div className="olhos-grid-row">
                                                    <span className="olho-badge">OE (Esquerdo)</span>
                                                    <input
                                                        name="oe_esferico"
                                                        type="number"
                                                        step="0.25"
                                                        placeholder="0.00"
                                                        value={novaReceita.oe_esferico}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                    <input
                                                        name="oe_cilindrico"
                                                        type="number"
                                                        step="0.25"
                                                        placeholder="0.00"
                                                        value={novaReceita.oe_cilindrico}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                    <input
                                                        name="oe_eixo"
                                                        type="number"
                                                        step="1"
                                                        placeholder="0"
                                                        value={novaReceita.oe_eixo}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                    <input
                                                        name="oe_acuidade"
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="1.0"
                                                        value={novaReceita.oe_acuidade}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="venda-row-4">
                                                <div className="venda-field">
                                                    <label>Ceratometria OD</label>
                                                    <input
                                                        name="ceratometria_od"
                                                        type="text"
                                                        maxLength={25}
                                                        placeholder="Opcional"
                                                        value={novaReceita.ceratometria_od}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                </div>
                                                <div className="venda-field">
                                                    <label>Ceratometria OE</label>
                                                    <input
                                                        name="ceratometria_oe"
                                                        type="text"
                                                        maxLength={25}
                                                        placeholder="Opcional"
                                                        value={novaReceita.ceratometria_oe}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                </div>
                                                <div className="venda-field">
                                                    <label>Condição Motora</label>
                                                    <input
                                                        name="condicao_motora"
                                                        type="text"
                                                        maxLength={30}
                                                        placeholder="Opcional"
                                                        value={novaReceita.condicao_motora}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                </div>
                                                <div className="venda-field">
                                                    <label>Lágrima</label>
                                                    <input
                                                        name="lagrima"
                                                        type="text"
                                                        maxLength={20}
                                                        placeholder="Opcional"
                                                        value={novaReceita.lagrima}
                                                        onChange={handleNovaReceitaChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="venda-field">
                                                <label>Observações da Receita</label>
                                                <input
                                                    name="observacao"
                                                    type="text"
                                                    placeholder="Observações adicionais sobre a receita..."
                                                    value={novaReceita.observacao}
                                                    onChange={handleNovaReceitaChange}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card 3: Armação, Lentes e Valores dos Produtos */}
                                <div className="venda-section-card">
                                    <h4 className="venda-section-title">3. Produtos e Valores</h4>

                                    <div className="venda-row-2">
                                        <div className="venda-field">
                                            <label htmlFor="referencia_armacao">Referência da Armação</label>
                                            <input
                                                id="referencia_armacao"
                                                name="referencia_armacao"
                                                type="text"
                                                placeholder="Código, marca ou modelo da armação"
                                                value={vendaForm.referencia_armacao}
                                                onChange={handleVendaChange}
                                            />
                                        </div>

                                        <div className="venda-field">
                                            <label htmlFor="referencia_lente">Referência da Lente</label>
                                            <input
                                                id="referencia_lente"
                                                name="referencia_lente"
                                                type="text"
                                                placeholder="Descrição ou referência das lentes"
                                                value={vendaForm.referencia_lente}
                                                onChange={handleVendaChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="venda-row-3">
                                        <div className="venda-field">
                                            <label htmlFor="valor_armacao">Valor da Armação (R$)</label>
                                            <input
                                                id="valor_armacao"
                                                name="valor_armacao"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0,00"
                                                value={vendaForm.valor_armacao}
                                                onChange={handleVendaChange}
                                            />
                                        </div>

                                        <div className="venda-field">
                                            <label htmlFor="valor_lentes">Valor das Lentes (R$)</label>
                                            <input
                                                id="valor_lentes"
                                                name="valor_lentes"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0,00"
                                                value={vendaForm.valor_lentes}
                                                onChange={handleVendaChange}
                                            />
                                        </div>

                                        <div className="venda-field">
                                            <label htmlFor="valor_anti_reflexo">Valor do Antirreflexo (R$)</label>
                                            <input
                                                id="valor_anti_reflexo"
                                                name="valor_anti_reflexo"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0,00"
                                                value={vendaForm.valor_anti_reflexo}
                                                onChange={handleVendaChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Coluna Direita: Resumo Financeiro e Parcelamento */}
                            <div className="venda-col-resumo">
                                <div className="venda-section-card card-financeiro">
                                    <h4 className="venda-section-title">4. Pagamento e Parcelas</h4>

                                    <div className="financeiro-totais-box">
                                        <div className="fin-linha">
                                            <span>Subtotal:</span>
                                            <strong>{formatarMoeda(subtotalCalculado)}</strong>
                                        </div>

                                        <div className="venda-row-2 fin-inputs-row">
                                            <div className="venda-field">
                                                <label htmlFor="desconto">Desconto (R$)</label>
                                                <input
                                                    id="desconto"
                                                    name="desconto"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0,00"
                                                    value={vendaForm.desconto}
                                                    onChange={handleVendaChange}
                                                />
                                            </div>

                                            <div className="venda-field">
                                                <label htmlFor="entrada">Entrada (R$)</label>
                                                <input
                                                    id="entrada"
                                                    name="entrada"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0,00"
                                                    value={vendaForm.entrada}
                                                    onChange={handleVendaChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="fin-linha total-destaque">
                                            <span>Total da Venda:</span>
                                            <strong>{formatarMoeda(totalCalculado)}</strong>
                                        </div>

                                        <div className="fin-linha saldo-restante">
                                            <span>Saldo a Parcelar:</span>
                                            <strong>{formatarMoeda(saldoRestante)}</strong>
                                        </div>
                                    </div>

                                    <div className="venda-field">
                                        <label htmlFor="forma_pagamento">Forma de Pagamento</label>
                                        <select
                                            id="forma_pagamento"
                                            value={formaPagamento}
                                            onChange={(e) => setFormaPagamento(e.target.value)}
                                        >
                                            <option value="PIX">PIX</option>
                                            <option value="Cartão de Crédito">Cartão de Crédito</option>
                                            <option value="Cartão de Débito">Cartão de Débito</option>
                                            <option value="Dinheiro">Dinheiro</option>
                                        </select>
                                    </div>

                                    {saldoRestante > 0 && (
                                        <>
                                            <div className="venda-row-2">
                                                <div className="venda-field">
                                                    <label htmlFor="qtd_parcelas">Nº de Parcelas</label>
                                                    <select
                                                        id="qtd_parcelas"
                                                        value={qtdParcelas}
                                                        onChange={(e) => setQtdParcelas(Number(e.target.value))}
                                                    >
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                                            <option key={n} value={n}>
                                                                {n}x de {formatarMoeda(saldoRestante / n)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="venda-field">
                                                    <label htmlFor="primeiro_vencimento">1º Vencimento</label>
                                                    <input
                                                        id="primeiro_vencimento"
                                                        type="date"
                                                        value={primeiroVencimento}
                                                        onChange={(e) => setPrimeiroVencimento(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="previa-parcelas-box">
                                                <span className="previa-titulo">Cronograma de Parcelas:</span>
                                                <div className="previa-lista">
                                                    {previaParcelas.map(p => (
                                                        <div key={p.numero_parcela} className="previa-item">
                                                            <span>{p.numero_parcela}ª Parcela ({p.data_vencimento_br})</span>
                                                            <strong>{formatarMoeda(p.valor)}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn-primary btn-finalizar-venda"
                                        disabled={salvandoVenda}
                                    >
                                        {salvandoVenda ? 'Registrando venda...' : 'Finalizar Venda'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Mesmo Modal de Cadastro de Cliente reutilizado diretamente na tela de Vendas */}
            <ModalNovoCliente
                isOpen={isModalNovoClienteOpen}
                onClose={() => setIsModalNovoClienteOpen(false)}
                onClienteCadastrado={handleClienteCadastrado}
            />
        </div>
    );
}
