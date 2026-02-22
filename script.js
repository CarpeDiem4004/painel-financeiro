// ============================================
// CONFIGURAÇÕES DE USUÁRIOS
// ============================================

let usuarios = {
    admin: {
        senha: 'admin123#',
        nivel: 'admin',
        primeiroAcesso: true,
        ultimoAcesso: null
    }
};

let usuarioAtual = null;

// ============================================
// DADOS FINANCEIROS
// ============================================

let dados = {
    limiteGlobal: 8450265.37,
    saldo: {
        combustivel: 0,
        pedagio: 0
    },
    boletos: []
};

// ============================================
// INICIALIZAÇÃO
// ============================================

function inicializar() {
    carregarUsuarios();
    carregarDados();
    verificarLembrarAcesso();
}

// Carregar usuários do localStorage
function carregarUsuarios() {
    const usuariosSalvos = localStorage.getItem('usuarios');
    if (usuariosSalvos) {
        usuarios = JSON.parse(usuariosSalvos);
    } else {
        // Criar usuário padrão
        salvarUsuarios();
    }
}

// Salvar usuários no localStorage
function salvarUsuarios() {
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

// Carregar dados financeiros
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
        salvarDados();
    }
}

// ============================================
// FUNÇÕES DE LOGIN
// ============================================

function fazerLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const lembrar = document.getElementById('lembrar').checked;
    
    // Validar campos
    if (!username || !password) {
        mostrarErro('Preencha usuário e senha!');
        return;
    }
    
    // Verificar se usuário existe
    if (!usuarios[username]) {
        mostrarErro('Usuário ou senha inválidos!');
        return;
    }
    
    // Verificar senha
    if (usuarios[username].senha !== password) {
        mostrarErro('Usuário ou senha inválidos!');
        return;
    }
    
    // Login bem sucedido
    usuarioAtual = {
        nome: username,
        nivel: usuarios[username].nivel
    };
    
    // Atualizar último acesso
    usuarios[username].ultimoAcesso = new Date().toISOString();
    salvarUsuarios();
    
    // Salvar se "lembrar" estiver marcado
    if (lembrar) {
        localStorage.setItem('lembrarUsuario', username);
    } else {
        localStorage.removeItem('lembrarUsuario');
    }
    
    // Esconder tela de login
    document.getElementById('telaLogin').style.display = 'none';
    
    // Mostrar painel
    document.getElementById('painelPrincipal').style.display = 'block';
    
    // Atualizar nome do usuário
    document.getElementById('usuarioLogado').textContent = `👤 ${username} (${traduzirNivel(usuarios[username].nivel)})`;
    
    // Verificar se é primeiro acesso
    if (usuarios[username].primeiroAcesso) {
        abrirModalPrimeiroAcesso();
    }
    
    // Aplicar permissões
    aplicarPermissoes();
    
    // Atualizar interface financeira
    atualizarInterface();
}

function verificarLembrarAcesso() {
    const usuarioLembrado = localStorage.getItem('lembrarUsuario');
    if (usuarioLembrado && usuarios[usuarioLembrado]) {
        document.getElementById('username').value = usuarioLembrado;
        document.getElementById('password').focus();
    }
}

function logout() {
    usuarioAtual = null;
    document.getElementById('painelPrincipal').style.display = 'none';
    document.getElementById('telaLogin').style.display = 'flex';
    document.getElementById('password').value = '';
    document.getElementById('mensagemErro').classList.remove('mostrar');
}

function mostrarErro(mensagem) {
    const erroDiv = document.getElementById('mensagemErro');
    erroDiv.textContent = mensagem;
    erroDiv.classList.add('mostrar');
    
    // Esconder após 3 segundos
    setTimeout(() => {
        erroDiv.classList.remove('mostrar');
    }, 3000);
}

function traduzirNivel(nivel) {
    const traducoes = {
        'admin': 'Administrador',
        'visualizador': 'Visualizador',
        'operador': 'Operador'
    };
    return traducoes[nivel] || nivel;
}

// ============================================
// PERMISSÕES DE ACESSO
// ============================================

