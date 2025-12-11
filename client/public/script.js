// client/script.js (API-backed version)
// NOTE: Backend deployed on Render

const API_BASE = 'https://mern1-backend-bpl9.onrender.com/api/students';

let students = [];
let coChart = null;
let poChart = null;

/** Load students from server and render */
/** Load students from server and render */
async function loadStudents() {
  try {
    const res = await fetch(API_BASE);
    let data = await res.json();

    // Normalize: ensure each student has a `roll` field for the UI
    students = data.map(s => ({
      ...s,
      // prefer existing `roll` if present, otherwise fallback to DB `rollNumber`
      roll: s.roll ?? s.rollNumber ?? '',
      // normalize avg: prefer avg, otherwise use percentage if available
      avg: (s.avg !== undefined ? Number(s.avg).toFixed(2) :
            (s.percentage !== undefined ? Number(s.percentage).toFixed(2) : ''))
    }));

    // sort by numeric roll when possible
    students.sort((a, b) => {
      const ai = parseInt(a.roll) || 0;
      const bi = parseInt(b.roll) || 0;
      return ai - bi;
    });

    updateTable();
    updateDropdown();
  } catch (err) {
    console.error('Failed to load students:', err);
    alert('Could not load students from server. Make sure the server is running.');
  }
}


/** Add student (POST to server) */
async function addStudent() {
  let name = document.getElementById("name").value.trim();
  let roll = document.getElementById("roll").value.trim();
  let co1 = parseFloat(document.getElementById("co1").value);
  let co2 = parseFloat(document.getElementById("co2").value);
  let co3 = parseFloat(document.getElementById("co3").value);

  if (!name || !roll || isNaN(co1) || isNaN(co2) || isNaN(co3)) {
    alert("Please fill all fields");
    return;
  }

  try {
    const payload = { name, roll, co1, co2, co3 };
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Server rejected the student: ' + (await res.text()));
    const saved = await res.json();
    // push to local list and re-render
    students.push({ ...saved, avg: (saved.avg !== undefined ? Number(saved.avg).toFixed(2) : '') });
    students.sort((a, b) => parseInt(a.roll) - parseInt(b.roll));
    updateTable();
    updateDropdown();

    // clear inputs
    document.getElementById("name").value = "";
    document.getElementById("roll").value = "";
    document.getElementById("co1").value = "";
    document.getElementById("co2").value = "";
    document.getElementById("co3").value = "";
  } catch (err) {
    console.error('Add student failed:', err);
    alert('Failed to add student. See console for details.');
  }
}

/** Delete student by DB id */
async function deleteStudent(id) {
  if (!confirm('Delete this student?')) return;
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    students = students.filter(s => s._id !== id);
    updateTable();
    updateDropdown();
    // clear charts/info if that student was selected
    const rollSel = document.getElementById('rollSelect').value;
    if (!rollSel) {
      document.getElementById("studentInfo").innerHTML = "";
      if (coChart instanceof Chart) coChart.destroy();
    }
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete student.');
  }
}

/** Render the student table with delete buttons */
function updateTable() {
  let table = document.getElementById("studentTable");
  table.innerHTML = `<tr>
    <th>Name</th><th>Roll</th><th>CIE1</th><th>CIE2</th><th>CIE3</th><th>Average</th><th>Action</th>
  </tr>`;
  students.forEach(s => {
    table.innerHTML += `<tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.roll)}</td>
      <td>${s.co1}</td><td>${s.co2}</td><td>${s.co3}</td>
      <td>${s.avg}</td>
      <td><button onclick="deleteStudent('${s._id || ''}')">Delete</button></td>
    </tr>`;
  });
}

/** Update roll dropdown */
function updateDropdown() {
  let select = document.getElementById("rollSelect");
  select.innerHTML = `<option value="">-- Select --</option>`;
  students.forEach(s => {
    let opt = document.createElement("option");
    opt.value = s.roll;
    opt.text = s.roll;
    select.add(opt);
  });
}

