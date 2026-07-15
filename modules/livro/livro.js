export function init() {
    const embed = document.getElementById('pdfEmbed');
    const fallback = document.getElementById('pdfFallback');
    if (!embed) return;

    // ID do arquivo no Google Drive
    const GOOGLE_DRIVE_FILE_ID = '1CmLctQbvYdFp0s5vgp5I2ng9OYm7pocD';
    
    const pdfUrl = `https://drive.google.com/file/d/${GOOGLE_DRIVE_FILE_ID}/preview`;
    console.log('📖 PDF URL (Google Drive):', pdfUrl);
    embed.src = pdfUrl;

    embed.addEventListener('error', () => {
        console.warn('❌ PDF não carregou do Google Drive');
        embed.style.display = 'none';
        fallback.style.display = 'block';
    });

    setTimeout(() => {
        if (!embed.contentDocument || embed.contentDocument.body.innerHTML === '') {
            embed.style.display = 'none';
            fallback.style.display = 'block';
        }
    }, 5000);
}