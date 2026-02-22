// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let usuarios = {};
let dados = {};
let usuarioAtual = null;

// ============================================
// INICIALIZAÇÃO - Executa quando a página carrega
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema...');
    inicializarSistema();
});

function inicializarSistema() {
    try {
        // Inicializar usuários
        const usuariosSalvos = localStorage.getItem('usuarios');
        if (usuariosSalvos) {
            usuarios = JSON.parse(usuariosSalvos);
            console.log('Usuários carregados:', Object.keys(usuarios));
        } else {
            // Criar usuário admin padrão
            usuarios = {
                admin: {
                    senha: 'admin123',
                    nivel: 'admin',
                    primeiroAcesso: true,
                    ultimoAcesso: null
                }
            };
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            console.log('Usuário admin criado');
        }
        
        // Inicializar dados financeiros
        const dadosSalvos = localStorage.getItem('painelFinanceiro');
        if (dadosSalvos) {
            dados = JSON.parse(dadosSalvos);
        } else {
            dados = {
                limiteGlobal: 8450265.37,
                saldo: {
                    combustivel: 0,
                    pedagio: 0
                },
                boletos: []
            };
            localStorage.setItem('painelFinanceiro', JSON.stringify(dados));
        }
        
        // Verificar se usuário estava logado
        const usuarioLogado = sessionStorage.getItem('usuarioLogado');
        if (usuarioLogado) {
            const userData = JSON.parse(usuarioLogado);
            usuarioAtual = userData;
            document.getElementById('telaLogin').style.display = 'none';
            document.getElementById('painelPrincipal').style.display = 'block';
            document.getElementById('usuarioLogado').textContent = `👤 ${userData.nome} (${traduzirNivel(userData.nivel)})`;
            aplicarPermissoes();
            atualizarInterface();
        }
        
        // Verificar se tem usuário lembrado
        const usuarioLembrado = localStorage.getItem('lembrarUsuario');
        if (usuarioLembrado && document.getElementById('username')) {
            document.getElementById('username').value = usuarioLembrado;
        }
        
        console.log('Sistema inicializado com sucesso!');
        
    } catch (error) {
        console.error('Erro na inicialização:', error);
        alert('Erro ao inicializar o sistema. Recarregue a página.');
    }
}

// ============================================
// FUNÇÃO DE LOGIN - CORRIGIDA
// ============================================

