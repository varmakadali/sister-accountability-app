import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, onSnapshot, doc, updateDoc, query, where, getDocs, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";

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
const functions = getFunctions(app, "asia-south1");
const $ = id => document.getElementById(id);
const DEADLINE = "2027-02-12";
const INTERNSHIP_DEADLINE = "2026-11-30";
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
function daysUntil(target){return Math.max(0,Math.ceil((new Date(`${target}T23:59:59`)-new Date())/86400000));}
function daysLeft(){return daysUntil(DEADLINE);}
function internshipDaysLeft(){return daysUntil(INTERNSHIP_DEADLINE);}

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
  const settingsButton=$("systemSettings");
  if(settingsButton) settingsButton.onclick=()=>showProfileView();
}

function skillStage(s){
  const status=s?.status||"not_started";
  if(status==="not_started") return "LEARN";
  if(status==="learning") return "PRACTICE";
  if(status==="practicing") return "TEST";
  if(status==="tested") return (s.revisionDue && s.revisionDue<=dateStr()) ? "REVISE" : "APPLY";
  if(status==="mastered") return "MASTERED";
  if(status==="failed") return "RETEST";
  return "LEARN";
}

function scoreModule(m, skills, history, todayTasks, settings={}){
  const s=skills[m.id]||{};
  const stage=skillStage(s);
  if(stage==="MASTERED") return -Infinity;
  const prereqBlocked=m.prereqs.some(p=>{
    const ps=skills[p]?.status||"not_started";
    return !["tested","mastered"].includes(ps);
  });
  if(prereqBlocked) return -Infinity;

  let score=m.weight*12;
  if(stage==="TEST"||stage==="RETEST") score+=35;
  if(stage==="REVISE") score+=28;
  if(stage==="PRACTICE") score+=20;
  if(stage==="LEARN") score+=12;
  if(s.confidence<0.5) score+=12;
  if(s.lastPassed && s.revisionDue && s.revisionDue<=dateStr()) score+=24;
  if(s.lastFailed) score+=25;

  const careerIds=["internship-prep","project-portfolio","gsoc-open-source","dsa","python-basics"];
  const gateIds=["gate","math-ml","dsa","os","dbms","networks","coa"];
  if(careerIds.includes(m.id)) score+=20;
  if(gateIds.includes(m.id)) score+=16;
  if(["llm","transformers","rag","embeddings","vector-db","mcp","eval"].includes(m.id)) score+=14;

  const masterPressure=Math.max(0,35-Math.floor(daysLeft()/10));
  const internshipPressure=Math.max(0,55-Math.floor(internshipDaysLeft()/2));
  const pressure=masterPressure;
  if(["internship-prep","project-portfolio","dsa","github","python-basics"].includes(m.id)) score+=internshipPressure;
  if(["internship-prep","project-portfolio","gsoc-open-source","gate"].includes(m.id)) score+=pressure;

  const focus=settings.focusMode||"balanced";
  const allocation=settings.allocation||{};
  const allocCategory=["genai","dl","ml"].includes(m.category)?"genai":
    ["programming","dsa","cs","engineering","backend","web","cloud"].includes(m.category)?"software":
    m.category==="gate"?"gate":
    ["career","project"].includes(m.category)?"career":
    m.category==="communication"?"english":
    m.category==="fitness"?"fitness":"projects";
  score+=(Number(allocation[allocCategory])||0)*0.35;
  if(focus==="internship" && ["internship-prep","dsa","project-portfolio","github","python-basics"].includes(m.id)) score+=25;
  if(focus==="gate" && gateIds.includes(m.id)) score+=25;
  if(focus==="genai" && ["python-basics","math-ml","ml","neural-networks","pytorch","transformers","llm","rag","eval"].includes(m.id)) score+=25;

  const failedCount=history.filter(t=>t.skillId===m.id&&t.status==="missed").length;
  score+=Math.min(20,failedCount*5);
  return score;
}

function buildMission(m, skills){
  const s=skills[m.id]||{};
  const stage=skillStage(s);
  const actions={
    LEARN:{what:`Learn ${m.name} fundamentals in simple words and make 5 recall questions.`,output:"Short notes + 5 recall answers"},
    PRACTICE:{what:`Practice ${m.name} with 3 small hands-on problems.`,output:"3 completed practice outputs"},
    TEST:{what:`Take a closed-book test on ${m.name}; record score and mistakes.`,output:"Score + mistake list"},
    RETEST:{what:`Retest ${m.name} after fixing previous mistakes.`,output:"New score + corrected mistakes"},
    REVISE:{what:`Revise ${m.name} from memory, then solve one fresh example.`,output:"Revision notes + fresh example"},
    APPLY:{what:`Apply ${m.name} in a small real-world example or project.`,output:"Working artifact / GitHub proof"}
  };
  const a=actions[stage]||actions.LEARN;
  const why=m.category==="career"||m.category==="project"?"Career proof and deadline relevance":
    m.category==="gate"?"GATE performance and mistake reduction":
    stage==="TEST"||stage==="RETEST"?"Learning loop requires evidence before advancing":
    stage==="REVISE"?"Spaced revision is due":
    m.prereqs.length?"This is the next unlocked prerequisite":"Foundation / continuous supporting habit";
  const proofRequired=["TEST","RETEST","APPLY"].includes(stage)||m.weight>=4||["project","career","gate"].includes(m.category);
  return {
    text:a.what,skillId:m.id,category:m.category,
    priority:m.weight>=4?"critical":m.weight>=2?"important":"supporting",
    difficulty:Math.min(5,Math.max(1,(s.difficulty||1)+(stage==="RETEST"?0:1))),
    proofRequired,level:stage,why,output:a.output,
    effort:m.weight>=4?"45-60 min":m.weight>=2?"30-45 min":"15-25 min"
  };
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
    focusMode:d.focusMode||"balanced",
    academicMode:d.academicMode||"normal",
    energy:d.energy||"normal"
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

async function initializeUser(uid){
  const ref=doc(db,"users",uid);
  const snap=await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref,{
      userId:uid,deadline:DEADLINE,createdAt:serverTimestamp(),
      goals:{genai:true,software:true,gate:true,internship:true,gsoc:true,projects:true,english:true,brand:true,business:true,college:true,fitness:true,futureTech:true},
      preferences:{dailyCapacity:3,collegeLoad:"normal",focusMode:"balanced",academicMode:"normal",availableMinutes:120,energy:"normal",allocation:{genai:30,software:20,gate:20,career:15,english:5,projects:5,fitness:5}},
      roadmapPhase:"Foundation",engineVersion:3
    });
  }
}

