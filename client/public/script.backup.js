let students = [];
let coChart = null;
let poChart = null;

function addStudent() {
  let name = document.getElementById("name").value.trim();
  let roll = document.getElementById("roll").value.trim();
  let co1 = parseFloat(document.getElementById("co1").value);
  let co2 = parseFloat(document.getElementById("co2").value);
  let co3 = parseFloat(document.getElementById("co3").value);

  if (!name || !roll || isNaN(co1) || isNaN(co2) || isNaN(co3)) {
    alert("Please fill all fields");
    return;
  }

  let avg = ((co1 + co2 + co3) / 3).toFixed(2);
  students.push({ name, roll, co1, co2, co3, avg });
  students.sort((a, b) => parseInt(a.roll) - parseInt(b.roll));

  updateTable();
  updateDropdown();

  document.getElementById("name").value = "";
  document.getElementById("roll").value = "";
  document.getElementById("co1").value = "";
  document.getElementById("co2").value = "";
  document.getElementById("co3").value = "";
}

function updateTable() {
  let table = document.getElementById("studentTable");
  table.innerHTML = `<tr>
    <th>Name</th><th>Roll</th><th>CIE1</th><th>CIE2</th><th>CIE3</th><th>Average</th>
  </tr>`;
  students.forEach(s => {
    table.innerHTML += `<tr>
      <td>${s.name}</td><td>${s.roll}</td>
      <td>${s.co1}</td><td>${s.co2}</td><td>${s.co3}</td><td>${s.avg}</td>
    </tr>`;
  });
}

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

function showStudentPerformance() {
  let roll = document.getElementById("rollSelect").value;
  if (!roll) return;

  let student = students.find(s => s.roll === roll);
  document.getElementById("studentInfo").innerHTML = `<h3>${student.name}</h3>`;

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

function calculateAttainment() {
  if (students.length === 0) { alert("Add students first"); return; }
  let threshold = 40;
  let coAtt = [];
  for(let i=1;i<=3;i++){
    let count = students.filter(s=>s["co"+i]>=threshold).length;
    coAtt.push((count/students.length)*100);
  }

  let poAtt = [];
  for(let p=1;p<=3;p++){
    let weightedSum=0, weightTotal=0;
    for(let c=1;c<=3;c++){ 
      let w = parseFloat(document.getElementById(`map-co${c}-po${p}`).value)||0;
      weightedSum += coAtt[c-1]*w;
      weightTotal += w;
    }
    poAtt.push(weightedSum>0 ? (weightedSum/weightTotal).toFixed(2) : 0);
  }

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
}

function clearAll(){
  if(!confirm("Clear all students and results?")) return;
  students=[];
  updateTable();
  updateDropdown();
  if(coChart instanceof Chart) coChart.destroy();
  if(poChart instanceof Chart) poChart.destroy();
  document.getElementById("attainmentOutput").innerHTML="";
  document.getElementById("studentInfo").innerHTML="";
}