function fazerLogin() {
    console.log('Tentando fazer login...');
    
    try {
        // Pegar elementos
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const lembrarCheck = document.getElementById('lembrar');
        
        if (!usernameInput || !passwordInput) {
            console.error('Campos de login não encontrados');
            alert('Erro: Campos de login não encontrados');
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const lembrar = lembrarCheck ? lembrarCheck.checked : false;
        
        console.log('Username:', username);
        
        // Validar campos
        if (!username || !password) {
            mostrarErro('Preencha usuário e senha!');
            return;
        }
        
        // Verificar se usuarios existe
        if (!usuarios || Object.keys(usuarios).length === 0) {
            console.error('Objeto usuarios vazio');
            mostrarErro('Erro no sistema. Contate o administrador.');
            return;
        }
        
        // Verificar se usuário existe
        if (!usuarios[username]) {
            console.log('Usuário não encontrado:', username);
            mostrarErro('Usuário ou senha inválidos!');
            return;
        }
        
        // Verificar senha
        if (usuarios[username].senha !== password) {
            console.log('Senha incorreta para:', username);
            mostrarErro('Usuário ou senha inválidos!');
            return;
        }
        
        console.log('Login bem sucedido para:', username);
        
        // Login bem sucedido
        usuarioAtual = {
            nome: username,
            nivel: usuarios[username].nivel || 'visualizador'
        };
        
        // Atualizar último acesso
        usuarios[username].ultimoAcesso = new Date().toISOString();
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        
        // Salvar na sessão
        sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        
        // Salvar se "lembrar" estiver marcado
        if (lembrar) {
            localStorage.setItem('lembrarUsuario', username);
        } else {
            localStorage.removeItem('lembrarUsuario');
        }
        
        // Esconder tela de login
        const telaLogin = document.getElementById('telaLogin');
        if (telaLogin) {
            telaLogin.style.display = 'none';
        } else {
            console.error('Tela de login não encontrada');
        }
        
        // Mostrar painel
        const painelPrincipal = document.getElementById('painelPrincipal');
        if (painelPrincipal) {
            painelPrincipal.style.display = 'block';
        } else {
            console.error('Painel principal não encontrado');
        }
        
        // Atualizar nome do usuário
        const usuarioLogadoSpan = document.getElementById('usuarioLogado');
        if (usuarioLogadoSpan) {
            usuarioLogadoSpan.textContent = `👤 ${username} (${traduzirNivel(usuarios[username].nivel)})`;
        }
        
        // Verificar se é primeiro acesso
        if (usuarios[username].primeiroAcesso) {
            setTimeout(() => abrirModalPrimeiroAcesso(), 500);
        }
        
        // Aplicar permissões
        aplicarPermissoes();
        
        // Atualizar interface financeira
        atualizarInterface();
        
        console.log('Login completo!');
        
    } catch (error) {
        console.error('Erro no login:', error);
        mostrarErro('Erro ao fazer login: ' + error.message);
    }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function mostrarErro(mensagem) {
    console.log('Mostrando erro:', mensagem);
    const erroDiv = document.getElementById('mensagemErro');
    if (erroDiv) {
        erroDiv.textContent = mensagem;
        erroDiv.classList.add('mostrar');
        
        // Esconder após 3 segundos
        setTimeout(() => {
            erroDiv.classList.remove('mostrar');
        }, 3000);
    } else {
        alert(mensagem);
    }
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

function traduzirNivel(nivel) {
    const traducoes = {
        'admin': 'Administrador',
        'visualizador': 'Visualizador',
        'operador': 'Operador'
    };
    return traducoes[nivel] || nivel;
}

function logout() {
    usuarioAtual = null;
    sessionStorage.removeItem('usuarioLogado');
    document.getElementById('painelPrincipal').style.display = 'none';
    document.getElementById('telaLogin').style.display = 'flex';
    document.getElementById('password').value = '';
}

function verificarLembrarAcesso() {
    const usuarioLembrado = localStorage.getItem('lembrarUsuario');
    if (usuarioLembrado && document.getElementById('username')) {
        document.getElementById('username').value = usuarioLembrado;
    }
}

// ============================================
// FUNÇÕES DE USUÁRIOS
// ============================================

function abrirModalUsuarios() {
    if (!usuarioAtual || usuarioAtual.nivel !== 'admin') {
        alert('Apenas administradores podem gerenciar usuários!');
        return;
    }
    atualizarTabelaUsuarios();
    document.getElementById('modalUsuarios').style.display = 'block';
}

function atualizarTabelaUsuarios() {
    const tbody = document.getElementById('tabelaUsuarios');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    Object.keys(usuarios).forEach(username => {
        const usuario = usuarios[username];
        const tr = document.createElement('tr');
        
        const ultimoAcesso = usuario.ultimoAcesso 
            ? new Date(usuario.ultimoAcesso).toLocaleString('pt-BR')
            : 'Nunca acessou';
        
        tr.innerHTML = `
            <td>${username}</td>
            <td class="nivel-${usuario.nivel}">${traduzirNivel(usuario.nivel)}</td>
            <td>${ultimoAcesso}</td>
            <td>
                ${username !== 'admin' ? `
                    <button class="btn-reset-senha" onclick="resetarSenha('${username}')">Redefinir Senha</button>
                    <button class="btn-remover-usuario" onclick="removerUsuario('${username}')">Remover</button>
                ` : 'Usuário padrão'}
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function adicionarUsuario() {
    const username = document.getElementById('novoUsername')?.value.trim();
    const senha = document.getElementById('novoSenha')?.value;
    const nivel = document.getElementById('novoNivel')?.value;
    
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
    
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    document.getElementById('novoUsername').value = '';
    document.getElementById('novoSenha').value = '';
    
    atualizarTabelaUsuarios();
    mostrarMensagemSucesso('Usuário adicionado!');
}

function removerUsuario(username) {
    if (username === 'admin') {
        alert('Não é possível remover o usuário admin!');
        return;
    }
    
    if (confirm(`Remover usuário ${username}?`)) {
        delete usuarios[username];
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        atualizarTabelaUsuarios();
        mostrarMensagemSucesso('Usuário removido!');
    }
}

function resetarSenha(username) {
    const novaSenha = prompt('Nova senha para ' + username);
    if (novaSenha && novaSenha.trim()) {
        usuarios[username].senha = novaSenha;
        usuarios[username].primeiroAcesso = true;
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        mostrarMensagemSucesso('Senha redefinida!');
    }
}

// ============================================
// FUNÇÕES DE SENHA
// ============================================

function abrirModalAlterarSenha() {
    document.getElementById('modalAlterarSenha').style.display = 'block';
}

function abrirModalPrimeiroAcesso() {
    document.getElementById('modalPrimeiroAcesso').style.display = 'block';
}

function alterarSenha(event) {
    event.preventDefault();
    
    const senhaAtual = document.getElementById('senhaAtual')?.value;
    const novaSenha = document.getElementById('novaSenha')?.value;
    const confirmar = document.getElementById('confirmarSenha')?.value;
    
    if (!usuarioAtual) return;
    
    if (usuarios[usuarioAtual.nome].senha !== senhaAtual) {
        alert('Senha atual incorreta!');
        return;
    }
    
    if (novaSenha !== confirmar) {
        alert('Nova senha e confirmação não coincidem!');
        return;
    }
    
    if (novaSenha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }
    
    usuarios[usuarioAtual.nome].senha = novaSenha;
    usuarios[usuarioAtual.nome].primeiroAcesso = false;
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    fecharModal('modalAlterarSenha');
    mostrarMensagemSucesso('Senha alterada!');
}

function alterarSenhaPrimeiroAcesso(event) {
    event.preventDefault();
    
    const novaSenha = document.getElementById('primeiraNovaSenha')?.value;
    const confirmar = document.getElementById('primeiraConfirmarSenha')?.value;
    
    if (!usuarioAtual) return;
    
    if (novaSenha !== confirmar) {
        alert('As senhas não coincidem!');
        return;
    }
    
    if (novaSenha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }
    
    usuarios[usuarioAtual.nome].senha = novaSenha;
    usuarios[usuarioAtual.nome].primeiroAcesso = false;
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    fecharModal('modalPrimeiroAcesso');
    mostrarMensagemSucesso('Senha alterada! Bem-vindo!');
}

// ============================================
// FUNÇÕES FINANCEIRAS
// ============================================

function formatarMoeda(valor) {
    if (valor === undefined || valor === null || isNaN(valor)) return '0,00';
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    return numero.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function converterParaNumero(valorString) {
    if (!valorString) return 0;
    const numeroLimpo = valorString.toString()
        .replace('R$', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
    return parseFloat(numeroLimpo) || 0;
}

function salvarDados() {
    localStorage.setItem('painelFinanceiro', JSON.stringify(dados));
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
    const el1 = document.getElementById('saldoCombustivel');
    const el2 = document.getElementById('saldoPedagio');
    const el3 = document.getElementById('saldoTotalDisponivel');
    
    if (el1) el1.textContent = formatarMoeda(dados.saldo?.combustivel || 0);
    if (el2) el2.textContent = formatarMoeda(dados.saldo?.pedagio || 0);
    
    const totalDisponivel = (dados.saldo?.combustivel || 0) + (dados.saldo?.pedagio || 0);
    if (el3) el3.textContent = formatarMoeda(totalDisponivel);
}

function abrirModalBoleto() {
    document.getElementById('modalBoleto').style.display = 'block';
}

function abrirModalSaldo() {
    document.getElementById('saldoCombustivelInput').value = dados.saldo?.combustivel || 0;
    document.getElementById('saldoPedagioInput').value = dados.saldo?.pedagio || 0;
    document.getElementById('modalSaldo').style.display = 'block';
}

function fecharModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function salvarBoleto(event) {
    event.preventDefault();
    
    const novoBoleto = {
        id: Date.now(),
        provedor: document.getElementById('provedor')?.value || '',
        dataVencimento: document.getElementById('dataVencimento')?.value || '',
        periodoInicio: document.getElementById('periodoInicio')?.value || '',
        periodoFim: document.getElementById('periodoFim')?.value || '',
        valor: parseFloat(document.getElementById('valor')?.value) || 0,
        tipoCobranca: document.getElementById('tipoCobranca')?.value || 'mensal',
        observacoes: document.getElementById('observacoes')?.value || '',
        status: 'pendente',
        adiado: false,
        pagoParcial: false
    };
    
    if (!dados.boletos) dados.boletos = [];
    dados.boletos.push(novoBoleto);
    salvarDados();
    atualizarInterface();
    fecharModal('modalBoleto');
    mostrarMensagemSucesso('Boleto adicionado!');
}

function atualizarSaldo(event) {
    event.preventDefault();
    
    dados.saldo = {
        combustivel: parseFloat(document.getElementById('saldoCombustivelInput')?.value) || 0,
        pedagio: parseFloat(document.getElementById('saldoPedagioInput')?.value) || 0
    };
    
    salvarDados();
    atualizarInterface();
    fecharModal('modalSaldo');
    mostrarMensagemSucesso('Saldo atualizado!');
}

function atualizarTabelaBoletos() {
    const tbody = document.getElementById('corpoTabela');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!dados.boletos || dados.boletos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 30px;">Nenhum boleto cadastrado</td></tr>';
        return;
    }
    
    dados.boletos.forEach(boleto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${boleto.dataVencimento ? new Date(boleto.dataVencimento).toLocaleDateString('pt-BR') : '-'}</td>
            <td>${boleto.provedor || '-'}</td>
            <td>${boleto.periodoInicio ? new Date(boleto.periodoInicio).toLocaleDateString('pt-BR') : '-'}</td>
            <td>${boleto.periodoFim ? new Date(boleto.periodoFim).toLocaleDateString('pt-BR') : '-'}</td>
            <td>R$ ${formatarMoeda(boleto.valor || 0)}</td>
            <td>${boleto.tipoCobranca || 'mensal'}</td>
            <td class="status-${boleto.status || 'pendente'}">${boleto.status || 'pendente'}</td>
            <td>${boleto.adiado ? 'Sim' : 'Não'}</td>
            <td>${boleto.novaData ? new Date(boleto.novaData).toLocaleDateString('pt-BR') : '-'}</td>
            <td>${boleto.novoValor ? 'R$ ' + formatarMoeda(boleto.novoValor) : '-'}</td>
            <td>${boleto.valorPago ? 'R$ ' + formatarMoeda(boleto.valorPago) : '-'}</td>
            <td>
                <button class="btn-editar" onclick="abrirModalDetalheBoleto(${boleto.id})">Editar</button>
                <button class="btn-excluir" onclick="excluirBoleto(${boleto.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function excluirBoleto(id) {
    if (confirm('Excluir este boleto?')) {
        dados.boletos = dados.boletos.filter(b => b.id !== id);
        salvarDados();
        atualizarInterface();
        mostrarMensagemSucesso('Boleto excluído!');
    }
}

function atualizarResumoMensal() {
    // Implementação básica
    document.getElementById('valorPagoMes').textContent = '0,00';
    document.getElementById('valorPendenteMes').textContent = '0,00';
    document.getElementById('totalMes').textContent = '0,00';
}

function verificarDiferenca() {
    const totalPendente = (dados.boletos || []).reduce((total, b) => {
        if (b.status === 'pendente' || b.status === 'adiado') {
            return total + (b.novoValor || b.valor || 0);
        }
        return total;
    }, 0);
    
    const totalDisponivel = (dados.saldo?.combustivel || 0) + (dados.saldo?.pedagio || 0);
    const totalGeral = totalPendente + totalDisponivel;
    const diferenca = totalGeral - (dados.limiteGlobal || 8450265.37);
    
    const alertas = document.getElementById('alertas');
    if (alertas) {
        if (Math.abs(diferenca) > 0.01) {
            alertas.className = 'alertas erro';
            alertas.innerHTML = `⚠️ Diferença: R$ ${formatarMoeda(Math.abs(diferenca))} ${diferenca > 0 ? 'acima' : 'abaixo'} do limite!`;
        } else {
            alertas.className = 'alertas sucesso';
            alertas.innerHTML = '✅ Valores conferem com o limite';
        }
    }
}

function atualizarFiltrosMeses() {
    // Implementação básica
}

function gerarGraficos() {
    const totalPendente = (dados.boletos || []).reduce((total, b) => {
        if (b.status === 'pendente' || b.status === 'adiado') {
            return total + (b.novoValor || b.valor || 0);
        }
        return total;
    }, 0);
    
    const totalDisponivel = (dados.saldo?.combustivel || 0) + (dados.saldo?.pedagio || 0);
    
    const grafico = document.getElementById('graficoPendencias');
    if (grafico) {
        grafico.innerHTML = `
            <h4>Distribuição</h4>
            <p><strong>Pendente:</strong> R$ ${formatarMoeda(totalPendente)}</p>
            <p><strong>Disponível:</strong> R$ ${formatarMoeda(totalDisponivel)}</p>
        `;
    }
}

function aplicarPermissoes() {
    // Implementação básica
}

function abrirModalDetalheBoleto(id) {
    alert('Função em desenvolvimento: Editar boleto ' + id);
}

function toggleCamposAdiados() {
    // Implementação básica
}

function filtrarBoletos() {
    atualizarTabelaBoletos();
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

// Fechar modal clicando fora
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}