async function getRoadmapHealth(uid){
  const {skills,tasks}=await loadState(uid);
  const active=[...modules.values()];
  const weighted=active.reduce((sum,m)=>sum+m.weight,0);
  const earned=active.reduce((sum,m)=>{
    const s=skills[m.id]||{};
    const p=Math.min(100,Number(s.progress)||0);
    const evidence=s.status==="mastered"?100:s.status==="tested"?75:s.status==="practicing"?45:s.status==="learning"?20:0;
    return sum+m.weight*(Math.max(p,evidence)/100);
  },0);
  const progress=weighted?Math.round(earned/weighted*100):0;
  const missed=tasks.filter(t=>t.status==="missed"&&!t.deleted).length;
  const criticalOpen=active.filter(m=>m.weight>=4).filter(m=>["not_started","learning","practicing","failed"].includes(skills[m.id]?.status||"not_started")).length;
  const days=daysLeft();
  let status="ON TRACK";
  if(missed>=4||criticalOpen>Math.max(5,Math.floor(active.length*.08))) status="AT RISK";
  if(missed>=8||progress<10) status="BEHIND";
  const bottleneck=active.map(m=>({m,s:skills[m.id]||{},score:m.weight*10+((skills[m.id]?.status==="failed")?30:0)+(m.prereqs.some(p=>!["tested","mastered"].includes(skills[p]?.status||"not_started"))?20:0)}))
    .filter(x=>["not_started","learning","practicing","failed"].includes(x.s.status||"not_started"))
    .sort((a,b)=>b.score-a.score)[0]?.m;
  return {progress,status,missed,criticalOpen,days,bottleneck:bottleneck?.name||"No single bottleneck"};
}

async function createTestRecord(task,score,mistakes){
  if(!currentUser||!task?.skillId)return;
  const numeric=Math.max(0,Math.min(100,Number(score)||0));
  await addDoc(collection(db,"tests"),{userId:currentUser.uid,skillId:task.skillId,taskId:task.id,score:numeric,accuracy:numeric,mistakes:(mistakes||"").trim(),type:"adaptive",attemptDate:dateStr(),createdAt:serverTimestamp()});
  const passed=numeric>=70;
  const patch={userId:currentUser.uid,skillId:task.skillId,status:passed?"tested":"failed",progress:passed?75:45,confidence:numeric/100,revisionDue:addDays(dateStr(),passed?5:2),updatedAt:serverTimestamp()};
  if(passed)patch.lastPassed=dateStr(); else patch.lastFailed=dateStr();
  await setDoc(doc(db,"skills",`${currentUser.uid}_${task.skillId}`),patch,{merge:true});
  return passed;
}

