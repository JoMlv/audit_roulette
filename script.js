// JS-only Study Audit Roulette

let studies = [], team = [], log = [];
let loaded = 0;
let studiesLoaded = false, teamLoaded = false;
let auditHistory = [];

// Load audit history from localStorage on page load
function loadAuditHistory() {
  const saved = localStorage.getItem('auditHistory');
  if (saved) {
    auditHistory = JSON.parse(saved);
  }
  renderAuditHistory();
}

// Save audit history to localStorage
function saveAuditHistory() {
  localStorage.setItem('auditHistory', JSON.stringify(auditHistory));
  renderAuditHistory();
}

// Tab switching
function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabName + '-tab').classList.add('active');
  event.target.classList.add('active');
  
  // Refresh history if viewing history tab
  if (tabName === 'history') {
    renderAuditHistory();
  }
}

function loadExcelFile() {
  const fileInput = document.getElementById('excelFile');
  const file = fileInput.files[0];
  
  if (!file) {
    setStatus('No file selected');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      
      // Get first sheet
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      // Transform data to match expected format
      studies = jsonData.map(s => ({
        name: s.study_name || s.Study || s.name || '',
        participants: parseInt(s.n_participants || s.participants || 0) || 0,
        expected: parseInt(s.n_expected_participants || s.expected || 0) || 0,
        personInCharge: s.person_in_charge || s.personInCharge || s.responsible || '',
        selected: true
      }));
      
      studiesLoaded = true;
      setStatus(`✓ Loaded ${studies.length} studies from Excel`);
      checkAndFinishLoad();
    } catch (err) {
      setStatus('Error reading Excel file: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function loadTeamJSON() {
  fetch('team.json')
    .then(resp => resp.json())
    .then(data => { 
      team = data.map(m => ({
        name: m.lab_members || m.name,
        selected: true
      }));
      teamLoaded = true;
      checkAndFinishLoad(); 
    })
    .catch(err => {
      console.error('Failed loading team.json:', err);
      teamLoaded = true; // Mark as loaded even if file doesn't exist
      team = []; // Empty team array
      checkAndFinishLoad();
    });
}

function checkAndFinishLoad() {
  if (studiesLoaded && teamLoaded) {
    setStatus("");
    document.getElementById("mainUI").style.display = '';
    renderLists();
    renderLog();
  }
}

function loadJSONFiles() {
  loaded = 0;
  fetch('study_repository.json')
    .then(resp => resp.json())
    .then(data => { 
      // Transform data to match expected format
      studies = data.map(s => ({
        name: s.study_name,
        participants: parseInt(s.n_participants) || 0,
        expected: parseInt(s.n_expected_participants) || 0,
        selected: true
      }));
      loaded++; 
      finishLoad(); 
    })
    .catch(() => setStatus('Failed loading study_repository.json'));
  fetch('team.json')
    .then(resp => resp.json())
    .then(data => { 
      // Transform data to match expected format
      team = data.map(m => ({
        name: m.lab_members,
        selected: true
      }));
      loaded++; 
      finishLoad(); 
    })
    .catch(() => setStatus('Failed loading team.json'));
}
function setStatus(msg) {
  document.getElementById("dataStatus").textContent = msg;
}
function finishLoad() {
  if (loaded < 2) return;
  setStatus("Loaded! Edit selection below.");
  document.getElementById("mainUI").style.display = '';
  renderLists();
  renderLog();
}
function renderLists() {
  // Studies
  let sUl = document.getElementById("studyList");
  sUl.innerHTML = '';
  studies.forEach((s, i) => {
    let el = document.createElement('li');
    el.style.marginBottom = '8px';
    
    let box = document.createElement('input');
    box.type = "checkbox";
    box.checked = !!s.selected;
    box.onchange = () => { s.selected = box.checked; };
    el.appendChild(box);
    
    let participantText = s.participants > 0 ? s.participants : s.expected;
    let suffix = s.participants > 0 ? '' : ' expected';
    let label = " " + s.name + " (" + participantText + suffix + ")";
    el.append(label);
    
    if (s.personInCharge) {
      let inChargeSpan = document.createElement('span');
      inChargeSpan.style.display = 'block';
      inChargeSpan.style.marginLeft = '24px';
      inChargeSpan.style.fontSize = '0.85em';
      inChargeSpan.style.color = 'var(--brand-gray)';
      inChargeSpan.style.fontStyle = 'italic';
      inChargeSpan.textContent = `↳ In charge: ${s.personInCharge}`;
      el.appendChild(inChargeSpan);
    }
    
    sUl.appendChild(el);
  });
  // Members
  let mUl = document.getElementById("memberList");
  mUl.innerHTML = '';
  team.forEach((m, i) => {
    let el = document.createElement('li');
    let box = document.createElement('input');
    box.type = "checkbox";
    box.checked = !!m.selected;
    box.onchange = () => { m.selected = box.checked; };
    el.appendChild(box);
    el.append(" " + m.name);
    
    // Add remove button
    let removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.style.marginLeft = '10px';
    removeBtn.style.padding = '2px 6px';
    removeBtn.style.fontSize = '0.75em';
    removeBtn.style.backgroundColor = 'var(--brand-accent)';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '4px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.lineHeight = '1';
    removeBtn.onclick = () => { removeMember(i); };
    el.appendChild(removeBtn);
    
    mUl.appendChild(el);
  });
}

function addTeamMember() {
  const nameInput = document.getElementById('newMemberName');
  const name = nameInput.value.trim();
  
  if (!name) {
    alert('Please enter a member name');
    return;
  }
  
  // Check if already exists
  if (team.some(m => m.name === name)) {
    alert('This member already exists');
    return;
  }
  
  team.push({ name: name, selected: true });
  nameInput.value = '';
  renderLists();
}

function removeMember(index) {
  if (confirm(`Remove ${team[index].name} from the team?`)) {
    team.splice(index, 1);
    renderLists();
  }
}

function saveTeamJSON() {
  // Convert team back to original JSON format
  const teamData = team.map(m => ({ lab_members: m.name }));
  const jsonStr = JSON.stringify(teamData, null, 2);
  
  // Download as file
  const blob = new Blob([jsonStr], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'team.json';
  a.click();
  
  alert('Team saved! Replace the old team.json file with the downloaded one.');
}

function selectAll(type, value) {
  if (type === 'studies') {
    studies.forEach(s => s.selected = value);
  } else if (type === 'team') {
    team.forEach(m => m.selected = value);
  }
  renderLists();
}

function runRoulette() {
  let selStudies = studies.filter(s=>s.selected);
  let selMembers = team.filter(m=>m.selected);
  if(selStudies.length===0 || selMembers.length===0) {
    alert('You must have at least one study and one member selected!');
    return;
  }
  
  // Disable button during spin
  document.getElementById('spinBtn').disabled = true;
  
  let auditPct = Math.max(1, Math.min(100, Number(document.getElementById('auditPct').value)||30));
  
  // Pick study first
  let studyIdx = Math.floor(Math.random() * selStudies.length);
  let studyObj = selStudies[studyIdx];
  
  // Filter out people in charge from available auditors
  // Parse multiple people separated by +
  let peopleInCharge = [];
  if (studyObj.personInCharge) {
    peopleInCharge = studyObj.personInCharge
      .split('+')
      .map(name => name.trim().toLowerCase())
      .filter(name => name.length > 0);
  }
  
  let availableAuditors = selMembers.filter(m => 
    !peopleInCharge.includes(m.name.trim().toLowerCase())
  );
  
  if(availableAuditors.length === 0) {
    alert(`No available auditors for ${studyObj.name}. All selected team members are in charge of this study (${studyObj.personInCharge}).`);
    document.getElementById('spinBtn').disabled = false;
    return;
  }
  
  let memberIdx = Math.floor(Math.random() * availableAuditors.length);
  
  // Animate study selection
  animateSpin('studySpin', selStudies.map(s=>s.name), studyIdx, ()=>{
    let studyObj = selStudies[studyIdx];
    let participantCount = studyObj.participants > 0 ? studyObj.participants : studyObj.expected;
    
    // Animate member selection with available auditors only
    animateSpin('memberSpin', availableAuditors.map(m=>m.name), memberIdx, ()=>{
      let memberObj = availableAuditors[memberIdx];
      let toAudit = Math.ceil((auditPct/100)*participantCount);
      let date = new Date().toLocaleString();
      
      // Display result in studySpin only
      document.getElementById('studySpin').innerHTML = 
        `🎯 <b>${studyObj.name}</b> selected, audit <b>${toAudit}/${participantCount}</b> participants.<br>
        🕵️ Auditor: <b>${memberObj.name}</b>`;
      document.getElementById('memberSpin').innerHTML = '';
      
      // Log row
      log.push({date, study:studyObj.name, participants:participantCount, toAudit, member:memberObj.name});
      renderLog();
      
      // Add to audit history
      auditHistory.push({
        id: Date.now(),
        date: date,
        study: studyObj.name,
        participants: participantCount,
        toAudit: toAudit,
        auditor: memberObj.name,
        completed: false
      });
      saveAuditHistory();
      
      // Re-enable button
      document.getElementById('spinBtn').disabled = false;
    });
  });
}

function animateSpin(divId, items, winnerIdx, cb) {
  let div = document.getElementById(divId);
  let currentIdx = 0;
  let spinsRemaining = 20 + Math.floor(Math.random() * 10); // Total spins before stopping
  let currentDelay = 50;
  
  function tick() {
    // Show current item
    div.innerHTML = '🎲 ' + items[currentIdx];
    
    spinsRemaining--;
    
    // Check if we should stop
    if (spinsRemaining <= 0 && currentIdx === winnerIdx) {
      // Found winner, stop here
      setTimeout(cb, 300);
      return;
    }
    
    // Move to next item
    currentIdx = (currentIdx + 1) % items.length;
    
    // Slow down near the end
    if (spinsRemaining < 10) {
      currentDelay += 20;
    }
    
    setTimeout(tick, currentDelay);
  }
  
  tick();
}

function randomStudyOnly() {
  let selStudies = studies.filter(s=>s.selected);
  if(selStudies.length===0) {
    alert('You must have at least one study selected!');
    return;
  }
  
  // Clear member result
  document.getElementById('memberSpin').innerHTML = '';
  
  // Pick winner immediately
  let studyIdx = Math.floor(Math.random() * selStudies.length);
  
  // Animate study selection
  animateSpin('studySpin', selStudies.map(s=>s.name), studyIdx, ()=>{
    let studyObj = selStudies[studyIdx];
    let pct = parseInt(document.getElementById('auditPct').value) || 30;
    let toAudit = Math.max(1, Math.round(studyObj.participants * pct / 100));
    document.getElementById('studySpin').innerHTML = `📚 Selected Study: <b>${studyObj.name}</b><br>Participants: ${studyObj.participants} → Audit: ${toAudit}`;
  });
}

function showResult(studyObj, memberObj, toAudit, error, html) {
  let participantCount = studyObj.participants > 0 ? studyObj.participants : studyObj.expected;
  document.getElementById('studySpin').innerHTML = error? html : `Study: <b>${studyObj.name}</b> (${participantCount} participants)<br>To audit: <b>${toAudit}</b>`;
  document.getElementById('memberSpin').innerHTML = error? "" : `Auditor: <b>${memberObj.name}</b>`;
  if (html) document.getElementById('studySpin').innerHTML = html;
}

function renderLog() {
  let tbody = document.querySelector("#logTable tbody");
  tbody.innerHTML = log.map(row=>
    `<tr>
      <td>${row.date}</td>
      <td>${row.study}</td>
      <td>${row.participants}</td>
      <td>${row.toAudit}</td>
      <td>${row.member}</td>
    </tr>`).join('');
}

function downloadLog() {
  if (!log.length) return;
  let csv = 'Date,Study,Participants,To Audit,Auditor\n'+
    log.map(r=>[r.date, r.study, r.participants, r.toAudit, r.member].join(',')).join('\n');
  let blob = new Blob([csv],{type:'text/csv'});
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'audit_log.csv';
  a.click();
}

// Audit History Functions
function renderAuditHistory() {
  const container = document.getElementById('historyList');
  if (!auditHistory.length) {
    container.innerHTML = '<p style="color:#999; font-style:italic;">No audits have been assigned yet. Spin the roulette to create audit assignments.</p>';
    return;
  }
  
  // Sort by date, newest first
  const sorted = [...auditHistory].reverse();
  
  container.innerHTML = sorted.map(audit => `
    <div class="history-item ${audit.completed ? 'completed' : ''}">
      <div class="history-header">
        <div>
          <strong style="font-size:1.1em;">${audit.study}</strong>
          <div class="history-details">
            👤 Auditor: <strong>${audit.auditor}</strong> | 
            📊 To Audit: <strong>${audit.toAudit}/${audit.participants}</strong> participants
          </div>
          <div class="history-details" style="color:#888;">
            📅 ${audit.date}
          </div>
        </div>
        <label class="checkbox-label">
          <input type="checkbox" 
                 ${audit.completed ? 'checked' : ''} 
                 onchange="toggleAuditComplete(${audit.id})" />
          <span>${audit.completed ? '✅ Completed' : 'Mark Complete'}</span>
        </label>
      </div>
    </div>
  `).join('');
}

function toggleAuditComplete(auditId) {
  const audit = auditHistory.find(a => a.id === auditId);
  if (audit) {
    audit.completed = !audit.completed;
    saveAuditHistory();
  }
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all audit history? This cannot be undone.')) {
    auditHistory = [];
    saveAuditHistory();
  }
}

function exportHistory() {
  if (!auditHistory.length) return;
  let csv = 'Date,Study,Participants,To Audit,Auditor,Status\n'+
    auditHistory.map(a=>[
      a.date, 
      a.study, 
      a.participants, 
      a.toAudit, 
      a.auditor,
      a.completed ? 'Completed' : 'Pending'
    ].join(',')).join('\n');
  let blob = new Blob([csv],{type:'text/csv'});
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'audit_history.csv';
  a.click();
}

// Load history when page loads
window.addEventListener('DOMContentLoaded', function() {
  loadAuditHistory();
  loadTeamJSON(); // Automatically load team.json on page load
});
