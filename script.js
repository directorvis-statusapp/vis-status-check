// script.js - VIS Status Checker
// CSV is expected with header row containing columns:
// "Registration#", "Name", "Hours Completed", "Status"
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAlPiSLTrsIzp8K12t-gfCCuWApaNiRAJ1PvlhK6yDddpN9fgtIjuwZM8oPhQCLbMkyqeuquz0tjBI/pub?output=csv";
let csvCache = null;

const regInput = document.getElementById('regInput');
const checkBtn = document.getElementById('checkBtn');
const clearBtn = document.getElementById('clearBtn');
const output = document.getElementById('output');
const meta = document.getElementById('meta');

checkBtn.addEventListener('click', performCheck);
clearBtn.addEventListener('click', () => { regInput.value=''; output.innerHTML=''; meta.innerHTML=''; regInput.focus(); });

regInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') performCheck(); });

async function fetchCsv() {
  if (csvCache) return csvCache;
  try {
    const res = await fetch(CSV_URL, {cache: "no-store"});
    if (!res.ok) throw new Error('Could not fetch data (HTTP ' + res.status + ')');
    const text = await res.text();
    csvCache = parseCsv(text);
    return csvCache;
  } catch (err) {
    throw err;
  }
}

function parseCsv(text) {
  // Simple CSV parser that splits lines, handles quoted values
  const lines = text.split(/\r?\n/).filter(l => l.trim()!==''); 
  if (lines.length === 0) return {header:[], rows:[]};
  // parse header
  const header = splitCsvLine(lines[0]);
  const rows = [];
  for (let i=1;i<lines.length;i++){ 
    const parts = splitCsvLine(lines[i]);
    if (parts.length === 0) continue;
    rows.push(parts);
  }
  return {header, rows};
}

function splitCsvLine(line) {
  const parts = [];
  let cur = '', inQuotes=false;
  for (let i=0;i<line.length;i++){
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      parts.push(cur.trim());
      cur='';
    } else cur += ch;
  }
  if (cur !== '') parts.push(cur.trim());
  return parts;
}

function findColumnIndex(header, nameCandidates) {
  const low = header.map(h => h.toLowerCase());
  for (let cand of nameCandidates) {
    const idx = low.indexOf(cand.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

async function performCheck(){
  const reg = (regInput.value || '').trim();
  output.className = 'output';
  meta.innerHTML = '';
  if (!reg) {
    output.textContent = 'Please enter registration number';
    output.classList.add('error');
    return;
  }
  try {
    output.textContent = 'Checking…';
    const data = await fetchCsv();
    const header = data.header;
    // find column indexes
    const idxReg = findColumnIndex(header, ['Registration#','Registration No','Registration Number','Reg No','Reg']);
    const idxName = findColumnIndex(header, ['Name','Student Name','Full Name']);
    const idxHours = findColumnIndex(header, ['Hours Completed','Hours','HoursCompleted','Hours Completed ']);
    const idxStatus = findColumnIndex(header, ['Status','Completion Status','Record Status']);

    if (idxReg === -1) {
      throw new Error('CSV header does not contain a Registration# column. Please ensure the first row uses the expected headers.');
    }

    // search rows
    let matched = null;
    for (const row of data.rows) {
      const cell = (row[idxReg] || '').toString().trim();
      if (!cell) continue;
      if (cell.toLowerCase() === reg.toLowerCase()) {
        matched = row;
        break;
      }
    }

    if (!matched) {
      output.textContent = '❌ No record found Or Status is Incomplete';
      output.classList.add('error');
      return;
    }

    // determine hours and status
    const hoursRaw = idxHours !== -1 ? (matched[idxHours] || '') : '';
    const statusRaw = idxStatus !== -1 ? (matched[idxStatus] || '') : '';
    const nameRaw = idxName !== -1 ? (matched[idxName] || '') : '';

    const hours = Number(String(hoursRaw).replace(/[^0-9.]/g,'')) || 0;
    const statusLower = String(statusRaw).toLowerCase();

    // Decide the display message
    let message = '❌ No record found Or Status is Incomplete';
    let cls = 'error';

    if (hours >= 65 || statusLower.includes('completed')) {
      message = '✅ Completed 65 hours';
      cls = 'success';
    } else if ((hours > 0 && hours < 65) || statusLower.includes('in progress') || statusLower.includes('in-progress')) {
      message = '⚠️ In progress';
      cls = 'warn';
    } else {
      // fallback if status explicitly says "not started" etc
      message = '❌ No record found Or Status is Incomplete';
      cls = 'error';
    }

    output.textContent = message;
    output.classList.add(cls);

    // show small meta (name and hours) but not required
    const metaParts = [];
    if (nameRaw) metaParts.push('<strong>Name:</strong> ' + escapeHtml(nameRaw));
    if (!isNaN(hours)) metaParts.push('<strong>Hours:</strong> ' + hours);
    if (statusRaw) metaParts.push('<strong>Raw status:</strong> ' + escapeHtml(statusRaw));
    meta.innerHTML = metaParts.join(' &nbsp; | &nbsp; ');

  } catch (err) {
    console.error(err);
    output.textContent = 'Error: ' + (err.message || err);
    output.classList.add('error');
  }
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// Preload CSV so first check is fast
fetchCsv().then(()=>console.log('CSV loaded')).catch(e=>console.warn('Could not preload CSV:', e));
