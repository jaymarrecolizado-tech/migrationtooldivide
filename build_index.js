const fs = require('fs');

const backup = fs.readFileSync('index.html.backup', 'utf8');

// Extract schemas
const schemaStart = backup.indexOf('const schemas = {');
let schemaEnd = backup.indexOf('};\n\n// Apply saved rules', schemaStart);
if (schemaEnd === -1) schemaEnd = backup.indexOf('};\r\n', schemaStart);
if (schemaEnd === -1) schemaEnd = backup.indexOf('};\n', schemaStart);
if (schemaEnd === -1) schemaEnd = backup.indexOf('};', schemaStart);

const schemasCode = backup.substring(schemaStart, schemaEnd + 2);

const newHtml = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BPLS Universal Migration Validator - Enterprise</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
<style>
:root {
  --bg-color: #f8fafc;
  --text-color: #0f172a;
  --panel-bg: #fff;
  --border-color: #e2e8f0;
  --header-bg: #f8fafc;
  --input-bg: transparent;
  --input-hover: #fff;
  --row-hover: #f8fafc;
  --err-bg: #fef2f2;
  --err-hover: #fee2e2;
  --err-text: #b91c1c;
  --err-border: #ef4444;
  --ok-bg: #ecfdf5;
  --ok-text: #047857;
  --ok-border: #10b981;
  --auto-bg: #eff6ff;
  --auto-text: #1d4ed8;
  --auto-border: #3b82f6;
  --toolbar-bg: #fff;
  --btn-text: #fff;
  --tab-bg: #e2e8f0;
  --tab-active: #4361ee;
  --tab-active-text: #fff;
  --tab-text: #475569;
}
[data-theme="dark"] {
  --bg-color: #0f172a;
  --text-color: #f8fafc;
  --panel-bg: #1e293b;
  --border-color: #334155;
  --header-bg: #0f172a;
  --input-bg: #1e293b;
  --input-hover: #334155;
  --row-hover: #1e293b;
  --err-bg: #450a0a;
  --err-hover: #7f1d1d;
  --err-text: #fca5a5;
  --err-border: #ef4444;
  --ok-bg: #064e3b;
  --ok-text: #6ee7b7;
  --ok-border: #10b981;
  --auto-bg: #1e3a8a;
  --auto-text: #93c5fd;
  --auto-border: #3b82f6;
  --toolbar-bg: #1e293b;
  --tab-bg: #334155;
  --tab-active: #3b82f6;
  --tab-active-text: #fff;
  --tab-text: #cbd5e1;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg-color);padding:20px;color:var(--text-color);transition: background 0.3s, color 0.3s;}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
h2{font-size:24px;display:flex;align-items:center;gap:10px}
.badge{background:var(--tab-active);color:var(--tab-active-text);font-size:12px;padding:3px 8px;border-radius:12px}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:15px;background:var(--toolbar-bg);padding:16px;border-radius:10px;box-shadow:0 2px 4px rgba(0,0,0,.05);border:1px solid var(--border-color)}
.toolbar label{font-weight:600;font-size:14px;margin-right:10px}
.toolbar select, .toolbar input[type=file]{padding:8px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--panel-bg);color:var(--text-color)}
.btn{padding:9px 18px;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-primary{background:#4361ee;color:#fff}
.btn-primary:hover:not(:disabled){background:#3a56d4}
.btn-success{background:#10b981;color:#fff}
.btn-success:hover:not(:disabled){background:#059669}
.btn-warning{background:#f59e0b;color:#fff}
.btn-warning:hover:not(:disabled){background:#d97706}
.btn-outline{background:transparent;border:1px solid var(--tab-active);color:var(--tab-active)}
.btn-outline:hover:not(:disabled){background:var(--row-hover)}

.tabs {display:flex; gap:5px; margin-bottom:15px;}
.tab {padding:10px 20px; background:var(--tab-bg); color:var(--tab-text); border-radius:8px 8px 0 0; cursor:pointer; font-weight:600; border:1px solid var(--border-color); border-bottom:none;}
.tab.active {background:var(--tab-active); color:var(--tab-active-text); border-color:var(--tab-active);}
.tab.disabled {opacity:0.5; cursor:not-allowed;}

#status{padding:12px 16px;border-radius:8px;font-size:14px;font-weight:500;margin-bottom:15px;transition:all .3s}
.status-info{background:var(--auto-bg);color:var(--auto-text);border-left:4px solid var(--auto-border)}
.status-ok{background:var(--ok-bg);color:var(--ok-text);border-left:4px solid var(--ok-border)}
.status-err{background:var(--err-bg);color:var(--err-text);border-left:4px solid var(--err-border)}
.status-warn{background:#fffbeb;color:#b45309;border-left:4px solid #f59e0b}

.panels{display:grid;grid-template-columns:1fr;gap:15px;margin-bottom:15px}
.panel{background:var(--panel-bg);border-radius:10px;padding:15px;box-shadow:0 2px 4px rgba(0,0,0,.05);display:none;max-height:250px;overflow-y:auto;border:1px solid var(--border-color)}
.panel h4{margin-bottom:10px;display:flex;align-items:center;gap:8px}
.panel.summary h4{color:var(--err-text)}
.panel.autocorrect-log h4{color:var(--auto-text)}
.err-row, .ac-row{padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px;line-height:1.4}
.err-row{color:var(--err-text)}
.ac-row{color:var(--auto-text)}

.table-wrap{overflow:auto;max-height:60vh;background:var(--panel-bg);border-radius:10px;box-shadow:0 4px 6px rgba(0,0,0,.05);border:1px solid var(--border-color)}
table{border-collapse:separate;border-spacing:0;font-size:13px;table-layout:auto;width:100%;}
thead th{background:var(--header-bg);color:var(--text-color);padding:10px 12px;position:sticky;top:0;z-index:10;text-align:left;white-space:nowrap;font-weight:600;border-bottom:2px solid var(--border-color)}
thead th.row-num{width:50px;text-align:center;background:var(--header-bg);position:sticky;left:0;z-index:11}
tbody td{padding:4px 6px;border-bottom:1px solid var(--border-color);vertical-align:middle;position:relative}
tbody td.row-num{background:var(--header-bg);text-align:center;color:var(--text-color);font-weight:600;font-size:12px;position:sticky;left:0;z-index:9;border-right:1px solid var(--border-color)}
tbody tr:hover td{background:var(--row-hover)}
tbody tr.has-error{background:var(--err-bg)}
tbody tr.has-error:hover td:not(.row-num){background:var(--err-hover)}

.cell-input{width:100%;border:1px solid transparent;padding:6px 8px;font-size:13px;border-radius:4px;background:var(--input-bg);color:var(--text-color);font-family:inherit;min-width:140px;transition:all .15s;}
.cell-input:hover{border-color:var(--border-color);background:var(--input-hover)}
.cell-input:focus{outline:none;border-color:var(--auto-border);background:var(--input-hover);box-shadow:0 0 0 3px rgba(59,130,246,.1)}
.cell-input.cell-err{border-color:var(--err-border);background:var(--err-bg);color:var(--err-text)}
.cell-input.cell-ok{border-color:var(--ok-border);background:var(--ok-bg);color:var(--ok-text)}
.cell-input.cell-autocorrected{border-color:var(--auto-border);background:var(--auto-bg);color:var(--auto-text)}

.pagination {display:flex; justify-content:space-between; align-items:center; margin-top:10px; background:var(--panel-bg); padding:10px 15px; border-radius:8px; border:1px solid var(--border-color);}

.legend{display:flex;gap:15px;font-size:13px;color:var(--text-color);margin-top:15px;flex-wrap:wrap;background:var(--panel-bg);padding:10px 15px;border-radius:8px;border:1px solid var(--border-color)}
.legend span{display:flex;align-items:center;gap:6px}
.legend .dot{width:12px;height:12px;border-radius:50%;display:inline-block}
.dot-err{background:#ef4444}
.dot-ok{background:#10b981}
.dot-neutral{background:#cbd5e1}
.dot-auto{background:#3b82f6}

/* Modal */
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.6);backdrop-filter:blur(2px);display:none;z-index:1000;justify-content:center;align-items:center}
.modal{background:var(--panel-bg);width:800px;max-width:90vw;border-radius:12px;box-shadow:0 20px 25px -5px rgba(0,0,0,.1);display:flex;flex-direction:column;max-height:90vh}
.modal-header{padding:16px 20px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center}
.modal-title{font-size:18px;font-weight:600}
.modal-close{background:transparent;border:none;font-size:24px;cursor:pointer;color:var(--text-color)}
.modal-body{padding:20px;overflow-y:auto;flex:1}
.modal-footer{padding:16px 20px;border-top:1px solid var(--border-color);display:flex;justify-content:flex-end;gap:10px}
textarea.json-editor{width:100%;height:400px;font-family:monospace;font-size:13px;padding:12px;border:1px solid var(--border-color);border-radius:6px;resize:vertical;background:var(--input-bg);color:var(--text-color)}
.tooltip-custom{position:absolute;background:#1e293b;color:#f8fafc;padding:8px 12px;border-radius:6px;font-size:12px;z-index:9999;pointer-events:none;max-width:300px;box-shadow:0 4px 6px rgba(0,0,0,.2);display:none}
.tooltip-custom .err{color:#fca5a5;font-weight:600}
.tooltip-custom .rule{color:#fde047;font-size:11px;margin-top:4px}
.tooltip-custom .hint{color:#86efac;font-size:11px;margin-top:4px;border-top:1px solid #334155;padding-top:4px}

/* Dupes Modal Specific */
.dup-container { display:flex; gap:15px; margin-bottom:20px; }
.dup-card { flex:1; border:1px solid var(--border-color); border-radius:8px; padding:15px; background:var(--bg-color); }
.dup-field { display:flex; justify-content:space-between; font-size:13px; border-bottom:1px solid var(--border-color); padding:4px 0;}
.dup-field strong { color:#888; width:120px; flex-shrink:0;}
</style>
</head>
<body>
<div class="header">
  <h2><span style="font-size:28px">🚀</span> BPLS Universal Migration Validator <span id="tableBadge" class="badge" style="display:none">Ready</span></h2>
  <div style="display:flex; gap:10px;">
      <button class="btn btn-outline" id="themeBtn">🌙 Dark Mode</button>
      <button class="btn btn-outline" id="rulesBtn">⚙️ Edit Validation Rules</button>
  </div>
</div>

<div class="toolbar">
  <input type="file" id="csvFile" accept=".csv,.zip" multiple title="Select multiple CSVs to batch process">
  
  <button class="btn btn-warning" id="autocorrectBtn" disabled>🪄 Auto-Correct</button>
  <button class="btn btn-primary" id="validateBtn" disabled>🔍 Validate All</button>
  <button class="btn btn-success" id="exportBtn" style="display:none" disabled>📥 Export Current CSV</button>
  <button class="btn btn-outline" id="exportAuditBtn" style="display:none" disabled>📝 Export Audit Log (CSV)</button>
</div>

<div class="tabs" id="tabContainer">
    <div class="tab active disabled" data-target="table1">Table 1 (Businesses)</div>
    <div class="tab disabled" data-target="table2">Table 2 (Activity)</div>
    <div class="tab disabled" data-target="table3">Table 3 (Application)</div>
    <div class="tab disabled" data-target="table4">Table 4 (Fee)</div>
</div>

<div id="status" class="status-info">Upload one or multiple CSV files to begin validation.</div>

<div class="panels">
  <div id="errorSummary" class="panel summary"></div>
  <div id="autocorrectLog" class="panel autocorrect-log"></div>
</div>

<div id="tableContainer"></div>
<div class="pagination" id="paginationBar" style="display:none;">
    <button class="btn btn-outline" id="prevPage">◀ Previous</button>
    <span id="pageInfo">Page 1 of 1</span>
    <button class="btn btn-outline" id="nextPage">Next ▶</button>
</div>

<div class="legend">
  <span><span class="dot dot-err"></span> Error</span>
  <span><span class="dot dot-auto"></span> Auto-corrected</span>
  <span><span class="dot dot-ok"></span> Valid</span>
  <span><span class="dot dot-neutral"></span> Not validated</span>
  <span style="color:#ef4444;font-weight:700">*</span> Required
  <span style="color:#94a3b8">opt</span> Optional
</div>

<!-- Rules Editor Modal -->
<div class="modal-overlay" id="rulesModal">
  <div class="modal">
    <!-- rules modal content ... -->
    <div class="modal-header">
      <div class="modal-title">Validation Rules Editor</div>
      <button class="modal-close" id="closeModal">&times;</button>
    </div>
    <div class="modal-body">
      <select id="rulesTableSelect" style="margin-bottom:10px;padding:6px;border-radius:4px;background:var(--input-bg);color:var(--text-color);">
        <option value="table1">Table 1 (Businesses)</option>
        <option value="table2">Table 2 (Activity)</option>
        <option value="table3">Table 3 (Application)</option>
        <option value="table4">Table 4 (Fee)</option>
      </select>
      <textarea id="rulesEditor" class="json-editor"></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" id="resetRules">↺ Reset</button>
      <button class="btn btn-primary" id="saveRules">💾 Save Changes</button>
    </div>
  </div>
</div>

<!-- Deduplication Modal -->
<div class="modal-overlay" id="dupModal">
  <div class="modal" style="width:900px;">
    <div class="modal-header">
      <div class="modal-title" style="color:var(--err-text)">⚠ Duplicate Detected</div>
      <button class="modal-close" id="closeDupModal">&times;</button>
    </div>
    <div class="modal-body" id="dupModalBody">
      <p style="margin-bottom:15px;">A duplicate identifier was found. Please choose which record to keep.</p>
      <div class="dup-container" id="dupCards"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" id="skipDup">Skip for now</button>
    </div>
  </div>
</div>

<div id="customTooltip" class="tooltip-custom"></div>

<script>
// --- SCHEMAS INJECTED HERE ---
${schemasCode}

// --- STATE MANAGEMENT ---
let MasterStore = { validBINs: new Set() };
let auditLog = []; // { table, row, type, message }

let appState = {
    table1: { loaded: false, headers: [], rows: [], cellErrors: {}, autocorrectedCells: {}, hasValidated: false },
    table2: { loaded: false, headers: [], rows: [], cellErrors: {}, autocorrectedCells: {}, hasValidated: false },
    table3: { loaded: false, headers: [], rows: [], cellErrors: {}, autocorrectedCells: {}, hasValidated: false },
    table4: { loaded: false, headers: [], rows: [], cellErrors: {}, autocorrectedCells: {}, hasValidated: false }
};

let activeTableId = 'table1';
let currentPage = 1;
const rowsPerPage = 100;
let pendingDuplicates = []; // Array of { table, key, rowIndices }

// Dark mode logic
let isDark = false;
document.getElementById('themeBtn').addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.getElementById('themeBtn').innerText = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// File input logic (Batch)
document.getElementById('csvFile').addEventListener('change', (e) => {
    const files = e.target.files;
    if (!files.length) return;
    
    let filesProcessed = 0;
    
    Array.from(files).forEach(file => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                let headers = results.meta.fields || [];
                let detectedId = detectTableType(headers);
                
                appState[detectedId] = {
                    loaded: true,
                    headers: headers,
                    rows: results.data,
                    cellErrors: {},
                    autocorrectedCells: {},
                    hasValidated: false
                };
                
                let tab = document.querySelector(\`.tab[data-target="\${detectedId}"]\`);
                tab.classList.remove('disabled');
                
                auditLog.push({table: detectedId, row: 'System', type: 'INFO', message: \`Loaded \${results.data.length} rows.\`});
                
                filesProcessed++;
                if (filesProcessed === files.length) {
                    // All files loaded. Auto-switch to table1 if loaded, or the first loaded.
                    if (appState['table1'].loaded) switchTab('table1');
                    else switchTab(detectedId);
                    
                    document.getElementById('validateBtn').disabled = false;
                    document.getElementById('autocorrectBtn').disabled = false;
                }
            }
        });
    });
});

document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
        if (!t.classList.contains('disabled')) {
            switchTab(t.dataset.target);
        }
    });
});

function switchTab(tableId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(\`.tab[data-target="\${tableId}"]\`).classList.add('active');
    activeTableId = tableId;
    currentPage = 1;
    
    document.getElementById('tableBadge').textContent = 'Mode: ' + activeTableId.toUpperCase();
    document.getElementById('tableBadge').style.display = 'inline-block';
    
    let st = appState[activeTableId];
    document.getElementById('exportBtn').style.display = st.hasValidated ? 'inline-flex' : 'none';
    document.getElementById('exportAuditBtn').style.display = auditLog.length > 0 ? 'inline-flex' : 'none';
    
    renderTable();
    updateStatusUI();
}

function detectTableType(csvHeaders) {
  let joined = csvHeaders.join(',').toLowerCase();
  if (joined.includes('dti_no') || joined.includes('business_type')) return 'table1';
  if (joined.includes('business_line_code')) return 'table2';
  if (joined.includes('application_type')) return 'table3';
  if (joined.includes('application_or_no') || joined.includes('fee_code') || joined.includes('type')) return 'table4';
  return 'table1'; 
}

function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderTable() {
    const c = document.getElementById('tableContainer');
    let st = appState[activeTableId];
    if (!st || !st.loaded) {
        c.innerHTML = '';
        document.getElementById('paginationBar').style.display = 'none';
        return;
    }

    let schema = schemas[activeTableId];
    let displayHeaders = st.headers.length ? st.headers : schema.FIELD_ORDER;
    let orderedHeaders = [];
    schema.FIELD_ORDER.forEach(f => { if (displayHeaders.includes(f)) orderedHeaders.push(f); });
    displayHeaders.forEach(f => { if (!orderedHeaders.includes(f)) orderedHeaders.push(f); });

    let totalRows = st.rows.length;
    let totalPages = Math.ceil(totalRows / rowsPerPage);
    if(currentPage > totalPages) currentPage = totalPages || 1;
    
    let startIdx = (currentPage - 1) * rowsPerPage;
    let endIdx = Math.min(startIdx + rowsPerPage, totalRows);
    
    let html = '<div class="table-wrap"><table><thead><tr><th class="row-num">#</th>';
    orderedHeaders.forEach(h => {
        let rule = schema.RULES[h];
        let badge = rule && rule.required ? '<span style="color:#ef4444">*</span>' : (!rule ? '' : '<span style="color:#94a3b8;font-size:10px">opt</span>');
        html += '<th>' + (rule?.label || h) + ' ' + badge + '</th>';
    });
    html += '</tr></thead><tbody>';

    for (let rIdx = startIdx; rIdx < endIdx; rIdx++) {
        let row = st.rows[rIdx];
        let hasErr = st.cellErrors[rIdx] && Object.keys(st.cellErrors[rIdx]).length > 0;
        html += '<tr class="' + (hasErr ? 'has-error' : '') + '"><td class="row-num">' + (rIdx+1) + '</td>';
        orderedHeaders.forEach(key => {
            let err = st.cellErrors[rIdx]?.[key];
            let isAuto = st.autocorrectedCells[rIdx] && st.autocorrectedCells[rIdx].has(key);
            let cls = 'cell-input';
            if (err) cls += ' cell-err';
            else if (isAuto && st.hasValidated) cls += ' cell-autocorrected';
            else if (st.hasValidated) cls += ' cell-ok';
            let displayVal = row[key] || '';
            
            html += \`<td><input type="text" class="\${cls}" data-row="\${rIdx}" data-col="\${key}" value="\${escapeHtml(displayVal)}"></td>\`;
        });
        html += '</tr>';
    }
    html += '</tbody></table></div>';
    c.innerHTML = html;
    
    // Pagination UI
    let pBar = document.getElementById('paginationBar');
    if (totalRows > rowsPerPage) {
        pBar.style.display = 'flex';
        document.getElementById('pageInfo').innerText = \`Page \${currentPage} of \${totalPages} (\${startIdx+1}-\${endIdx} of \${totalRows})\`;
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    } else {
        pBar.style.display = 'none';
    }

    c.querySelectorAll('.cell-input').forEach(input => {
        input.addEventListener('input', e => {
            let r = parseInt(e.target.dataset.row), k = e.target.dataset.col;
            st.rows[r][k] = e.target.value;
            if (st.hasValidated) runLiveValidation(r, k, e.target);
        });
        input.addEventListener('change', e => {
            if (st.hasValidated) runLiveValidation(parseInt(e.target.dataset.row), e.target.dataset.col, e.target);
        });
        input.addEventListener('mouseenter', e => showTooltip(e.target));
        input.addEventListener('mouseleave', hideTooltip);
    });
}

document.getElementById('prevPage').addEventListener('click', () => { if(currentPage > 1) { currentPage--; renderTable(); }});
document.getElementById('nextPage').addEventListener('click', () => { 
    let max = Math.ceil(appState[activeTableId].rows.length / rowsPerPage);
    if(currentPage < max) { currentPage++; renderTable(); }
});

const tipEl = document.getElementById('customTooltip');
function showTooltip(input) {
  let r = input.dataset.row;
  let k = input.dataset.col;
  let st = appState[activeTableId];
  let err = st.cellErrors[r]?.[k];
  if (!err) return;
  
  let hint = schemas[activeTableId].HINTS[k];
  let html = \`<div class="err">⚠️ \${escapeHtml(err)}</div>\`;
  if (hint) {
    if(hint.rule) html += \`<div class="rule">\${escapeHtml(hint.rule)}</div>\`;
    if(hint.fix) html += \`<div class="hint">Fix: \${escapeHtml(hint.fix)}</div>\`;
  }
  tipEl.innerHTML = html;
  tipEl.style.display = 'block';
  let rect = input.getBoundingClientRect();
  tipEl.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
  tipEl.style.top = (rect.bottom + 5) + 'px';
}
function hideTooltip() { tipEl.style.display = 'none'; }


function formatDate(raw) {
  if (!raw || !raw.trim()) return '';
  let s = raw.trim().replace(/^'+/, '');
  let formatted = '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      formatted = s;
  } else {
      let d = new Date(s);
      if (isNaN(d.getTime())) return raw;
      formatted = String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0') + '/' + d.getFullYear();
  }
  if (formatted.startsWith('0')) return "'" + formatted;
  return formatted;
}

function customValidateRow(tableId, row, errs, seenLists) {
    const g = (k) => (row[k] == null ? '' : String(row[k])).trim();
    
    if (tableId === 'table1') {
        let bin = g('bin');
        if (bin && !/^\\d{7}-\\d{4}-\\d{7}$/.test(bin)) errs.bin = 'Format: PSGC7-YEAR4-INC7';
        
        let bt = g('business_type');
        if (bt === 'SOLE PROPRIETORSHIP') {
            if (!g('dti_no')) errs.dti_no = 'Required for SOLE PROPRIETORSHIP';
            if (!g('dti_registratrion_expiry_date')) errs.dti_registratrion_expiry_date = 'Required for SOLE PROPRIETORSHIP';
        }
        if (['ONE PERSON CORPORATION','PARTNERSHIP','CORPORATION'].includes(bt) && !g('sec_no')) errs.sec_no = 'Required for ' + bt;
        if (bt === 'COOPERATIVE' && !g('cda_no')) errs.cda_no = 'Required for COOPERATIVE';
        
        let locOwned = g('location_owned');
        if (locOwned === '1') {
            if (!g('tdn_no') && !g('pin_no')) {
                errs.tdn_no = 'Provide TDN or PIN for owned';
                errs.pin_no = 'Provide TDN or PIN for owned';
            }
        }
        if (locOwned === '0') {
            if (!g('lessor_name')) errs.lessor_name = 'Required for rented';
            if (!g('monthly_rental')) errs.monthly_rental = 'Required for rented';
        }
        
        let male = Number(g('no_of_male_employees') || 0);
        let female = Number(g('no_of_female_employees') || 0);
        let residing = Number(g('no_of_employees_residing_within_the_area') || 0);
        if (residing > male + female) errs.no_of_employees_residing_within_the_area = 'Cannot exceed total (' + (male+female) + ')';
    } 
    else if (tableId === 'table2' || tableId === 'table3' || tableId === 'table4') {
        let binKey = tableId === 'table2' ? 'bin' : 'business_bin';
        let bin = g(binKey);
        if (bin && !/^\\d{7}-\\d{4}-\\d{7}$/.test(bin)) errs[binKey] = 'Format: PSGC7-YEAR4-INC7';
        
        // CROSS-TABLE REFERENTIAL INTEGRITY
        if (appState['table1'].loaded && appState['table1'].hasValidated) {
            if (bin && !MasterStore.validBINs.has(bin)) {
                errs[binKey] = 'BIN not found in Table 1 MasterStore';
            }
        }
    }
    
    if (tableId === 'table3') {
        let qf = g('qtr_from'), qt = g('qtr_to');
        if (qf && qt && Number(qt) < Number(qf)) errs.qtr_to = 'Must be >= Qtr From';
        
        let amtN = Number((g('amount')||'0').replace(/[^\\d.\\-]/g,''));
        let surN = Number((g('surcharge')||'0').replace(/[^\\d.\\-]/g,''));
        let intN = Number((g('interest')||'0').replace(/[^\\d.\\-]/g,''));
        let dscN = Number((g('discount')||'0').replace(/[^\\d.\\-]/g,''));
        let expected = amtN + surN + intN - dscN;
        let totalVal = g('total');
        if (totalVal !== '' && !isNaN(Number(totalVal.replace(/[^\\d.\\-]/g,'')))) {
            if (Math.abs(Number(totalVal.replace(/[^\\d.\\-]/g,'')) - expected) > 0.01) {
                errs.total = 'Must equal amount + surcharge + interest - discount (' + expected + ')';
            }
        }
    }
    else if (tableId === 'table4') {
        let amtN = Number((g('amount')||'0').replace(/[^\\d.\\-]/g,''));
        let surN = Number((g('Surcharge')||'0').replace(/[^\\d.\\-]/g,''));
        let intN = Number((g('Interest')||'0').replace(/[^\\d.\\-]/g,''));
        let dscN = Number((g('discount')||'0').replace(/[^\\d.\\-]/g,''));
        let expected = amtN + surN + intN - dscN;
        let totalVal = g('total');
        if (totalVal !== '' && !isNaN(Number(totalVal.replace(/[^\\d.\\-]/g,'')))) {
            let expectedRounded = Math.round(expected * 100) / 100;
            if (Math.abs(Number(totalVal.replace(/[^\\d.\\-]/g,'')) - expectedRounded) > 0.001) {
                errs.total = 'Must equal amount + Surcharge + Interest - discount (' + expectedRounded + ')';
            }
        }
        let qf = g('qtr_from'), qt = g('qtr_to');
        if (qf && qt && Number(qt) < Number(qf)) errs.qtr_to = 'Must be >= Qtr From';
    }
}

function validateSingleRow(tableId, row, rowIdx, seenLists) {
  let errs = {};
  let schema = schemas[tableId].RULES;
  
  Object.keys(schema).forEach(k => {
    let rule = schema[k];
    let val = (row[k] == null ? '' : String(row[k])).trim();
    
    if (rule.required && val === '') { errs[k] = 'Required'; return; }
    if (val !== '') {
      if (rule.min && val.length < rule.min) errs[k] = \`Min \${rule.min} chars\`;
      if (rule.max && val.length > rule.max) errs[k] = \`Max \${rule.max} chars\`;
      if (rule.allowed && !rule.allowed.includes(val)) errs[k] = \`Allowed: \${rule.allowed.join(', ')}\`;
      if (rule.numeric) {
        if (!/^\\d+(\\.\\d+)?$/.test(val)) {
            errs[k] = 'Must be numbers only';
        }
      }
      let df = schemas[tableId].DATE_FIELDS || [];
      if (df.includes(k)) {
        let cleanVal = val.replace(/^'+/, '');
        if (!/^\\d{2}\\/\\d{2}\\/\\d{4}$/.test(cleanVal)) {
            errs[k] = "Invalid format. Use MM/DD/YYYY";
        } else {
            let d = new Date(cleanVal);
            if (isNaN(d.getTime())) {
                errs[k] = 'Invalid Date';
            } else {
                let y = d.getFullYear();
                if (y < 1900 || y > 2100) errs[k] = 'Year out of range (1900-2100)';
            }
        }
      }
    }
  });

  customValidateRow(tableId, row, errs, seenLists);
  return errs;
}

// Deduplication grouping
function detectDuplicates(tableId, rows) {
    let dups = [];
    if (tableId === 'table1') {
        let map = {};
        rows.forEach((r, idx) => { let b = r.bin?.trim(); if(b) { map[b] = map[b] || []; map[b].push(idx); } });
        for (let b in map) if(map[b].length > 1) dups.push({table: tableId, keyField: 'bin', keyValue: b, indices: map[b]});
    }
    if (tableId === 'table3') {
        let map = {};
        rows.forEach((r, idx) => { let o = r.or_no?.trim(); if(o) { map[o] = map[o] || []; map[o].push(idx); } });
        for (let o in map) if(map[o].length > 1) dups.push({table: tableId, keyField: 'or_no', keyValue: o, indices: map[o]});
    }
    return dups;
}

function runLiveValidation(changedRow, changedKey, inputEl) {
  let st = appState[activeTableId];
  let seenLists = {};
  
  let errs = validateSingleRow(activeTableId, st.rows[changedRow], changedRow, seenLists);
  if (Object.keys(errs).length > 0) {
      st.cellErrors[changedRow] = errs;
      auditLog.push({table: activeTableId, row: changedRow+1, type: 'ERROR', message: \`\${changedKey}: \${errs[changedKey]}\`});
  } else { 
      delete st.cellErrors[changedRow]; 
  }
  
  updateStatusUI();
  
  let tr = inputEl.closest('tr');
  let hasRowErr = st.cellErrors[changedRow] !== undefined;
  tr.className = hasRowErr ? 'has-error' : '';
  
  tr.querySelectorAll('.cell-input').forEach(inp => {
    let k = inp.dataset.col;
    let err = st.cellErrors[changedRow]?.[k];
    let isAuto = st.autocorrectedCells[changedRow] && st.autocorrectedCells[changedRow].has(k);
    inp.className = 'cell-input' + (err ? ' cell-err' : (isAuto ? ' cell-autocorrected' : ' cell-ok'));
  });
}

function processDuplicatesModal() {
    if (pendingDuplicates.length === 0) return;
    let dup = pendingDuplicates.shift();
    let st = appState[dup.table];
    
    document.getElementById('dupModal').style.display = 'flex';
    let container = document.getElementById('dupCards');
    container.innerHTML = '';
    
    dup.indices.forEach(rowIdx => {
        let row = st.rows[rowIdx];
        let card = document.createElement('div');
        card.className = 'dup-card';
        let html = \`<div style="font-weight:bold; margin-bottom:10px;">Row \${rowIdx+1} (\${dup.keyField}: \${dup.keyValue})</div>\`;
        
        let schema = schemas[dup.table];
        schema.FIELD_ORDER.slice(0, 8).forEach(f => {
            if (row[f]) html += \`<div class="dup-field"><strong>\${f}</strong><span>\${escapeHtml(row[f])}</span></div>\`;
        });
        
        html += \`<button class="btn btn-primary" style="margin-top:15px;width:100%;justify-content:center;">Keep This Row</button>\`;
        card.innerHTML = html;
        
        card.querySelector('button').addEventListener('click', () => {
            // Delete the other rows
            dup.indices.forEach(idx => {
                if (idx !== rowIdx) {
                    st.rows[idx] = null; // Mark for deletion
                    auditLog.push({table: dup.table, row: idx+1, type: 'DEDUPLICATION', message: \`Discarded duplicate \${dup.keyField} \${dup.keyValue}\`});
                } else {
                    auditLog.push({table: dup.table, row: idx+1, type: 'DEDUPLICATION', message: \`Kept record for \${dup.keyField} \${dup.keyValue}\`});
                }
            });
            // Compact rows
            st.rows = st.rows.filter(r => r !== null);
            
            document.getElementById('dupModal').style.display = 'none';
            
            if (pendingDuplicates.length > 0) {
                processDuplicatesModal();
            } else {
                // Done deduplicating this table
                finalizeValidation(dup.table);
            }
        });
        container.appendChild(card);
    });
}

document.getElementById('skipDup').addEventListener('click', () => {
    document.getElementById('dupModal').style.display = 'none';
    let dup = pendingDuplicates[0];
    auditLog.push({table: dup.table, row: 'System', type: 'DEDUPLICATION', message: \`Skipped manual resolution for \${dup.keyField} \${dup.keyValue}\`});
    
    if (pendingDuplicates.length > 0) {
        processDuplicatesModal();
    } else {
        finalizeValidation(activeTableId);
    }
});
document.getElementById('closeDupModal').addEventListener('click', () => {
    document.getElementById('dupModal').style.display = 'none';
    pendingDuplicates = [];
    finalizeValidation(activeTableId);
});


document.getElementById('validateBtn').addEventListener('click', () => {
    // Validate all loaded tables
    Object.keys(appState).forEach(tid => {
        if(appState[tid].loaded) executeValidation(tid);
    });
});

function executeValidation(tableId) {
    let st = appState[tableId];
    st.hasValidated = true;
    st.cellErrors = {};
    let seenLists = {};
    
    let dups = detectDuplicates(tableId, st.rows);
    if (dups.length > 0) {
        pendingDuplicates = pendingDuplicates.concat(dups);
        if (tableId === activeTableId) processDuplicatesModal(); // Start modal chain
        return; // Pause validation until dups resolved
    }
    
    finalizeValidation(tableId);
}

function finalizeValidation(tableId) {
    let st = appState[tableId];
    let seenLists = {};
    
    // Reset MasterStore for table 1
    if (tableId === 'table1') MasterStore.validBINs.clear();

    st.rows.forEach((row, idx) => {
        let errs = validateSingleRow(tableId, row, idx, seenLists);
        if (Object.keys(errs).length > 0) {
            st.cellErrors[idx] = errs;
        } else {
            // Valid row logic
            if (tableId === 'table1') {
                let bin = row['bin'];
                if (bin) MasterStore.validBINs.add(bin);
            }
        }
    });
    
    if(tableId === activeTableId) {
        currentPage = 1;
        renderTable();
        updateStatusUI();
        document.getElementById('exportBtn').style.display = 'inline-flex';
        document.getElementById('exportAuditBtn').style.display = auditLog.length > 0 ? 'inline-flex' : 'none';
    }
}

function updateStatusUI() {
    let st = appState[activeTableId];
    if(!st.loaded) return;
    
    let errCount = Object.keys(st.cellErrors).reduce((acc, idx) => acc + Object.keys(st.cellErrors[idx]).length, 0);
    
    const s = document.getElementById('status');
    const sum = document.getElementById('errorSummary');
    
    if (!st.hasValidated) {
        s.className = 'status-info';
        s.innerHTML = \`Table \${activeTableId} loaded (\${st.rows.length} rows). Click Validate.\`;
        sum.style.display = 'none';
    } else if (errCount === 0) {
        s.className = 'status-ok';
        s.innerHTML = \`✅ All \${st.rows.length} rows valid in \${activeTableId}. Ready for export.\`;
        sum.style.display = 'none';
    } else {
        s.className = 'status-err';
        s.innerHTML = \`❌ Found \${errCount} error(s) across \${Object.keys(st.cellErrors).length} row(s) in \${activeTableId}. Hover over red cells to see fixes.\`;
        sum.style.display = 'block';
        
        let html = \`<h4><span style="font-size:16px">⚠</span> Error Summary (\${errCount})</h4>\`;
        let counter = 0;
        Object.entries(st.cellErrors).forEach(([r, errs]) => {
            if (counter > 50) return; // limit summary
            let errStr = Object.entries(errs).map(([k,v]) => \`<b>\${k}</b>: \${v}\`).join(' | ');
            html += \`<div class="err-row">Row \${(Number(r)+1)}: \${errStr}</div>\`;
            counter++;
        });
        if(Object.keys(st.cellErrors).length > 50) html += \`<div class="err-row">...and more. Check Audit Log.</div>\`;
        sum.innerHTML = html;
    }
}


function customAutoCorrect(tableId, row, fixes) {
    const v = (k) => (row[k] == null ? '' : String(row[k])).trim();
    if (tableId === 'table1') {
        let bin = v('bin');
        if (bin && bin.includes(' ')) { row.bin = bin.replace(/\\s+/g, ''); fixes.push('bin: removed spaces'); }
        
        let cell = v('cellphone_no');
        if (cell) {
            let digits = cell.replace(/[^\\d]/g, '');
            if (digits.startsWith('09') && digits.length === 11) { row.cellphone_no = '639' + digits.substring(2); fixes.push('cellphone_no: converted 09xx to 639xx'); }
        }
        
        let loc = v('location_owned').toLowerCase();
        if (['yes', 'true', 'owned', '1.0'].includes(loc)) { row.location_owned = '1'; fixes.push('location_owned: converted to 1'); }
        else if (['no', 'false', 'rented', '0.0'].includes(loc)) { row.location_owned = '0'; fixes.push('location_owned: converted to 0'); }
        else if (loc !== '1' && loc !== '0' && loc !== '') { row.location_owned = ''; fixes.push('location_owned: cleared invalid'); }
    }
    if (tableId === 'table3') {
        let amtN = Number(v('amount').replace(/[^\\d.\\-]/g,'') || 0);
        let surN = Number(v('surcharge').replace(/[^\\d.\\-]/g,'') || 0);
        let intN = Number(v('interest').replace(/[^\\d.\\-]/g,'') || 0);
        let dscN = Number(v('discount').replace(/[^\\d.\\-]/g,'') || 0);
        let expectedTotal = amtN + surN + intN - dscN;
        let currentTotal = v('total').replace(/[^\\d.\\-]/g,'');
        if (!isNaN(amtN) && !isNaN(surN) && !isNaN(intN) && !isNaN(dscN)) {
            if (currentTotal === '' || Number(currentTotal) !== expectedTotal) {
                row.total = expectedTotal.toString();
                fixes.push('total: auto-calculated');
            }
        }
    }
    if (tableId === 'table4') {
        let amtN = Number(v('amount').replace(/[^\\d.\\-]/g,'') || 0);
        let surN = Number(v('Surcharge').replace(/[^\\d.\\-]/g,'') || 0);
        let intN = Number(v('Interest').replace(/[^\\d.\\-]/g,'') || 0);
        let dscN = Number(v('discount').replace(/[^\\d.\\-]/g,'') || 0);
        let expectedTotal = Math.round((amtN + surN + intN - dscN) * 100) / 100;
        let currentTotal = v('total').replace(/[^\\d.\\-]/g,'');
        if (!isNaN(amtN) && !isNaN(surN) && !isNaN(intN) && !isNaN(dscN)) {
            if (currentTotal === '' || Number(currentTotal) !== expectedTotal) {
                row.total = String(expectedTotal);
                fixes.push('total: auto-calculated');
            }
        }
    }
}

document.getElementById('autocorrectBtn').addEventListener('click', () => {
    Object.keys(appState).forEach(tid => {
        let st = appState[tid];
        if(!st.loaded) return;
        
        st.autocorrectedCells = {};
        let df = schemas[tid] && schemas[tid].DATE_FIELDS ? schemas[tid].DATE_FIELDS : [];
        
        st.rows.forEach((row, idx) => {
            let fixes = [];
            
            Object.keys(row).forEach(k => {
                let orig = String(row[k]||'').trim();
                let fixed = orig;
                if (df.includes(k) && orig) {
                    fixed = formatDate(orig);
                }
                let rule = schemas[tid].RULES[k];
                if (rule && rule.allowed && orig) {
                    let upper = orig.toUpperCase().trim();
                    if (rule.allowed.includes(upper)) fixed = upper;
                }
                if (rule && rule.numeric && fixed) {
                    let nStr = fixed.replace(/[^\\d.\\-]/g, '');
                    if (nStr !== fixed && nStr !== '') fixed = nStr;
                }
                if (fixed !== orig) {
                    fixes.push(\`\${k}: formatted\`);
                    row[k] = fixed;
                }
            });
            
            customAutoCorrect(tid, row, fixes);
            
            if (fixes.length > 0) {
                st.autocorrectedCells[idx] = new Set(fixes.map(f => f.split(':')[0]));
                fixes.forEach(f => {
                    auditLog.push({table: tid, row: idx+1, type: 'AUTOCORRECT', message: f});
                });
            }
        });
    });
    
    // Re-validate all after autocorrect
    document.getElementById('validateBtn').click();
    alert('Autocorrect complete. Check Audit Log for details.');
});


document.getElementById('exportBtn').addEventListener('click', () => {
  let st = appState[activeTableId];
  let finalRows = st.rows.map(r => {
    let out = {};
    st.headers.forEach(h => {
      let v = String(r[h] || '').trim();
      if (v.startsWith('0') && !/^\\d+$/.test(v)) v = "'" + v;
      out[h] = v;
    });
    return out;
  });
  
  let csv = Papa.unparse(finalRows, { columns: st.headers });
  let blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'validated_' + activeTableId + '_' + Date.now() + '.csv';
  link.click();
});

document.getElementById('exportAuditBtn').addEventListener('click', () => {
    let csv = Papa.unparse(auditLog, { columns: ['table', 'row', 'type', 'message'] });
    let blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bpls_audit_log_' + Date.now() + '.csv';
    link.click();
});

// Rules Editor Logic
const modal = document.getElementById('rulesModal');
const rulesSelect = document.getElementById('rulesTableSelect');
const rulesEditor = document.getElementById('rulesEditor');

document.getElementById('rulesBtn').addEventListener('click', () => {
  rulesSelect.value = activeTableId || 'table1';
  loadEditorRules();
  modal.style.display = 'flex';
});

document.getElementById('closeModal').addEventListener('click', () => modal.style.display='none');

rulesSelect.addEventListener('change', loadEditorRules);

function loadEditorRules() {
  let val = rulesSelect.value;
  rulesEditor.value = JSON.stringify(schemas[val].RULES, null, 2);
}

document.getElementById('saveRules').addEventListener('click', () => {
  try {
    let newRules = JSON.parse(rulesEditor.value);
    schemas[rulesSelect.value].RULES = newRules;
    localStorage.setItem('bpls_rules_' + rulesSelect.value, JSON.stringify(newRules));
    alert('✅ Rules saved successfully for ' + rulesSelect.value + '!');
    document.getElementById('validateBtn').click();
  } catch(e) {
    alert('❌ Invalid JSON syntax. Please check your formatting.');
  }
});

document.getElementById('resetRules').addEventListener('click', () => {
  if(confirm('Reset ' + rulesSelect.value + ' validation rules to system defaults?')) {
    localStorage.removeItem('bpls_rules_' + rulesSelect.value);
    alert('To fully apply defaults, please reload the page.');
    location.reload();
  }
});
</script>
</body>
</html>`;

fs.writeFileSync('index.html', newHtml, 'utf8');
console.log('Successfully rebuilt index.html');
