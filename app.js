import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, onSnapshot, doc, updateDoc, query, where, getDocs, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCoM00m6KgrWHOn_UB9_Qf9MAowGtovZSA".replace("GtovGtov","Gtov"),
  authDomain: "sister-accountability-app.firebaseapp.com",
  projectId: "sister-accountability-app",
  storageBucket: "sister-accountability-app.firebasestorage.app",
  messagingSenderId: "311794164387",
  appId: "1:311794164387:web:ccb0dbc236fe8111d51516",
  measurementId: "G-S95T59VWRJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
const DEADLINE = "2027-02-12";
const ATTENDANCE_TIME = "04:30";
const MAX_DAILY = 5;
let stopTasks = null;
let allTasks = [];
let currentUser = null;

const CURRICULUM = [
  // foundation
  ["computer-fundamentals","Computer Fundamentals","foundation",1,[]],
  ["internet-fundamentals","Internet Fundamentals","foundation",1,["computer-fundamentals"]],
  ["number-system","Number System & Binary","foundation",1,["computer-fundamentals"]],
  ["cli","CLI / Terminal Basics","foundation",1,["computer-fundamentals"]],
  ["git","Git","engineering",2,["cli"]],
  ["github","GitHub","engineering",2,["git"]],
  ["linux","Linux","engineering",2,["cli"]],
  ["vscode","VS Code","engineering",1,["cli"]],
  // programming
  ["python-basics","Python","programming",3,["cli","vscode"]],
  ["python-oop","Python OOP","programming",3,["python-basics"]],
  ["java-basics","Java Basics","programming",2,["python-basics"]],
  ["debugging","Debugging","programming",2,["python-basics"]],
  ["problem-solving","Problem Solving Basics","programming",3,["python-basics"]],
  // web
  ["html","HTML","web",2,["internet-fundamentals"]],
  ["css","CSS","web",2,["html"]],
  ["responsive","Responsive Design","web",2,["css"]],
  ["javascript","JavaScript","web",3,["html","css"]],
  ["dom","Browser & DOM","web",3,["javascript"]],
  ["static-web","Static Websites","web",2,["html","css","javascript"]],
  ["react","React","web",3,["javascript","dom"]],
  ["redux","Redux Basics","web",2,["react"]],
  ["https","HTTPS","backend",1,["internet-fundamentals"]],
  ["rest","REST API","backend",2,["javascript","https"]],
  ["json","JSON","backend",1,["javascript"]],
  // backend
  ["node","Node.js","backend",2,["javascript"]],
  ["express","Express.js","backend",2,["node","rest"]],
  ["sql","SQL","backend",3,["problem-solving"]],
  ["postgresql","PostgreSQL","backend",3,["sql"]],
  ["mongodb","MongoDB","backend",2,["sql"]],
  ["supabase","Supabase","backend",2,["postgresql"]],
  ["fastapi","FastAPI","backend",3,["python-basics","rest"]],
  ["auth","Authentication JWT OAuth","backend",3,["fastapi","rest"]],
  ["file-upload","File Upload","backend",2,["fastapi"]],
  ["email-service","Email Service","backend",2,["fastapi"]],
  ["api-docs","API Documentation","engineering",2,["rest"]],
  // engineering
  ["complexity","Time & Space Complexity","dsa",3,["problem-solving"]],
  ["dsa","DSA","dsa",5,["python-basics","complexity"]],
  ["cp-basics","Competitive Programming Basics","dsa",2,["dsa"]],
  ["clean-code","Clean Code","engineering",2,["python-oop"]],
  ["solid","SOLID Principles","engineering",2,["python-oop","clean-code"]],
  ["design-patterns","Design Patterns","engineering",2,["solid"]],
  ["refactoring","Refactoring","engineering",2,["clean-code"]],
  ["testing","Testing","engineering",2,["python-basics"]],
  ["logging","Logging","engineering",1,["python-basics"]],
  ["git-workflow","Git Workflow","engineering",2,["git","github"]],
  ["cicd","CI/CD","engineering",2,["git-workflow"]],
  ["docker","Docker","engineering",3,["linux","fastapi"]],
  ["kubernetes","Kubernetes Basics","engineering",1,["docker"]],
  ["redis","Redis","engineering",1,["express"]],
  ["messaging","RabbitMQ / Kafka Basics","engineering",1,["express"]],
  ["agile","Agile & Scrum","engineering",1,["git-workflow"]],
  // CS
  ["os","Operating Systems","cs",3,["computer-fundamentals"]],
  ["dbms","DBMS","cs",3,["sql"]],
  ["networks","Computer Networks","cs",3,["internet-fundamentals"]],
  ["coa","Computer Organization & Architecture","cs",2,["number-system"]],
  ["compiler","Compiler Basics","cs",1,["computer-fundamentals"]],
  ["system-design","System Design Basics","cs",3,["networks","dbms","dsa"]],
  // ML/DL
  ["math-ml","Mathematics for ML","ml",4,["number-system"]],
  ["ml","Machine Learning","ml",4,["math-ml","python-basics"]],
  ["neural-networks","Neural Networks","dl",4,["ml"]],
  ["pytorch","PyTorch","dl",3,["neural-networks"]],
  ["tensorflow","TensorFlow Familiarity","dl",1,["neural-networks"]],
  ["cnn-fnn","CNN / FNN","dl",3,["pytorch"]],
  ["rnn","RNN","dl",2,["pytorch"]],
  ["lstm-gru","LSTM / GRU","dl",2,["rnn"]],
  ["attention","Attention","genai",3,["lstm-gru"]],
  ["transformers","Transformers","genai",5,["attention"]],
  ["finetuning","Fine-tuning","genai",3,["transformers"]],
  // GenAI
  ["llm","LLM Fundamentals","genai",5,["transformers"]],
  ["nlp","NLP","genai",3,["ml","llm"]],
  ["prompt","Prompt Engineering","genai",3,["llm"]],
  ["huggingface","Hugging Face","genai",3,["llm","python-basics"]],
  ["ollama","Ollama","genai",2,["llm"]],
  ["embeddings","Embeddings","genai",3,["llm"]],
  ["vector-db","Vector Database","genai",3,["embeddings","sql"]],
  ["rag","RAG","genai",5,["embeddings","vector-db","llm"]],
  ["langchain","LangChain","genai",2,["rag"]],
  ["langgraph","LangGraph","genai",3,["langchain"]],
  ["llamaindex","LlamaIndex","genai",2,["rag"]],
  ["mcp","MCP","genai",3,["langgraph"]],
  ["crewai","CrewAI","agents",2,["mcp","langgraph"]],
  ["multi-agent","Multi-Agent Systems","agents",4,["crewai"]],
  ["eval","AI Evaluation","production",4,["rag","llm"]],
  ["guardrails","AI Guardrails","production",3,["eval"]],
  // automation/cloud
  ["n8n","n8n","automation",2,["rest","api-docs"]],
  ["zapier","Zapier","automation",1,["rest"]],
  ["aws","AWS IAM / EC2 / S3 / RDS / Lambda","cloud",4,["linux","docker"]],
  ["azure-ai","Azure AI","cloud",1,["aws"]],
  ["firebase","Firebase Basics","cloud",2,["javascript"]],
  ["deployment","Deployment","cloud",3,["docker","aws"]],
  ["monitoring","Monitoring","production",2,["deployment"]],
  ["docker-deploy","Docker Deployment","production",3,["docker","deployment"]],
  // proof goals
  ["project-portfolio","Portfolio Project","project",5,["github","fastapi","react"]],
  ["internship-prep","November Internship Prep","career",5,["dsa","github","project-portfolio"]],
  ["gsoc-open-source","GSoC / Open Source","career",4,["git","github","problem-solving"]],
  ["gate","GATE Preparation","gate",4,["problem-solving","math-ml"]],
  ["english","English Communication","communication",2,[]],
  ["youtube","YouTube / Personal Brand","brand",1,[]],
  ["startup","Startup / AI Automation","business",1,["python-basics","n8n"]],
  ["fitness","Fitness","fitness",1,[]]
];