function aplicarPermissoes() {
    if (!usuarioAtual) return;
    
    const nivel = usuarioAtual.nivel;
    
    // Elementos que podem ser restritos
    const botoesEditar = document.querySelectorAll('.btn-editar');
    const botoesExcluir = document.querySelectorAll('.btn-excluir');
    const botoesAcao = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-config');
    
    switch(nivel) {
        case 'visualizador':
            // Apenas visualização - desabilitar tudo
            botoesEditar.forEach(btn => btn.style.display = 'none');
            botoesExcluir.forEach(btn => btn.style.display = 'none');
            botoesAcao.forEach(btn => btn.style.display = 'none');
            break;
            
        case 'operador':
            // Pode editar, mas não gerenciar usuários
            botoesEditar.forEach(btn => btn.style.display = 'inline-block');
            botoesExcluir.forEach(btn => btn.style.display = 'inline-block');
            // Esconder botões de configuração de usuários
            document.querySelectorAll('button[onclick*="Usuarios"]').forEach(btn => btn.style.display = 'none');
            break;
            
        case 'admin':
            // Acesso total
            botoesEditar.forEach(btn => btn.style.display = 'inline-block');
            botoesExcluir.forEach(btn => btn.style.display = 'inline-block');
            botoesAcao.forEach(btn => btn.style.display = 'inline-block');
            break;
    }
}

// ============================================
// GERENCIAMENTO DE USUÁRIOS
// ============================================

function abrirModalUsuarios() {
    if (usuarioAtual.nivel !== 'admin') {
        alert('Apenas administradores podem gerenciar usuários!');
        return;
    }
    
    atualizarTabelaUsuarios();
    document.getElementById('modalUsuarios').style.display = 'block';
}

