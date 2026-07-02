document.addEventListener('DOMContentLoaded', function() {

  // ==========================================================================
  // Trava o envio ao apertar Enter
  // ==========================================================================
  const meuForm = document.getElementById('meuFormulario');
  if (meuForm) {
    meuForm.addEventListener('keydown', function(evento) {
      if (evento.key === 'Enter') {
        evento.preventDefault();
      }
    });
  }

  // ==========================================================================
  // MÁSCARAS DE INPUT (CPF/CNPJ e Telefone)
  // ==========================================================================
  const inputCnpj = document.getElementById('f-cnpj');
  if (inputCnpj) {
    inputCnpj.addEventListener('input', function(e) {
      let v = e.target.value.replace(/\D/g, ""); 
      if (v.length <= 11) { 
        v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      } else { 
        v = v.substring(0, 14).replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
      }
      e.target.value = v;
    });
  }

  const inputContato = document.getElementById('f-contato');
  if (inputContato) {
    inputContato.addEventListener('input', function(e) {
      let v = e.target.value.replace(/\D/g, "").substring(0, 11);
      if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, "($1) $2");
      if (v.length > 7) v = (v.length === 11) ? v.replace(/(\d{5})(\d{4})$/, "$1-$2") : v.replace(/(\d{4})(\d{4})$/, "$1-$2");
      e.target.value = v;
    });
  }

  // ==========================================================================
  // ADICIONAR E REMOVER PRODUTOS DINAMICAMENTE
  // ==========================================================================
  const btnAddProd = document.getElementById('btn-add-produto');
  if (btnAddProd) {
    btnAddProd.addEventListener('click', function() {
      let lista = document.getElementById('lista-produtos-formulario');
      if (!lista) return;

      let novoItem = document.createElement('div');
      novoItem.className = 'produto-item-form form-grid'; 
      novoItem.innerHTML = `
        <div class="form-grupo" style="grid-column: span 2;">
          <label>Nome do Produto</label>
          <input type="text" class="f-produto" placeholder="Nome do outro produto" required>
        </div>
        <div class="form-grupo">
          <label>Quantidade</label>
          <input type="number" class="f-qtd" value="1" min="1" step="1" required>
        </div>
        <div class="form-grupo">
          <label>Valor Unitário (R$)</label>
          <input type="number" class="f-valor" value="0.00" step="0.01" required>
        </div>
        <button type="button" class="btn-remover-prod"><i class="fa-solid fa-trash"></i></button>
      `;
      lista.appendChild(novoItem);
      novoItem.querySelector('.btn-remover-prod').addEventListener('click', () => novoItem.remove());
    });
  }

  // ==========================================================================
  // FUNÇÃO PARA CALCULAR O PRÓXIMO NÚMERO DE NOTA FISCAL
  // ==========================================================================
  function atualizarProximoNumeroNota() {
    let historico = [];
    try {
      historico = JSON.parse(localStorage.getItem('smartnfe_db')) || [];
    } catch(e) {
      historico = [];
    }
    let proximoNumero = historico.length + 1;
    
    let numeroFormatado = String(proximoNumero).padStart(6, '0');
    numeroFormatado = numeroFormatado.substring(0, 3) + '.' + numeroFormatado.substring(3);
    
    const campoNumero = document.getElementById('n-numero');
    if (campoNumero) {
      // Se for um input (tela de edição), muda o value. Se for texto puro, muda o innerText
      if (campoNumero.tagName === 'INPUT') {
        campoNumero.value = numeroFormatado;
      } else {
        campoNumero.innerText = numeroFormatado;
      }
    }
  }

  // ==========================================================================
  // LÓGICA DO HISTÓRICO (LOCALSTORAGE)
  // ==========================================================================
  function renderizarHistorico() {
    const listaHTML = document.getElementById('lista-historico');
    if (!listaHTML) return;
    
    let historico = [];
    try {
      historico = JSON.parse(localStorage.getItem('smartnfe_db')) || [];
    } catch(e) {
      historico = [];
    }
    
    listaHTML.innerHTML = historico.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:#94A3B8; padding:15px;">Nenhuma nota fiscal gerada ainda.</td></tr>' : '';
    
    historico.forEach((nota, i) => {
      let tr = document.createElement('tr');
      tr.style.borderBottom = "1px solid #E5E7EB";
      tr.innerHTML = `
        <td style="padding: 10px;">${nota.data} ${nota.hora}</td>
        <td style="padding: 10px;"><strong>${nota.cliente}</strong></td>
        <td style="padding: 10px;">R$ ${parseFloat(nota.total || 0).toFixed(2).replace('.', ',')}</td>
        <td style="padding: 10px;">
          <button type="button" class="btn-ver-historico" data-index="${i}" style="background:#10B981; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Ver</button>
          <button type="button" class="btn-deletar-historico" data-index="${i}" style="background:#EF4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-left:5px;">X</button>
        </td>
      `;
      listaHTML.appendChild(tr);
    });
  }

  document.addEventListener('click', function(e) {
    let historico = JSON.parse(localStorage.getItem('smartnfe_db')) || [];
    
    if (e.target.classList.contains('btn-deletar-historico')) {
      historico.splice(e.target.dataset.index, 1);
      localStorage.setItem('smartnfe_db', JSON.stringify(historico));
      renderizarHistorico();
      atualizarProximoNumeroNota();
    }
    
    if (e.target.classList.contains('btn-ver-historico')) {
      mostrarNotaMontada(historico[e.target.dataset.index]);
    }
  });

  // ==========================================================================
  // PROCESSAMENTO DO FORMULÁRIO E EMISSÃO DA NOTA
  // ==========================================================================
  if (meuForm) {
    meuForm.addEventListener('submit', function(evento) {
      evento.preventDefault();

      // TRAVA DE SEGURANÇA: Impede o envio se os campos obrigatórios estiverem vazios
      let elCnpj = document.getElementById('f-cnpj');
      let elContato = document.getElementById('f-contato');
      let cnpjVal = elCnpj ? elCnpj.value.trim() : "";
      let contatoVal = elContato ? elContato.value.trim() : "";
      
      if (!cnpjVal || !contatoVal) {
        alert("⚠️ Por favor, preencha o CPF/CNPJ e o Telefone antes de gerar a nota!");
        return;
      }

      let valorFrete = parseFloat(document.getElementById('f-frete')?.value) || 0;
      let valorDesconto = parseFloat(document.getElementById('f-desconto')?.value) || 0;
      let subtotalGeralProdutos = 0;
      let produtosCarregados = [];

      document.querySelectorAll('.produto-item-form').forEach(produtoElemento => {
        let nomeProd = produtoElemento.querySelector('.f-produto')?.value || "";
        let qtdProd = parseInt(produtoElemento.querySelector('.f-qtd')?.value) || 0;
        let valUnitProd = parseFloat(produtoElemento.querySelector('.f-valor')?.value) || 0;
        subtotalGeralProdutos += (qtdProd * valUnitProd);
        
        produtosCarregados.push({ nome: nomeProd, qtd: qtdProd, valor: valUnitProd });
      });

      let valorTotalNota = (subtotalGeralProdutos + valorFrete) - valorDesconto;
      let agora = new Date();

      // GERA CHAVE DE ACESSO ÚNICA
      let chaveNumeros = "";
      for (let i = 0; i < 44; i++) {
        chaveNumeros += Math.floor(Math.random() * 10);
      }
      let chaveFormatada = chaveNumeros.match(/.{1,4}/g).join(' ');

      // PEGA O NÚMERO ATUAL EXIBIDO NO FORMULÁRIO
      let elNumero = document.getElementById('n-numero');
      let numeroAtualNota = elNumero ? (elNumero.value || elNumero.innerText) : "000.001";

      let novaNota = {
        numero: numeroAtualNota,
        chave: chaveFormatada,
        cliente: document.getElementById('f-nome')?.value || "",
        cnpj: cnpjVal,
        endereco: document.getElementById('f-endereco')?.value || "",
        contato: contatoVal,
        produtos: produtosCarregados,
        subtotal: subtotalGeralProdutos,
        frete: valorFrete,
        desconto: valorDesconto,
        total: valorTotalNota,
        data: agora.toLocaleDateString('pt-BR'),
        hora: agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
      };

      let historico = JSON.parse(localStorage.getItem('smartnfe_db')) || [];
      historico.push(novaNota);
      localStorage.setItem('smartnfe_db', JSON.stringify(historico));
      
      renderizarHistorico();
      mostrarNotaMontada(novaNota);
    });
  }

  function mostrarNotaMontada(dados) {
    let elNumero = document.getElementById('n-numero');
    if (elNumero) {
      if (elNumero.tagName === 'INPUT') elNumero.value = dados.numero;
      else elNumero.innerText = dados.numero;
    }
    
    const containerChave = document.querySelector('.chave-container input');
    if (containerChave) {
      containerChave.value = dados.chave;
    }

    if(document.getElementById('n-nome')) document.getElementById('n-nome').value = dados.cliente;
    if(document.getElementById('n-cnpj')) document.getElementById('n-cnpj').value = dados.cnpj;
    if(document.getElementById('n-endereco')) document.getElementById('n-endereco').value = dados.endereco;
    if(document.getElementById('n-contato')) document.getElementById('n-contato').value = dados.contato;
    if(document.getElementById('n-data')) document.getElementById('n-data').value = dados.data;
    if(document.getElementById('n-hora')) document.getElementById('n-hora').value = dados.hora;

    if(document.getElementById('subtotal-produtos')) document.getElementById('subtotal-produtos').innerText = "R$ " + dados.subtotal.toFixed(2).replace('.', ',');
    if(document.getElementById('n-frete-print')) document.getElementById('n-frete-print').innerText = "R$ " + dados.frete.toFixed(2).replace('.', ',');
    if(document.getElementById('n-desconto-print')) document.getElementById('n-desconto-print').innerText = "R$ " + dados.desconto.toFixed(2).replace('.', ',');
    if(document.getElementById('valor-final-nota')) document.getElementById('valor-final-nota').innerText = "R$ " + dados.total.toFixed(2).replace('.', ',');

    let baseTexto = "R$ " + dados.total.toFixed(2).replace('.', ',');
    if(document.getElementById('imp-icms-base')) document.getElementById('imp-icms-base').value = baseTexto;
    if(document.getElementById('imp-icms-val')) document.getElementById('imp-icms-val').value = "R$ " + (dados.total * 0.18).toFixed(2).replace('.', ',');
    if(document.getElementById('imp-ipi-base')) document.getElementById('imp-ipi-base').value = baseTexto;
    if(document.getElementById('imp-ipi-val')) document.getElementById('imp-ipi-val').value = "R$ 0,00";
    if(document.getElementById('imp-pis-val')) document.getElementById('imp-pis-val').value = "R$ " + (dados.total * 0.0165).toFixed(2).replace('.', ',');
    if(document.getElementById('imp-cofins-val')) document.getElementById('imp-cofins-val').value = "R$ " + (dados.total * 0.076).toFixed(2).replace('.', ',');

    let tabelaNota = document.getElementById('corpo-tabela-produtos');
    if (tabelaNota) {
      tabelaNota.innerHTML = "";
      dados.produtos.forEach((prod, idx) => {
        let linha = document.createElement('tr');
        linha.innerHTML = `
          <td>${idx + 1}</td>
          <td><input type="text" value="${prod.nome}" class="n-edit-nome"></td>
          <td><input type="number" value="${prod.qtd}" style="text-align: center;" class="n-edit-qtd" min="0"></td>
          <td><input type="number" value="${prod.valor.toFixed(2)}" style="text-align: right;" class="n-edit-valor" step="0.01"></td>
          <td><span class="total-item-txt" style="display: block; text-align: right;">R$ ${(prod.qtd * prod.valor).toFixed(2).replace('.', ',')}</span></td>
        `;
        tabelaNota.appendChild(linha);
      });

      const recalcularTabelaNota = () => {
        let novoSubtotal = 0;
        
        document.querySelectorAll('#corpo-tabela-produtos tr').forEach(linhaProd => {
          let qtd = parseFloat(linhaProd.querySelector('.n-edit-qtd').value) || 0;
          let valor = parseFloat(linhaProd.querySelector('.n-edit-valor').value) || 0;
          let totalItem = qtd * valor;
          novoSubtotal += totalItem;
          
          linhaProd.querySelector('.total-item-txt').innerText = "R$ " + totalItem.toFixed(2).replace('.', ',');
        });

        if(document.getElementById('subtotal-produtos')) document.getElementById('subtotal-produtos').innerText = "R$ " + novoSubtotal.toFixed(2).replace('.', ',');
        
        let totalFinal = (novoSubtotal + dados.frete) - dados.desconto;
        if(document.getElementById('valor-final-nota')) document.getElementById('valor-final-nota').innerText = "R$ " + totalFinal.toFixed(2).replace('.', ',');

        let baseTexto = "R$ " + totalFinal.toFixed(2).replace('.', ',');
        if(document.getElementById('imp-icms-base')) document.getElementById('imp-icms-base').value = baseTexto;
        if(document.getElementById('imp-icms-val')) document.getElementById('imp-icms-val').value = "R$ " + (totalFinal * 0.18).toFixed(2).replace('.', ',');
        if(document.getElementById('imp-ipi-base')) document.getElementById('imp-ipi-base').value = baseTexto;
        if(document.getElementById('imp-pis-val')) document.getElementById('imp-pis-val').value = "R$ " + (totalFinal * 0.0165).toFixed(2).replace('.', ',');
        if(document.getElementById('imp-cofins-val')) document.getElementById('imp-cofins-val').value = "R$ " + (totalFinal * 0.076).toFixed(2).replace('.', ',');
        
        let chaveSemEspacos = dados.chave.replace(/\s/g, "");
        let dadosQrCode = `ChaveNFe:${chaveSemEspacos}|ValorTotal:R$${totalFinal.toFixed(2)}`;
        if(document.getElementById('n-qrcode')) {
          document.getElementById('n-qrcode').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(dadosQrCode)}`;
        }
      };

      tabelaNota.querySelectorAll('.n-edit-qtd, .n-edit-valor').forEach(input => {
        input.addEventListener('input', recalcularTabelaNota);
      });
    }

    let chaveSemEspacos = dados.chave.replace(/\s/g, "");
    let dadosQrCode = `ChaveNFe:${chaveSemEspacos}|ValorTotal:R$${dados.total.toFixed(2)}`;
    if(document.getElementById('n-qrcode')) {
      document.getElementById('n-qrcode').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(dadosQrCode)}`;
    }

    if(document.getElementById('tela-formulario')) document.getElementById('tela-formulario').style.display = 'none';
    if(document.getElementById('secao-historico')) document.getElementById('secao-historico').style.display = 'none';
    if(document.getElementById('tela-nota')) document.getElementById('tela-nota').style.display = 'block';
  }

  // ==========================================================================
  // BOTÃO VOLTAR (Com limpeza automática de campos e produtos)
  // ==========================================================================
  const btnVoltarForm = document.getElementById('btn-voltar-form');
  if (btnVoltarForm) {
    btnVoltarForm.addEventListener('click', function() {
      if(meuForm) meuForm.reset();

      const todosOsProdutos = document.querySelectorAll('.produto-item-form');
      todosOsProdutos.forEach((item, index) => {
        if (index > 0) {
          item.remove();
        } else {
          let pNome = item.querySelector('.f-produto');
          let pQtd = item.querySelector('.f-qtd');
          let pVal = item.querySelector('.f-valor');
          if(pNome) pNome.value = "";
          if(pQtd) pQtd.value = "1";
          if(pVal) pVal.value = "2500.00";
        }
      });

      if(document.getElementById('tela-nota')) document.getElementById('tela-nota').style.display = 'none';
      if(document.getElementById('tela-formulario')) document.getElementById('tela-formulario').style.display = 'block';
      if(document.getElementById('secao-historico')) document.getElementById('secao-historico').style.display = 'block';
      
      atualizarProximoNumeroNota(); 
    });
  }

  // ==========================================================================
  // FUNÇÃO PARA GERAR E BAIXAR O ARQUIVO XML
  // ==========================================================================
  const btnBaixarXml = document.getElementById('btn-baixar-xml');
  if (btnBaixarXml) {
    btnBaixarXml.addEventListener('click', function() {
      const nomeCliente = document.getElementById('n-nome')?.value || "";
      const cnpjCliente = document.getElementById('n-cnpj')?.value || "";
      const dataEmissao = document.getElementById('n-data')?.value || "";
      const horaEmissao = document.getElementById('n-hora')?.value || "";
      
      let elNumero = document.getElementById('n-numero');
      const numeroNota = elNumero ? (elNumero.value || elNumero.innerText || "000001") : "000001";
      
      const valorTotal = document.getElementById('valor-final-nota')?.innerText.replace('R$ ', '') || "0,00";
      
      const inputChave = document.querySelector('.chave-container input');
      const chaveAcesso = inputChave ? inputChave.value.replace(/\s/g, "") : "00000000000000000000000000000000000000000000";

      let xmlTexto = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xmlTexto += `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">\n`;
      xmlTexto += `  <NFe>\n`;
      xmlTexto += `    <infNFe id="NFe${chaveAcesso}" versao="4.00">\n`;
      xmlTexto += `      <ide>\n`;
      xmlTexto += `        <cNF>12345678</cNF>\n`;
      xmlTexto += `        <natOp>Venda de mercadoria ou servico</natOp>\n`;
      xmlTexto += `        <mod>55</mod>\n`;
      xmlTexto += `        <serie>1</serie>\n`;
      xmlTexto += `        <nNF>${numeroNota.replace('.', '')}</nNF>\n`;
      xmlTexto += `        <dhEmi>${dataEmissao}T${horaEmissao}:00-03:00</dhEmi>\n`;
      xmlTexto += `      </ide>\n`;
      xmlTexto += `      <emit>\n`;
      xmlTexto += `        <CNPJ>00000000000000</CNPJ>\n`;
      xmlTexto += `        <xNome>Sua Empresa LTDA</xNome>\n`;
      xmlTexto += `      </emit>\n`;
      xmlTexto += `      <dest>\n`;
      xmlTexto += `        <CNPJ_CPF>${cnpjCliente.replace(/\D/g, '')}</CNPJ_CPF>\n`;
      xmlTexto += `        <xNome>${nomeCliente}</xNome>\n`;
      xmlTexto += `      </dest>\n`;
      
      xmlTexto += `      <detalhe_produtos>\n`;
      document.querySelectorAll('#corpo-tabela-produtos tr').forEach((linhaProd, idx) => {
        let nomeProd = linhaProd.querySelector('.n-edit-nome')?.value || "";
        let qtd = linhaProd.querySelector('.n-edit-qtd')?.value || "0";
        let valor = linhaProd.querySelector('.n-edit-valor')?.value || "0";
        let totalItem = (parseFloat(qtd) * parseFloat(valor)).toFixed(2);

        xmlTexto += `        <prod id="${idx + 1}">\n`;
        xmlTexto += `          <xProd>${nomeProd}</xProd>\n`;
        xmlTexto += `          <qCom>${qtd}</qCom>\n`;
        xmlTexto += `          <vUnCom>${valor}</vUnCom>\n`;
        xmlTexto += `          <vProd>${totalItem}</vProd>\n`;
        xmlTexto += `        </prod>\n`;
      });
      xmlTexto += `      </detalhe_produtos>\n`;

      xmlTexto += `      <total>\n`;
      xmlTexto += `        <vNF>${valorTotal}</vNF>\n`;
      xmlTexto += `      </total>\n`;
      xmlTexto += `    </infNFe>\n`;
      xmlTexto += `  </NFe>\n`;
      xmlTexto += `</nfeProc>`;

      const blob = new Blob([xmlTexto], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const linkDownload = document.createElement('a');
      linkDownload.href = url;
      linkDownload.download = `NFe_Numero_${numeroNota.replace('.', '')}.xml`;
      
      document.body.appendChild(linkDownload);
      linkDownload.click();
      document.body.removeChild(linkDownload);
      URL.revokeObjectURL(url);
    });
  }

  // Inicializadores de segurança
  atualizarProximoNumeroNota();
  renderizarHistorico();
// ==========================================================================
  // LÓGICA DO INTERRUPTOR DARK MODE
  // ==========================================================================
  const btnDarkMode = document.getElementById('btn-dark-mode');
  if (btnDarkMode) {
    // Verifica se o usuário já usava o modo escuro antes
    if (localStorage.getItem('smartnfe_theme') === 'dark') {
      document.body.classList.add('dark-theme');
      btnDarkMode.innerHTML = '<i class="fa-solid fa-sun"></i> Modo Claro';
      btnDarkMode.style.backgroundColor = '#E2E8F0';
      btnDarkMode.style.color = '#0F172A';
    }

    btnDarkMode.addEventListener('click', function() {
      document.body.classList.toggle('dark-theme');
      
      if (document.body.classList.contains('dark-theme')) {
        localStorage.setItem('smartnfe_theme', 'dark');
        btnDarkMode.innerHTML = '<i class="fa-solid fa-sun"></i> Modo Claro';
        btnDarkMode.style.backgroundColor = '#E2E8F0';
        btnDarkMode.style.color = '#0F172A';
      } else {
        localStorage.setItem('smartnfe_theme', 'light');
        btnDarkMode.innerHTML = '<i class="fa-solid fa-moon"></i> Modo Escuro';
        btnDarkMode.style.backgroundColor = '#64748B';
        btnDarkMode.style.color = 'white';
      }
    });
  }
});