const modules = new Map(CURRICULUM.map(([id,name,category,weight,prereqs])=>[id,{id,name,category,weight,prereqs}]));

const PHRASES = {
  foundation:["Learn the concept in simple words","Make 5 recall questions"],
  programming:["Code the concept from memory","Solve 3 small programs"],
  web:["Build a tiny working example","Explain the concept without notes"],
  backend:["Build one API/example","Test the API with real input"],
  dsa:["Solve 3 problems","Write the approach + Big-O"],
  engineering:["Apply it to a small codebase","Write one practical checklist"],
  cs:["Study one core concept","Answer 10 exam/interview questions"],
  ml:["Learn with one numeric example","Solve 5 concept questions"],
  dl:["Implement a tiny example","Explain the architecture"],
  genai:["Build a minimal working example","Test it with 3 inputs"],
  agents:["Build one small agent workflow","Test failure and success cases"],
  production:["Add one reliability/evaluation check","Document the design"],
  automation:["Build one automation workflow","Test one failure path"],
  cloud:["Deploy or configure one small component","Write the deployment steps"],
  project:["Produce a GitHub artifact","Write a short README update"],
  career:["Create one proof-of-skill artifact","Record what was learned"],
  gate:["Solve 10 GATE questions","Review every mistake"],
  communication:["Speak for 5 minutes","Write 150 words and self-correct"],
  brand:["Create one useful content asset","Publish or prepare it for publishing"],
  business:["Validate one small idea","Document one user/problem insight"],
  fitness:["Complete today's planned workout","Log completion honestly"]
};

