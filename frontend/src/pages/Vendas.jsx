import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import filtroIcon from '../assets/icons/filtro.svg';
import novoClienteIcon from '../assets/icons/novo_cliente.svg';
import setaEsquerda from '../assets/icons/seta_esquerda.svg';
import setaDireita from '../assets/icons/seta_direita.svg';
import { ModalNovoCliente } from '../components/ModalNovoCliente';
import { ModalDetalheCompra } from '../components/ModalDetalheCompra';
import {
    gerarPDFCompraCompleta,
    gerarPDFReciboParcela,
    gerarPDFFolhaDeVendas
} from '../utils/gerarPdfDocumentos';
import './styles/Vendas.css';

const getDataPadraoVencimento = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
};

const getHojeISO = () => {
    return new Date().toISOString().split('T')[0];
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

    // Controle de visão: 'lista' (histórico/gestão de vendas) | 'formulario' (nova venda ou edição)
    const [modoTela, setModoTela] = useState('lista');
    const [vendaEmEdicao, setVendaEmEdicao] = useState(null);
    const [atualizarParcelasNaEdicao, setAtualizarParcelasNaEdicao] = useState(false);

    // Lista de Vendas Registradas
    const [vendas, setVendas] = useState([]);
    const [loadingVendas, setLoadingVendas] = useState(true);
    const [buscaVendaTermo, setBuscaVendaTermo] = useState('');
    const [filtroStatusVenda, setFiltroStatusVenda] = useState('todas');
    const [mostrarMenuFiltroVendas, setMostrarMenuFiltroVendas] = useState(false);
    const [paginaAtualVendas, setPaginaAtualVendas] = useState(1);
    const vendasPorPagina = 6;
    const filtroVendasRef = useRef(null);

    // Modal de Ordem de Serviço (Ver detalhes / Validar parcelas / PDF) e Modal de Exclusão
    const [vendaDetalheModal, setVendaDetalheModal] = useState(null);
    const [vendaParaExcluir, setVendaParaExcluir] = useState(null);
    const [excluindoVenda, setExcluindoVenda] = useState(false);

    // Modal da Folha de Vendas (PDF de Controle de Vendas e Custos)
    const [isModalFolhaOpen, setIsModalFolhaOpen] = useState(false);
    const [folhaDataAtendimento, setFolhaDataAtendimento] = useState(getHojeISO());
    const [folhaResponsavel, setFolhaResponsavel] = useState('MÁRCIO');
    const [folhaFiltrarPorData, setFolhaFiltrarPorData] = useState(false);
    const [folhaFiltrarPorOptometrista, setFolhaFiltrarPorOptometrista] = useState(false);
    const [folhaLinhasEditaveis, setFolhaLinhasEditaveis] = useState([]);
    const [salvandoCustosFolha, setSalvandoCustosFolha] = useState(false);

    // Clientes para seleção na venda
    const [clientes, setClientes] = useState([]);
    const [loadingClientes, setLoadingClientes] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [vendaIniciada, setVendaIniciada] = useState(false);
    const [isModalNovoClienteOpen, setIsModalNovoClienteOpen] = useState(false);

    // Estado da Venda (conforme VendaSchema do backend)
    const [vendaForm, setVendaForm] = useState({
        numero_talao: '',
        data_venda: getHojeISO(),
        vendedor: usuario?.nome || 'Administrador',
        optometrista: '',
        laboratorio: '',
        referencia_armacao: '',
        referencia_lente: '',
        valor_armacao: '',
        valor_lentes: '',
        custo_armacao: '',
        custo_lentes: '',
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
        carregarDadosIniciais();
    }, []);

    useEffect(() => {
        if (usuario?.nome && !vendaForm.vendedor) {
            setVendaForm(prev => ({ ...prev, vendedor: usuario.nome }));
        }
    }, [usuario]);

    // Fecha o dropdown de filtros ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (filtroVendasRef.current && !filtroVendasRef.current.contains(event.target)) {
                setMostrarMenuFiltroVendas(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Caso venha da tela de detalhes de Clientes clicando em "Nova venda"
    useEffect(() => {
        if (location.state?.cliente) {
            const cli = location.state.cliente;
            setClienteSelecionado(cli);
            setVendaEmEdicao(null);
            setVendaConcluida(null);
            setVendaIniciada(true);
            setModoTela('formulario');
            carregarReceitasDoCliente(cli.id);
        }
    }, [location.state]);

    const carregarDadosIniciais = async () => {
        await Promise.all([carregarVendas(), carregarClientes()]);
    };

    const carregarVendas = async () => {
        try {
            setLoadingVendas(true);
            const response = await api.get('/api/vendas');
            const lista = Array.isArray(response.data) ? response.data : [];
            setVendas(lista);
        } catch (error) {
            console.error('Erro ao buscar vendas:', error);
        } finally {
            setLoadingVendas(false);
        }
    };

    const carregarClientes = async () => {
        try {
            setLoadingClientes(true);
            const response = await api.get('/api/clientes');
            setClientes(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Erro ao buscar clientes para venda:', error);
        } finally {
            setLoadingClientes(false);
        }
    };

    const carregarReceitasDoCliente = async (clienteId, receitaIdPreferencial = null) => {
        try {
            const response = await api.get(`/api/receitas/${clienteId}`);
            const lista = Array.isArray(response.data) ? response.data : [];
            setReceitasCliente(lista);
            if (receitaIdPreferencial) {
                setReceitaSelecionadaId(String(receitaIdPreferencial));
            } else if (lista.length > 0) {
                setReceitaSelecionadaId(String(lista[0].id));
            } else {
                setReceitaSelecionadaId('');
            }
        } catch {
            setReceitasCliente([]);
            setReceitaSelecionadaId('');
        }
    };

    const sugerirProximoTalao = (listaVendas = vendas) => {
        if (!listaVendas || listaVendas.length === 0) return '1001';
        const maior = listaVendas.reduce((max, v) => {
            const num = parseInt(v.numero_talao, 10) || 0;
            return num > max ? num : max;
        }, 0);
        return String(maior + 1);
    };

    // Auxiliar para obter o objeto do cliente de uma venda
    const obterClienteDaVenda = (venda) => {
        if (!venda) return null;
        if (venda.cliente && venda.cliente.nome_completo) return venda.cliente;
        return clientes.find(c => c.id === venda.cliente_id) || null;
    };

    // Calcula status financeiro de uma venda
    const calcularStatusFinanceiroVenda = (venda) => {
        const hoje = new Date();
        const parcelas = Array.isArray(venda.parcelas) ? venda.parcelas : [];
        const totalVenda = Number(venda.total) || 0;
        const entrada = Number(venda.entrada) || 0;

        const pagas = parcelas.filter(p => p.status === 'Pago');
        const pendentes = parcelas.filter(p => p.status !== 'Pago');
        const atrasadas = pendentes.filter(
            p => p.status === 'Vencido' || (p.data_vencimento && new Date(p.data_vencimento) < hoje)
        );

        const somaPagas = pagas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
        const totalQuitado = parcelas.length > 0 ? Math.min(totalVenda, entrada + somaPagas) : totalVenda;
        const saldoDevedor = Math.max(0, totalVenda - totalQuitado);
        const isQuitada = saldoDevedor <= 0.01 || pendentes.length === 0;

        return {
            parcelas,
            pagas,
            pendentes,
            atrasadas,
            totalQuitado,
            saldoDevedor,
            isQuitada,
            statusChave: isQuitada ? 'quitada' : atrasadas.length > 0 ? 'atrasada' : 'aberta'
        };
    };

    // Formatações
    const formatarCPF = (cpf) => {
        if (!cpf) return '-';
        const clean = cpf.toString().replace(/\D/g, '');
        if (clean.length !== 11) return cpf;
        return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
    };

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

    const formatarDataISO = (isoStr) => {
        if (!isoStr) return '-';
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleDateString('pt-BR');
    };

    const formatarDataHoraISO = (isoStr) => {
        if (!isoStr) return '-';
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    // Cálculos automáticos do formulário de venda
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

    // Filtra clientes em tempo real pela barra de busca na Etapa 1
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

    // Filtra vendas registradas na tela principal de Vendas
    const vendasFiltradas = vendas.filter(venda => {
        const infoFin = calcularStatusFinanceiroVenda(venda);
        if (filtroStatusVenda !== 'todas' && infoFin.statusChave !== filtroStatusVenda) {
            return false;
        }

        if (!buscaVendaTermo.trim()) return true;

        const termo = buscaVendaTermo.toLowerCase().trim();
        const termoNumerico = buscaVendaTermo.replace(/\D/g, '');
        const cli = obterClienteDaVenda(venda);

        const talaoStr = String(venda.numero_talao || '').toLowerCase();
        const vendedorStr = (venda.vendedor || '').toLowerCase();
        const labStr = (venda.laboratorio || '').toLowerCase();
        const armacaoStr = (venda.referencia_armacao || '').toLowerCase();
        const lenteStr = (venda.referencia_lente || '').toLowerCase();
        const nomeCli = (cli?.nome_completo || '').toLowerCase();
        const cpfCli = (cli?.cpf || '').replace(/\D/g, '');
        const fichaCli = (cli?.numero_ficha || '').toLowerCase();

        return talaoStr.includes(termo.replace('#', '')) ||
               vendedorStr.includes(termo) ||
               labStr.includes(termo) ||
               armacaoStr.includes(termo) ||
               lenteStr.includes(termo) ||
               nomeCli.includes(termo) ||
               fichaCli.includes(termo) ||
               (termoNumerico && cpfCli.includes(termoNumerico));
    });

    // Paginação da lista de vendas
    const indiceUltimaVenda = paginaAtualVendas * vendasPorPagina;
    const indicePrimeiraVenda = indiceUltimaVenda - vendasPorPagina;
    const vendasPaginadas = vendasFiltradas.slice(indicePrimeiraVenda, indiceUltimaVenda);
    const totalPaginasVendas = Math.ceil(vendasFiltradas.length / vendasPorPagina) || 1;

    // Métricas gerais para os 4 cards do topo
    const faturamentoTotal = vendas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
    const qtdVendasQuitadas = vendas.filter(v => calcularStatusFinanceiroVenda(v).isQuitada).length;
    const qtdVendasPendentesOuAtraso = vendas.length - qtdVendasQuitadas;

    // =========================================================================
    // FOLHA DE VENDAS (PDF DE CONTROLE DE VENDAS E CUSTOS DE PRODUTOS)
    // =========================================================================
    const listaOptometristasUnicos = Array.from(
        new Set(
            vendas
                .map(v => (v.optometrista || v.receita?.optometrista || '').trim())
                .filter(Boolean)
        )
    );

    const montarLinhasFolhaVendas = (
        listaBase,
        filtrarData = folhaFiltrarPorData,
        dataAlvoISO = folhaDataAtendimento,
        filtrarOpto = folhaFiltrarPorOptometrista,
        optoAlvo = folhaResponsavel
    ) => {
        let filtradas = listaBase;

        if (filtrarData && dataAlvoISO) {
            filtradas = filtradas.filter(v => {
                if (!v.data_venda) return false;
                const dataVendaISO = new Date(v.data_venda).toISOString().split('T')[0];
                return dataVendaISO === dataAlvoISO;
            });
        }

        if (filtrarOpto && optoAlvo.trim()) {
            const termoOpto = optoAlvo.trim().toLowerCase();
            filtradas = filtradas.filter(v => {
                const optoVenda = (v.optometrista || v.receita?.optometrista || '').toLowerCase();
                return optoVenda.includes(termoOpto);
            });
        }

        // Ordena pelo número de talão crescente para a planilha
        const ordenadas = [...filtradas].sort((a, b) => (Number(a.numero_talao) || 0) - (Number(b.numero_talao) || 0));

        return ordenadas.map(v => {
            const cli = obterClienteDaVenda(v);
            const parcelas = Array.isArray(v.parcelas)
                ? [...v.parcelas].sort((a, b) => a.numero_parcela - b.numero_parcela)
                : [];
            const totalNum = Number(v.total) || 0;
            const entradaNum = Number(v.entrada) || 0;
            const saldoPrestacoes = Math.max(0, totalNum - entradaNum);

            let prestacoesTexto = 'À VISTA';
            let dataPagtoTexto = formatarDataISO(v.data_venda);

            if (parcelas.length > 0) {
                const valorParc = Number(parcelas[0].valor) || (saldoPrestacoes / parcelas.length);
                const formaStr = parcelas[0].forma_de_pagamento ? ` (${parcelas[0].forma_de_pagamento})` : '';
                prestacoesTexto = `${parcelas.length}x ${formatarMoeda(valorParc)}${formaStr}`;
                dataPagtoTexto = parcelas[0].data_vencimento
                    ? formatarDataISO(parcelas[0].data_vencimento)
                    : dataPagtoTexto;
            }

            const descLente = v.referencia_lente || v.receita?.tipo_lente || '-';
            const nomeOptometrista = v.optometrista || v.receita?.optometrista || '-';

            return {
                id: v.id,
                selecionada: true,
                foiEditadaNaFolha: false,
                talao: String(v.numero_talao || '').padStart(4, '0'),
                titular: cli?.nome_completo || `Cliente #${v.cliente_id}`,
                optometrista: nomeOptometrista,
                lentes: descLente,
                valor_lentes: v.valor_lentes != null ? Number(v.valor_lentes) : 0,
                custo_lentes: v.custo_lentes != null ? Number(v.custo_lentes) : 0,
                laboratorio: v.laboratorio || '-',
                armacao: v.referencia_armacao || '-',
                valor_armacao: v.valor_armacao != null ? Number(v.valor_armacao) : 0,
                custo_armacao: v.custo_armacao != null ? Number(v.custo_armacao) : 0,
                desconto: v.desconto != null ? Number(v.desconto) : 0,
                valor_total: totalNum,
                entrada: entradaNum,
                saldo_prestacoes: saldoPrestacoes,
                prestacoes_texto: prestacoesTexto,
                data_pagamento_texto: dataPagtoTexto
            };
        });
    };

    const handleAbrirModalFolhaVendas = () => {
        const hojeStr = getHojeISO();
        setFolhaDataAtendimento(hojeStr);
        setFolhaFiltrarPorData(false);
        setFolhaFiltrarPorOptometrista(false);
        const optometristaRecente = vendasFiltradas.find(v => v.optometrista || v.receita?.optometrista);
        const optoInicial = optometristaRecente
            ? (optometristaRecente.optometrista || optometristaRecente.receita?.optometrista || 'MÁRCIO')
            : 'MÁRCIO';
        setFolhaResponsavel(optoInicial);
        const linhasIniciais = montarLinhasFolhaVendas(vendasFiltradas, false, hojeStr, false, optoInicial);
        setFolhaLinhasEditaveis(linhasIniciais);
        setIsModalFolhaOpen(true);
    };

    const handleAlternarFiltroDataFolha = (checked, novaData = folhaDataAtendimento) => {
        setFolhaFiltrarPorData(checked);
        setFolhaLinhasEditaveis(
            montarLinhasFolhaVendas(vendasFiltradas, checked, novaData, folhaFiltrarPorOptometrista, folhaResponsavel)
        );
    };

    const handleAlternarFiltroOptoFolha = (checked, novoOpto = folhaResponsavel) => {
        setFolhaFiltrarPorOptometrista(checked);
        setFolhaLinhasEditaveis(
            montarLinhasFolhaVendas(vendasFiltradas, folhaFiltrarPorData, folhaDataAtendimento, checked, novoOpto)
        );
    };

    const handleEditarLinhaFolha = (id, campo, valor) => {
        setFolhaLinhasEditaveis(prev =>
            prev.map(item => (item.id === id ? { ...item, [campo]: valor, foiEditadaNaFolha: true } : item))
        );
    };

    const handleSalvarCustosDaFolhaNoBanco = async (linhasAlvo = folhaLinhasEditaveis) => {
        const editadas = linhasAlvo.filter(l => l.foiEditadaNaFolha);
        if (editadas.length === 0) return;

        setSalvandoCustosFolha(true);
        try {
            for (const item of editadas) {
                await api.patch(`/api/vendas/${item.id}`, {
                    optometrista: item.optometrista && item.optometrista !== '-' ? item.optometrista.trim().slice(0, 60) : null,
                    valor_lentes: Number(item.valor_lentes || 0).toFixed(2),
                    custo_lentes: Number(item.custo_lentes || 0).toFixed(2),
                    valor_armacao: Number(item.valor_armacao || 0).toFixed(2),
                    custo_armacao: Number(item.custo_armacao || 0).toFixed(2)
                });
            }
            await carregarVendas();
            setFolhaLinhasEditaveis(prev => prev.map(l => ({ ...l, foiEditadaNaFolha: false })));
        } catch (error) {
            console.error('Erro ao salvar custos da folha no banco:', error);
        } finally {
            setSalvandoCustosFolha(false);
        }
    };

    const handleGerarPDFFolhaConfirmado = async () => {
        const selecionadas = folhaLinhasEditaveis.filter(l => l.selecionada);
        await handleSalvarCustosDaFolhaNoBanco(selecionadas);
        gerarPDFFolhaDeVendas({
            dataAtendimento: folhaDataAtendimento,
            responsavelAtendimento: folhaResponsavel,
            linhas: selecionadas
        });
    };

    // Ações para abrir Nova Venda, Editar Venda e Voltar para Lista
    const handleAbrirNovaVenda = () => {
        setVendaEmEdicao(null);
        setAtualizarParcelasNaEdicao(false);
        setVendaConcluida(null);
        setErroVenda('');
        setClienteSelecionado(null);
        setVendaIniciada(false);
        setVendaForm({
            numero_talao: sugerirProximoTalao(),
            data_venda: getHojeISO(),
            vendedor: usuario?.nome || 'Administrador',
            optometrista: '',
            laboratorio: '',
            referencia_armacao: '',
            referencia_lente: '',
            valor_armacao: '',
            valor_lentes: '',
            custo_armacao: '',
            custo_lentes: '',
            valor_anti_reflexo: '',
            desconto: '',
            entrada: ''
        });
        setModoReceita('nenhuma');
        setNovaReceita(initialReceitaState);
        setFormaPagamento('PIX');
        setQtdParcelas(1);
        setPrimeiroVencimento(getDataPadraoVencimento());
        setModoTela('formulario');
    };

    const handleAbrirEdicaoVenda = async (venda) => {
        const cli = obterClienteDaVenda(venda);
        setVendaEmEdicao(venda);
        setAtualizarParcelasNaEdicao(false);
        setVendaConcluida(null);
        setErroVenda('');
        setClienteSelecionado(cli);
        setVendaIniciada(true);

        setVendaForm({
            numero_talao: String(venda.numero_talao || ''),
            data_venda: venda.data_venda ? venda.data_venda.split('T')[0] : getHojeISO(),
            vendedor: venda.vendedor || usuario?.nome || 'Administrador',
            optometrista: venda.optometrista || venda.receita?.optometrista || '',
            laboratorio: venda.laboratorio || '',
            referencia_armacao: venda.referencia_armacao || '',
            referencia_lente: venda.referencia_lente || '',
            valor_armacao: venda.valor_armacao != null ? String(venda.valor_armacao) : '',
            valor_lentes: venda.valor_lentes != null ? String(venda.valor_lentes) : '',
            custo_armacao: venda.custo_armacao != null ? String(venda.custo_armacao) : '',
            custo_lentes: venda.custo_lentes != null ? String(venda.custo_lentes) : '',
            valor_anti_reflexo: venda.valor_anti_reflexo != null ? String(venda.valor_anti_reflexo) : '',
            desconto: venda.desconto != null ? String(venda.desconto) : '',
            entrada: venda.entrada != null ? String(venda.entrada) : ''
        });

        if (cli?.id) {
            await carregarReceitasDoCliente(cli.id, venda.receita_id);
        }

        if (venda.receita_id) {
            setModoReceita('existente');
            setReceitaSelecionadaId(String(venda.receita_id));
        } else {
            setModoReceita('nenhuma');
        }
        setNovaReceita(initialReceitaState);

        const parcelasExistentes = Array.isArray(venda.parcelas) ? venda.parcelas : [];
        if (parcelasExistentes.length > 0) {
            const ordenadas = [...parcelasExistentes].sort((a, b) => a.numero_parcela - b.numero_parcela);
            setFormaPagamento(ordenadas[0].forma_de_pagamento || 'PIX');
            setQtdParcelas(ordenadas.length);
            if (ordenadas[0].data_vencimento) {
                setPrimeiroVencimento(ordenadas[0].data_vencimento.split('T')[0]);
            }
        } else {
            setFormaPagamento('PIX');
            setQtdParcelas(1);
            setPrimeiroVencimento(getDataPadraoVencimento());
        }

        setModoTela('formulario');
    };

    const handleVoltarParaLista = () => {
        setModoTela('lista');
        setVendaEmEdicao(null);
        setVendaConcluida(null);
        setErroVenda('');
        carregarVendas();
    };

    // Exclusão de venda com confirmação
    const handleConfirmarExclusaoVenda = async () => {
        if (!vendaParaExcluir) return;
        setExcluindoVenda(true);
        try {
            await api.delete(`/api/vendas/${vendaParaExcluir.id}`);
            setVendaParaExcluir(null);
            await carregarVendas();
        } catch (error) {
            alert(
                error.response?.data?.erro ||
                'Não foi possível excluir a venda. Tente novamente.'
            );
        } finally {
            setExcluindoVenda(false);
        }
    };

    // Baixa e estorno de parcelas dentro do ModalDetalheCompra aberto na tela de Vendas
    const handleValidarParcelaModal = async (parcela, formaDePagamento = null) => {
        try {
            const payload = {
                status: 'Pago',
                data_pagamento: new Date().toISOString()
            };
            if (formaDePagamento) {
                payload.forma_de_pagamento = formaDePagamento;
            }
            await api.patch(`/api/parcelas/${parcela.id}`, payload);
            await carregarVendas();
        } catch (error) {
            console.error('Erro ao validar parcela:', error);
        }
    };

    const handleReabrirParcelaModal = async (parcela) => {
        try {
            await api.patch(`/api/parcelas/${parcela.id}`, {
                status: 'Pendente',
                data_pagamento: null
            });
            await carregarVendas();
        } catch (error) {
            console.error('Erro ao reabrir parcela:', error);
        }
    };

    const handleQuitarTodasParcelasModal = async (listaParcelasPendentes) => {
        try {
            const agora = new Date().toISOString();
            for (const parc of listaParcelasPendentes) {
                await api.patch(`/api/parcelas/${parc.id}`, {
                    status: 'Pago',
                    data_pagamento: agora
                });
            }
            await carregarVendas();
        } catch (error) {
            console.error('Erro ao quitar todas as parcelas:', error);
        }
    };

    // Quando cadastra um novo cliente pelo modal, já seleciona e inicia a venda imediatamente
    const handleClienteCadastrado = async (novoCliente) => {
        await carregarClientes();
        if (novoCliente && novoCliente.id) {
            setClienteSelecionado(novoCliente);
            setVendaIniciada(true);
            setVendaConcluida(null);
            if (!vendaForm.numero_talao) {
                setVendaForm(prev => ({ ...prev, numero_talao: sugerirProximoTalao() }));
            }
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
            if (!vendaForm.numero_talao) {
                setVendaForm(prev => ({ ...prev, numero_talao: sugerirProximoTalao() }));
            }
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

    const resetarFormularioVenda = (listaAtualizada = vendas) => {
        setVendaForm({
            numero_talao: sugerirProximoTalao(listaAtualizada),
            data_venda: getHojeISO(),
            vendedor: usuario?.nome || 'Administrador',
            optometrista: '',
            laboratorio: '',
            referencia_armacao: '',
            referencia_lente: '',
            valor_armacao: '',
            valor_lentes: '',
            custo_armacao: '',
            custo_lentes: '',
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
            let receitaObjExistente = null;
            let payloadNovaReceita = null;

            // 1. Se selecionou receita existente
            if (modoReceita === 'existente' && receitaSelecionadaId) {
                receitaIdFinal = parseInt(receitaSelecionadaId, 10);
                receitaObjExistente = receitasCliente.find(r => r.id === receitaIdFinal) || null;
            }

            // 2. Se escolheu cadastrar nova receita agora (enviada na mesma transação da venda)
            if (modoReceita === 'nova') {
                payloadNovaReceita = {
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
            }

            // 3. Monta as parcelas para envio atômico junto com a Venda
            const payloadParcelas = previaParcelas.map(p => ({
                numero_parcela: p.numero_parcela,
                valor: p.valor.toFixed(2),
                data_vencimento: p.data_vencimento_iso,
                forma_de_pagamento: formaPagamento
            }));

            const payloadVenda = {
                numero_talao: numTalao,
                data_venda: vendaForm.data_venda || getHojeISO(),
                cliente_id: clienteSelecionado.id,
                receita_id: modoReceita === 'nenhuma' ? null : receitaIdFinal,
                vendedor: vendaForm.vendedor.trim().slice(0, 25),
                optometrista: (vendaForm.optometrista || novaReceita.optometrista || '').trim().slice(0, 60) || null,
                laboratorio: vendaForm.laboratorio.trim() || null,
                referencia_armacao: vendaForm.referencia_armacao.trim() || null,
                referencia_lente: vendaForm.referencia_lente.trim() || null,
                valor_armacao: vArmacao > 0 ? vArmacao.toFixed(2) : null,
                valor_lentes: vLentes > 0 ? vLentes.toFixed(2) : null,
                custo_armacao: vendaForm.custo_armacao !== '' ? (parseFloat(vendaForm.custo_armacao) || 0).toFixed(2) : null,
                custo_lentes: vendaForm.custo_lentes !== '' ? (parseFloat(vendaForm.custo_lentes) || 0).toFixed(2) : null,
                valor_anti_reflexo: vAntiReflexo > 0 ? vAntiReflexo.toFixed(2) : null,
                subtotal: subtotalCalculado.toFixed(2),
                desconto: vDesconto.toFixed(2),
                entrada: vEntrada.toFixed(2),
                total: totalCalculado.toFixed(2)
            };

            if (payloadNovaReceita) {
                payloadVenda.nova_receita = payloadNovaReceita;
            }

            // Na criação sempre envia as parcelas; na edição só substitui as parcelas se o usuário marcou a opção
            if (!vendaEmEdicao || atualizarParcelasNaEdicao) {
                payloadVenda.parcelas = payloadParcelas;
            }

            let resVenda;
            if (vendaEmEdicao?.id) {
                resVenda = await api.patch(`/api/vendas/${vendaEmEdicao.id}`, payloadVenda);
            } else {
                resVenda = await api.post('/api/vendas', payloadVenda);
            }

            const vendaSalva = resVenda.data;

            if (modoReceita === 'nova') {
                carregarReceitasDoCliente(clienteSelecionado.id);
            }

            const resLista = await api.get('/api/vendas');
            const novaListaVendas = Array.isArray(resLista.data) ? resLista.data : [];
            setVendas(novaListaVendas);

            const parcelasCriadasLista = Array.isArray(vendaSalva.parcelas)
                ? vendaSalva.parcelas
                : [];
            const receitaObjFinal = vendaSalva.receita || receitaObjExistente;

            setVendaConcluida({
                ...vendaSalva,
                foi_edicao: Boolean(vendaEmEdicao?.id),
                parcelas_criadas: parcelasCriadasLista.length,
                forma_de_pagamento: formaPagamento,
                receita_obj: receitaObjFinal,
                parcelas_lista: parcelasCriadasLista
            });
            setVendaEmEdicao(null);
            resetarFormularioVenda(novaListaVendas);
        } catch (error) {
            const msg = error.response?.data?.erro ||
                        error.response?.data?.detalhes ||
                        'Erro ao salvar a venda. Verifique os dados informados.';
            setErroVenda(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSalvandoVenda(false);
        }
    };

    // Venda sincronizada para o ModalDetalheCompra
    const vendaAtualNoModal = vendaDetalheModal
        ? vendas.find(v => v.id === vendaDetalheModal.id) || vendaDetalheModal
        : null;
    const clienteAtualNoModal = obterClienteDaVenda(vendaAtualNoModal);

    // Totais da Folha de Vendas no modal
    const linhasFolhaSelecionadas = folhaLinhasEditaveis.filter(l => l.selecionada);
    const totalFolhaVLentes = linhasFolhaSelecionadas.reduce((acc, l) => acc + (Number(l.valor_lentes) || 0), 0);
    const totalFolhaCustoLentes = linhasFolhaSelecionadas.reduce((acc, l) => acc + (Number(l.custo_lentes) || 0), 0);
    const totalFolhaVArmacao = linhasFolhaSelecionadas.reduce((acc, l) => acc + (Number(l.valor_armacao) || 0), 0);
    const totalFolhaCustoArmacao = linhasFolhaSelecionadas.reduce((acc, l) => acc + (Number(l.custo_armacao) || 0), 0);
    const totalFolhaVendas = linhasFolhaSelecionadas.reduce((acc, l) => acc + (Number(l.valor_total) || 0), 0);
    const totalFolhaCustos = totalFolhaCustoLentes + totalFolhaCustoArmacao;
    const lucroFolha = totalFolhaVendas - totalFolhaCustos;

    return (
        <div className="page-container vendas-container">
            {modoTela === 'lista' ? (
                /* =========================================================
                   VISÃO PRINCIPAL: PAINEL DE VENDAS + BUSCA + TABELA
                ========================================================= */
                <>
                    <div className="vendas-top-bar">
                        <div className="page-titles">
                            <h2>Vendas</h2>
                            <p>Consulte, edite, imprima Ordens de Serviço, Folha de Vendas ou registre uma nova venda</p>
                        </div>
                    </div>

                    {/* 4 Cards de Resumo Rápido */}
                    <div className="vendas-kpis-grid">
                        <div
                            className={`venda-kpi-card ${filtroStatusVenda === 'todas' ? 'ativo' : ''}`}
                            onClick={() => { setFiltroStatusVenda('todas'); setPaginaAtualVendas(1); }}
                        >
                            <span className="venda-kpi-label">Total de Vendas</span>
                            <strong className="venda-kpi-valor">{vendas.length}</strong>
                            <span className="venda-kpi-sub">talões registrados no sistema</span>
                        </div>

                        <div className="venda-kpi-card destaque-azul">
                            <span className="venda-kpi-label">Faturamento Total</span>
                            <strong className="venda-kpi-valor">{formatarMoeda(faturamentoTotal)}</strong>
                            <span className="venda-kpi-sub">soma líquida das vendas</span>
                        </div>

                        <div
                            className={`venda-kpi-card ${filtroStatusVenda === 'quitada' ? 'ativo' : ''}`}
                            onClick={() => { setFiltroStatusVenda('quitada'); setPaginaAtualVendas(1); }}
                        >
                            <span className="venda-kpi-label">Vendas Quitadas</span>
                            <strong className="venda-kpi-valor texto-verde">{qtdVendasQuitadas}</strong>
                            <span className="venda-kpi-sub">100% pagas e validadas</span>
                        </div>

                        <div
                            className={`venda-kpi-card ${filtroStatusVenda === 'aberta' || filtroStatusVenda === 'atrasada' ? 'ativo' : ''}`}
                            onClick={() => { setFiltroStatusVenda('aberta'); setPaginaAtualVendas(1); }}
                        >
                            <span className="venda-kpi-label">Com Parcelas em Aberto</span>
                            <strong className="venda-kpi-valor texto-amarelo">{qtdVendasPendentesOuAtraso}</strong>
                            <span className="venda-kpi-sub">aguardando baixa de parcelas</span>
                        </div>
                    </div>

                    {/* Barra de Busca, Filtro, Folha de Vendas (PDF) e Botão + Nova Venda */}
                    <div className="action-bar">
                        <input
                            type="text"
                            placeholder="Pesquisar por nº do talão, nome do cliente, CPF, vendedor, armação..."
                            className="search-input"
                            value={buscaVendaTermo}
                            onChange={(e) => {
                                setBuscaVendaTermo(e.target.value);
                                setPaginaAtualVendas(1);
                            }}
                        />

                        <div className="action-buttons">
                            <div className="filter-wrapper" ref={filtroVendasRef}>
                                <button
                                    type="button"
                                    className={`btn-secondary ${filtroStatusVenda !== 'todas' ? 'active-filter' : ''}`}
                                    onClick={() => setMostrarMenuFiltroVendas(!mostrarMenuFiltroVendas)}
                                >
                                    <img src={filtroIcon} alt="Filtro" className="icon" />
                                    {filtroStatusVenda === 'todas'
                                        ? 'Filtros'
                                        : filtroStatusVenda === 'quitada'
                                            ? 'Filtro: Quitadas'
                                            : filtroStatusVenda === 'aberta'
                                                ? 'Filtro: Em Aberto'
                                                : 'Filtro: Em Atraso'}
                                </button>

                                {mostrarMenuFiltroVendas && (
                                    <div className="filtro-dropdown">
                                        <button
                                            type="button"
                                            className={filtroStatusVenda === 'todas' ? 'selected' : ''}
                                            onClick={() => { setFiltroStatusVenda('todas'); setMostrarMenuFiltroVendas(false); setPaginaAtualVendas(1); }}
                                        >
                                            Todas
                                        </button>
                                        <button
                                            type="button"
                                            className={filtroStatusVenda === 'quitada' ? 'selected' : ''}
                                            onClick={() => { setFiltroStatusVenda('quitada'); setMostrarMenuFiltroVendas(false); setPaginaAtualVendas(1); }}
                                        >
                                            Quitadas
                                        </button>
                                        <button
                                            type="button"
                                            className={filtroStatusVenda === 'aberta' ? 'selected' : ''}
                                            onClick={() => { setFiltroStatusVenda('aberta'); setMostrarMenuFiltroVendas(false); setPaginaAtualVendas(1); }}
                                        >
                                            Em Aberto
                                        </button>
                                        <button
                                            type="button"
                                            className={filtroStatusVenda === 'atrasada' ? 'selected' : ''}
                                            onClick={() => { setFiltroStatusVenda('atrasada'); setMostrarMenuFiltroVendas(false); setPaginaAtualVendas(1); }}
                                        >
                                            Em Atraso
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                className="btn-secondary btn-folha-pdf"
                                onClick={handleAbrirModalFolhaVendas}
                                title="Gerar Folha de Vendas e Controle de Custos em PDF"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                </svg>
                                Folha de Venda (PDF)
                            </button>

                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleAbrirNovaVenda}
                            >
                                <img src={novoClienteIcon} alt="Nova Venda" className="icon" />
                                Nova Venda
                            </button>
                        </div>
                    </div>

                    {/* Tabela de Vendas Registradas */}
                    <div className="table-container">
                        <table className="data-table vendas-table">
                            <thead>
                                <tr>
                                    <th>Talão / Data</th>
                                    <th>Cliente</th>
                                    <th>Vendedor / Itens</th>
                                    <th>Valor Total</th>
                                    <th>Situação</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingVendas ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">Carregando vendas registradas...</td>
                                    </tr>
                                ) : vendasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            {buscaVendaTermo || filtroStatusVenda !== 'todas'
                                                ? 'Nenhuma venda encontrada para a busca/filtro selecionado.'
                                                : 'Nenhuma venda cadastrada ainda. Clique em "Nova Venda" para começar.'}
                                        </td>
                                    </tr>
                                ) : (
                                    vendasPaginadas.map(venda => {
                                        const cli = obterClienteDaVenda(venda);
                                        const fin = calcularStatusFinanceiroVenda(venda);
                                        const formaPag = fin.parcelas[0]?.forma_de_pagamento || null;

                                        return (
                                            <tr key={venda.id}>
                                                <td>
                                                    <div className="venda-cell-principal">
                                                        <span className="talao-badge-tabela">
                                                            #{String(venda.numero_talao).padStart(4, '0')}
                                                        </span>
                                                        <small>{formatarDataISO(venda.data_venda)}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="venda-cell-principal">
                                                        <strong>{cli?.nome_completo || `Cliente #${venda.cliente_id}`}</strong>
                                                        <small>
                                                            {cli ? `Ficha ${cli.numero_ficha} • CPF: ${formatarCPF(cli.cpf)}` : '-'}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="venda-cell-principal">
                                                        <span><strong>Vend.:</strong> {venda.vendedor || '-'}</span>
                                                        <small>
                                                            {venda.referencia_armacao ? `Arm.: ${venda.referencia_armacao}` : ''}
                                                            {venda.referencia_armacao && venda.referencia_lente ? ' • ' : ''}
                                                            {venda.referencia_lente ? `Lente: ${venda.referencia_lente}` : ''}
                                                            {!venda.referencia_armacao && !venda.referencia_lente ? (venda.laboratorio || 'Itens ópticos') : ''}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="venda-cell-principal">
                                                        <strong className="valor-venda-tabela">
                                                            {formatarMoeda(venda.total)}
                                                        </strong>
                                                        <small>
                                                            {fin.parcelas.length > 0
                                                                ? `${fin.parcelas.length}x ${formaPag ? `(${formaPag})` : ''}`
                                                                : 'À vista'}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            fin.isQuitada
                                                                ? 'badge-regular'
                                                                : fin.atrasadas.length > 0
                                                                    ? 'badge-atrasada'
                                                                    : 'badge-garantia'
                                                        }`}
                                                    >
                                                        {fin.isQuitada
                                                            ? 'Quitada'
                                                            : fin.atrasadas.length > 0
                                                                ? `${fin.atrasadas.length} em Atraso`
                                                                : `Em Aberto (${fin.pagas.length}/${fin.parcelas.length})`}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="vendas-acoes-row">
                                                        <button
                                                            type="button"
                                                            className="btn-acao-venda os"
                                                            onClick={() => setVendaDetalheModal(venda)}
                                                            title="Abrir Ordem de Serviço, Parcelas e PDF"
                                                        >
                                                            OS / PDF
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-acao-venda editar"
                                                            onClick={() => handleAbrirEdicaoVenda(venda)}
                                                            title="Editar dados desta venda"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-acao-venda excluir"
                                                            onClick={() => setVendaParaExcluir(venda)}
                                                            title="Excluir esta venda"
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>

                        <div className="table-footer">
                            <span className="pagination-info">
                                Mostrando {vendasFiltradas.length === 0 ? 0 : indicePrimeiraVenda + 1} -{' '}
                                {Math.min(indiceUltimaVenda, vendasFiltradas.length)} de {vendasFiltradas.length}.
                            </span>
                            <div className="pagination-controls">
                                <button
                                    type="button"
                                    className="btn-page"
                                    onClick={() => paginaAtualVendas > 1 && setPaginaAtualVendas(paginaAtualVendas - 1)}
                                    disabled={paginaAtualVendas === 1 || vendasFiltradas.length === 0}
                                >
                                    <img src={setaEsquerda} alt="Anterior" />
                                </button>
                                <button
                                    type="button"
                                    className="btn-page"
                                    onClick={() => paginaAtualVendas < totalPaginasVendas && setPaginaAtualVendas(paginaAtualVendas + 1)}
                                    disabled={paginaAtualVendas === totalPaginasVendas || vendasFiltradas.length === 0}
                                >
                                    <img src={setaDireita} alt="Próxima" />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* =========================================================
                   VISÃO FORMULÁRIO: NOVA VENDA OU EDIÇÃO DE VENDA
                ========================================================= */
                <>
                    <div className="vendas-top-bar">
                        <div>
                            <button
                                type="button"
                                className="btn-voltar-vendas"
                                onClick={handleVoltarParaLista}
                            >
                                ← Voltar para lista de vendas
                            </button>
                            <div className="page-titles">
                                <h2>
                                    {vendaEmEdicao
                                        ? `Editar Venda — Talão #${String(vendaEmEdicao.numero_talao).padStart(4, '0')}`
                                        : 'Nova Venda'}
                                </h2>
                                <p>
                                    {vendaEmEdicao
                                        ? 'Altere os dados da venda abaixo e clique em Salvar Alterações'
                                        : 'Busque o cliente para iniciar uma nova venda ou cadastre-o rapidamente'}
                                </p>
                            </div>
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
                                        type="button"
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
                                            type="button"
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
                                                type="button"
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
                                                type="button"
                                                className="btn-primary btn-iniciar-venda"
                                                onClick={handleIniciarVenda}
                                            >
                                                Avançar para Dados da Venda
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
                        /* ETAPA 2: FORMULÁRIO COMPLETO DE VENDA (NOVA OU EDIÇÃO) */
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

                                <button
                                    type="button"
                                    className="btn-secondary btn-trocar-cliente"
                                    onClick={handleTrocarCliente}
                                >
                                    Trocar cliente
                                </button>
                            </div>

                            {vendaConcluida ? (
                                <div className="venda-sucesso-card">
                                    <div className="sucesso-icone">✓</div>
                                    <h3>
                                        {vendaConcluida.foi_edicao
                                            ? 'Venda atualizada com sucesso!'
                                            : 'Venda registrada com sucesso!'}
                                    </h3>
                                    <p>
                                        Talão <strong>#{vendaConcluida.numero_talao}</strong> registrado para{' '}
                                        <strong>{clienteSelecionado?.nome_completo}</strong> no valor total de{' '}
                                        <strong>{formatarMoeda(vendaConcluida.total)}</strong>.
                                    </p>
                                    {vendaConcluida.parcelas_criadas > 0 && (
                                        <span className="sucesso-sub">
                                            {vendaConcluida.parcelas_criadas} parcela(s) registrada(s) via {vendaConcluida.forma_de_pagamento}.
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
                                            onClick={handleVoltarParaLista}
                                        >
                                            Ver na lista de Vendas
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setVendaConcluida(null)}
                                        >
                                            Nova venda para este cliente
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
                                                    <label htmlFor="data_venda">Data da Venda *</label>
                                                    <input
                                                        id="data_venda"
                                                        name="data_venda"
                                                        type="date"
                                                        value={vendaForm.data_venda}
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
                                            </div>

                                            <div className="venda-row-2">
                                                <div className="venda-field">
                                                    <label htmlFor="optometrista">Optometrista / Atendimento</label>
                                                    <input
                                                        id="optometrista"
                                                        name="optometrista"
                                                        type="text"
                                                        maxLength={60}
                                                        placeholder="Ex: Márcio"
                                                        value={vendaForm.optometrista}
                                                        onChange={handleVendaChange}
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

                                            <div className="venda-row-2">
                                                <div className="venda-field">
                                                    <label htmlFor="custo_armacao">Custo de Fábrica da Armação (R$) — Folha de Controle</label>
                                                    <input
                                                        id="custo_armacao"
                                                        name="custo_armacao"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Opcional (usado na Folha de Venda PDF)"
                                                        value={vendaForm.custo_armacao}
                                                        onChange={handleVendaChange}
                                                    />
                                                </div>

                                                <div className="venda-field">
                                                    <label htmlFor="custo_lentes">Custo de Fábrica das Lentes (R$) — Folha de Controle</label>
                                                    <input
                                                        id="custo_lentes"
                                                        name="custo_lentes"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Opcional (usado na Folha de Venda PDF)"
                                                        value={vendaForm.custo_lentes}
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

                                            {vendaEmEdicao && (
                                                <label className="checkbox-recalcular-parcelas">
                                                    <input
                                                        type="checkbox"
                                                        checked={atualizarParcelasNaEdicao}
                                                        onChange={(e) => setAtualizarParcelasNaEdicao(e.target.checked)}
                                                    />
                                                    <span>Recalcular e substituir as parcelas desta venda</span>
                                                </label>
                                            )}

                                            {(!vendaEmEdicao || atualizarParcelasNaEdicao) && (
                                                <>
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
                                                            <option value="Promissória">Promissória</option>
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
                                                </>
                                            )}

                                            <button
                                                type="submit"
                                                className="btn-primary btn-finalizar-venda"
                                                disabled={salvandoVenda}
                                            >
                                                {salvandoVenda
                                                    ? 'Salvando...'
                                                    : vendaEmEdicao
                                                        ? 'Salvar Alterações da Venda'
                                                        : 'Finalizar Venda'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Modal de Cadastro de Cliente reutilizado na tela de Vendas */}
            <ModalNovoCliente
                isOpen={isModalNovoClienteOpen}
                onClose={() => setIsModalNovoClienteOpen(false)}
                onClienteCadastrado={handleClienteCadastrado}
            />

            {/* Modal de Ordem de Serviço Completa / Validação de Parcelas / PDF */}
            <ModalDetalheCompra
                isOpen={Boolean(vendaAtualNoModal && clienteAtualNoModal)}
                onClose={() => setVendaDetalheModal(null)}
                venda={vendaAtualNoModal}
                cliente={clienteAtualNoModal}
                receita={vendaAtualNoModal?.receita || null}
                parcelas={vendaAtualNoModal?.parcelas || []}
                onValidarParcela={handleValidarParcelaModal}
                onReabrirParcela={handleReabrirParcelaModal}
                onQuitarTodasParcelas={handleQuitarTodasParcelasModal}
                onGerarPDFCompra={(v, r, p) => gerarPDFCompraCompleta(clienteAtualNoModal, v, r, p)}
                onGerarPDFReciboParcela={(v, p, totalP) => gerarPDFReciboParcela(clienteAtualNoModal, v, p, totalP)}
            />

            {/* Modal da Folha de Vendas e Controle de Custos (PDF) */}
            {isModalFolhaOpen && (
                <div className="modal-folha-overlay" onClick={() => setIsModalFolhaOpen(false)}>
                    <div className="modal-folha-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-folha-header">
                            <div>
                                <h3>Folha de Vendas e Controle de Custos (PDF)</h3>
                                <p>
                                    Configure o cabeçalho de atendimento, ajuste os valores de custo das Lentes/Armação se desejar e baixe a planilha em PDF.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn-fechar-folha"
                                onClick={() => setIsModalFolhaOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Controles do Cabeçalho: ATENDIMENTO: DD/MM/AAAA - NOME */}
                        <div className="modal-folha-config-bar">
                            <div className="venda-field">
                                <label>Data do Atendimento</label>
                                <input
                                    type="date"
                                    value={folhaDataAtendimento}
                                    onChange={(e) => {
                                        const novaData = e.target.value;
                                        setFolhaDataAtendimento(novaData);
                                        if (folhaFiltrarPorData) {
                                            setFolhaLinhasEditaveis(
                                                montarLinhasFolhaVendas(vendasFiltradas, true, novaData, folhaFiltrarPorOptometrista, folhaResponsavel)
                                            );
                                        }
                                    }}
                                />
                            </div>

                            <div className="venda-field">
                                <label>Optometrista / Atendimento (Cabeçalho)</label>
                                <input
                                    type="text"
                                    list="lista-optometristas-folha"
                                    placeholder="Ex: MÁRCIO"
                                    value={folhaResponsavel}
                                    onChange={(e) => {
                                        const novoOpto = e.target.value;
                                        setFolhaResponsavel(novoOpto);
                                        if (folhaFiltrarPorOptometrista) {
                                            setFolhaLinhasEditaveis(
                                                montarLinhasFolhaVendas(vendasFiltradas, folhaFiltrarPorData, folhaDataAtendimento, true, novoOpto)
                                            );
                                        }
                                    }}
                                />
                                <datalist id="lista-optometristas-folha">
                                    {listaOptometristasUnicos.map(opto => (
                                        <option key={opto} value={opto} />
                                    ))}
                                </datalist>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label className="folha-checkbox-filtro" style={{ height: 'auto' }}>
                                    <input
                                        type="checkbox"
                                        checked={folhaFiltrarPorData}
                                        onChange={(e) => handleAlternarFiltroDataFolha(e.target.checked)}
                                    />
                                    <span>Filtrar vendas pela data selecionada</span>
                                </label>
                                <label className="folha-checkbox-filtro" style={{ height: 'auto' }}>
                                    <input
                                        type="checkbox"
                                        checked={folhaFiltrarPorOptometrista}
                                        onChange={(e) => handleAlternarFiltroOptoFolha(e.target.checked)}
                                    />
                                    <span>Filtrar vendas apenas deste Optometrista</span>
                                </label>
                            </div>
                        </div>

                        {/* Faixa de pré-visualização do cabeçalho da planilha */}
                        <div className="folha-preview-banner">
                            ATENDIMENTO: {folhaDataAtendimento ? formatarDataISO(`${folhaDataAtendimento}T12:00:00`) : '-'} - {(folhaResponsavel || 'KERO ÓTICA').toUpperCase()}
                        </div>

                        {/* Tabela Editável da Folha de Vendas */}
                        <div className="folha-preview-table-wrapper">
                            <table className="folha-preview-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '36px', textAlign: 'center' }}>✓</th>
                                        <th>TALÃO</th>
                                        <th>TITULAR DO ÓCULOS</th>
                                        <th>OPTOMETRISTA</th>
                                        <th>LENTES</th>
                                        <th>V. LENTES (VENDA)</th>
                                        <th>CUSTO LENTES</th>
                                        <th>LABORATÓRIO</th>
                                        <th>ARMAÇÃO</th>
                                        <th>V. ARMAÇÃO (VENDA)</th>
                                        <th>CUSTO ARMAÇÃO</th>
                                        <th>DESCONTO</th>
                                        <th>VALOR PAGO</th>
                                        <th>ENTRADA</th>
                                        <th>PRESTAÇÕES</th>
                                        <th>DATA PAGAMENTO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {folhaLinhasEditaveis.length === 0 ? (
                                        <tr>
                                            <td colSpan="16" className="folha-empty-row">
                                                Nenhuma venda encontrada para este filtro. Desmarque os filtros acima para listar todas as vendas.
                                            </td>
                                        </tr>
                                    ) : (
                                        folhaLinhasEditaveis.map(linha => (
                                            <tr key={linha.id} className={!linha.selecionada ? 'linha-desmarcada' : ''}>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={linha.selecionada}
                                                        onChange={(e) => handleEditarLinhaFolha(linha.id, 'selecionada', e.target.checked)}
                                                    />
                                                </td>
                                                <td className="col-talao-bold">{linha.talao}</td>
                                                <td className="col-titular-bold">{linha.titular}</td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="folha-inline-input"
                                                        value={linha.optometrista}
                                                        onChange={(e) => handleEditarLinhaFolha(linha.id, 'optometrista', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="folha-inline-input"
                                                        value={linha.lentes}
                                                        onChange={(e) => handleEditarLinhaFolha(linha.id, 'lentes', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="folha-inline-input num"
                                                        value={linha.valor_lentes}
                                                        onChange={(e) => handleEditarLinhaFolha(linha.id, 'valor_lentes', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="folha-inline-input num"
                                                        value={linha.custo_lentes}
                                                        onChange={(e) => handleEditarLinhaFolha(linha.id, 'custo_lentes', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="folha-inline-input"
                                                        value={linha.laboratorio}
                                                        onChange={(e) => handleEditarLinhaFolha(linha.id, 'laboratorio', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="folha-inline-input"
                                                        value={linha.armacao}
                                                        onChange={(e) => handleEditarLinhaFolha(linha.id, 'armacao', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="folha-inline-input num"
                                                        value={linha.valor_armacao}
                                                        onChange={(e) => handleEditarLinhaFolha(linha.id, 'valor_armacao', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="folha-inline-input num"
                                                        value={linha.custo_armacao}
                                                        onChange={(e) => handleEditarLinhaFolha(linha.id, 'custo_armacao', e.target.value)}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'right' }}>{formatarMoeda(linha.desconto)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#0B2B46' }}>{formatarMoeda(linha.valor_total)}</td>
                                                <td style={{ textAlign: 'right' }}>{formatarMoeda(linha.entrada)}</td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="folha-inline-input"
                                                        value={linha.prestacoes_texto}
                                                        onChange={(e) => handleEditarLinhaFolha(linha.id, 'prestacoes_texto', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="folha-inline-input"
                                                        value={linha.data_pagamento_texto}
                                                        onChange={(e) => handleEditarLinhaFolha(linha.id, 'data_pagamento_texto', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="modal-folha-footer">
                            <div className="folha-resumo-totais">
                                <span>Selecionadas: <strong>{linhasFolhaSelecionadas.length}</strong></span>
                                <span>•</span>
                                <span>Total Pago (Clientes): <strong>{formatarMoeda(totalFolhaVendas)}</strong></span>
                                <span>•</span>
                                <span>Custo Lentes: <strong>{formatarMoeda(totalFolhaCustoLentes)}</strong></span>
                                <span>•</span>
                                <span>Custo Armação: <strong>{formatarMoeda(totalFolhaCustoArmacao)}</strong></span>
                                <span>•</span>
                                <span>Custo Total: <strong style={{ color: '#991B1B' }}>{formatarMoeda(totalFolhaCustos)}</strong></span>
                                <span>•</span>
                                <span>Lucro Bruto: <strong style={{ color: '#15803D' }}>{formatarMoeda(lucroFolha)}</strong></span>
                            </div>

                            <div className="modal-folha-acoes">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setIsModalFolhaOpen(false)}
                                >
                                    Fechar
                                </button>
                                {folhaLinhasEditaveis.some(l => l.foiEditadaNaFolha) && (
                                    <button
                                        type="button"
                                        className="btn-secondary btn-folha-pdf"
                                        onClick={() => handleSalvarCustosDaFolhaNoBanco()}
                                        disabled={salvandoCustosFolha}
                                    >
                                        {salvandoCustosFolha ? 'Salvando custos...' : '💾 Salvar Custos no Banco'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleGerarPDFFolhaConfirmado}
                                    disabled={linhasFolhaSelecionadas.length === 0 || salvandoCustosFolha}
                                >
                                    📄 Baixar / Imprimir Folha em PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Exclusão de Venda */}
            {vendaParaExcluir && (
                <div className="modal-exclusao-overlay" onClick={() => !excluindoVenda && setVendaParaExcluir(null)}>
                    <div className="modal-exclusao-card" onClick={(e) => e.stopPropagation()}>
                        <h3>Excluir Venda — Talão #{String(vendaParaExcluir.numero_talao).padStart(4, '0')}</h3>
                        <p>
                            Tem certeza que deseja excluir a venda do Talão{' '}
                            <strong>#{vendaParaExcluir.numero_talao}</strong> no valor de{' '}
                            <strong>{formatarMoeda(vendaParaExcluir.total)}</strong>?
                        </p>
                        <span className="modal-exclusao-aviso">
                            Esta ação também removerá as parcelas vinculadas a este talão e não poderá ser desfeita.
                        </span>
                        <div className="modal-exclusao-acoes">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setVendaParaExcluir(null)}
                                disabled={excluindoVenda}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-confirmar-exclusao"
                                onClick={handleConfirmarExclusaoVenda}
                                disabled={excluindoVenda}
                            >
                                {excluindoVenda ? 'Excluindo...' : 'Sim, Excluir Venda'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
