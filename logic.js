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
                
                let tab = document.querySelector(`.tab[data-target="${detectedId}"]`);
                if(tab) tab.classList.remove('disabled');
                
                auditLog.push({table: detectedId, row: 'System', type: 'INFO', message: `Loaded ${results.data.length} rows.`});
                
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
    let tab = document.querySelector(`.tab[data-target="${tableId}"]`);
    if(tab) tab.classList.add('active');
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
    let orderedHeaders = [...schema.FIELD_ORDER];
    st.headers.forEach(f => { if (!orderedHeaders.includes(f)) orderedHeaders.push(f); });
    st.headers = orderedHeaders; // Ensure exports include the missing columns too

    let totalRows = st.rows.length;
    let totalPages = Math.ceil(totalRows / rowsPerPage);
    if(currentPage > totalPages) currentPage = totalPages || 1;
    
    let startIdx = (currentPage - 1) * rowsPerPage;
    let endIdx = Math.min(startIdx + rowsPerPage, totalRows);
    
    let html = '<div class="table-wrap"><table><thead><tr><th class="row-num">#</th>';
    orderedHeaders.forEach(h => {
        let rule = schema.RULES[h];
        let badge = rule && rule.required ? '<span style="color:#ef4444">*</span>' : (!rule ? '' : '<span style="color:#94a3b8;font-size:10px">opt</span>');
        html += `<th>${rule?.label || h} ${badge}</th>`;
    });
    html += '</tr></thead><tbody>';

    for (let rIdx = startIdx; rIdx < endIdx; rIdx++) {
        let row = st.rows[rIdx];
        let hasErr = st.cellErrors[rIdx] && Object.keys(st.cellErrors[rIdx]).length > 0;
        html += `<tr class="${hasErr ? 'has-error' : ''}"><td class="row-num">${rIdx+1}</td>`;
        orderedHeaders.forEach(key => {
            let err = st.cellErrors[rIdx]?.[key];
            let isAuto = st.autocorrectedCells[rIdx] && st.autocorrectedCells[rIdx].has(key);
            let cls = 'cell-input';
            if (err) cls += ' cell-err';
            else if (isAuto && st.hasValidated) cls += ' cell-autocorrected';
            else if (st.hasValidated) cls += ' cell-ok';
            let displayVal = row[key] || '';
            
            html += `<td><input type="text" class="${cls}" data-row="${rIdx}" data-col="${key}" value="${escapeHtml(displayVal)}"></td>`;
        });
        html += '</tr>';
    }
    html += '</tbody></table></div>';
    c.innerHTML = html;
    
    // Pagination UI
    let pBar = document.getElementById('paginationBar');
    if (totalRows > rowsPerPage) {
        pBar.style.display = 'flex';
        document.getElementById('pageInfo').innerText = `Page ${currentPage} of ${totalPages} (${startIdx+1}-${endIdx} of ${totalRows})`;
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
  let html = `<div class="err">⚠️ ${escapeHtml(err)}</div>`;
  if (hint) {
    if(hint.rule) html += `<div class="rule">${escapeHtml(hint.rule)}</div>`;
    if(hint.fix) html += `<div class="hint">Fix: ${escapeHtml(hint.fix)}</div>`;
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
        if (bin && !/^\d{7}-\d{4}-\d{7}$/.test(bin)) errs.bin = 'Format: PSGC7-YEAR4-INC7';
        
        let bt = g('business_type');
        if (bt === 'SOLE PROPRIETORSHIP') {
            if (!g('dti_no')) errs.dti_no = 'Required for SOLE PROPRIETORSHIP';
            if (!g('dti_registration_expiry_date')) errs.dti_registration_expiry_date = 'Required for SOLE PROPRIETORSHIP';
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
        if (bin && !/^\d{7}-\d{4}-\d{7}$/.test(bin)) errs[binKey] = 'Format: PSGC7-YEAR4-INC7';
        
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
        
        let amtN = Number((g('amount')||'0').replace(/[^\d.\-]/g,''));
        let surN = Number((g('surcharge')||'0').replace(/[^\d.\-]/g,''));
        let intN = Number((g('interest')||'0').replace(/[^\d.\-]/g,''));
        let dscN = Number((g('discount')||'0').replace(/[^\d.\-]/g,''));
        let expected = amtN + surN + intN - dscN;
        let totalVal = g('total');
        if (totalVal !== '' && !isNaN(Number(totalVal.replace(/[^\d.\-]/g,'')))) {
            if (Math.abs(Number(totalVal.replace(/[^\d.\-]/g,'')) - expected) > 0.01) {
                errs.total = 'Must equal amount + surcharge + interest - discount (' + expected + ')';
            }
        }
    }
    else if (tableId === 'table4') {
        let amtN = Number((g('amount')||'0').replace(/[^\d.\-]/g,''));
        let surN = Number((g('Surcharge')||'0').replace(/[^\d.\-]/g,''));
        let intN = Number((g('Interest')||'0').replace(/[^\d.\-]/g,''));
        let dscN = Number((g('discount')||'0').replace(/[^\d.\-]/g,''));
        let expected = amtN + surN + intN - dscN;
        let totalVal = g('total');
        if (totalVal !== '' && !isNaN(Number(totalVal.replace(/[^\d.\-]/g,'')))) {
            let expectedRounded = Math.round(expected * 100) / 100;
            if (Math.abs(Number(totalVal.replace(/[^\d.\-]/g,'')) - expectedRounded) > 0.001) {
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
      if (rule.min && val.length < rule.min) errs[k] = `Min ${rule.min} chars`;
      if (rule.max && val.length > rule.max) errs[k] = `Max ${rule.max} chars`;
      if (rule.allowed && !rule.allowed.includes(val)) errs[k] = `Allowed: ${rule.allowed.join(', ')}`;
      if (rule.numeric) {
        if (!/^\d+(\.\d+)?$/.test(val)) {
            errs[k] = 'Must be numbers only';
        }
      }
      let df = schemas[tableId].DATE_FIELDS || [];
      if (df.includes(k)) {
        let cleanVal = val.replace(/^'+/, '');
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(cleanVal)) {
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
        rows.forEach((r, idx) => { let b = r?.bin?.trim(); if(b) { map[b] = map[b] || []; map[b].push(idx); } });
        for (let b in map) if(map[b].length > 1) dups.push({table: tableId, keyField: 'bin', keyValue: b, indices: map[b]});
    }
    if (tableId === 'table3') {
        let map = {};
        rows.forEach((r, idx) => { let o = r?.or_no?.trim(); if(o) { map[o] = map[o] || []; map[o].push(idx); } });
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
      auditLog.push({table: activeTableId, row: changedRow+1, type: 'ERROR', message: `${changedKey}: ${errs[changedKey]}`});
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
        if(!row) return; // already deleted
        let card = document.createElement('div');
        card.className = 'dup-card';
        let html = `<div style="font-weight:bold; margin-bottom:10px;">Row ${rowIdx+1} (${dup.keyField}: ${dup.keyValue})</div>`;
        
        let schema = schemas[dup.table];
        schema.FIELD_ORDER.slice(0, 8).forEach(f => {
            if (row[f]) html += `<div class="dup-field"><strong>${f}</strong><span>${escapeHtml(row[f])}</span></div>`;
        });
        
        html += `<button class="btn btn-primary" style="margin-top:15px;width:100%;justify-content:center;">Keep This Row</button>`;
        card.innerHTML = html;
        
        card.querySelector('button').addEventListener('click', () => {
            // Delete the other rows
            dup.indices.forEach(idx => {
                if (idx !== rowIdx) {
                    st.rows[idx] = null; // Mark for deletion
                    auditLog.push({table: dup.table, row: idx+1, type: 'DEDUPLICATION', message: `Discarded duplicate ${dup.keyField} ${dup.keyValue}`});
                } else {
                    auditLog.push({table: dup.table, row: idx+1, type: 'DEDUPLICATION', message: `Kept record for ${dup.keyField} ${dup.keyValue}`});
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
    if(dup) auditLog.push({table: dup.table, row: 'System', type: 'DEDUPLICATION', message: `Skipped manual resolution for ${dup.keyField} ${dup.keyValue}`});
    
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
        if (tableId === activeTableId) processDuplicatesModal();
        return; 
    }
    
    finalizeValidation(tableId);
}

function finalizeValidation(tableId) {
    let st = appState[tableId];
    let seenLists = {};
    
    if (tableId === 'table1') MasterStore.validBINs.clear();

    st.rows.forEach((row, idx) => {
        if(!row) return;
        let errs = validateSingleRow(tableId, row, idx, seenLists);
        if (Object.keys(errs).length > 0) {
            st.cellErrors[idx] = errs;
        } else {
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
        s.innerHTML = `Table ${activeTableId} loaded (${st.rows.length} rows). Click Validate.`;
        sum.style.display = 'none';
    } else if (errCount === 0) {
        s.className = 'status-ok';
        s.innerHTML = `✅ All ${st.rows.length} rows valid in ${activeTableId}. Ready for export.`;
        sum.style.display = 'none';
    } else {
        s.className = 'status-err';
        s.innerHTML = `❌ Found ${errCount} error(s) across ${Object.keys(st.cellErrors).length} row(s) in ${activeTableId}. Hover over red cells to see fixes.`;
        sum.style.display = 'block';
        
        let html = `<h4><span style="font-size:16px">⚠</span> Error Summary (${errCount})</h4>`;
        let counter = 0;
        Object.entries(st.cellErrors).forEach(([r, errs]) => {
            if (counter > 50) return; 
            let errStr = Object.entries(errs).map(([k,v]) => `<b>${k}</b>: ${v}`).join(' | ');
            html += `<div class="err-row">Row ${(Number(r)+1)}: ${errStr}</div>`;
            counter++;
        });
        if(Object.keys(st.cellErrors).length > 50) html += `<div class="err-row">...and more. Check Audit Log.</div>`;
        sum.innerHTML = html;
    }
}

function customAutoCorrect(tableId, row, fixes) {
    const v = (k) => (row[k] == null ? '' : String(row[k])).trim();
    if (tableId === 'table1') {
        let bin = v('bin');
        if (bin && bin.includes(' ')) { row.bin = bin.replace(/\s+/g, ''); fixes.push('bin: removed spaces'); }
        
        let cell = v('cellphone_no');
        if (cell) {
            let digits = cell.replace(/[^\d]/g, '');
            if (digits.startsWith('09') && digits.length === 11) { row.cellphone_no = '639' + digits.substring(2); fixes.push('cellphone_no: converted 09xx to 639xx'); }
        }
        
        let loc = v('location_owned').toLowerCase();
        if (['yes', 'true', 'owned', '1.0'].includes(loc)) { row.location_owned = '1'; fixes.push('location_owned: converted to 1'); }
        else if (['no', 'false', 'rented', '0.0'].includes(loc)) { row.location_owned = '0'; fixes.push('location_owned: converted to 0'); }
        else if (loc !== '1' && loc !== '0' && loc !== '') { row.location_owned = ''; fixes.push('location_owned: cleared invalid'); }
    }
    if (tableId === 'table3') {
        let amtN = Number(v('amount').replace(/[^\d.\-]/g,'') || 0);
        let surN = Number(v('surcharge').replace(/[^\d.\-]/g,'') || 0);
        let intN = Number(v('interest').replace(/[^\d.\-]/g,'') || 0);
        let dscN = Number(v('discount').replace(/[^\d.\-]/g,'') || 0);
        let expectedTotal = amtN + surN + intN - dscN;
        let currentTotal = v('total').replace(/[^\d.\-]/g,'');
        if (!isNaN(amtN) && !isNaN(surN) && !isNaN(intN) && !isNaN(dscN)) {
            if (currentTotal === '' || Number(currentTotal) !== expectedTotal) {
                row.total = expectedTotal.toString();
                fixes.push('total: auto-calculated');
            }
        }
    }
    if (tableId === 'table4') {
        let amtN = Number(v('amount').replace(/[^\d.\-]/g,'') || 0);
        let surN = Number(v('Surcharge').replace(/[^\d.\-]/g,'') || 0);
        let intN = Number(v('Interest').replace(/[^\d.\-]/g,'') || 0);
        let dscN = Number(v('discount').replace(/[^\d.\-]/g,'') || 0);
        let expectedTotal = Math.round((amtN + surN + intN - dscN) * 100) / 100;
        let currentTotal = v('total').replace(/[^\d.\-]/g,'');
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
            if(!row) return;
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
                    let nStr = fixed.replace(/[^\d.\-]/g, '');
                    if (nStr !== fixed && nStr !== '') fixed = nStr;
                }
                if (fixed !== orig) {
                    fixes.push(`${k}: formatted`);
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
    
    document.getElementById('validateBtn').click();
    alert('Autocorrect complete. Check Audit Log for details.');
});

document.getElementById('exportBtn').addEventListener('click', () => {
  let st = appState[activeTableId];
  let finalRows = st.rows.map(r => {
    if(!r) return null;
    let out = {};
    st.headers.forEach(h => {
      let v = String(r[h] || '').trim();
      
      // Force text formatting for Excel to prevent scientific notation or dropping leading zeros
      if (v && /^\d+$/.test(v)) {
          if (h === 'cellphone_no' || h === 'telephone_no' || h === 'tin_no' || v.length > 10 || (v.startsWith('0') && v.length > 1)) {
              v = "'" + v;
          }
      }
      
      out[h] = v;
    });
    return out;
  }).filter(r => r !== null);
  
  let csv = Papa.unparse(finalRows, { columns: st.headers });
  let blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'validated_' + activeTableId + '_' + Date.now() + '.csv';
  link.click();
});

document.getElementById('exportAuditBtn').addEventListener('click', () => {
    let csv = Papa.unparse(auditLog, { columns: ['table', 'row', 'type', 'message'] });
    let blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
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