function dateStr(d=new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function addDays(s,n){const d=new Date(`${s}T00:00:00`);d.setDate(d.getDate()+n);return dateStr(d);}
function pretty(s){return new Date(`${s}T00:00:00`).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}).toUpperCase();}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function daysLeft(){return Math.max(1,Math.ceil((new Date(`${DEADLINE}T23:59:59`)-new Date())/86400000));}

function ensureEnginePanel(){
  if($("enginePanel")) return;
  const card=document.createElement("section");
  card.className="card"; card.id="enginePanel";
  card.innerHTML=`<div class="card-title"><h2>🧠 JARVIS TASK ENGINE</h2><small>ADAPTIVE ROADMAP</small></div>
  <div id="engineText" style="color:#aeb5ba;line-height:1.7;font-size:13px"></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button id="addManualTask" style="padding:10px 14px;border-radius:9px;border:1px solid #394047;background:#0c1012;color:#fff;cursor:pointer">+ Add Real-Life Task</button><button id="checkIn430" style="padding:10px 14px;border-radius:9px;border:1px solid #394047;background:#0c1012;color:#fff;cursor:pointer">04:30 AM Check-in</button></div>`;
  $("taskList").parentElement.appendChild(card);
  $("addManualTask").onclick=()=>addManualTask();
  $("checkIn430").onclick=()=>checkAttendance();
}

