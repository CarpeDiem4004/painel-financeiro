// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let usuarios = {};
let dados = {
    limiteGlobal: 8450265.37,
    saldo: {
        combustivel: 0,
        pedagio: 0
    },
    boletos: []
};
let usuarioAtual = null;

// ============================================
// INICIALIZAÇÃO - Executa quando a página carrega
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sistema...');
    carregarUsuarios();
    carregarDadosFinanceiros();
    verificarSessao();
    verificarLembrarUsuario();
    configurarEventos();
    console.log('Sistema inicializado!');
});

function carregarUsuarios() {
    try {
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
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

function carregarDadosFinanceiros() {
    try {
        const dadosSalvos = localStorage.getItem('painelFinanceiro');
        if (dadosSalvos) {
            const dadosParseados = JSON.parse(dadosSalvos);
            // Garantir que a estrutura está correta
            dados = {
                limiteGlobal: dadosParseados.limiteGlobal || 8450265.37,
                saldo: dadosParseados.saldo || { combustivel: 0, pedagio: 0 },
                boletos: dadosParseados.boletos || []
            };
        } else {
            // Dados padrão com exemplos
            dados = {
                limiteGlobal: 8450265.37,
                saldo: {
                    combustivel: 210337.99,
                    pedagio: 455.44
                },
                boletos: [
                    {
                        id: 1,
                        provedor: 'Ticket',
                        dataVencimento: '2026-02-24',
                        periodoInicio: '2026-02-01',
                        periodoFim: '2026-02-10',
                        valor: 76.64,
                        tipoCobranca: 'mensal',
                        observacoes: '',
                        status: 'pendente',
                        adiado: false
                    },
                    {
                        id: 2,
                        provedor: 'Ticket-Line Haul',
                        dataVencimento: '2026-02-24',
                        periodoInicio: '2026-02-09',
                        periodoFim: '2026-02-19',
                        valor: 663267.94,
                        tipoCobranca: 'mensal',
                        observacoes: '',
                        status: 'pendente',
                        adiado: false
                    },
                    {
                        id: 3,
                        provedor: 'Ticket-Postos',
                        dataVencimento: '2026-02-24',
                        periodoInicio: '2026-02-01',
                        periodoFim: '2026-02-11',
                        valor: 81462.02,
                        tipoCobranca: 'mensal',
                        observacoes: '',
                        status: 'pendente',
                        adiado: false
                    }
                ]
            };
            localStorage.setItem('painelFinanceiro', JSON.stringify(dados));
        }
        console.log('Dados financeiros carregados');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function verificarSessao() {
    try {
        const sessao = sessionStorage.getItem('usuarioLogado');
        if (sessao) {
            const userData = JSON.parse(sessao);
            if (userData && userData.nome && usuarios[userData.nome]) {
                usuarioAtual = userData;
                
                // Esconder login e mostrar painel
                const telaLogin = document.getElementById('telaLogin');
                const painelPrincipal = document.getElementById('painelPrincipal');
                const usuarioSpan = document.getElementById('usuarioLogado');
                
                if (telaLogin) telaLogin.style.display = 'none';
                if (painelPrincipal) painelPrincipal.style.display = 'block';
                if (usuarioSpan) {
                    usuarioSpan.textContent = `👤 ${userData.nome} (${traduzirNivel(userData.nivel)})`;
                }
                
                aplicarPermissoes();
                atualizarInterface();
                console.log('Sessão restaurada para:', userData.nome);
            }
        }
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
    }
}

function verificarLembrarUsuario() {
    try {
        const usuarioLembrado = localStorage.getItem('lembrarUsuario');
        const usernameInput = document.getElementById('username');
        if (usuarioLembrado && usernameInput) {
            usernameInput.value = usuarioLembrado;
        }
    } catch (error) {
        console.error('Erro ao verificar lembrar usuário:', error);
    }
}

// ============================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================

function configurarEventos() {
    try {
        // Configurar evento do filtro de mês
        const filtroSelect = document.getElementById('filtroMes');
        if (filtroSelect && !filtroSelect.hasAttribute('data-listener')) {
            filtroSelect.addEventListener('change', function() {
                console.log('Evento change disparado - mês:', this.value);
                filtrarBoletos();
            });
            filtroSelect.setAttribute('data-listener', 'true');
        }
        
        // Configurar evento do filtro de status
        const filtroStatus = document.getElementById('filtroStatus');
        if (filtroStatus && !filtroStatus.hasAttribute('data-listener')) {
            filtroStatus.addEventListener('change', function() {
                console.log('Filtro status alterado:', this.value);
                filtrarBoletos();
            });
            filtroStatus.setAttribute('data-listener', 'true');
        }
        
        // Configurar evento do campo de busca
        const filtroBusca = document.getElementById('filtroBusca');
        if (filtroBusca && !filtroBusca.hasAttribute('data-listener')) {
            filtroBusca.addEventListener('keyup', function() {
                filtrarBoletos();
            });
            filtroBusca.setAttribute('data-listener', 'true');
        }
        
        // Configurar evento de tecla Enter no campo de senha
        const passwordInput = document.getElementById('password');
        if (passwordInput && !passwordInput.hasAttribute('data-listener')) {
            passwordInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    fazerLogin();
                }
            });
            passwordInput.setAttribute('data-listener', 'true');
        }
        
        // Configurar evento para limpar filtros
        const btnLimpar = document.getElementById('btnLimparFiltros');
        if (btnLimpar && !btnLimpar.hasAttribute('data-listener')) {
            btnLimpar.addEventListener('click', function() {
                limparFiltros();
            });
            btnLimpar.setAttribute('data-listener', 'true');
        }
        
        console.log('Eventos configurados com sucesso');
    } catch (error) {
        console.error('Erro ao configurar eventos:', error);
    }
}

// ============================================
// FUNÇÃO DE LOGIN
// ============================================

function fazerLogin() {
    console.log('Tentando fazer login...');
    
    try {
        // Pegar elementos do DOM
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const lembrarCheck = document.getElementById('lembrar');
        
        // Verificar se elementos existem
        if (!usernameInput || !passwordInput) {
            console.error('Campos de login não encontrados no DOM');
            alert('Erro: Elementos de login não encontrados. Recarregue a página.');
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const lembrar = lembrarCheck ? lembrarCheck.checked : false;
        
        console.log('Tentativa de login para usuário:', username);
        
        // Validar campos vazios
        if (!username) {
            mostrarErro('Digite o nome de usuário!');
            return;
        }
        
        if (!password) {
            mostrarErro('Digite a senha!');
            return;
        }
        
        // Verificar se objeto usuários existe e não está vazio
        if (!usuarios || Object.keys(usuarios).length === 0) {
            console.error('Objeto usuários vazio ou inválido');
            mostrarErro('Erro no sistema. Contate o administrador.');
            return;
        }
        
        // Verificar se usuário existe
        if (!usuarios.hasOwnProperty(username)) {
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
        
        // Login bem sucedido
        console.log('Login bem sucedido para:', username);
        
        // Criar objeto do usuário atual
        usuarioAtual = {
            nome: username,
            nivel: usuarios[username].nivel || 'visualizador'
        };
        
        // Atualizar último acesso
        usuarios[username].ultimoAcesso = new Date().toISOString();
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        
        // Salvar na sessão
        sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        
        // Salvar "lembrar" se marcado
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
            console.error('Elemento telaLogin não encontrado');
        }
        
        // Mostrar painel principal
        const painelPrincipal = document.getElementById('painelPrincipal');
        if (painelPrincipal) {
            painelPrincipal.style.display = 'block';
        } else {
            console.error('Elemento painelPrincipal não encontrado');
        }
        
        // Atualizar nome do usuário no header
        const usuarioLogadoSpan = document.getElementById('usuarioLogado');
        if (usuarioLogadoSpan) {
            usuarioLogadoSpan.textContent = `👤 ${username} (${traduzirNivel(usuarios[username].nivel)})`;
        }
        
        // Verificar primeiro acesso
        if (usuarios[username].primeiroAcesso) {
            setTimeout(() => abrirModalPrimeiroAcesso(), 500);
        }
        
        // Aplicar permissões baseadas no nível
        aplicarPermissoes();
        
        // Atualizar interface financeira
        atualizarInterface();
        
        console.log('Login completo! Painel carregado.');
        
    } catch (error) {
        console.error('Erro detalhado no login:', error);
        mostrarErro('Erro ao fazer login: ' + error.message);
    }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function mostrarErro(mensagem) {
    console.log('Exibindo erro:', mensagem);
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
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
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
    
    const painelPrincipal = document.getElementById('painelPrincipal');
    const telaLogin = document.getElementById('telaLogin');
    const passwordInput = document.getElementById('password');
    
    if (painelPrincipal) painelPrincipal.style.display = 'none';
    if (telaLogin) telaLogin.style.display = 'flex';
    if (passwordInput) passwordInput.value = '';
}

// ============================================
// FUNÇÕES DE PERMISSÕES
// ============================================

function aplicarPermissoes() {
    if (!usuarioAtual) return;
    
    const botoesEditar = document.querySelectorAll('.btn-editar');
    const botoesExcluir = document.querySelectorAll('.btn-excluir');
    const botoesAcao = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-config');
    const botoesUsuarios = document.querySelectorAll('button[onclick*="Usuarios"]');
    
    switch(usuarioAtual.nivel) {
        case 'visualizador':
            botoesEditar.forEach(btn => btn.style.display = 'none');
            botoesExcluir.forEach(btn => btn.style.display = 'none');
            botoesAcao.forEach(btn => btn.style.display = 'none');
            break;
            
        case 'operador':
            botoesEditar.forEach(btn => btn.style.display = 'inline-block');
            botoesExcluir.forEach(btn => btn.style.display = 'inline-block');
            botoesUsuarios.forEach(btn => btn.style.display = 'none');
            break;
            
        case 'admin':
            botoesEditar.forEach(btn => btn.style.display = 'inline-block');
            botoesExcluir.forEach(btn => btn.style.display = 'inline-block');
            botoesAcao.forEach(btn => btn.style.display = 'inline-block');
            break;
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
    const modal = document.getElementById('modalUsuarios');
    if (modal) modal.style.display = 'block';
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
    
    const inputUsername = document.getElementById('novoUsername');
    const inputSenha = document.getElementById('novoSenha');
    
    if (inputUsername) inputUsername.value = '';
    if (inputSenha) inputSenha.value = '';
    
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
    const modal = document.getElementById('modalAlterarSenha');
    if (modal) modal.style.display = 'block';
}

function abrirModalPrimeiroAcesso() {
    const modal = document.getElementById('modalPrimeiroAcesso');
    if (modal) modal.style.display = 'block';
}

function alterarSenha(event) {
    event.preventDefault();
    
    if (!usuarioAtual) return;
    
    const senhaAtual = document.getElementById('senhaAtual')?.value;
    const novaSenha = document.getElementById('novaSenha')?.value;
    const confirmar = document.getElementById('confirmarSenha')?.value;
    
    if (!senhaAtual || !novaSenha || !confirmar) {
        alert('Preencha todos os campos!');
        return;
    }
    
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
    
    if (!usuarioAtual) return;
    
    const novaSenha = document.getElementById('primeiraNovaSenha')?.value;
    const confirmar = document.getElementById('primeiraConfirmarSenha')?.value;
    
    if (!novaSenha || !confirmar) {
        alert('Preencha todos os campos!');
        return;
    }
    
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
    
    try {
        const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
        return numero.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch (error) {
        console.error('Erro ao formatar moeda:', error);
        return '0,00';
    }
}

function converterParaNumero(valorString) {
    if (!valorString) return 0;
    
    try {
        const numeroLimpo = valorString.toString()
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();
        
        return parseFloat(numeroLimpo) || 0;
    } catch (error) {
        console.error('Erro ao converter número:', error);
        return 0;
    }
}

function salvarDados() {
    try {
        localStorage.setItem('painelFinanceiro', JSON.stringify(dados));
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

function atualizarInterface() {
    try {
        atualizarSaldos();
        atualizarFiltrosMeses();
        aplicarFiltrosAtuais();
        verificarDiferenca();
        gerarGraficos();
        atualizarResumoFiltro();
    } catch (error) {
        console.error('Erro ao atualizar interface:', error);
    }
}

function atualizarSaldos() {
    const combustivelEl = document.getElementById('saldoCombustivel');
    const pedagioEl = document.getElementById('saldoPedagio');
    const totalEl = document.getElementById('saldoTotalDisponivel');
    
    if (combustivelEl) {
        combustivelEl.textContent = formatarMoeda(dados.saldo?.combustivel || 0);
    }
    
    if (pedagioEl) {
        pedagioEl.textContent = formatarMoeda(dados.saldo?.pedagio || 0);
    }
    
    const totalDisponivel = (dados.saldo?.combustivel || 0) + (dados.saldo?.pedagio || 0);
    if (totalEl) {
        totalEl.textContent = formatarMoeda(totalDisponivel);
    }
}

function abrirModalBoleto() {
    const modal = document.getElementById('modalBoleto');
    if (modal) modal.style.display = 'block';
}

function abrirModalSaldo() {
    const combustivelInput = document.getElementById('saldoCombustivelInput');
    const pedagioInput = document.getElementById('saldoPedagioInput');
    const modal = document.getElementById('modalSaldo');
    
    if (combustivelInput) {
        combustivelInput.value = dados.saldo?.combustivel || 0;
    }
    
    if (pedagioInput) {
        pedagioInput.value = dados.saldo?.pedagio || 0;
    }
    
    if (modal) modal.style.display = 'block';
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function salvarBoleto(event) {
    event.preventDefault();
    
    try {
        const provedor = document.getElementById('provedor')?.value || '';
        const dataVencimento = document.getElementById('dataVencimento')?.value || '';
        const periodoInicio = document.getElementById('periodoInicio')?.value || '';
        const periodoFim = document.getElementById('periodoFim')?.value || '';
        const valorInput = document.getElementById('valor')?.value || '0';
        const tipoCobranca = document.getElementById('tipoCobranca')?.value || 'mensal';
        const observacoes = document.getElementById('observacoes')?.value || '';
        
        // Validar campos obrigatórios
        if (!provedor || !dataVencimento || !periodoInicio || !periodoFim) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }
        
        // Validar período
        if (new Date(periodoFim) < new Date(periodoInicio)) {
            alert('Data final não pode ser menor que data inicial!');
            return;
        }
        
        // Converter valor
        let valorNumerico = 0;
        if (valorInput.includes(',')) {
            valorNumerico = converterParaNumero(valorInput);
        } else {
            valorNumerico = parseFloat(valorInput) || 0;
        }
        
        if (valorNumerico <= 0) {
            alert('Digite um valor válido!');
            return;
        }
        
        const novoBoleto = {
            id: Date.now(),
            provedor: provedor,
            dataVencimento: dataVencimento,
            periodoInicio: periodoInicio,
            periodoFim: periodoFim,
            valor: valorNumerico,
            tipoCobranca: tipoCobranca,
            observacoes: observacoes,
            status: 'pendente',
            adiado: false,
            pagoParcial: false
        };
        
        if (!dados.boletos) dados.boletos = [];
        dados.boletos.push(novoBoleto);
        
        salvarDados();
        atualizarInterface();
        fecharModal('modalBoleto');
        
        // Limpar formulário
        const form = document.getElementById('formBoleto');
        if (form) form.reset();
        
        mostrarMensagemSucesso('Boleto adicionado!');
        
    } catch (error) {
        console.error('Erro ao salvar boleto:', error);
        alert('Erro ao salvar boleto!');
    }
}

function atualizarSaldo(event) {
    event.preventDefault();
    
    try {
        const combustivelInput = document.getElementById('saldoCombustivelInput')?.value || '0';
        const pedagioInput = document.getElementById('saldoPedagioInput')?.value || '0';
        
        let combustivelValor = 0;
        let pedagioValor = 0;
        
        if (combustivelInput.includes(',')) {
            combustivelValor = converterParaNumero(combustivelInput);
        } else {
            combustivelValor = parseFloat(combustivelInput) || 0;
        }
        
        if (pedagioInput.includes(',')) {
            pedagioValor = converterParaNumero(pedagioInput);
        } else {
            pedagioValor = parseFloat(pedagioInput) || 0;
        }
        
        dados.saldo = {
            combustivel: combustivelValor,
            pedagio: pedagioValor
        };
        
        salvarDados();
        atualizarInterface();
        fecharModal('modalSaldo');
        mostrarMensagemSucesso('Saldo atualizado!');
        
    } catch (error) {
        console.error('Erro ao atualizar saldo:', error);
        alert('Erro ao atualizar saldo!');
    }
}

// ============================================
// FUNÇÕES DE FILTRO MELHORADAS
// ============================================

function aplicarFiltrosAtuais() {
    const filtroMes = document.getElementById('filtroMes')?.value || 'todos';
    const filtroStatus = document.getElementById('filtroStatus')?.value || 'todos';
    const filtroBusca = document.getElementById('filtroBusca')?.value?.toLowerCase() || '';
    
    atualizarTabelaBoletos(filtroMes, filtroStatus, filtroBusca);
    atualizarResumoMensal(filtroMes);
}

function atualizarTabelaBoletos(mesFiltro = 'todos', statusFiltro = 'todos', buscaFiltro = '') {
    const tbody = document.getElementById('corpoTabela');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!dados.boletos || dados.boletos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 30px;">Nenhum boleto cadastrado</td></tr>';
        return;
    }
    
    // Aplicar todos os filtros
    let boletosFiltrados = dados.boletos.filter(boleto => {
        // Filtro por mês
        if (mesFiltro !== 'todos') {
            const [ano, mes] = mesFiltro.split('-');
            if (!boleto.dataVencimento) return false;
            
            try {
                const dataVenc = new Date(boleto.dataVencimento + 'T12:00:00');
                const anoVenc = dataVenc.getFullYear();
                const mesVenc = dataVenc.getMonth() + 1;
                
                if (anoVenc !== parseInt(ano) || mesVenc !== parseInt(mes)) {
                    return false;
                }
            } catch (e) {
                console.error('Erro ao processar data:', boleto.dataVencimento, e);
                return false;
            }
        }
        
        // Filtro por status
        if (statusFiltro !== 'todos') {
            if (boleto.status !== statusFiltro) {
                return false;
            }
        }
        
        // Filtro por busca (provedor)
        if (buscaFiltro) {
            if (!boleto.provedor || !boleto.provedor.toLowerCase().includes(buscaFiltro)) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log(`${boletosFiltrados.length} boletos encontrados após filtros`);
    
    // Ordenar por data de vencimento
    boletosFiltrados.sort((a, b) => {
        return new Date(a.dataVencimento) - new Date(b.dataVencimento);
    });
    
    // Popular tabela
    boletosFiltrados.forEach(boleto => {
        const tr = document.createElement('tr');
        
        const dataVencimento = boleto.dataVencimento ? new Date(boleto.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
        const periodoInicio = boleto.periodoInicio ? new Date(boleto.periodoInicio + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
        const periodoFim = boleto.periodoFim ? new Date(boleto.periodoFim + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
        const novaData = boleto.novaData ? new Date(boleto.novaData + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
        
        // Capitalizar status
        let statusTexto = boleto.status || 'pendente';
        statusTexto = statusTexto.charAt(0).toUpperCase() + statusTexto.slice(1);
        
        tr.innerHTML = `
            <td>${dataVencimento}</td>
            <td>${boleto.provedor || '-'}</td>
            <td>${periodoInicio}</td>
            <td>${periodoFim}</td>
            <td>R$ ${formatarMoeda(boleto.valor || 0)}</td>
            <td>${boleto.tipoCobranca || 'mensal'}</td>
            <td class="status-${boleto.status || 'pendente'}">${statusTexto}</td>
            <td>${boleto.adiado ? 'Sim' : 'Não'}</td>
            <td>${novaData}</td>
            <td>${boleto.novoValor ? 'R$ ' + formatarMoeda(boleto.novoValor) : '-'}</td>
            <td>${boleto.valorPago ? 'R$ ' + formatarMoeda(boleto.valorPago) : '-'}</td>
            <td>
                <button class="btn-editar" onclick="abrirModalDetalheBoleto(${boleto.id})">Editar</button>
                <button class="btn-excluir" onclick="excluirBoleto(${boleto.id})">Excluir</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Se não encontrou nenhum boleto nos filtros
    if (boletosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 30px;">Nenhum boleto encontrado com os filtros selecionados</td></tr>`;
    }
    
    // Atualizar resumo dos filtros
    atualizarResumoFiltro(boletosFiltrados);
    
    // Aplicar permissões se usuário estiver logado
    if (usuarioAtual) aplicarPermissoes();
}

function atualizarResumoFiltro(boletosFiltrados = null) {
    try {
        if (!boletosFiltrados) {
            const filtroMes = document.getElementById('filtroMes')?.value || 'todos';
            const filtroStatus = document.getElementById('filtroStatus')?.value || 'todos';
            const filtroBusca = document.getElementById('filtroBusca')?.value?.toLowerCase() || '';
            
            // Reaplicar filtros para pegar os boletos atuais
            boletosFiltrados = dados.boletos?.filter(boleto => {
                if (filtroMes !== 'todos') {
                    const [ano, mes] = filtroMes.split('-');
                    if (!boleto.dataVencimento) return false;
                    try {
                        const dataVenc = new Date(boleto.dataVencimento + 'T12:00:00');
                        const anoVenc = dataVenc.getFullYear();
                        const mesVenc = dataVenc.getMonth() + 1;
                        if (anoVenc !== parseInt(ano) || mesVenc !== parseInt(mes)) return false;
                    } catch (e) { return false; }
                }
                if (filtroStatus !== 'todos' && boleto.status !== filtroStatus) return false;
                if (filtroBusca && (!boleto.provedor || !boleto.provedor.toLowerCase().includes(filtroBusca))) return false;
                return true;
            }) || [];
        }
        
        const totalBoletos = boletosFiltrados.length;
        
        let totalPendente = 0;
        let totalPago = 0;
        
        boletosFiltrados.forEach(b => {
            if (b.status === 'pendente' || b.status === 'adiado') {
                totalPendente += b.novoValor || b.valor || 0;
            } else if (b.status === 'pago' || b.status === 'parcial') {
                totalPago += b.valorPago || b.valor || 0;
            }
        });
        
        const totalBoletosEl = document.getElementById('totalBoletosFiltrados');
        const totalPendenteEl = document.getElementById('totalPendenteFiltrado');
        const totalPagoEl = document.getElementById('totalPagoFiltrado');
        
        if (totalBoletosEl) totalBoletosEl.textContent = totalBoletos;
        if (totalPendenteEl) totalPendenteEl.textContent = `R$ ${formatarMoeda(totalPendente)}`;
        if (totalPagoEl) totalPagoEl.textContent = `R$ ${formatarMoeda(totalPago)}`;
        
    } catch (error) {
        console.error('Erro ao atualizar resumo do filtro:', error);
    }
}

function filtrarBoletos() {
    console.log('Filtrando boletos...');
    aplicarFiltrosAtuais();
}

function limparFiltros() {
    console.log('Limpando filtros...');
    
    const filtroMes = document.getElementById('filtroMes');
    const filtroStatus = document.getElementById('filtroStatus');
    const filtroBusca = document.getElementById('filtroBusca');
    
    if (filtroMes) filtroMes.value = 'todos';
    if (filtroStatus) filtroStatus.value = 'todos';
    if (filtroBusca) filtroBusca.value = '';
    
    aplicarFiltrosAtuais();
}

function excluirBoleto(id) {
    if (!usuarioAtual || usuarioAtual.nivel === 'visualizador') {
        alert('Sem permissão para excluir!');
        return;
    }
    
    if (confirm('Excluir este boleto?')) {
        dados.boletos = dados.boletos.filter(b => b.id !== id);
        salvarDados();
        atualizarInterface();
        mostrarMensagemSucesso('Boleto excluído!');
    }
}

function atualizarResumoMensal(mesFiltro = 'todos') {
    try {
        let valorPago = 0;
        let valorPendente = 0;
        
        if (!dados.boletos || dados.boletos.length === 0) {
            const pagoEl = document.getElementById('valorPagoMes');
            const pendenteEl = document.getElementById('valorPendenteMes');
            const totalEl = document.getElementById('totalMes');
            
            if (pagoEl) pagoEl.textContent = '0,00';
            if (pendenteEl) pendenteEl.textContent = '0,00';
            if (totalEl) totalEl.textContent = '0,00';
            return;
        }
        
        // Filtrar boletos por mês se necessário
        let boletosParaCalcular = dados.boletos;
        
        if (mesFiltro !== 'todos') {
            const [ano, mes] = mesFiltro.split('-');
            
            boletosParaCalcular = dados.boletos.filter(b => {
                if (!b.dataVencimento) return false;
                
                try {
                    const dataVenc = new Date(b.dataVencimento + 'T12:00:00');
                    const anoVenc = dataVenc.getFullYear();
                    const mesVenc = dataVenc.getMonth() + 1;
                    
                    return anoVenc === parseInt(ano) && mesVenc === parseInt(mes);
                } catch (e) {
                    return false;
                }
            });
        }
        
        // Calcular totais
        boletosParaCalcular.forEach(boleto => {
            if (boleto.status === 'pago' || boleto.status === 'parcial') {
                valorPago += boleto.valorPago || 0;
            } else if (boleto.status === 'pendente' || boleto.status === 'adiado') {
                valorPendente += boleto.novoValor || boleto.valor || 0;
            }
        });
        
        // Atualizar elementos na tela
        const pagoEl = document.getElementById('valorPagoMes');
        const pendenteEl = document.getElementById('valorPendenteMes');
        const totalEl = document.getElementById('totalMes');
        
        if (pagoEl) pagoEl.textContent = formatarMoeda(valorPago);
        if (pendenteEl) pendenteEl.textContent = formatarMoeda(valorPendente);
        if (totalEl) totalEl.textContent = formatarMoeda(valorPago + valorPendente);
        
        console.log(`Resumo - Mês: ${mesFiltro}, Pago: ${valorPago}, Pendente: ${valorPendente}`);
        
    } catch (error) {
        console.error('Erro ao atualizar resumo mensal:', error);
    }
}

function verificarDiferenca() {
    try {
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
    } catch (error) {
        console.error('Erro ao verificar diferença:', error);
    }
}

function atualizarFiltrosMeses() {
    try {
        const select = document.getElementById('filtroMes');
        if (!select) return;
        
        // Guardar valor selecionado atual
        const valorAtual = select.value;
        
        const meses = new Set();
        
        if (dados.boletos && dados.boletos.length > 0) {
            dados.boletos.forEach(boleto => {
                if (boleto.dataVencimento) {
                    try {
                        const data = new Date(boleto.dataVencimento + 'T12:00:00');
                        const ano = data.getFullYear();
                        const mes = data.getMonth() + 1;
                        meses.add(`${ano}-${String(mes).padStart(2, '0')}`);
                    } catch (e) {
                        console.warn('Data inválida:', boleto.dataVencimento);
                    }
                }
            });
        }
        
        // Limpar e recriar options
        select.innerHTML = '<option value="todos">📅 Todos os Meses</option>';
        
        // Ordenar meses do mais recente para o mais antigo
        Array.from(meses)
            .sort()
            .reverse()
            .forEach(mes => {
                const [ano, mesNum] = mes.split('-');
                const data = new Date(ano, mesNum - 1, 1);
                const option = document.createElement('option');
                option.value = mes;
                option.textContent = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                select.appendChild(option);
            });
        
        // Restaurar valor selecionado se possível
        if (valorAtual !== 'todos' && Array.from(meses).includes(valorAtual)) {
            select.value = valorAtual;
        } else {
            select.value = 'todos';
        }
        
        console.log('Filtros de mês atualizados. Opções:', Array.from(meses));
        
    } catch (error) {
        console.error('Erro ao atualizar filtros:', error);
    }
}

function gerarGraficos() {
    try {
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
                <h4>Distribuição de Recursos</h4>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                    <p><strong>Pendente:</strong> R$ ${formatarMoeda(totalPendente)}</p>
                    <p><strong>Disponível:</strong> R$ ${formatarMoeda(totalDisponivel)}</p>
                    <div style="width: 100%; height: 20px; background: #ddd; margin-top: 10px; border-radius: 10px; overflow: hidden;">
                        <div style="width: ${(totalPendente / (dados.limiteGlobal || 1)) * 100}%; height: 100%; background: #f0ad4e; float: left;"></div>
                        <div style="width: ${(totalDisponivel / (dados.limiteGlobal || 1)) * 100}%; height: 100%; background: #5cb85c; float: left;"></div>
                    </div>
                </div>
            `;
        }
        
        const graficoMensal = document.getElementById('graficoMensal');
        if (graficoMensal) {
            graficoMensal.innerHTML = `
                <h4>Resumo Rápido</h4>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                    <p>Total de boletos: ${dados.boletos?.length || 0}</p>
                    <p>Total pendente: R$ ${formatarMoeda(totalPendente)}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao gerar gráficos:', error);
    }
}

// ============================================
// FUNÇÕES DE EDIÇÃO DE BOLETOS (NOVAS E MELHORADAS)
// ============================================

function abrirModalDetalheBoleto(id) {
    console.log('Abrindo edição para boleto ID:', id);
    
    const boleto = dados.boletos.find(b => b.id === id);
    if (!boleto) {
        alert('Boleto não encontrado!');
        return;
    }
    
    // Preencher campos básicos
    const boletoId = document.getElementById('boletoId');
    const detalheProvedor = document.getElementById('detalheProvedor');
    const detalheDataVencimento = document.getElementById('detalheDataVencimento');
    const detalhePeriodoInicio = document.getElementById('detalhePeriodoInicio');
    const detalhePeriodoFim = document.getElementById('detalhePeriodoFim');
    const detalheValor = document.getElementById('detalheValor');
    const detalheTipoCobranca = document.getElementById('detalheTipoCobranca');
    const detalheObservacoes = document.getElementById('detalheObservacoes');
    const detalheStatus = document.getElementById('detalheStatus');
    const detalheNovaData = document.getElementById('detalheNovaData');
    const detalheNovoValor = document.getElementById('detalheNovoValor');
    const detalheValorPago = document.getElementById('detalheValorPago');
    
    if (boletoId) boletoId.value = boleto.id;
    if (detalheProvedor) detalheProvedor.value = boleto.provedor || '';
    if (detalheDataVencimento) detalheDataVencimento.value = boleto.dataVencimento || '';
    if (detalhePeriodoInicio) detalhePeriodoInicio.value = boleto.periodoInicio || '';
    if (detalhePeriodoFim) detalhePeriodoFim.value = boleto.periodoFim || '';
    if (detalheValor) detalheValor.value = boleto.valor || 0;
    if (detalheTipoCobranca) detalheTipoCobranca.value = boleto.tipoCobranca || 'mensal';
    if (detalheObservacoes) detalheObservacoes.value = boleto.observacoes || '';
    if (detalheStatus) detalheStatus.value = boleto.status || 'pendente';
    if (detalheNovaData) detalheNovaData.value = boleto.novaData || '';
    if (detalheNovoValor) detalheNovoValor.value = boleto.novoValor || '';
    if (detalheValorPago) detalheValorPago.value = boleto.valorPago || '';
    
    // Mostrar/esconder campos conforme status
    toggleCamposAdiados();
    
    const modal = document.getElementById('modalDetalheBoleto');
    if (modal) modal.style.display = 'block';
}

function atualizarBoleto(event) {
    event.preventDefault();
    
    console.log('Atualizando boleto...');
    
    try {
        const id = parseInt(document.getElementById('boletoId').value);
        const boletoIndex = dados.boletos.findIndex(b => b.id === id);
        
        if (boletoIndex === -1) {
            alert('Boleto não encontrado!');
            return;
        }
        
        // Capturar valores do formulário
        const provedor = document.getElementById('detalheProvedor').value;
        const dataVencimento = document.getElementById('detalheDataVencimento').value;
        const periodoInicio = document.getElementById('detalhePeriodoInicio').value;
        const periodoFim = document.getElementById('detalhePeriodoFim').value;
        const valor = parseFloat(document.getElementById('detalheValor').value) || 0;
        const tipoCobranca = document.getElementById('detalheTipoCobranca').value;
        const observacoes = document.getElementById('detalheObservacoes').value;
        const status = document.getElementById('detalheStatus').value;
        
        // Validar campos obrigatórios
        if (!provedor || !dataVencimento || !periodoInicio || !periodoFim) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }
        
        if (valor <= 0) {
            alert('Digite um valor válido!');
            return;
        }
        
        // Validar período
        if (new Date(periodoFim) < new Date(periodoInicio)) {
            alert('Data final não pode ser menor que data inicial!');
            return;
        }
        
        // Criar objeto atualizado
        const boletoAtualizado = {
            ...dados.boletos[boletoIndex],
            provedor,
            dataVencimento,
            periodoInicio,
            periodoFim,
            valor,
            tipoCobranca,
            observacoes,
            status
        };
        
        // Processar status específicos
        if (status === 'adiado') {
            const novaData = document.getElementById('detalheNovaData').value;
            const novoValor = parseFloat(document.getElementById('detalheNovoValor').value) || 0;
            
            if (!novaData) {
                alert('Informe a nova data de vencimento para o adiamento!');
                return;
            }
            
            boletoAtualizado.adiado = true;
            boletoAtualizado.novaData = novaData;
            boletoAtualizado.novoValor = novoValor > 0 ? novoValor : valor;
            boletoAtualizado.valorPago = 0;
            
            // Remover campos de outros status
            delete boletoAtualizado.valorPago;
            
        } else if (status === 'parcial') {
            const valorPago = parseFloat(document.getElementById('detalheValorPago').value) || 0;
            
            if (valorPago <= 0) {
                alert('Informe o valor pago!');
                return;
            }
            
            if (valorPago > valor) {
                alert('Valor pago não pode ser maior que o valor total!');
                return;
            }
            
            boletoAtualizado.adiado = false;
            boletoAtualizado.valorPago = valorPago;
            
            // Remover campos de adiamento
            delete boletoAtualizado.novaData;
            delete boletoAtualizado.novoValor;
            
        } else if (status === 'pago') {
            boletoAtualizado.adiado = false;
            boletoAtualizado.valorPago = valor;
            
            // Remover campos de adiamento
            delete boletoAtualizado.novaData;
            delete boletoAtualizado.novoValor;
            
        } else { // pendente
            boletoAtualizado.adiado = false;
            
            // Remover todos os campos especiais
            delete boletoAtualizado.novaData;
            delete boletoAtualizado.novoValor;
            delete boletoAtualizado.valorPago;
        }
        
        // Atualizar o boleto no array
        dados.boletos[boletoIndex] = boletoAtualizado;
        
        // Salvar no localStorage
        salvarDados();
        
        // Atualizar interface
        atualizarInterface();
        
        // Fechar modal
        fecharModal('modalDetalheBoleto');
        
        // Mostrar mensagem de sucesso
        mostrarMensagemSucesso('Boleto atualizado com sucesso!');
        
        console.log('Boleto atualizado:', boletoAtualizado);
        
    } catch (error) {
        console.error('Erro ao atualizar boleto:', error);
        alert('Erro ao atualizar boleto: ' + error.message);
    }
}

function toggleCamposAdiados() {
    const status = document.getElementById('detalheStatus')?.value;
    const camposAdiados = document.getElementById('camposAdiados');
    const camposParcial = document.getElementById('camposParcial');
    
    console.log('Toggle campos para status:', status);
    
    // Esconder todos primeiro
    if (camposAdiados) camposAdiados.style.display = 'none';
    if (camposParcial) camposParcial.style.display = 'none';
    
    // Mostrar campos específicos
    if (status === 'adiado' && camposAdiados) {
        camposAdiados.style.display = 'block';
    } else if (status === 'parcial' && camposParcial) {
        camposParcial.style.display = 'block';
    }
}

function exportarDados() {
    try {
        const dadosString = JSON.stringify(dados, null, 2);
        const blob = new Blob([dadosString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `painel-financeiro-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        mostrarMensagemSucesso('Dados exportados!');
    } catch (error) {
        console.error('Erro ao exportar:', error);
        alert('Erro ao exportar dados!');
    }
}

// Fechar modal clicando fora
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}