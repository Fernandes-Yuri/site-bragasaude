/* Verificação do APK sempre vem do gateway; falha não mantém um hash antigo. */
(function () {
  function loadMetadata() {
    var hashes = ['apk-sha256-hash', 'modal-apk-sha256'].map(function (id) { return document.getElementById(id); });
    var buttons = ['btn-copy-hash', 'modal-btn-copy-hash'].map(function (id) { return document.getElementById(id); });
    hashes.forEach(function (element) { if (element) element.textContent = 'Carregando verificação...'; });
    buttons.forEach(function (button) { if (button) button.disabled = true; });
    fetch('https://api.bragasaude.online/api/app/latest', { cache: 'no-store' })
      .then(function (response) { if (!response.ok) throw new Error('Metadados indisponíveis'); return response.json(); })
      .then(function (data) {
        if (!data || !/^[a-f0-9]{64}$/i.test(data.sha256_hash || '') || !/^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(data.version_name || '')) throw new Error('Metadados inválidos');
        hashes.forEach(function (element) { if (element) element.textContent = data.sha256_hash; });
        buttons.forEach(function (button) { if (button) button.disabled = false; });
        document.querySelectorAll('[data-braga-version]').forEach(function (element) { element.textContent = data.version_name; });
        var node = document.getElementById('braga-ldjson');
        if (node) {
          var ld = JSON.parse(node.textContent);
          (ld['@graph'] || [ld]).forEach(function (item) {
            if (item && item['@type'] === 'SoftwareApplication') item.softwareVersion = data.version_name.replace(/^v/, '');
          });
          node.textContent = JSON.stringify(ld);
        }
      })
      .catch(function () {
        hashes.forEach(function (element) { if (element) element.textContent = 'Verificação indisponível. Tente novamente.'; });
        buttons.forEach(function (button) { if (button) button.disabled = true; });
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadMetadata);
  else loadMetadata();
})();