function scoreModule(m, skills, history, todayTasks, settings={}){
  const s=skills[m.id]||{};
  if(s.status==="mastered") return -Infinity;
  if(m.prereqs.some(p=>(skills[p]?.status||"not_started")==="not_started")) return -Infinity;
  let score=m.weight*10;
  if(s.status==="tested") score+=12;
  if(s.status==="practicing") score+=8;
  if(s.status==="learning") score+=5;
  if(s.status==="failed") score+=25;
  if(s.revisionDue && s.revisionDue<=dateStr()) score+=18;
  if(["internship-prep","gsoc-open-source","gate","project-portfolio"].includes(m.id)) score+=18;
  if(m.category==="genai") score+=8;
  const pressure=Math.max(0,20-Math.floor(daysLeft()/14));
  if(["internship-prep","gate","gsoc-open-source","project-portfolio"].includes(m.id)) score+=pressure;
  if(m.category==="fitness"||m.category==="communication") score+=5;
  if(m.id==="youtube"||m.id==="startup") score+=2;
  const focus=settings.focusMode||"balanced";
  if(focus==="internship" && ["internship-prep","dsa","project-portfolio","github","python-basics"].includes(m.id)) score+=22;
  if(focus==="gate" && ["gate","math-ml","dsa","cs","networks","os","dbms"].includes(m.id)) score+=22;
  if(focus==="genai" && ["llm","rag","transformers","python-basics","embeddings","vector-db","mcp","eval"].includes(m.id)) score+=22;
  return score;
}

function buildMission(m, skills){
  const s=skills[m.id]||{};
  const action=(PHRASES[m.category]||PHRASES.foundation)[s.status==="practicing"?1:0];
  const level=s.status||"not_started";
  const text=`${m.name}: ${action}`;
  const why = m.category==="career"||m.category==="project" ? "Direct career proof" :
    m.category==="gate" ? "GATE preparation" :
    m.category==="genai" ? "GenAI Engineer roadmap" : "Prerequisite / skill progression";
  const output = m.category==="dsa"||m.category==="gate" ? "Solved questions + mistakes" :
    m.category==="project"||m.category==="career" ? "GitHub/output proof" : "Working example or written test";
  return {text,skillId:m.id,category:m.category,priority:m.weight>=4?"critical":m.weight>=2?"important":"supporting",
    difficulty:Math.min(5,(s.difficulty||1)+(s.status==="failed"?0:1)),proofRequired:m.weight>=4||["project","career","gate"].includes(m.category),
    level,why,output,effort:m.weight>=4?"45-60 min":m.weight>=2?"30-45 min":"15-30 min"};
}

async function loadState(uid){
  const [skillsSnap,taskSnap]=await Promise.all([
    getDocs(query(collection(db,"skills"),where("userId","==",uid))),
    getDocs(query(collection(db,"tasks"),where("userId","==",uid)))
  ]);
  const skills={}; skillsSnap.forEach(d=>{const v=d.data(); skills[v.skillId||d.id]=v;});
  const tasks=[]; taskSnap.forEach(d=>tasks.push({id:d.id,...d.data()}));
  return {skills,tasks};
}

async function seedSkills(uid){
  const snap=await getDocs(query(collection(db,"skills"),where("userId","==",uid)));
  if(!snap.empty) return;
  const batch=[];
  for(const m of modules.values()) batch.push(setDoc(doc(db,"skills",`${uid}_${m.id}`),{userId:uid,skillId:m.id,name:m.name,status:"not_started",progress:0,confidence:0,difficulty:1,updatedAt:serverTimestamp()}));
  await Promise.all(batch);
}

async function getSettings(uid){
  const snap=await getDoc(doc(db,"users",uid));
  const d=snap.exists()?snap.data():{};
  return {
    dailyCapacity:Number(d.dailyCapacity)||3,
    collegeLoad:d.collegeLoad||"normal",
    focusMode:d.focusMode||"balanced"
  };
}

async function configureSystem(){
  if(!currentUser)return;
  const current=await getSettings(currentUser.uid);
  const cap=prompt("Daily study capacity (1-5 missions):",String(current.dailyCapacity));
  if(cap===null)return;
  const dailyCapacity=Math.max(1,Math.min(5,Number(cap)||3));
  const collegeLoad=prompt("College workload today/usually: low / normal / high",current.collegeLoad)||current.collegeLoad;
  const focusMode=prompt("Focus mode: balanced / internship / gate / genai",current.focusMode)||current.focusMode;
  await setDoc(doc(db,"users",currentUser.uid),{userId:currentUser.uid,dailyCapacity,collegeLoad,focusMode,updatedAt:serverTimestamp()},{merge:true});
  alert("System settings saved. Refresh/generate missions to apply.");
}

