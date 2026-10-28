const $=id=>document.getElementById(id);
const defaultTasks="Parse, Compile-A, Compile-B, Link";
const defaultDeps="Parse Compile-A\\nParse Compile-B\\nCompile-A Link\\nCompile-B Link";
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function drawGraph(tasks,edges,cycle=false,cycleTasks=[]){
 const box=$("graph"); if(!tasks.length){box.innerHTML='<span class="sub">Add tasks to visualize the dependency graph.</span>';return;}
 const W=360,H=260,r=29,pos={},ind=Object.fromEntries(tasks.map(t=>[t,0])),layer=Object.fromEntries(tasks.map(t=>[t,0]));
 edges.forEach(e=>{if(ind[e.target]!==undefined)ind[e.target]++});
 const roots=tasks.filter(t=>ind[t]===0), q=[...roots]; let seen=[];
 const incoming={...ind};
 for(let i=0;i<q.length;i++){let n=q[i];seen.push(n);edges.filter(e=>e.source===n).forEach(e=>{layer[e.target]=Math.max(layer[e.target],layer[n]+1);incoming[e.target]--;if(incoming[e.target]===0)q.push(e.target)})}
 const cyclic=cycle||seen.length!==tasks.length;
 if(cyclic||!roots.length){tasks.forEach((t,i)=>{let a=-Math.PI/2+2*Math.PI*i/tasks.length;pos[t]={x:W/2+Math.min(W,H)*.32*Math.cos(a),y:H/2+Math.min(W,H)*.32*Math.sin(a)}})}
 else {let max=Math.max(0,...Object.values(layer)),groups={};tasks.forEach(t=>(groups[layer[t]]??=[]).push(t));Object.keys(groups).forEach(k=>groups[k].forEach((t,i)=>pos[t]={x:max?45+Number(k)*(W-90)/max:W/2,y:H/(groups[k].length+1)*(i+1)}))}
 let svg=`<svg viewBox="0 0 ${W} ${H}"><defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="#7b8ea5"/></marker></defs>`;
 edges.forEach(e=>{let a=pos[e.source],b=pos[e.target];if(!a||!b)return;let dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;svg+=`<line class="edge" x1="${a.x+dx/l*24}" y1="${a.y+dy/l*24}" x2="${b.x-dx/l*(r+7)}" y2="${b.y-dy/l*(r+7)}" marker-end="url(#arr)" ${cyclic?'stroke="#c65b65"':''}/>`});
 const fills=["#eee8ff","#def5e6","#e3efff","#fff0df"],strokes=["#9570e8","#46a86c","#4787e8","#e1a14e"];
 tasks.forEach((t,i)=>{let p=pos[t],bad=cyclic&&cycleTasks.includes(t),label=t.length>12?t.slice(0,11)+"…":t;svg+=`<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${bad?'#ffe2e4':fills[i%4]}" stroke="${bad?'#d95d67':strokes[i%4]}" stroke-width="1.6"/><text class="node-label" x="${p.x}" y="${p.y}">${esc(label)}</text>`});
 box.innerHTML=svg+"</svg>";
}
function renderOrder(order,valid){$("order").innerHTML=valid?(order.length?order.map((t,i)=>`<span class="chip">${esc(t)}</span>${i<order.length-1?'<span class="arrow">→</span>':''}`).join(""):'<span class="sub">No tasks to process — empty order.</span>'):'<span class="sub">No valid execution order available.</span>'}
async function run(){
 $("error").textContent="";$("run").disabled=true;
 try{
  let res=await fetch("/api/schedule",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tasks:$("tasks").value,dependencies:$("deps").value})});
  let d=await res.json();if(!res.ok)throw Error(d.message||"Please check your input.");
  let valid=d.status==="Valid Execution Order",cycle=d.status==="Cycle detected";
  $("banner").classList.toggle("bad",!valid);$("symbol").textContent=valid?"✓":"!";$("status").textContent=d.status;$("statusnote").textContent=valid?"Dependency rules satisfied":(cycle?"Review the dependency loop":"Check your input");
  $("message").textContent=d.message;renderOrder(d.order||[],valid);$("v").textContent=(d.tasks||[]).length;$("e").textContent=(d.graph||[]).length;drawGraph(d.tasks||[],d.graph||[],cycle,d.cycle_tasks||[]);
 }catch(e){$("error").textContent=e.message}finally{$("run").disabled=false}
}
$("run").addEventListener("click",run);
$("reset").addEventListener("click",()=>{$("tasks").value=defaultTasks;$("deps").value=defaultDeps;run()});
$("refresh").addEventListener("click",loadTests);
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n===b));
 let about=b.dataset.view==="about";$("about").classList.toggle("hidden",!about);$("home").classList.toggle("hidden",about);
 if(b.dataset.view==="scheduler")$("tasks").focus();
 if(b.dataset.view==="tests")$("testpanel").scrollIntoView({behavior:"smooth"});
 if(b.dataset.view==="home")window.scrollTo({top:0,behavior:"smooth"});
}));
async function loadTests(){try{let r=await fetch("/api/test-cases"),cases=await r.json();$("testrows").innerHTML=cases.map((c,i)=>`<tr><td>${i+1}. ${esc(c.name)}</td><td>${esc(c.size)}</td><td>${esc(c.expected)}</td><td>${c.name==="Directed cycle"?'<b style="color:#b6414b">Cycle detected</b>':esc(c.actual)}</td><td>${esc(c.analysis)}</td></tr>`).join("")}catch(e){}}
drawGraph(["Parse","Compile-A","Compile-B","Link"],[{source:"Parse",target:"Compile-A"},{source:"Parse",target:"Compile-B"},{source:"Compile-A",target:"Link"},{source:"Compile-B",target:"Link"}]);loadTests();
