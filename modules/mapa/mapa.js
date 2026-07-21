<div class="panel fade-in">
    <div class="panel-header">🗺️ Mapa Tático</div>
    <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
        <button class="btn btn-sm" id="btnAddToken">➕ Adicionar Token</button>
        <button class="btn btn-sm" id="btnImportarCombate">⚔️ Importar do Combate</button>
        <button class="btn btn-sm" id="btnClearMapa">🗑️ Limpar Mapa</button>
        <label style="font-size:0.8rem; display:flex; align-items:center; gap:4px;">
            Grid: <input type="number" id="gridSize" value="10" min="5" max="20" style="width:50px;">
        </label>
        <button class="btn btn-sm" id="btnSyncMapa">🔄 Sincronizar</button>
        <label style="font-size:0.8rem; display:flex; align-items:center; gap:4px;">
            <input type="file" id="mapImageInput" accept="image/*" style="display:none;">
            <button class="btn btn-sm" id="btnUploadImagem">🖼️ Upload Imagem</button>
        </label>
    </div>
    <div style="position:relative; width:100%; aspect-ratio:1/1; background:#1a1a2e; border-radius:8px;">
        <canvas id="mapCanvas" style="width:100%; height:100%; border-radius:8px; cursor:crosshair; display:block;"></canvas>
    </div>
    <div style="margin-top:8px; font-size:0.8rem; color:var(--text-dim);">
        Clique ou arraste um token para movê-lo. 
        <span id="tokenStatus">Nenhum token selecionado.</span>
    </div>
</div>