async function generateDailyMissions(uid, force=false){
  const {skills,tasks}=await loadState(uid);
  const settings=await getSettings(uid);
  const today=dateStr();
  const existing=tasks.filter(t=>t.date===today);
  if(existing.some(t=>t.source==="engine") && !force) return existing;
  if(existing.length>=MAX_DAILY && !force) return existing;

  const todayTasks=existing;
  const chosen=[];
  const used=new Set(todayTasks.map(t=>t.skillId).filter(Boolean));
  const candidates=[...modules.values()].map(m=>({m,score:scoreModule(m,skills,{},todayTasks,settings)})).filter(x=>Number.isFinite(x.score)).sort((a,b)=>b.score-a.score);
  const capacity=settings.collegeLoad==="high"?Math.max(1,settings.dailyCapacity-1):settings.dailyCapacity;

  // One core learning task, one DSA/GATE task, one GenAI/engineering task, one career/proof task, one non-negotiable.
  const buckets=[
    m=>["programming","dsa","cs","ml"].includes(m.category),
    m=>m.category==="dsa"||m.id==="gate",
    m=>["genai","dl","backend","engineering","cloud"].includes(m.category),
    m=>["career","project","communication","brand","business"].includes(m.category),
    m=>m.id==="english"||m.id==="fitness"
  ];
  for(const bucket of buckets){
    const pick=candidates.find(x=>bucket(x.m)&&!used.has(x.m.id));
    if(pick){chosen.push(pick);used.add(pick.m.id);}
  }
  for(const x of candidates){ if(chosen.length>=Math.min(MAX_DAILY,capacity)) break; if(!used.has(x.m.id)){chosen.push(x);used.add(x.m.id);} }

  // High college workload intentionally reduces mission count instead of creating overload.
  if(settings.collegeLoad==="high") chosen.splice(capacity);
  const created=[];
  for(const x of chosen.slice(0,MAX_DAILY)){
    const m=x.m, mission=buildMission(m,skills);
    const ref={text:mission.text, userId:uid,date:today,completed:false,source:"engine",goalId:goalFor(m),skillId:m.id,category:m.category,priority:mission.priority,difficulty:mission.difficulty,proofRequired:mission.proofRequired,deadline:DEADLINE,
      why:mission.why,output:mission.output,effort:mission.effort,createdAt:serverTimestamp()};
    const refDoc=await addDoc(collection(db,"tasks"),ref); created.push({id:refDoc.id,...ref});
  }
  await setDoc(doc(db,"users",uid),{userId:uid,deadline:DEADLINE,engineVersion:2,lastGeneratedDate:today,updatedAt:serverTimestamp()},{merge:true});
  return created;
}
function goalFor(m){
  if(m.category==="gate")return"GATE";
  if(["career","project","brand","business"].includes(m.category))return"Career / Projects";
  if(["genai","dl","ml"].includes(m.category))return"GenAI Engineer";
  if(m.category==="dsa"||m.category==="cs"||m.category==="programming")return"Software Engineering";
  if(m.category==="communication")return"English";
  if(m.category==="fitness")return"Fitness";
  return"Core Roadmap";
}

async function completeTask(task){
  if(task.completed) return;
  let proof="";
  if(task.proofRequired){
    proof=prompt("Proof required for this important mission. Enter a short proof (GitHub link, score, output, or what you built):")||"";
    if(!proof.trim()){alert("Important mission needs proof before completion.");return;}
  }
  await updateDoc(doc(db,"tasks",task.id),{completed:true,completedAt:serverTimestamp(),proof:proof.trim()});
  if(task.skillId){
    await setDoc(doc(db,"skills",`${currentUser.uid}_${task.skillId}`),{userId:currentUser.uid,skillId:task.skillId,status:"tested",progress:Math.max(70,(task.difficulty||1)*15),confidence:1,lastPassed:dateStr(),revisionDue:addDays(dateStr(),3),updatedAt:serverTimestamp()},{merge:true});
  }
}