async function tryAIPlan(uid,targetDate,preview,profile,settings,skills,tasks){
  try{
    const planState={date:targetDate,preview,profile:{deadline:profile.deadline,goals:profile.goals,preferences:profile.preferences,roadmapPhase:profile.roadmapPhase},settings,skills:Object.values(skills).map(s=>({skillId:s.skillId,status:s.status,progress:s.progress,confidence:s.confidence,revisionDue:s.revisionDue,lastFailed:s.lastFailed})),recentTasks:tasks.filter(t=>!t.deleted).slice(-80).map(t=>({date:t.date,skillId:t.skillId,completed:t.completed,status:t.status,priority:t.priority})),deadlines:{master:DEADLINE,internship:INTERNSHIP_DEADLINE}};
    const call=httpsCallable(functions,"planMissions");
    const result=await call({state:planState});
    return Array.isArray(result.data?.missions)?result.data.missions:[];
  }catch(e){console.warn("AI planner unavailable; using local planner.",e);return [];}
}
async function generateDailyMissions(uid, force=false, targetDate=dateStr(), preview=false){
  const {skills,tasks}=await loadState(uid);
  const profile=await getProfile(uid);
  const settings={...await getSettings(uid),...profile.preferences};
  const today=targetDate;
  const existing=tasks.filter(t=>t.date===today&&!t.deleted);
  const activeToday=tasks.filter(t=>t.date===dateStr()&&!t.deleted);
  const academicMode=settings.academicMode||"normal";
  const academicReduction=academicMode==="semester" ? 2 : academicMode==="mid" || academicMode==="exam" ? 1 : 0;
  if(existing.some(t=>t.source==="engine") && !force) return existing;
  if(existing.length>=MAX_DAILY && !force) return existing;

  const todayTasks=existing;
  if(!preview && !force && !existing.some(t=>t.source==="engine") && !existing.length){
    const ai=await tryAIPlan(uid,today,preview,profile,settings,skills,tasks);
    const valid=ai.filter(x=>modules.has(x.skillId)).filter(x=>{
      const m=modules.get(x.skillId),s=skills[m.id]||{},blocked=m.prereqs.some(p=>!["tested","mastered"].includes(skills[p]?.status||"not_started"));
      return !blocked && skillStage(s)!=="MASTERED";
    }).slice(0,MAX_DAILY);
    if(valid.length){
      const created=[];
      for(const x of valid){
        const m=modules.get(x.skillId),mission=buildMission(m,skills);
        const ref={text:x.text||mission.text,userId:uid,date:today,completed:false,source:"ai-engine",preview:false,goalId:goalFor(m),skillId:m.id,category:m.category,priority:x.priority||mission.priority,difficulty:mission.difficulty,proofRequired:mission.proofRequired,deadline:DEADLINE,why:x.why||mission.why,output:x.output||mission.output,effort:x.effort||mission.effort,createdAt:serverTimestamp()};
        const refDoc=await addDoc(collection(db,"tasks"),ref);created.push({id:refDoc.id,...ref});
      }
      await setDoc(doc(db,"users",uid),{userId:uid,deadline:DEADLINE,engineVersion:5,lastGeneratedDate:today,planner:"grok",updatedAt:serverTimestamp()},{merge:true});
      return created;
    }
  }
  const chosen=[];
  const used=new Set(todayTasks.map(t=>t.skillId).filter(Boolean));
  const recentHistory=tasks.filter(t=>!t.deleted).slice(-250);
  // Planning agent: today's unfinished work, failed tests, deadlines and academic load
  // are inputs. The agent never creates more work just because there is free capacity.
  const candidates=[...modules.values()]
    .map(m=>({m,score:scoreModule(m,skills,recentHistory,activeToday,settings)}))
    .filter(x=>Number.isFinite(x.score))
    .sort((a,b)=>b.score-a.score);
  if(academicMode==="semester"||academicMode==="mid"||academicMode==="exam"){
    for(const x of candidates){
      if(["english","fitness"].includes(x.m.id)) x.score+=18;
      if(["internship-prep","project-portfolio","brand","business","youtube"].includes(x.m.id)) x.score-=18;
      if(["gate","dsa","python-basics","math-ml"].includes(x.m.id)) x.score-=4;
    }
    candidates.sort((a,b)=>b.score-a.score);
  }
  const timeCap=Math.max(1,Math.floor((Number(settings.availableMinutes)||120)/25));
  const energyReduction=settings.energy==="low"?1:0;
  const baseCapacity=settings.collegeLoad==="high"?Math.max(1,settings.dailyCapacity-1):settings.dailyCapacity;
  const capacity=Math.min(MAX_DAILY,Math.max(1,baseCapacity-academicReduction-energyReduction),timeCap);

  // ₹0 adaptive brain: hard constraints are enforced locally even when no AI API is configured.
  // This keeps the app useful without paid API calls and prevents the planner from overloading the user.
  const nonNegotiables=["english","fitness"];
  const deadlineCriticalDays=Math.min(daysLeft(),internshipDaysLeft());
  const mustProtectCareer=deadlineCriticalDays<=45;
  if(mustProtectCareer){
    for(const x of candidates){
      if(["internship-prep","project-portfolio","dsa","github","python-basics"].includes(x.m.id)) x.score+=25;
    }
    candidates.sort((a,b)=>b.score-a.score);
  }

  // Balanced buckets: core learning, exam/DSA, GenAI/engineering, career proof, and non-negotiables.
  const buckets=[
    m=>["programming","dsa","cs","ml"].includes(m.category),
    m=>m.category==="dsa"||m.id==="gate",
    m=>["genai","dl","backend","engineering","cloud"].includes(m.category),
    m=>["career","project","communication","brand","business"].includes(m.category),
    m=>nonNegotiables.includes(m.id)
  ];
  for(const bucket of buckets){
    if(chosen.length>=Math.min(MAX_DAILY,capacity)) break;
    const pick=candidates.find(x=>bucket(x.m)&&!used.has(x.m.id));
    if(pick){chosen.push(pick);used.add(pick.m.id);}
  }

  // Protect the two non-negotiables whenever there is enough capacity.
  for(const id of nonNegotiables){
    if(chosen.length>=Math.min(MAX_DAILY,capacity)) break;
    if(!used.has(id)){
      const pick=candidates.find(x=>x.m.id===id);
      if(pick){chosen.push(pick);used.add(id);}
    }
  }
  for(const x of candidates){ if(chosen.length>=Math.min(MAX_DAILY,capacity)) break; if(!used.has(x.m.id)){chosen.push(x);used.add(x.m.id);} }

  // High college workload / low energy intentionally reduces mission count instead of creating overload.
  chosen.splice(capacity);

  // Do not stack too many heavy missions on low-energy or exam days.
  if(settings.energy==="low" || academicMode==="mid" || academicMode==="exam"){
    let heavy=0;
    for(let i=chosen.length-1;i>=0;i--){
      if((chosen[i].m.weight||1)>=4){
        heavy++;
        if(heavy>1) chosen.splice(i,1);
      }
    }
  }
  // Never leave the user with an empty day. If every roadmap node is complete,
  // create a meaningful proof/revision mission instead of showing "no missions".
  if(!chosen.length){
    const fallback = [...modules.values()].find(m=>m.id==="project-portfolio") || [...modules.values()].find(m=>m.id==="english") || [...modules.values()][0];
    if(fallback) chosen.push({m:fallback,score:1});
  }
  const created=[];
  for(const x of chosen.slice(0,MAX_DAILY)){
    const m=x.m, mission=buildMission(m,skills);
    const ref={text:mission.text, userId:uid,date:today,completed:false,source:"engine",preview:!!preview,goalId:goalFor(m),skillId:m.id,category:m.category,priority:mission.priority,difficulty:mission.difficulty,proofRequired:mission.proofRequired,deadline:DEADLINE,
      why:mission.why,output:mission.output,effort:mission.effort,createdAt:serverTimestamp()};
    const refDoc=await addDoc(collection(db,"tasks"),ref); created.push({id:refDoc.id,...ref});
  }
  if(!preview) await setDoc(doc(db,"users",uid),{userId:uid,deadline:DEADLINE,engineVersion:6,lastGeneratedDate:today,updatedAt:serverTimestamp(),planner:"local-adaptive"}, {merge:true});
  return created;
}
async function prepareTomorrow(uid,force=false){
  const tomorrow=addDays(dateStr(),1);
  const {tasks}=await loadState(uid);
  const existing=tasks.filter(t=>t.date===tomorrow&&!t.deleted);
  const previews=existing.filter(t=>t.preview===true);
  const committed=existing.filter(t=>!t.preview);
  if(committed.length) return existing;
  if(previews.length&&!force) return existing;
  if(previews.length&&force) await Promise.all(previews.map(t=>updateDoc(doc(db,"tasks",t.id),{deleted:true,deletedAt:serverTimestamp()})));
  return generateDailyMissions(uid,false,tomorrow,true);
}

