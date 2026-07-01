document.getElementById('meuFormulario').addEventListener('submit', function(evento) {
  // Evita que a página recarregue ao enviar o formulário
  evento.preventDefault();

  // 1. Coletar os dados digitados no formulário
  let nomeCliente = document.getElementById('f-nome').value;
  let cnpjCliente = document.getElementById('f-cnpj').value;
  let enderecoCliente = document.getElementById('f-endereco').value;
  let contatoCliente = document.getElementById('f-contato').value;

  let nomeProduto = document.getElementById('f-produto').value;
  let qtdProduto = parseInt(document.getElementById('f-qtd').value) || 0;
  let valorUnitario = parseFloat(document.getElementById('f-valor').value) || 0;

  let valorFrete = parseFloat(document.getElementById('f-frete').value) || 0;
  let valorDesconto = parseFloat(document.getElementById('f-desconto').value) || 0;

  // 2. Fazer as contas matemáticas básicas
  let totalProduto = qtdProduto * valorUnitario;
  let subtotalGeral = totalProduto; // Caso queira expandir para mais itens depois
  let valorTotalNota = (subtotalGeral + valorFrete) - valorDesconto;

  // 3. Injetar as informações dentro do layout da Nota Fiscal
  document.getElementById('n-nome').value = nomeCliente;
  document.getElementById('n-cnpj').value = cnpjCliente;
  document.getElementById('n-endereco').value = enderecoCliente;
  document.getElementById('n-contato').value = contatoCliente;

  document.getElementById('n-produto-nome').value = nomeProduto;
  document.getElementById('n-produto-qtd').value = qtdProduto;
  document.getElementById('n-produto-valor').value = valorUnitario.toFixed(2);
  document.getElementById('n-produto-total').innerText = "R$ " + totalProduto.toFixed(2).replace('.', ',');

  document.getElementById('subtotal-produtos').innerText = "R$ " + subtotalGeral.toFixed(2).replace('.', ',');
  document.getElementById('n-frete').value = valorFrete.toFixed(2);
  document.getElementById('n-desconto').value = valorDesconto.toFixed(2);
  document.getElementById('valor-final-nota').innerText = "R$ " + valorTotalNota.toFixed(2).replace('.', ',');

  // 4. Calcular e injetar os Impostos de forma automática
  let baseTexto = "R$ " + subtotalGeral.toFixed(2).replace('.', ',');
  
  let valIcms = subtotalGeral * 0.18;
  let valIpi = subtotalGeral * 0.00;
  let valPis = subtotalGeral * 0.0165;
  let valCofins = subtotalGeral * 0.076;

  document.getElementById('imp-icms-base').value = baseTexto;
  document.getElementById('imp-icms-val').value = "R$ " + valIcms.toFixed(2).replace('.', ',');
  
  document.getElementById('imp-ipi-base').value = baseTexto;
  document.getElementById('imp-ipi-val').value = "R$ " + valIpi.toFixed(2).replace('.', ',');
  
  document.getElementById('imp-pis-val').value = "R$ " + valPis.toFixed(2).replace('.', ',');
  document.getElementById('imp-cofins-val').value = "R$ " + valCofins.toFixed(2).replace('.', ',');

  // 5. Inserir a data e hora do momento exato da emissão
  let agora = new Date();
  document.getElementById('n-data').value = agora.toLocaleDateString('pt-BR');
  document.getElementById('n-hora').value = agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

  // 6. Transição de telas: Esconder o formulário e mostrar a nota fiscal gerada
  document.getElementById('tela-formulario').style.display = 'none';
  document.getElementById('tela-nota').style.display = 'block';
});