async function failOrDelete(task){
  if(task.source==="manual"){ if(confirm("Delete this real-life task?")) await updateDoc(doc(db,"tasks",task.id),{deleted:true}); return; }
  if(confirm("Mark this mission as MISSED? It will be reviewed on Sunday and can be repeated.")){
    await updateDoc(doc(db,"tasks",task.id),{status:"missed",missedAt:serverTimestamp()});
    if(task.skillId) await setDoc(doc(db,"skills",`${currentUser.uid}_${task.skillId}`),{userId:currentUser.uid,skillId:task.skillId,status:"failed",updatedAt:serverTimestamp()},{merge:true});
  }
}

function renderToday(tasks){
  const list=$("taskList"); list.innerHTML="";
  if(!tasks.length){list.innerHTML='<div class="empty">Generating today\'s missions...</div>';return;}
  tasks.sort((a,b)=>({critical:0,important:1,supporting:2}[a.priority]??3)-({critical:0,important:1,supporting:2}[b.priority]??3));
  for(const t of tasks){
    const row=document.createElement("div"); row.className=`task ${t.completed?"completed":""}`;
    row.innerHTML=`<div class="task-left"><button class="task-check">${t.completed?"✓":""}</button><div><div class="task-name">${esc(t.text)}</div><small style="color:#7d858b">${esc(t.priority||"supporting").toUpperCase()} • ${esc(t.source==="manual"?"REAL-LIFE":"JARVIS")}${t.proofRequired&&!t.completed?" • PROOF":""}</small>
      ${t.source==="engine"||t.source==="sunday-review"?`<div style="margin-top:7px;color:#9da5aa;font-size:12px">WHY: ${esc(t.why||"Roadmap progression")} • OUTPUT: ${esc(t.output||"Proof of work")} • EFFORT: ${esc(t.effort||"30-45 min")}</div>`:""}</div></div><span class="badge ${t.completed?"done":"pending"}">${t.completed?"DONE":"PENDING"}</span>`;
    row.querySelector(".task-check").onclick=()=>completeTask(t);
    list.appendChild(row);
  }
}

function updateProgress(tasks){
  const visible=tasks.filter(t=>!t.deleted); const done=visible.filter(t=>t.completed).length; const total=visible.length; const pct=total?Math.round(done/total*100):0;
  if($("completedCount"))$("completedCount").textContent=done;
  if($("pendingCount"))$("pendingCount").textContent=total-done;
  if($("totalCount"))$("totalCount").textContent=total;
  const ring=$("progressCircle"); if(ring) ring.style.background=`conic-gradient(var(--red) ${pct*3.6}deg,#351313 ${pct*3.6}deg)`;
  if($("progressNumber"))$("progressNumber").textContent=`${pct}%`;
  if($("progressText"))$("progressText").textContent=`${pct}%`;
}

function renderHistory(tasks){
  const by={}; for(const t of tasks){if(!t.date||t.deleted)continue;by[t.date]??={total:0,done:0,missed:0};by[t.date].total++;if(t.completed)by[t.date].done++;if(t.status==="missed")by[t.date].missed++;}
  const list=$("historyList"); if(!list)return; list.innerHTML="";
  const dates=Object.keys(by).sort().reverse().slice(0,7); if(!dates.length){list.innerHTML='<div class="empty">No history yet.</div>';return;}
  for(const d of dates){const x=by[d],pct=Math.round(x.done/x.total*100);const el=document.createElement("div");el.className="history-card";el.innerHTML=`<div class="history-top"><span>${pretty(d)}</span><b>${pct}%</b></div><div class="history-bar"><i style="width:${pct}%"></i></div><div class="history-result">${x.done}/${x.total} complete • ${x.missed} missed</div>`;list.appendChild(el);}
}