/** Show selected student's performance (keep previous Chart.js logic) */
function showStudentPerformance() {
  let roll = document.getElementById("rollSelect").value;
  if (!roll) {
    document.getElementById("studentInfo").innerHTML = "";
    if (coChart instanceof Chart) coChart.destroy();
    return;
  }

  let student = students.find(s => s.roll === roll);
  if (!student) return;

  document.getElementById("studentInfo").innerHTML = `<h3>${escapeHtml(student.name)}</h3>`;

  let ctx = document.getElementById("coChart").getContext("2d");
  if (coChart instanceof Chart) coChart.destroy();
  coChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["CIE1","CIE2","CIE3"],
      datasets:[{
        label:"Marks",
        data:[student.co1, student.co2, student.co3],
        backgroundColor:["#3498db","#2ecc71","#9b59b6"]
      }]
    },
    options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,max:100,ticks:{stepSize:10}}}}
  });
}

/** Calculate attainment by calling server endpoint (optional) */
async function calculateAttainment() {
  if (students.length === 0) { alert("Add students first"); return; }
  // Read mapping from DOM and build mapping object expected by server
  const mapping = {
    co1: { po1: parseFloat(document.getElementById('map-co1-po1').value)||0, po2: parseFloat(document.getElementById('map-co1-po2').value)||0, po3: parseFloat(document.getElementById('map-co1-po3').value)||0 },
    co2: { po1: parseFloat(document.getElementById('map-co2-po1').value)||0, po2: parseFloat(document.getElementById('map-co2-po2').value)||0, po3: parseFloat(document.getElementById('map-co2-po3').value)||0 },
    co3: { po1: parseFloat(document.getElementById('map-co3-po1').value)||0, po2: parseFloat(document.getElementById('map-co3-po2').value)||0, po3: parseFloat(document.getElementById('map-co3-po3').value)||0 }
  };

  try {
    const res = await fetch(`${API_BASE}/attainment`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ threshold: 40, mapping })
    });
    if (!res.ok) throw new Error('Attainment calculation failed');
    const { coAtt, poAtt } = await res.json();

    let out = "<div class='att-grid'><div class='att-col'><h3>CIE Attainment (%)</h3>";
    for(let i=0;i<3;i++) out += `<p>CIE${i+1}: ${coAtt[i].toFixed(2)}%</p>`;
    out += "</div><div class='att-col'><h3>Skills Attainment (%)</h3>";
    for(let i=0;i<3;i++) out += `<p>Skills ${i+1}: ${poAtt[i]}%</p>`;
    out += "</div></div>";
    document.getElementById("attainmentOutput").innerHTML = out;

    let ctx = document.getElementById("poChart").getContext("2d");
    if(poChart instanceof Chart) poChart.destroy();
    poChart = new Chart(ctx,{
      type:"bar",
      data:{labels:["Front End","Back end ","Database"],datasets:[{label:"PO Attainment (%)",data:poAtt,backgroundColor:["#f39c12","#27ae60","#2980b9"]}]},
      options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100,ticks:{stepSize:10}}}}
    });
  } catch (err) {
    console.error(err);
    alert('Failed to calculate attainment on server. See console.');
  }
}

/** Clear all (clears server too by deleting each) */
async function clearAll(){
  if(!confirm("Clear all students and results?")) return;
  // delete all students from server one-by-one
  for (const s of [...students]) {
    if (s._id) {
      try {
        await fetch(`${API_BASE}/${s._id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Failed to delete', s._id, err);
      }
    }
  }
  students = [];
  updateTable();
  updateDropdown();
  if(coChart instanceof Chart) coChart.destroy();
  if(poChart instanceof Chart) poChart.destroy();
  document.getElementById("attainmentOutput").innerHTML="";
  document.getElementById("studentInfo").innerHTML="";
}

/** small helper to avoid HTML injection */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/** init */
window.addEventListener('DOMContentLoaded', () => {
  // wire buttons to functions (keeps existing inline onclicks working too)
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.trim().toLowerCase() === 'calculate attainment') {
      btn.addEventListener('click', calculateAttainment);
    }
    if (btn.textContent.trim().toLowerCase() === 'clear all') {
      btn.addEventListener('click', clearAll);
    }
  });

  // initially load data from server
  loadStudents();
});
