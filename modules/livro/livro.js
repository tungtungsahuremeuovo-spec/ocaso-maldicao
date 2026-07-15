export function init() {
    const embed = document.getElementById('pdfEmbed');
    const fallback = document.getElementById('pdfFallback');
    if (!embed) return;

    // Obtém a URL base a partir do próprio script (import.meta.url)
    // Ex: https://tungtungsahuremeuovo-spec.github.io/ocaso-maldicao/modules/livro/livro.js
    const scriptUrl = import.meta.url;
    // Remove '/modules/livro/livro.js' para chegar na raiz do projeto
    const basePath = scriptUrl.substring(0, scriptUrl.lastIndexOf('/modules/'));
    const pdfUrl = basePath + '/assets/pdf/livro.pdf';

    console.log('📖 PDF URL:', pdfUrl);
    embed.src = pdfUrl;

    // Se o PDF não carregar, mostra fallback
    embed.addEventListener('error', () => {
        console.warn('❌ PDF não encontrado em:', pdfUrl);
        embed.style.display = 'none';
        fallback.style.display = 'block';
    });

    // Timeout de segurança: se após 5 segundos o embed ainda estiver vazio, mostra fallback
    setTimeout(() => {
        if (!embed.contentDocument || embed.contentDocument.body.innerHTML === '') {
            embed.style.display = 'none';
            fallback.style.display = 'block';
        }
    }, 5000);
}