function atualizarTabelaUsuarios() {
    const tbody = document.getElementById('tabelaUsuarios');
    tbody.innerHTML = '';
    
    Object.keys(usuarios).forEach(username => {
        const usuario = usuarios[username];
        const tr = document.createElement('tr');
        
        const ultimoAcesso = usuario.ultimoAcesso 
            ? new Date(usuario.ultimoAcesso).toLocaleString('pt-BR')
            : 'Nunca acessou';
        
        const nivelClass = `nivel-${usuario.nivel}`;
        
        tr.innerHTML = `
            <td>${username}</td>
            <td class="${nivelClass}">${traduzirNivel(usuario.nivel)}</td>
            <td>${ultimoAcesso}</td>
            <td>
                ${username !== 'admin' ? `
                    <button class="btn-reset-senha" onclick="resetarSenha('${username}')">Redefinir Senha</button>
                    <button class="btn-remover-usuario" onclick="removerUsuario('${username}')">Remover</button>
                ` : '⛔ Usuário padrão'}
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function adicionarUsuario() {
    const username = document.getElementById('novoUsername').value.trim();
    const senha = document.getElementById('novoSenha').value;
    const nivel = document.getElementById('novoNivel').value;
    
    if (!username || !senha) {
        alert('Preencha todos os campos!');
        return;
    }
    
    if (usuarios[username]) {
        alert('Usuário já existe!');
        return;
    }
    
    usuarios[username] = {
        senha: senha,
        nivel: nivel,
        primeiroAcesso: true,
        ultimoAcesso: null
    };
    
    salvarUsuarios();
    
    // Limpar campos
    document.getElementById('novoUsername').value = '';
    document.getElementById('novoSenha').value = '';
    
    // Atualizar tabela
    atualizarTabelaUsuarios();
    
    mostrarMensagemSucesso('Usuário adicionado com sucesso!');
}

function removerUsuario(username) {
    if (username === 'admin') {
        alert('Não é possível remover o usuário admin padrão!');
        return;
    }
    
    if (confirm(`Tem certeza que deseja remover o usuário ${username}?`)) {
        delete usuarios[username];
        salvarUsuarios();
        atualizarTabelaUsuarios();
        mostrarMensagemSucesso('Usuário removido!');
    }
}

function resetarSenha(username) {
    const novaSenha = prompt('Digite a nova senha para o usuário ' + username);
    
    if (novaSenha && novaSenha.trim()) {
        usuarios[username].senha = novaSenha;
        usuarios[username].primeiroAcesso = true;
        salvarUsuarios();
        mostrarMensagemSucesso('Senha redefinida com sucesso!');
    }
}

// ============================================
// ALTERAÇÃO DE SENHA
// ============================================

function abrirModalAlterarSenha() {
    document.getElementById('modalAlterarSenha').style.display = 'block';
}

function abrirModalPrimeiroAcesso() {
    document.getElementById('modalPrimeiroAcesso').style.display = 'block';
}

function alterarSenha(event) {
    event.preventDefault();
    
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmar = document.getElementById('confirmarSenha').value;
    
    if (!usuarioAtual) return;
    
    // Verificar senha atual
    if (usuarios[usuarioAtual.nome].senha !== senhaAtual) {
        alert('Senha atual incorreta!');
        return;
    }
    
    // Verificar nova senha
    if (novaSenha !== confirmar) {
        alert('Nova senha e confirmação não coincidem!');
        return;
    }
    
    if (novaSenha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }
    
    // Atualizar senha
    usuarios[usuarioAtual.nome].senha = novaSenha;
    usuarios[usuarioAtual.nome].primeiroAcesso = false;
    salvarUsuarios();
    
    fecharModal('modalAlterarSenha');
    mostrarMensagemSucesso('Senha alterada com sucesso!');
}

function alterarSenhaPrimeiroAcesso(event) {
    event.preventDefault();
    
    const novaSenha = document.getElementById('primeiraNovaSenha').value;
    const confirmar = document.getElementById('primeiraConfirmarSenha').value;
    
    if (!usuarioAtual) return;
    
    if (novaSenha !== confirmar) {
        alert('As senhas não coincidem!');
        return;
    }
    
    if (novaSenha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }
    
    // Atualizar senha
    usuarios[usuarioAtual.nome].senha = novaSenha;
    usuarios[usuarioAtual.nome].primeiroAcesso = false;
    salvarUsuarios();
    
    fecharModal('modalPrimeiroAcesso');
    mostrarMensagemSucesso('Senha alterada com sucesso! Seja bem-vindo!');
}

function recuperarSenha() {
    alert('Para recuperar sua senha, entre em contato com o administrador do sistema.');
}

function mostrarMensagemSucesso(texto) {
    const msg = document.createElement('div');
    msg.className = 'mensagem-sucesso';
    msg.textContent = texto;
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.remove();
    }, 3000);
}

// ============================================
// FUNÇÕES FINANCEIRAS (MANTIDAS DO CÓDIGO ANTERIOR)
// ============================================

function salvarDados() {
    localStorage.setItem('painelFinanceiro', JSON.stringify(dados));
}

function formatarMoeda(valor) {
    return valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function atualizarInterface() {
    atualizarSaldos();
    atualizarTabelaBoletos();
    atualizarResumoMensal();
    verificarDiferenca();
    atualizarFiltrosMeses();
    gerarGraficos();
}

function atualizarSaldos() {
    document.getElementById('saldoCombustivel').textContent = formatarMoeda(dados.saldo.combustivel);
    document.getElementById('saldoPedagio').textContent = formatarMoeda(dados.saldo.pedagio);
    
    const totalDisponivel = dados.saldo.combustivel + dados.saldo.pedagio;
    document.getElementById('saldoTotalDisponivel').textContent = formatarMoeda(totalDisponivel);
}

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
    
    // Aplicar permissões novamente após atualizar tabela
    if (usuarioAtual) {
        aplicarPermissoes();
    }
}

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

function calcularTotalPendente() {
    return dados.boletos.reduce((total, boleto) => {
        if (boleto.status === 'pendente' || boleto.status === 'adiado') {
            return total + (boleto.novoValor || boleto.valor);
        }
        return total;
    }, 0);
}

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

function gerarGraficos() {
    const graficoPendencias = document.getElementById('graficoPendencias');
    const graficoMensal = document.getElementById('graficoMensal');
    
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

// ============================================
// FUNÇÕES DOS MODAIS
// ============================================

function abrirModalBoleto() {
    if (usuarioAtual.nivel === 'visualizador') {
        alert('Você não tem permissão para adicionar boletos!');
        return;
    }
    document.getElementById('modalBoleto').style.display = 'block';
}

function abrirModalSaldo() {
    if (usuarioAtual.nivel === 'visualizador') {
        alert('Você não tem permissão para alterar saldos!');
        return;
    }
    document.getElementById('saldoCombustivelInput').value = dados.saldo.combustivel;
    document.getElementById('saldoPedagioInput').value = dados.saldo.pedagio;
    document.getElementById('modalSaldo').style.display = 'block';
}

function abrirModalDetalheBoleto(id) {
    if (usuarioAtual.nivel === 'visualizador') {
        alert('Você não tem permissão para editar boletos!');
        return;
    }
    
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

// ============================================
// FUNÇÕES CRUD
// ============================================

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

function atualizarSaldo(event) {
    event.preventDefault();
    
    dados.saldo.combustivel = parseFloat(document.getElementById('saldoCombustivelInput').value) || 0;
    dados.saldo.pedagio = parseFloat(document.getElementById('saldoPedagioInput').value) || 0;
    
    salvarDados();
    atualizarInterface();
    fecharModal('modalSaldo');
}

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

function excluirBoleto(id) {
    if (usuarioAtual.nivel === 'visualizador') {
        alert('Você não tem permissão para excluir boletos!');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir este boleto?')) {
        dados.boletos = dados.boletos.filter(b => b.id !== id);
        salvarDados();
        atualizarInterface();
    }
}

function filtrarBoletos() {
    atualizarTabelaBoletos();
    atualizarResumoMensal();
}

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

// ============================================
// EVENTOS GLOBAIS
// ============================================

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', inicializar);