async function renderTomorrowPreview(uid,force=false){
  const list=$("tomorrowList"); if(!list)return;
  try{
    const tasks=await prepareTomorrow(uid,force);
    list.innerHTML=tasks.filter(t=>t.date===addDays(dateStr(),1)&&!t.deleted).map(t=>`<div class="task preview-task"><div class="task-left"><div><div class="task-name">${esc(t.text)}</div><small style="color:#7d858b">${esc(t.priority||"supporting").toUpperCase()} • JARVIS PREVIEW</small><div style="margin-top:6px;color:#9da5aa;font-size:12px">WHY: ${esc(t.why||"Adaptive roadmap")} • OUTPUT: ${esc(t.output||"Proof of work")} • EFFORT: ${esc(t.effort||"30-45 min")}</div></div></div><span class="badge pending">TOMORROW</span></div>`).join("") || '<div class="empty">Tomorrow is being planned…</div>';
    const note=$("tomorrowNote");
    if(note) note.textContent=force?"Replanned from today's latest feedback.":"Tentative plan. Today's completion, misses, academic mode and deadlines can change it.";
  }catch(e){console.error(e);list.innerHTML='<div class="empty">Tomorrow preview is syncing…</div>';}
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

function proofTypeFor(task){const x=((task.text||"")+" "+(task.skillId||"")).toLowerCase();if(x.includes("gate"))return"gate";if(x.includes("github")||x.includes("git"))return"github";if(x.includes("project")||x.includes("deploy"))return"project";if(x.includes("python")||x.includes("java")||x.includes("code")||x.includes("dsa")||x.includes("leetcode"))return"code";if(x.includes("english")||x.includes("speaking"))return"english";return"general";}
function validateProof(type,value){const v=String(value||"").trim();if(!v)return{ok:false,msg:"Evidence is required."};if(type==="code"&&v.length<15)return{ok:false,msg:"Paste meaningful code/output, not a one-line claim."};if((type==="github"||type==="project")&&!/(github\.com|http:\/\/|https:\/\/)/i.test(v))return{ok:false,msg:"Add a GitHub/project/demo URL."};if(type==="gate"&&!/\d+/.test(v))return{ok:false,msg:"Include question/test score or result."};return{ok:true};}
async function completeTask(task){
  if(task.completed)return;
  let proof="";
  if(task.proofRequired){
    proof=prompt("Proof required. Enter score, GitHub link, output, or what you actually produced:")||"";
    if(!proof.trim()){alert("This mission needs real proof before completion.");return;}
  }
  const stage=task.level||"LEARN";
  if(["TEST","RETEST"].includes(stage)){
    const score=prompt("Enter your test score (0-100):");
    if(score===null)return;
    const mistakes=prompt("What mistakes/weak concepts did you find?")||"";
    const passed=await createTestRecord(task,score,mistakes);
    await updateDoc(doc(db,"tasks",task.id),{completed:true,completedAt:serverTimestamp(),proof:proof.trim(),testScore:Number(score),testMistakes:mistakes.trim(),result:passed?"passed":"failed"});
    if(!passed)alert("Test recorded as failed. JARVIS will prioritize this skill again.");
    await renderTomorrowPreview(currentUser.uid);
    return;
  }
  await updateDoc(doc(db,"tasks",task.id),{completed:true,completedAt:serverTimestamp(),proof:proof.trim()});
  if(task.skillId){
    const current=await getDoc(doc(db,"skills",`${currentUser.uid}_${task.skillId}`));
    const s=current.exists()?current.data():{};
    const nextStatus=stage==="APPLY"?"mastered":stage==="LEARN"?"learning":"practicing";
    const nextProgress=stage==="APPLY"?100:stage==="LEARN"?20:45;
    await setDoc(doc(db,"skills",`${currentUser.uid}_${task.skillId}`),{userId:currentUser.uid,skillId:task.skillId,status:nextStatus,progress:Math.max(Number(s.progress)||0,nextProgress),confidence:Math.max(Number(s.confidence)||0,stage==="APPLY"?1:.5),lastStudied:dateStr(),revisionDue:addDays(dateStr(),2),updatedAt:serverTimestamp()},{merge:true});
  }
  await renderTomorrowPreview(currentUser.uid);
}

async function failOrDelete(task){
  if(task.source==="manual"){ if(confirm("Delete this real-life task?")) await updateDoc(doc(db,"tasks",task.id),{deleted:true}); return; }
  if(confirm("Mark this mission as MISSED? It will be reviewed on Sunday and can be repeated.")){
    await updateDoc(doc(db,"tasks",task.id),{status:"missed",missedAt:serverTimestamp()});
    if(task.skillId) await setDoc(doc(db,"skills",`${currentUser.uid}_${task.skillId}`),{userId:currentUser.uid,skillId:task.skillId,status:"failed",updatedAt:serverTimestamp()},{merge:true});
    await renderTomorrowPreview(currentUser.uid);
  }
}

function renderToday(tasks){
  const list=$("taskList"); list.innerHTML="";
  if(!tasks.length){list.innerHTML='<div class="empty">Generating today\'s missions...</div>';return;}
  tasks.sort((a,b)=>({critical:0,important:1,supporting:2}[a.priority]??3)-({critical:0,important:1,supporting:2}[b.priority]??3));
  for(const t of tasks){
    const row=document.createElement("div"); row.className=`task ${t.completed?"completed":""}`;
    row.innerHTML=`<div class="task-left"><button class="task-check">${t.completed?"✓":""}</button><div><div class="task-name">${esc(t.text)}</div><small style="color:#7d858b">${esc(t.priority||"supporting").toUpperCase()} • ${esc(t.source==="manual"?"REAL-LIFE":"JARVIS")}${t.proofRequired&&!t.completed?" • PROOF":""}</small>
      ${t.source==="engine"||t.source==="ai-engine"||t.source==="sunday-review"?`<div style="margin-top:7px;color:#9da5aa;font-size:12px">WHY: ${esc(t.why||"Roadmap progression")} • OUTPUT: ${esc(t.output||"Proof of work")} • EFFORT: ${esc(t.effort||"30-45 min")}</div>`:""}</div></div><span class="badge ${t.completed?"done":"pending"}">${t.completed?"DONE":"PENDING"}</span>`;
    row.querySelector(".task-check").onclick=()=>completeTask(t);
    list.appendChild(row);
  }
}

async function updateProgress(tasks){
  const visible=tasks.filter(t=>!t.deleted),done=visible.filter(t=>t.completed).length,total=visible.length,pct=total?Math.round(done/total*100):0;
  if($("completedCount"))$("completedCount").textContent=done;
  if($("pendingCount"))$("pendingCount").textContent=Math.max(0,total-done);
  if($("totalCount"))$("totalCount").textContent=total;
  if($("progressNumber"))$("progressNumber").textContent=`${pct}%`;
  if($("progressText"))$("progressText").textContent=`${pct}%`;
  const ring=$("progressCircle"); if(ring)ring.style.background=`conic-gradient(var(--accent) ${pct*3.6}deg,#202a39 ${pct*3.6}deg)`;
  try{
    const health=await getRoadmapHealth(currentUser.uid);
    if($("roadmapStatus"))$("roadmapStatus").textContent=health.status;
    if($("roadmapProgress"))$("roadmapProgress").textContent=`${health.progress}%`;
    if($("roadmapBottleneck"))$("roadmapBottleneck").textContent=health.bottleneck;
    if($("deadlineDays"))$("deadlineDays").textContent=`${health.days} days`;
  }catch(e){console.error(e);}
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

async function engineMessage(tasks){
  if(!$("engineText"))return;
  try{
    const health=await getRoadmapHealth(currentUser.uid),today=dateStr();
    const engine=tasks.filter(t=>(t.source==="engine"||t.source==="sunday-review")&&!t.deleted&&t.date===today);
    const done=engine.filter(t=>t.completed).length,missed=tasks.filter(t=>t.status==="missed"&&!t.deleted).length;
    const attendance=await getDoc(doc(db,"attendance",currentUser.uid+"_"+today));
    const att=attendance.exists()?attendance.data().status:"not checked";
    $("engineText").innerHTML=`<b>${health.status}</b> · ${health.progress}% roadmap evidence · <b>${health.days} days</b> to deadline.<br>Today: <b>${done}/${engine.length}</b> missions · 04:30 attendance: <b>${esc(att)}</b>.<br>Bottleneck: <b>${esc(health.bottleneck)}</b> · ${missed} missed task(s) under recovery.<br>JARVIS protects prerequisites and reduces low-value work when you fall behind.`;
  }catch(e){console.error(e);$("engineText").textContent="Mentor engine is syncing your roadmap…";}
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
  if(new Date().getDay()!==0)return;
  const today=dateStr(),missed=tasks.filter(t=>t.status==="missed"&&!t.reviewedSunday&&!t.deleted);
  const weekTasks=tasks.filter(t=>t.date>=addDays(today,-6)&&t.date<=today&&!t.deleted);
  const completed=weekTasks.filter(t=>t.completed),missedAll=weekTasks.filter(t=>t.status==="missed"),weakSkills=[...new Set(missedAll.map(t=>t.skillId).filter(Boolean))];
  const health=await getRoadmapHealth(uid);
  await setDoc(doc(db,"weeklyReviews",uid+"_"+today),{userId:uid,week:today,date:today,completed:completed.length,missed:missedAll.length,weakSkills,roadmapStatus:health.status,roadmapProgress:health.progress,nextWeekPlan:[health.bottleneck==="No single bottleneck"?"Continue highest-value unlocked skill":`Fix bottleneck: ${health.bottleneck}`,"Complete one test and record mistakes","Produce one career/project proof artifact","Review GATE/DSA mistakes"],createdAt:serverTimestamp()},{merge:true});
  if(!tasks.some(t=>t.date===today&&t.source==="sunday-review"&&t.reviewOfWeek===today&&!t.deleted)){
    await addDoc(collection(db,"tasks"),{text:"SUNDAY REVIEW: Analyze this week's performance and rebuild next week's plan.",userId:uid,date:today,completed:false,source:"sunday-review",reviewOfWeek:today,category:"review",goalId:"Weekly Review",priority:"critical",proofRequired:true,why:"Sunday is the replanning checkpoint",output:"Completed/missed/weak skills + next-week plan",effort:"30-45 min",createdAt:serverTimestamp()});
  }
  // Sunday recovery is deliberate, not a backlog dump: recover only the two
  // highest-value missed missions and let the engine reprioritize the rest.
  const recoveries=[...missed].sort((a,b)=>{
    const rank={critical:0,important:1,supporting:2};
    return (rank[a.priority]??3)-(rank[b.priority]??3);
  }).slice(0,2);
  for(const t of recoveries){
    if(tasks.some(x=>x.date===today&&x.source==="sunday-review"&&x.reviewOf===t.id&&!x.deleted))continue;
    await addDoc(collection(db,"tasks"),{text:"RECOVERY: "+t.text,userId:uid,date:today,completed:false,source:"sunday-review",reviewOf:t.id,skillId:t.skillId,goalId:t.goalId||"Weekly Review",category:t.category||"review",priority:"critical",proofRequired:true,why:"Recover missed work without blindly dumping it into tomorrow",output:"Reason + corrected attempt + proof",effort:"30-45 min",createdAt:serverTimestamp()});
  }
  if(missed.length)await Promise.all(missed.map(t=>updateDoc(doc(db,"tasks",t.id),{reviewedSunday:true})));
}

async function promoteTodayPreview(uid){
  const snap=await getDocs(query(collection(db,"tasks"),where("userId","==",uid)));
  const today=dateStr();
  const previews=snap.docs.map(d=>({id:d.id,...d.data()})).filter(t=>t.date===today&&!t.deleted&&t.preview===true);
  if(previews.length) await Promise.all(previews.map(t=>updateDoc(doc(db,"tasks",t.id),{preview:false,source:"engine",promotedAt:serverTimestamp()})));
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
  await promoteTodayPreview(uid);
  await attendanceAudit(uid);
  const state=await loadState(uid);
  await markOverdueAsMissed(state.tasks);
  await generateDailyMissions(uid);
}


function normalizeAllocation(a={}){
  const base={genai:Number(a.genai)||30,software:Number(a.software)||20,gate:Number(a.gate)||20,career:Number(a.career)||15,english:Number(a.english)||5,projects:Number(a.projects)||5,fitness:Number(a.fitness)||5};
  const total=Object.values(base).reduce((x,y)=>x+y,0)||100;
  const out={}; for(const [k,v] of Object.entries(base)) out[k]=Math.round(v/total*100);
  return out;
}

async function getProfile(uid){
  const snap=await getDoc(doc(db,"users",uid));
  const d=snap.exists()?snap.data():{};
  return {
    ...(d||{}),
    goals:{genai:true,software:true,gate:true,internship:true,gsoc:true,projects:true,english:true,brand:true,business:true,college:true,fitness:true,futureTech:true,...(d.goals||{})},
    preferences:{dailyCapacity:3,collegeLoad:"normal",focusMode:"balanced",academicMode:"normal",availableMinutes:120,energy:"normal",allocation:normalizeAllocation(d.preferences?.allocation),...(d.preferences||{})}
  };
}

async function saveProfile(uid,patch){
  await setDoc(doc(db,"users",uid),{userId:uid,...patch,updatedAt:serverTimestamp()},{merge:true});
}

function modal(title,kicker,html){
  const m=$("workspaceModal"); if(!m)return;
  $("modalTitle").textContent=title; $("modalKicker").textContent=kicker||"WORKSPACE"; $("modalBody").innerHTML=html; m.classList.remove("hidden");
  $("modalClose").onclick=()=>m.classList.add("hidden");
  m.querySelector(".workspace-modal-backdrop")?.addEventListener("click",()=>m.classList.add("hidden"));
}

async function showEvidenceView(){
 const proof=allTasks.filter(t=>t.completed&&t.proofRequired);
 const verified=proof.filter(t=>t.proofStatus==="verified");
 modal("Evidence audit","PROOF",`<div class="roadmap-summary"><div><span>SUBMITTED</span><b>${proof.length}</b></div><div><span>VERIFIED</span><b>${verified.length}</b></div><div><span>QUALITY</span><b>${proof.length?Math.round(verified.length/proof.length*100):0}%</b></div><div><span>NEEDS REVIEW</span><b>${proof.filter(t=>t.proofStatus!=="verified").length}</b></div></div><div class="modal-list">${proof.slice(0,40).map(t=>`<div class="modal-row evidence-row"><div><b>${esc(t.text)}</b><small>${esc(t.proofType||"general")} · ${esc(t.proof||"")}</small></div><span class="stage-chip">${t.proofStatus==="verified"?"VERIFIED":`<button class="verify-proof" data-id="${t.id}">VERIFY</button>`}</span></div>`).join("")||'<div class="empty">No proof submissions yet.</div>'}</div>`);
 document.querySelectorAll(".verify-proof").forEach(b=>b.onclick=async()=>{await updateDoc(doc(db,"tasks",b.dataset.id),{proofStatus:"verified",verifiedAt:serverTimestamp()});await showEvidenceView();});
}
async function showWeeklyReview(){
 const q=query(collection(db,"weeklyReviews"),where("userId","==",currentUser.uid));const snap=await getDocs(q);
 const reviews=snap.docs.map(d=>d.data()).sort((a,b)=>String(b.weekStart||"").localeCompare(String(a.weekStart||""))).slice(0,8);
 const health=await getRoadmapHealth(currentUser.uid);
 const completed=allTasks.filter(t=>t.completed).length, missed=allTasks.filter(t=>t.status==="missed").length;
 modal("Weekly command center","REVIEW",`<div class="roadmap-summary"><div><span>ROADMAP</span><b>${health.status}</b></div><div><span>EVIDENCE</span><b>${health.progress}%</b></div><div><span>COMPLETED</span><b>${completed}</b></div><div><span>MISSED</span><b>${missed}</b></div></div><div class="review-insight"><b>Current bottleneck</b><p>${esc(health.bottleneck)}</p><b>Adaptive rule</b><p>${health.status==="BEHIND"?"Reduce low-value work and attack the bottleneck first.":health.status==="AT RISK"?"Protect core missions and increase proof/test quality.":"Keep prerequisites moving and convert learning into evidence."}</p></div><h3 class="modal-section-title">Recent reviews</h3><div class="modal-list">${reviews.map(x=>`<div class="modal-row"><div><b>${esc(x.weekStart||"Week")}</b><small>Progress ${x.roadmapProgress||0}% · ${x.completed||0} completed · ${x.missed||0} missed</small></div><span class="stage-chip">${esc(x.roadmapStatus||"REVIEW")}</span></div>`).join("")||'<div class="empty">Your first Sunday review will appear here.</div>'}</div>`);
}
async function showAnalytics(){
 const tasks=allTasks.filter(t=>!t.deleted);const done=tasks.filter(t=>t.completed).length, missed=tasks.filter(t=>t.status==="missed").length;
 const proof=tasks.filter(t=>t.completed&&t.proofRequired).length;const tests=tasks.filter(t=>t.type==="test"||t.level==="TEST"||t.level==="RETEST").length;
 const rate=tasks.length?Math.round(done/tasks.length*100):0;
 const health=await getRoadmapHealth(currentUser.uid);
 modal("Execution analytics","ANALYTICS",`<div class="roadmap-summary"><div><span>COMPLETION</span><b>${rate}%</b></div><div><span>PROOF</span><b>${proof}</b></div><div><span>TESTS</span><b>${tests}</b></div><div><span>ROADMAP</span><b>${health.progress}%</b></div></div><div class="analytics-bars"><div><span>Completed</span><i style="width:${Math.min(100,rate)}%"></i></div><div><span>Proof quality</span><i style="width:${done?Math.min(100,Math.round(proof/done*100)):0}%"></i></div><div><span>Roadmap evidence</span><i style="width:${health.progress}%"></i></div></div><div class="review-insight"><b>System diagnosis</b><p>${missed>done?"Execution is the immediate bottleneck.":"Keep increasing evidence quality instead of simply increasing task count."}</p></div>`);
}
async function showCareerTracker(){
 const snap=await getDoc(doc(db,"users",currentUser.uid)); const p=snap.exists()?snap.data():{};
 const c=p.careerTracker||{internship:{applications:0,interviews:0,offers:0},gsoc:{repos:0,prs:0,issues:0},gate:{questions:0,tests:0,avgScore:0},projects:{shipped:0,commits:0,demos:0}};
 const section=(name,obj)=>Object.entries(obj).map(([k,v])=>`<label>${k.toUpperCase()} <input class="tracker-field" data-section="${name}" data-key="${k}" type="number" min="0" value="${Number(v)||0}"></label>`).join("");
 modal("Career execution tracker","EXECUTION",`<div class="tracker-block"><h3>November Internship</h3><div class="allocation-grid">${section("internship",c.internship)}</div></div><div class="tracker-block"><h3>GSoC</h3><div class="allocation-grid">${section("gsoc",c.gsoc)}</div></div><div class="tracker-block"><h3>GATE</h3><div class="allocation-grid">${section("gate",c.gate)}</div></div><div class="tracker-block"><h3>Projects / GitHub</h3><div class="allocation-grid">${section("projects",c.projects)}</div></div><button id="saveCareerTracker" class="primary-button">Save execution data →</button>`);
 $("saveCareerTracker").onclick=async()=>{const out={internship:{...c.internship},gsoc:{...c.gsoc},gate:{...c.gate},projects:{...c.projects}};document.querySelectorAll(".tracker-field").forEach(x=>{out[x.dataset.section][x.dataset.key]=Number(x.value)||0});await saveProfile(currentUser.uid,{careerTracker:out});$("workspaceModal").classList.add("hidden");await loadTasks(currentUser.uid);};
}
async function showOnboarding(){
 const p=await getProfile(currentUser.uid);
 modal("Set up your Career OS","ONBOARDING",`<p class="modal-help">These answers control your daily missions. You can change them later.</p><div class="form-grid"><label>Daily missions <input id="oCap" type="number" min="1" max="5" value="${p.preferences?.dailyCapacity||3}"></label><label>Available minutes <input id="oMin" type="number" min="15" max="600" value="${p.preferences?.availableMinutes||120}"></label><label>College load <select id="oLoad"><option>low</option><option selected>normal</option><option>high</option></select></label><label>Energy <select id="oEnergy"><option>low</option><option selected>normal</option><option>high</option></select></label><label>Primary mode <select id="oFocus"><option>balanced</option><option>internship</option><option>gate</option><option>genai</option></select></label><label>Roadmap phase <select id="oPhase"><option>Foundation</option><option>Programming</option><option>CS Core</option><option>ML</option><option>GenAI</option><option>Career</option></select></label></div><button id="saveOnboarding" class="primary-button">Activate my Career OS →</button>`);
 $("saveOnboarding").onclick=async()=>{await saveProfile(currentUser.uid,{roadmapPhase:$("oPhase").value,preferences:{...(p.preferences||{}),dailyCapacity:Math.min(5,Math.max(1,Number($("oCap").value)||3)),availableMinutes:Math.max(15,Number($("oMin").value)||120),collegeLoad:$("oLoad").value,energy:$("oEnergy").value,focusMode:$("oFocus").value,onboarded:true}});$("workspaceModal").classList.add("hidden");await generateDailyMissions(currentUser.uid,true);alert("Career OS activated. Today's plan has been rebuilt.");};
}
async function showProfileView(){
  const p=await getProfile(currentUser.uid), pref=p.preferences||{}, g=p.goals||{}, a=normalizeAllocation(pref.allocation);
  modal("Career OS Profile","PROFILE",`
    <div class="form-grid">
      <label>Daily capacity <input id="pCapacity" type="number" min="1" max="5" value="${pref.dailyCapacity||3}"></label>
      <label>Available study minutes <input id="pMinutes" type="number" min="15" max="600" value="${pref.availableMinutes||120}"></label>
      <label>College load <select id="pCollege"><option ${pref.collegeLoad==="low"?"selected":""}>low</option><option ${pref.collegeLoad==="normal"?"selected":""}>normal</option><option ${pref.collegeLoad==="high"?"selected":""}>high</option></select></label>
      <label>Energy <select id="pEnergy"><option>low</option><option ${pref.energy==="normal"?"selected":""}>normal</option><option ${pref.energy==="high"?"selected":""}>high</option></select></label>
      <label>Primary focus <select id="pFocus"><option ${pref.focusMode==="balanced"?"selected":""}>balanced</option><option ${pref.focusMode==="internship"?"selected":""}>internship</option><option ${pref.focusMode==="gate"?"selected":""}>gate</option><option ${pref.focusMode==="genai"?"selected":""}>genai</option></select></label>\n      <label>Academic mode <select id="pAcademic"><option ${pref.academicMode==="normal"?"selected":""}>normal</option><option ${pref.academicMode==="semester"?"selected":""}>semester</option><option ${pref.academicMode==="mid"?"selected":""}>mid</option><option ${pref.academicMode==="exam"?"selected":""}>exam</option></select></label>
    </div>
    <h3 class="modal-section-title">Percentage allocation</h3>
    <div class="allocation-grid">
      ${Object.entries(a).map(([k,v])=>`<label>${k.toUpperCase()} <input class="alloc" data-key="${k}" type="number" min="0" max="100" value="${v}"></label>`).join("")}
    </div>
    <h3 class="modal-section-title">Goals</h3>
    <div class="goal-grid">${Object.entries(g).map(([k,v])=>`<label><input class="goal" data-key="${k}" type="checkbox" ${v?"checked":""}> ${k}</label>`).join("")}</div>
    <button id="saveProfile" class="primary-button">Save profile & regenerate plan <span>→</span></button>`);
  $("saveProfile").onclick=async()=>{
    const alloc={};document.querySelectorAll(".alloc").forEach(x=>alloc[x.dataset.key]=Number(x.value)||0);
    const goals={};document.querySelectorAll(".goal").forEach(x=>goals[x.dataset.key]=x.checked);
    await saveProfile(currentUser.uid,{goals,preferences:{...pref,dailyCapacity:Math.max(1,Math.min(5,Number($("pCapacity").value)||3)),availableMinutes:Math.max(15,Number($("pMinutes").value)||120),collegeLoad:$("pCollege").value,energy:$("pEnergy").value,focusMode:$("pFocus").value,academicMode:$("pAcademic").value,allocation:normalizeAllocation(alloc)}});
    $("workspaceModal").classList.add("hidden"); await generateDailyMissions(currentUser.uid,true); alert("Profile saved. Your adaptive plan was rebuilt.");
  };
}

async function showHistoryView(){
  const tasks=allTasks.filter(t=>!t.deleted).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const rows=tasks.slice(0,30).map(t=>`<div class="modal-row"><div><b>${esc(t.text)}</b><small>${esc(t.date||"")} · ${esc(t.source||"")}</small></div><span class="badge ${t.completed?"done":"pending"}">${t.completed?"DONE":t.status==="missed"?"MISSED":"PENDING"}</span></div>`).join("")||'<div class="empty">No history yet.</div>';
  modal("Execution history","HISTORY",`<div class="modal-list">${rows}</div>`);
}

async function showRoadmapView(){
  const {skills}=await loadState(currentUser.uid), health=await getRoadmapHealth(currentUser.uid);
  const rows=[...modules.values()].map(m=>{const s=skills[m.id]||{};return {m,s,stage:skillStage(s)}}).sort((x,y)=>(y.m.weight-x.m.weight)||(x.stage.localeCompare(y.stage)));
  modal("Full adaptive roadmap","ROADMAP",`
    <div class="roadmap-summary"><div><span>STATUS</span><b>${health.status}</b></div><div><span>EVIDENCE</span><b>${health.progress}%</b></div><div><span>DEADLINE</span><b>${health.days}d</b></div><div><span>BOTTLENECK</span><b>${esc(health.bottleneck)}</b></div></div>
    <div class="modal-list">${rows.map(x=>`<div class="modal-row"><div><b>${esc(x.m.name)}</b><small>${esc(x.m.category)} · weight ${x.m.weight} · ${x.s.progress||0}%</small></div><span class="stage-chip">${x.stage}</span></div>`).join("")}</div>`);
}

async function showMissionsView(){
  const today=allTasks.filter(t=>t.date===dateStr()&&!t.deleted);
  modal("Today's mission control","MISSIONS",`<div class="mission-control">${today.map(t=>`<article class="mission-detail"><div><span class="stage-chip">${esc(t.level||"TASK")}</span><b>${esc(t.text)}</b></div><p><strong>WHY</strong> ${esc(t.why||"Roadmap progression")}<br><strong>OUTPUT</strong> ${esc(t.output||"Proof of work")}<br><strong>EFFORT</strong> ${esc(t.effort||"30-45 min")}<br><strong>PROOF</strong> ${t.proofRequired?"Required":"Optional"}</p></article>`).join("")||'<div class="empty">No missions.</div>'}</div>`);
}

async function askMentor(message){const call=httpsCallable(functions,"mentorChat");const result=await call({message});return result.data?.answer||"No response.";}
function showMentorChat(){modal("Ask JARVIS","AI MENTOR",'<div id="mentorMessages" class="mentor-messages"><div class="mentor-bubble"><b>JARVIS</b><br>Ask about your plan, weak skills, GATE, internship, or what to study next.</div></div><div class="mentor-input-row"><textarea id="mentorInput" rows="3" placeholder="What should I study today?"></textarea><button id="mentorSend" class="primary-button">Ask JARVIS →</button></div>');const send=async()=>{const input=$("mentorInput"),box=$("mentorMessages"),m=input.value.trim();if(!m)return;box.insertAdjacentHTML("beforeend",'<div class="user-bubble">'+esc(m)+'</div>');input.value="";$("mentorSend").disabled=true;try{const a=await askMentor(m);box.insertAdjacentHTML("beforeend",'<div class="mentor-bubble"><b>JARVIS</b><br>'+esc(a).replace(/\n/g,"<br>")+'</div>')}catch(e){box.insertAdjacentHTML("beforeend",'<div class="mentor-bubble"><b>JARVIS</b><br>AI mentor is not configured yet.</div>')}$("mentorSend").disabled=false};$("mentorSend").onclick=send;}
function setupReviewAnalytics(){const r=$("weeklyReviewButton"),a=$("analyticsButton"),e=$("evidenceButton");if(r)r.onclick=showWeeklyReview;if(a)a.onclick=showAnalytics;if(e)e.onclick=showEvidenceView;}
function setupCareerTrackerButton(){const b=$("careerTrackerButton");if(b)b.onclick=showCareerTracker;}
function setupCommandCenter(){const map={evidenceButton:showEvidenceView,weeklyReviewButton2:showWeeklyReview,analyticsButton2:showAnalytics,mentorButton:showMentorChat};Object.entries(map).forEach(([id,fn])=>{const b=$(id);if(b)b.onclick=fn});}
function setupWorkspaceNavigation(){
  document.querySelectorAll(".nav-item[data-view]").forEach(btn=>btn.onclick=async()=>{
    document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
    const v=btn.dataset.view;
    if(v==="today")window.scrollTo({top:0,behavior:"smooth"});
    if(v==="missions")await showMissionsView();
    if(v==="history")await showHistoryView();
    if(v==="roadmap")await showRoadmapView();
    if(v==="review")await showWeeklyReview();
    if(v==="analytics")await showAnalytics();
  });
  const enginePanel=document.querySelector("#enginePanel");if(enginePanel){const actions=enginePanel.querySelector(".engine-actions");if(actions){const b=document.createElement("button");b.className="secondary-button";b.textContent="✦ Ask JARVIS";b.onclick=showMentorChat;actions.prepend(b);}}const profile=document.querySelector(".profile-panel"); if(profile){profile.style.cursor="pointer";profile.onclick=showProfileView;}
}

ensureEnginePanel();
setupWorkspaceNavigation();
setupCommandCenter();
setupCareerTrackerButton();
setupReviewAnalytics();
if($("todayDate"))$("todayDate").textContent=pretty(dateStr());

function setupAuthExtras(){
  const createBtn=$("createAccountButton"),resetBtn=$("forgotPasswordButton"),emailInput=$("email"),message=$("loginMessage");
  if(createBtn)createBtn.onclick=async()=>{
    const e=emailInput?.value.trim()||"",p=passwordInput?.value||"";
    if(!e||!p){if(message)message.textContent="Enter email and password first.";return;}
    if(p.length<6){if(message)message.textContent="Password must be at least 6 characters.";return;}
    try{await createUserWithEmailAndPassword(auth,e,p);if(message)message.textContent="Account created. Initializing your workspace…";}
    catch(err){console.error(err);if(message)message.textContent=`Could not create account: ${err.code||"try again"}`;}
  };
  if(resetBtn)resetBtn.onclick=async()=>{
    const e=emailInput?.value.trim()||"";
    if(!e){if(message)message.textContent="Enter your email first.";return;}
    try{await sendPasswordResetEmail(auth,e);if(message)message.textContent="Password reset email sent.";}
    catch(err){console.error(err);if(message)message.textContent=`Reset failed: ${err.code||"try again"}`;}
  };
}

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

setupAuthExtras();

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
    initializeUser(user.uid).then(async()=>{const profile=await getProfile(user.uid);if(!profile.preferences?.onboarded) await showOnboarding();await loadTasks(user.uid);}).catch(err=>{console.error(err);if($("engineText"))$("engineText").textContent="Unable to initialize your workspace. Please refresh.";});
  }else{
    if(loginPage)loginPage.style.display="flex";
    if(dashboard)dashboard.style.display="none";
  }
});
