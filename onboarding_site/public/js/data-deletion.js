/* The request stays in the browser until the person sends the prepared email. */
(function () {
  'use strict';
  var form = document.getElementById('deletion-form');
  var scope = document.getElementById('request-scope');
  var details = document.getElementById('request-details');
  var review = document.getElementById('request-review');
  var message = document.getElementById('request-message');
  var status = document.getElementById('request-status');
  var recipient = 'contato@bragasaude.online';
  var subject = 'Solicitação de exclusão de dados - Braga Saúde';
  function invalidate() {
    review.hidden = true;
    message.value = '';
    document.getElementById('send-email').setAttribute('href', 'mailto:' + recipient);
  }
  scope.addEventListener('change', function () {
    details.required = scope.value === 'specific';
    document.getElementById('details-label').textContent = details.required ? '*' : '(opcional)';
  });
  form.addEventListener('input', invalidate);
  form.addEventListener('change', invalidate);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var account = form.elements.account.value.trim();
    if (!account || (details.required && !details.value.trim())) {
      if (!account) { form.elements.account.focus(); return; }
      details.focus(); return;
    }
    var labels = {
      account: 'Excluir minha conta e os dados pessoais associados',
      meta: 'Excluir os dados vinculados ao acesso pelo Facebook / Meta',
      specific: 'Excluir apenas dados específicos e manter a conta'
    };
    var body = [
      'Olá, equipe de privacidade do Braga Saúde.', '',
      'Solicito a análise do seguinte pedido de exclusão:', '',
      'Nome: ' + (form.elements.name.value.trim() || 'Não informado'),
      'E-mail ou telefone usado na conta: ' + account,
      'E-mail para resposta: ' + form.elements.reply.value.trim(),
      'Forma de acesso: ' + form.elements.login.value,
      'Tipo de solicitação: ' + labels[scope.value],
      'Dados específicos ou observações: ' + (details.value.trim() || 'Sem observações adicionais.'), '',
      'Confirmo que sou titular da conta. Entendo que a equipe verificará minha identidade e o alcance do pedido antes de executar a exclusão.',
      'Por favor, confirme o recebimento e informe os próximos passos.'
    ].join('\n');
    message.value = body;
    document.getElementById('send-email').href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    status.textContent = 'Seu pedido ainda não foi enviado. Abra seu e-mail, confira a mensagem e envie. Se não abrir, copie a mensagem e envie para ' + recipient + '.';
    review.hidden = false;
    review.focus();
  });
  document.getElementById('copy-request').addEventListener('click', function () {
    var text = 'Destinatário: ' + recipient + '\nAssunto: ' + subject + '\n\n' + message.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        status.textContent = 'Mensagem copiada. Cole no seu e-mail e envie para ' + recipient + '. O pedido ainda não foi enviado.';
      }, selectMessage);
    } else selectMessage();
  });
  function selectMessage() {
    message.focus(); message.select();
    status.textContent = 'Selecione e copie o texto acima. Envie para ' + recipient + ' com o assunto “' + subject + '”. O pedido ainda não foi enviado.';
  }
}());
