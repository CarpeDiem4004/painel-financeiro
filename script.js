// Dados iniciais
let dados = {
    limiteGlobal: 8450265.37,
    saldo: {
        combustivel: 0,
        pedagio: 0
    },
    boletos: []
};

// Carregar dados do localStorage
function carregarDados() {
    const dadosSalvos = localStorage.getItem('painelFinanceiro');
    if (dadosSalvos) {
        dados = JSON.parse(dadosSalvos);
    } else {
        // Dados de exemplo
        dados.boletos = [
            {
                id: Date.now() - 1000000,
                dataVencimento: '2024-01-15',
                valor: 15000.00,
                periodo: 'mensal',
                status: 'pendente'
            },
            {
                id: Date.now() - 2000000,
                dataVencimento: '2024-01-20',
                valor: 8500.50,
                periodo: 'unico',
                status: 'pago',
                valorPago: 8500.50
            }
        ];
    }
    atualizarInterface();
}

// Salvar dados no localStorage
function salvarDados() {
    localStorage.setItem('painelFinanceiro', JSON.stringify(dados));
}

// Formatar valor para moeda
function formatarMoeda(valor) {
    return valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Atualizar interface completa
function atualizarInterface() {
    atualizarSaldos();
    atualizarTabelaBoletos();
    atualizarResumoMensal();
    verificarDiferenca();
    atualizarFiltrosMeses();
    gerarGraficos();
}

// Atualizar saldos disponíveis
function atualizarSaldos() {
    document.getElementById('saldoCombustivel').textContent = formatarMoeda(dados.saldo.combustivel);
    document.getElementById('saldoPedagio').textContent = formatarMoeda(dados.saldo.pedagio);
    
    const totalDisponivel = dados.saldo.combustivel + dados.saldo.pedagio;
    document.getElementById('saldoTotalDisponivel').textContent = formatarMoeda(totalDisponivel);
}

// Atualizar tabela de boletos
function atualizarTabelaBoletos() {
    const filtroMes = document.getElementById('filtroMes').value;
    const tbody = document.getElementById('corpoTabela');
    
    let boletosFiltrados = dados.boletos;
    
    if (filtroMes !== 'todos') {
        const [ano, mes] = filtroMes.split('-');
        boletosFiltrados = dados.boletos.filter(b => {
            const data = new Date(b.dataVencimento);
            return data.getFullYear() === parseInt(ano) && data.getMonth() + 1 === parseInt(mes);
        });
    }
    
    tbody.innerHTML = '';
    
    boletosFiltrados.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
    
    boletosFiltrados.forEach(boleto => {
        const tr = document.createElement('tr');
        
        const statusClass = boleto.status === 'pendente' ? 'status-pendente' :
                           boleto.status === 'pago' ? 'status-pago' : 'status-adiado';
        
        tr.innerHTML = `
            <td>${new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}</td>
            <td>R$ ${formatarMoeda(boleto.valor)}</td>
            <td>${boleto.periodo}</td>
            <td class="${statusClass}">${boleto.status}</td>
            <td>${boleto.adiado ? 'Sim' : 'Não'}</td>
            <td>${boleto.novaData ? new Date(boleto.novaData).toLocaleDateString('pt-BR') : '-'}</td>
            <td>${boleto.novoValor ? 'R$ ' + formatarMoeda(boleto.novoValor) : '-'}</td>
            <td>${boleto.pagoParcial ? 'Sim' : 'Não'}</td>
            <td>${boleto.valorPago ? 'R$ ' + formatarMoeda(boleto.valorPago) : '-'}</td>
            <td>
                <button class="btn-editar" onclick="abrirModalDetalheBoleto(${boleto.id})">Editar</button>
                <button class="btn-excluir" onclick="excluirBoleto(${boleto.id})">Excluir</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Atualizar resumo mensal
function atualizarResumoMensal() {
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth();
    const anoAtual = dataAtual.getFullYear();
    
    let valorPago = 0;
    let valorPendente = 0;
    
    dados.boletos.forEach(boleto => {
        const dataVencimento = new Date(boleto.dataVencimento);
        
        if (dataVencimento.getMonth() === mesAtual && dataVencimento.getFullYear() === anoAtual) {
            if (boleto.status === 'pago' || boleto.status === 'parcial') {
                valorPago += boleto.valorPago || 0;
            } else if (boleto.status === 'pendente' || boleto.status === 'adiado') {
                valorPendente += boleto.novoValor || boleto.valor;
            }
        }
    });
    
    document.getElementById('valorPagoMes').textContent = formatarMoeda(valorPago);
    document.getElementById('valorPendenteMes').textContent = formatarMoeda(valorPendente);
    document.getElementById('totalMes').textContent = formatarMoeda(valorPago + valorPendente);
}

// Verificar diferença no limite global
function verificarDiferenca() {
    const totalPendente = calcularTotalPendente();
    const totalDisponivel = dados.saldo.combustivel + dados.saldo.pedagio;
    const totalGeral = totalPendente + totalDisponivel;
    
    const diferenca = totalGeral - dados.limiteGlobal;
    const alertas = document.getElementById('alertas');
    
    if (Math.abs(diferenca) > 0.01) {
        alertas.className = 'alertas erro';
        alertas.innerHTML = `⚠️ Diferença detectada: R$ ${formatarMoeda(Math.abs(diferenca))} ${diferenca > 0 ? 'acima' : 'abaixo'} do limite global!`;
    } else {
        alertas.className = 'alertas sucesso';
        alertas.innerHTML = '✅ Valores conferem com o limite global';
    }
}

// Calcular total pendente
function calcularTotalPendente() {
    return dados.boletos.reduce((total, boleto) => {
        if (boleto.status === 'pendente' || boleto.status === 'adiado') {
            return total + (boleto.novoValor || boleto.valor);
        }
        return total;
    }, 0);
}

// Atualizar filtros de meses
function atualizarFiltrosMeses() {
    const meses = new Set();
    dados.boletos.forEach(boleto => {
        const data = new Date(boleto.dataVencimento);
        meses.add(`${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`);
    });
    
    const select = document.getElementById('filtroMes');
    const valorAtual = select.value;
    
    select.innerHTML = '<option value="todos">Todos os Meses</option>';
    
    Array.from(meses).sort().reverse().forEach(mes => {
        const [ano, mesNum] = mes.split('-');
        const data = new Date(ano, mesNum - 1);
        const option = document.createElement('option');
        option.value = mes;
        option.textContent = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        select.appendChild(option);
    });
    
    select.value = valorAtual;
}

// Gerar gráficos (versão simplificada usando texto)
function gerarGraficos() {
    const graficoPendencias = document.getElementById('graficoPendencias');
    const graficoMensal = document.getElementById('graficoMensal');
    
    // Gráfico de pendencias
    const totalPendente = calcularTotalPendente();
    const totalDisponivel = dados.saldo.combustivel + dados.saldo.pedagio;
    
    graficoPendencias.innerHTML = `
        <h4>Distribuição de Recursos</h4>
        <div style="background: #eee; padding: 20px; border-radius: 5px;">
            <p><strong>Pendente:</strong> R$ ${formatarMoeda(totalPendente)}</p>
            <p><strong>Disponível:</strong> R$ ${formatarMoeda(totalDisponivel)}</p>
            <div style="width: 100%; height: 30px; background: #ddd; margin-top: 10px;">
                <div style="width: ${(totalPendente / dados.limiteGlobal) * 100}%; height: 100%; background: #f0ad4e; float: left;"></div>
                <div style="width: ${(totalDisponivel / dados.limiteGlobal) * 100}%; height: 100%; background: #5cb85c; float: left;"></div>
            </div>
        </div>
    `;
    
    // Gráfico mensal simplificado
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dataAtual = new Date();
    let html = '<h4>Últimos 3 Meses</h4><div style="background: #eee; padding: 20px; border-radius: 5px;">';
    
    for (let i = 2; i >= 0; i--) {
        const mes = dataAtual.getMonth() - i;
        const ano = dataAtual.getFullYear() + (mes < 0 ? -1 : 0);
        const mesAjustado = mes < 0 ? mes + 12 : mes;
        
        let pago = 0;
        let pendente = 0;
        
        dados.boletos.forEach(boleto => {
            const data = new Date(boleto.dataVencimento);
            if (data.getMonth() === mesAjustado && data.getFullYear() === ano) {
                if (boleto.status === 'pago' || boleto.status === 'parcial') {
                    pago += boleto.valorPago || 0;
                } else {
                    pendente += boleto.novoValor || boleto.valor;
                }
            }
        });
        
        html += `
            <p><strong>${meses[mesAjustado]}/${ano}:</strong></p>
            <p>Pago: R$ ${formatarMoeda(pago)} | Pendente: R$ ${formatarMoeda(pendente)}</p>
        `;
    }
    
    html += '</div>';
    graficoMensal.innerHTML = html;
}

// Funções do modal
function abrirModalBoleto() {
    document.getElementById('modalBoleto').style.display = 'block';
}

function abrirModalSaldo() {
    document.getElementById('saldoCombustivelInput').value = dados.saldo.combustivel;
    document.getElementById('saldoPedagioInput').value = dados.saldo.pedagio;
    document.getElementById('modalSaldo').style.display = 'block';
}

function abrirModalDetalheBoleto(id) {
    const boleto = dados.boletos.find(b => b.id === id);
    if (!boleto) return;
    
    document.getElementById('boletoId').value = boleto.id;
    document.getElementById('detalheDataVencimento').value = boleto.dataVencimento;
    document.getElementById('detalheValor').value = boleto.valor;
    document.getElementById('detalhePeriodo').value = boleto.periodo;
    document.getElementById('detalheStatus').value = boleto.status || 'pendente';
    
    toggleCamposAdiados();
    
    if (boleto.adiado) {
        document.getElementById('detalheNovaData').value = boleto.novaData || '';
        document.getElementById('detalheNovoValor').value = boleto.novoValor || '';
    }
    
    if (boleto.pagoParcial) {
        document.getElementById('detalheValorPago').value = boleto.valorPago || '';
    }
    
    document.getElementById('modalDetalheBoleto').style.display = 'block';
}

function fecharModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function toggleCamposAdiados() {
    const status = document.getElementById('detalheStatus').value;
    document.getElementById('camposAdiados').style.display = status === 'adiado' ? 'block' : 'none';
    document.getElementById('camposParcial').style.display = status === 'parcial' ? 'block' : 'none';
}

// Salvar novo boleto
function salvarBoleto(event) {
    event.preventDefault();
    
    const novoBoleto = {
        id: Date.now(),
        dataVencimento: document.getElementById('dataVencimento').value,
        valor: parseFloat(document.getElementById('valor').value),
        periodo: document.getElementById('periodo').value,
        status: 'pendente',
        adiado: false,
        pagoParcial: false
    };
    
    dados.boletos.push(novoBoleto);
    salvarDados();
    atualizarInterface();
    fecharModal('modalBoleto');
    event.target.reset();
}

// Atualizar saldo
function atualizarSaldo(event) {
    event.preventDefault();
    
    dados.saldo.combustivel = parseFloat(document.getElementById('saldoCombustivelInput').value) || 0;
    dados.saldo.pedagio = parseFloat(document.getElementById('saldoPedagioInput').value) || 0;
    
    salvarDados();
    atualizarInterface();
    fecharModal('modalSaldo');
}

// Atualizar boleto
function atualizarBoleto(event) {
    event.preventDefault();
    
    const id = parseInt(document.getElementById('boletoId').value);
    const boleto = dados.boletos.find(b => b.id === id);
    
    if (!boleto) return;
    
    boleto.dataVencimento = document.getElementById('detalheDataVencimento').value;
    boleto.valor = parseFloat(document.getElementById('detalheValor').value);
    boleto.periodo = document.getElementById('detalhePeriodo').value;
    boleto.status = document.getElementById('detalheStatus').value;
    
    if (boleto.status === 'adiado') {
        boleto.adiado = true;
        boleto.novaData = document.getElementById('detalheNovaData').value;
        boleto.novoValor = parseFloat(document.getElementById('detalheNovoValor').value);
        boleto.pagoParcial = false;
    } else if (boleto.status === 'parcial') {
        boleto.pagoParcial = true;
        boleto.valorPago = parseFloat(document.getElementById('detalheValorPago').value);
        boleto.adiado = false;
    } else {
        boleto.adiado = false;
        boleto.pagoParcial = false;
    }
    
    salvarDados();
    atualizarInterface();
    fecharModal('modalDetalheBoleto');
}

// Excluir boleto
function excluirBoleto(id) {
    if (confirm('Tem certeza que deseja excluir este boleto?')) {
        dados.boletos = dados.boletos.filter(b => b.id !== id);
        salvarDados();
        atualizarInterface();
    }
}

// Filtrar boletos
function filtrarBoletos() {
    atualizarTabelaBoletos();
    atualizarResumoMensal();
}

// Exportar dados
function exportarDados() {
    const dadosString = JSON.stringify(dados, null, 2);
    const blob = new Blob([dadosString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `painel-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Fechar modal clicando fora
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', carregarDados);