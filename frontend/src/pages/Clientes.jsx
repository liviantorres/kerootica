import React, { useState, useEffect } from 'react';
import api from '../services/api';
import filtro from '../assets/icons/filtro.svg';
import novoCliente from '../assets/icons/novo_cliente.svg';
import setaEsquerda from '../assets/icons/seta_esquerda.svg';
import setaDireita from '../assets/icons/seta_direita.svg';
import '../pages/styles/Clientes.css';

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        carregarClientes();
    }, []);

    const carregarClientes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/clientes');
            setClientes(response.data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    // Lógica de paginação
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClientes = clientes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(clientes.length / itemsPerPage);

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Render badge de situação (será útil quando o backend enviar o dado)
    const renderSituacao = (situacao) => {
        if (!situacao) return <span className="badge badge-empty">-</span>;
        
        let badgeClass = 'badge-regular';
        if (situacao.toLowerCase().includes('atrasada')) badgeClass = 'badge-atrasada';
        else if (situacao.toLowerCase().includes('garantia')) badgeClass = 'badge-garantia';
        
        return <span className={`badge ${badgeClass}`}>{situacao}</span>;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className='page-titles'>
                    <h2>Clientes</h2>
                    <p>Cadastre, pesquise e acompanhe todo o histórico</p>
                </div>
            </div>

            <div className="action-bar">
                <input 
                    type="text" 
                    placeholder="Pesquisar por nome, CPF, talão.." 
                    className="search-input"
                />

                <div className="action-buttons">
                    <button className="btn-secondary">
                        <img src={filtro} alt="Filtro" className="icon" /> Filtros
                    </button>
                    <button className="btn-primary">
                        <img src={novoCliente} alt="Novo Cliente" className="icon" /> Novo Cliente
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>CPF</th>
                            <th>Telefone</th>
                            <th>Situação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="empty-state">Carregando clientes...</td>
                            </tr>
                        ) : clientes.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="empty-state">Nenhum cliente cadastrado ainda.</td>
                            </tr>
                        ) : (
                            currentClientes.map(cliente => (
                                <tr key={cliente.id}>
                                    <td>{cliente.nome_completo}</td>
                                    <td>{cliente.cpf}</td>
                                    <td>{cliente.telefone1 || '-'}</td>
                                    <td>{renderSituacao(cliente.situacao)}</td>
                                    <td className="action-cell">
                                        <button className="btn-icon">
                                            <img src={setaDireita} alt="Ações" className="action-arrow" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                
                <div className="table-footer">
                    <span className="pagination-info">
                        Mostrando {clientes.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, clientes.length)} de {clientes.length}.
                    </span>
                    <div className="pagination-controls">
                        <button 
                            className="btn-page" 
                            onClick={handlePrevPage}
                            disabled={currentPage === 1 || clientes.length === 0}
                        >
                            <img src={setaEsquerda} alt="Anterior" />
                        </button>
                        <button 
                            className="btn-page" 
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || clientes.length === 0}
                        >
                            <img src={setaDireita} alt="Próxima" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}