function updateStreak(tasks){
  const by={};for(const t of tasks){if(!t.date||t.deleted)continue;by[t.date]??={t:0,d:0};by[t.date].t++;if(t.completed)by[t.date].d++;}
  let s=0,d=dateStr();while(by[d]&&by[d].t>0&&by[d].d===by[d].t){s++;d=addDays(d,-1);} if($("streakNumber"))$("streakNumber").textContent=s;
  [1,3,7,30].forEach(n=>{const el=$("achievement"+n);if(el){el.classList.toggle("locked",s<n);const sm=el.querySelector("small");if(sm)sm.textContent=s>=n?"UNLOCKED":"LOCKED";}});
}

async function addManualTask(){
  const text=prompt("Real-life / college task for today:"); if(!text?.trim())return;
  await addDoc(collection(db,"tasks"),{text:text.trim(),userId:currentUser.uid,date:dateStr(),completed:false,source:"manual",category:"real-life",priority:"important",createdAt:serverTimestamp()});
}

async function checkAttendance(){
  const now=new Date(); const hh=String(now.getHours()).padStart(2,"0"),mm=String(now.getMinutes()).padStart(2,"0");
  if(`${hh}:${mm}`!==ATTENDANCE_TIME){alert(`Attendance is a hard 04:30 AM rule. Current time: ${hh}:${mm}.`);return;}
  await setDoc(doc(db,"attendance",`${currentUser.uid}_${dateStr()}`),{userId:currentUser.uid,date:dateStr(),requiredTime:ATTENDANCE_TIME,actualTime:now.toISOString(),status:"present",createdAt:serverTimestamp()});
  alert("04:30 AM attendance recorded.");
}

function engineMessage(tasks){
  const engine=tasks.filter(t=>(t.source==="engine"||t.source==="sunday-review")&&!t.deleted); const done=engine.filter(t=>t.completed).length;
  const missed=tasks.filter(t=>t.status==="missed").length;
  if($("engineText"))$("engineText").innerHTML=`Deadline: <b>${DEADLINE}</b> • ${daysLeft()} days left.<br>Today: <b>${done}/${engine.length}</b> JARVIS missions complete${missed?` • <b>${missed}</b> missed mission(s) queued for Sunday review.`:"."}<br>Engine chooses tasks using prerequisites, priority, performance, revision need and career deadlines. It does not unlock advanced topics before their prerequisites.`;
}

async function markOverdueAsMissed(tasks){
  const today=dateStr();
  const overdue=tasks.filter(t=>t.date && t.date<today && !t.completed && !t.deleted && t.source==="engine" && t.status!=="missed");
  if(!overdue.length)return;
  await Promise.all(overdue.map(t=>updateDoc(doc(db,"tasks",t.id),{status:"missed",missedAt:serverTimestamp()})));
  await Promise.all(overdue.filter(t=>t.skillId).map(t=>setDoc(doc(db,"skills",`${currentUser.uid}_${t.skillId}`),{userId:currentUser.uid,skillId:t.skillId,status:"failed",updatedAt:serverTimestamp()},{merge:true})));
}

async function attendanceAudit(uid){
  const now=new Date();
  const today=dateStr();
  const hhmm=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
  if(hhmm<ATTENDANCE_TIME)return;
  const ref=doc(db,"attendance",uid+"_"+today);
  const snap=await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref,{userId:uid,date:today,requiredTime:ATTENDANCE_TIME,actualTime:null,status:"missed",createdAt:serverTimestamp()});
  }
}

async function sundayReview(uid,tasks){
  const day=new Date().getDay(); if(day!==0)return;
  const missed=tasks.filter(t=>t.status==="missed"&&!t.reviewedSunday);
  if(!missed.length)return;
  const today=dateStr();
  const completed=tasks.filter(t=>t.completed&&!t.deleted);
  const missedAll=tasks.filter(t=>t.status==="missed"&&!t.deleted);
  const weakSkills=[...new Set(missedAll.map(t=>t.skillId).filter(Boolean))];
  await setDoc(doc(db,"weeklyReviews",uid+"_"+today),{
    userId:uid,date:today,missedCount:missedAll.length,
    completedCount:completed.length,
    missedSkillIds:weakSkills,
    focus:"Fix missed work first, then continue prerequisites.",
    nextWeekPlan:["Repair missed/failed skills","Continue prerequisite chain","Produce proof for one career/project task","Review GATE/DSA mistakes"],
    action:"review_and_replan",createdAt:serverTimestamp()
  },{merge:true});
  const existing=tasks.filter(t=>t.date===today&&t.source==="sunday-review");
  const existingKeys=new Set(existing.map(t=>t.reviewOf).filter(Boolean));
  for(const t of missed){
    if(existingKeys.has(t.id))continue;
    await addDoc(collection(db,"tasks"),{
      text:"SUNDAY REVIEW: "+t.text,
      userId:uid,date:today,completed:false,source:"sunday-review",
      reviewOf:t.id,skillId:t.skillId,goalId:t.goalId||"Weekly Review",
      category:t.category||"review",priority:"critical",proofRequired:true,
      why:"Review missed work and remove the bottleneck",output:"Reason + corrected attempt + proof",effort:"30-45 min",
      createdAt:serverTimestamp()
    });
  }
  await Promise.all(missed.map(t=>updateDoc(doc(db,"tasks",t.id),{reviewedSunday:true})));
}

async function loadTasks(uid){
  if(stopTasks)stopTasks();
  const q=query(collection(db,"tasks"),where("userId","==",uid));
  stopTasks=onSnapshot(q,async snap=>{
    allTasks=[];snap.forEach(d=>allTasks.push({id:d.id,...d.data()}));
    const todayTasks=allTasks.filter(t=>t.date===dateStr()&&!t.deleted);
    renderToday(todayTasks);updateProgress(todayTasks);renderHistory(allTasks);updateStreak(allTasks);engineMessage(allTasks);await sundayReview(uid,allTasks);
  },err=>{console.error(err);if($("taskList"))$("taskList").innerHTML='<div class="empty">Unable to load missions. Check Firestore rules.</div>';});
  await seedSkills(uid);
  await attendanceAudit(uid);
  const state=await loadState(uid);
  await markOverdueAsMissed(state.tasks);
  await generateDailyMissions(uid);
}

ensureEnginePanel();
if($("todayDate"))$("todayDate").textContent=pretty(dateStr());

const loginButton=$("loginButton");
const passwordInput=$("password");
const logoutButton=$("logoutButton");

if(loginButton){
  loginButton.onclick=async()=>{
    const emailInput=$("email");
    const message=$("loginMessage");
    const e=emailInput?.value.trim()||"";
    const p=passwordInput?.value||"";
    if(!e||!p){if(message)message.textContent="Please enter email and password.";return;}
    try{
      await signInWithEmailAndPassword(auth,e,p);
      if(message)message.textContent="";
    }catch(err){
      console.error(err);
      if(message)message.textContent=`Login failed: ${err.code||"Check email/password."}`;
    }
  };
}

if(passwordInput && loginButton){
  passwordInput.onkeydown=e=>{if(e.key==="Enter")loginButton.click()};
}

if(logoutButton){
  logoutButton.onclick=()=>signOut(auth);
}

onAuthStateChanged(auth,user=>{
  currentUser=user;
  const loginPage=$("loginPage");
  const dashboard=$("dashboard");

  if(user){
    if(loginPage)loginPage.style.display="none";
    if(dashboard)dashboard.style.display="block";
    loadTasks(user.uid);
  }else{
    if(loginPage)loginPage.style.display="flex";
    if(dashboard)dashboard.style.display="none";
  }
});
