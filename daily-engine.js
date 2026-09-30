import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const config = {
  apiKey:"AIzaSyCoM00m6KgrWHOn_UB9_Qf9MAowGtovZSA",
  authDomain:"sister-accountability-app.firebaseapp.com",
  projectId:"sister-accountability-app",
  storageBucket:"sister-accountability-app.firebasestorage.app",
  messagingSenderId:"311794164387",
  appId:"1:311794164387:web:ccb0dbc236fe8111d51516"
};
const app = getApps().length ? getApps()[0] : initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

const DAY = 86400000;
const MASTER = "2027-02-12";
const INTERNSHIP = "2026-11-30";
const MAX = 5;

const MODULES = [
  ["computer-fundamentals","Computer Fundamentals","foundation",1,[]],
  ["internet-fundamentals","Internet Fundamentals","foundation",1,["computer-fundamentals"]],
  ["cli","CLI / Terminal Basics","engineering",2,["computer-fundamentals"]],
  ["git","Git","engineering",2,["cli"]],
  ["github","GitHub","engineering",2,["git"]],
  ["vscode","VS Code","engineering",1,["cli"]],
  ["python-basics","Python","programming",3,["cli","vscode"]],
  ["problem-solving","Problem Solving Basics","programming",3,["python-basics"]],
  ["complexity","Time & Space Complexity","dsa",3,["problem-solving"]],
  ["dsa","DSA","dsa",5,["python-basics","complexity"]],
  ["sql","SQL","backend",3,["problem-solving"]],
  ["fastapi","FastAPI","backend",3,["python-basics"]],
  ["react","React","web",3,["javascript","dom"]],
  ["javascript","JavaScript","web",3,["html","css"]],
  ["html","HTML","web",2,["internet-fundamentals"]],
  ["css","CSS","web",2,["html"]],
  ["math-ml","Mathematics for ML","ml",4,["number-system"]],
  ["ml","Machine Learning","ml",4,["math-ml","python-basics"]],
  ["neural-networks","Neural Networks","dl",4,["ml"]],
  ["pytorch","PyTorch","dl",3,["neural-networks"]],
  ["transformers","Transformers","genai",5,["attention"]],
  ["llm","LLM Fundamentals","genai",5,["transformers"]],
  ["prompt","Prompt Engineering","genai",3,["llm"]],
  ["embeddings","Embeddings","genai",3,["llm"]],
  ["vector-db","Vector Database","genai",3,["embeddings","sql"]],
  ["rag","RAG","genai",5,["embeddings","vector-db","llm"]],
  ["langchain","LangChain","genai",2,["rag"]],
  ["langgraph","LangGraph","genai",3,["langchain"]],
  ["mcp","MCP","genai",3,["langgraph"]],
  ["eval","AI Evaluation","production",4,["rag","llm"]],
  ["n8n","n8n","automation",2,["rest","api-docs"]],
  ["aws","AWS","cloud",4,["linux","docker"]],
  ["project-portfolio","Portfolio Project","project",5,["github","fastapi","react"]],
  ["internship-prep","November Internship Prep","career",5,["dsa","github","project-portfolio"]],
  ["gsoc-open-source","GSoC / Open Source","career",4,["git","github","problem-solving"]],
  ["gate","GATE Preparation","gate",4,["problem-solving","math-ml"]],
  ["english","English Communication","communication",2,[]],
  ["fitness","Fitness","fitness",1,[]]
].map(x=>({id:x[0],name:x[1],category:x[2],weight:x[3],prereqs:x[4]}));

function today(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function daysUntil(s){return Math.max(0,Math.ceil((new Date(s+"T23:59:59")-new Date())/DAY));}
function stage(s){
  const x=s?.status||"not_started";
  if(x==="failed") return "RETEST";
  if(x==="learning") return "PRACTICE";
  if(x==="practicing") return "TEST";
  if(x==="tested") return s.revisionDue && s.revisionDue<=today() ? "REVISE" : "APPLY";
  if(x==="mastered") return "DONE";
  return "LEARN";
}
function unlocked(m,skills){
  return m.prereqs.every(p=>["tested","mastered"].includes(skills[p]?.status));
}
function goalEnabled(m,goals){
  if(m.category==="gate") return goals.gate!==false;
  if(["genai","ml","dl","production","automation"].includes(m.category)) return goals.genai!==false;
  if(["programming","dsa","backend","web","engineering","cloud"].includes(m.category)) return goals.software!==false;
  if(m.category==="career" && m.id==="internship-prep") return goals.internship!==false;
  if(m.id==="gsoc-open-source") return goals.gsoc!==false;
  if(m.category==="project") return goals.projects!==false;
  if(m.category==="communication") return goals.english!==false;
  if(m.category==="fitness") return goals.fitness!==false;
  return true;
}
function score(m,skills,tasks,profile){
  const s=skills[m.id]||{};
  const st=stage(s);
  if(st==="DONE" || !unlocked(m,skills) || !goalEnabled(m,profile.goals||{})) return -Infinity;
  let n=m.weight*10;
  if(st==="RETEST") n+=55;
  if(st==="TEST") n+=40;
  if(st==="REVISE") n+=32;
  if(st==="PRACTICE") n+=24;
  if(st==="LEARN") n+=16;
  if((s.confidence||0)<.5) n+=10;
  if(s.lastFailed) n+=25;
  const missed=tasks.filter(t=>t.skillId===m.id&&t.status==="missed").length;
  n+=Math.min(30,missed*6);

  const internshipDays=daysUntil(INTERNSHIP);
  const masterDays=daysUntil(MASTER);
  if(["internship-prep","project-portfolio","dsa","python-basics","github"].includes(m.id))
    n+=Math.max(0,50-Math.floor(internshipDays/2));
  if(["gate","math-ml","dsa","problem-solving"].includes(m.id))
    n+=18;
  if(["llm","transformers","rag","embeddings","vector-db","mcp","eval"].includes(m.id))
    n+=15;

  const alloc=profile.preferences?.allocation||{};
  const bucket=["genai","ml","dl","production"].includes(m.category)?"genai":
    ["programming","dsa","backend","web","engineering","cloud"].includes(m.category)?"software":
    m.category==="gate"?"gate":
    ["career","project"].includes(m.category)?"career":
    m.category==="communication"?"english":m.category==="fitness"?"fitness":"projects";
  n+=(Number(alloc[bucket])||0)*.5;

  if(profile.preferences?.focusMode==="internship" && ["dsa","python-basics","github","project-portfolio","internship-prep"].includes(m.id)) n+=30;
  if(profile.preferences?.focusMode==="gate" && ["gate","math-ml","problem-solving","dsa"].includes(m.id)) n+=30;
  if(profile.preferences?.focusMode==="genai" && ["python-basics","math-ml","ml","neural-networks","pytorch","transformers","llm","rag","eval"].includes(m.id)) n+=30;

  const day=new Date().getDay();
  if(day===0 && m.id==="gate") n+=8;
  if(day===6 && ["project-portfolio","github","gsoc-open-source"].includes(m.id)) n+=8;
  return n;
}
function mission(m,s){
  const st=stage(s);
  const actions={
    LEARN:[`Learn ${m.name} in simple words; make 5 recall questions.`,"Notes + 5 recall answers"],
    PRACTICE:[`Practice ${m.name} with 3 small hands-on problems.`,"3 completed outputs"],
    TEST:[`Take a closed-book test on ${m.name}; record score and mistakes.`,"Score + mistake list"],
    RETEST:[`Retest ${m.name} after fixing the previous mistakes.`,"New score + corrected mistakes"],
    REVISE:[`Revise ${m.name} from memory, then solve one fresh example.`,"Revision + fresh example"],
    APPLY:[`Apply ${m.name} in a small real-world example and save proof.`,"Working artifact / proof"]
  }[st]||[`Work on ${m.name}.`,"Evidence"];
  const proof=["TEST","RETEST","APPLY"].includes(st)||m.weight>=4||["career","project","gate"].includes(m.category);
  return {text:actions[0],output:actions[1],level:st,proofRequired:proof,
    effort:m.weight>=4?"45-60 min":m.weight>=2?"30-45 min":"15-25 min",
    priority:m.weight>=4?"critical":m.weight>=2?"important":"supporting"};
}
async function read(uid){
  const [u,k,t]=await Promise.all([
    getDocs(query(collection(db,"users"),where("userId","==",uid))),
    getDocs(query(collection(db,"skills"),where("userId","==",uid))),
    getDocs(query(collection(db,"tasks"),where("userId","==",uid)))
  ]);
  const profile=u.docs[0]?.data()||{};
  const skills={};k.forEach(d=>{const x=d.data();skills[x.skillId||d.id]=x;});
  const tasks=[];t.forEach(d=>tasks.push({id:d.id,...d.data()}));
  return {profile,skills,tasks};
}
async function generate(uid){
  const {profile,skills,tasks}=await read(uid);
  const d=today();
  const todayTasks=tasks.filter(t=>t.date===d&&!t.deleted);
  if(todayTasks.some(t=>t.schedulerVersion===4)) return;

  // Archive only old engine-generated missions for today. Manual tasks are untouched.
  await Promise.all(todayTasks.filter(t=>t.source==="engine"&&!t.schedulerVersion).map(t=>
    updateDoc(doc(db,"tasks",t.id),{deleted:true,archivedByScheduler:true,archivedAt:serverTimestamp()})));

  const history=tasks.filter(t=>!t.deleted);
  const available=Number(profile.preferences?.availableMinutes)||120;
  const configured=Number(profile.preferences?.dailyCapacity)||3;
  const capacity=Math.min(MAX,Math.max(1,configured,Math.floor(available/25)));
  const candidates=MODULES.map(m=>({m,n:score(m,skills,history,profile)}))
    .filter(x=>Number.isFinite(x.n)).sort((a,b)=>b.n-a.n);

  const chosen=[],used=new Set();
  const priorities=[
    ["recovery",m=>m.id==="gate"||m.id==="dsa"||m.category==="career"||m.category==="project"],
    ["core",m=>["programming","dsa","ml","cs","engineering"].includes(m.category)],
    ["genai",m=>["genai","dl","production","automation"].includes(m.category)],
    ["career",m=>["career","project"].includes(m.category)],
    ["nonnegotiable",m=>m.id==="english"||m.id==="fitness"]
  ];
  for(const [,test] of priorities){
    const pick=candidates.find(x=>!used.has(x.m.id)&&test(x.m));
    if(pick){chosen.push(pick);used.add(pick.m.id);}
    if(chosen.length>=capacity) break;
  }
  for(const x of candidates){
    if(chosen.length>=capacity) break;
    if(!used.has(x.m.id)){chosen.push(x);used.add(x.m.id);}
  }
  if(profile.preferences?.collegeLoad==="high") chosen.splice(Math.min(2,chosen.length));

  for(const x of chosen.slice(0,MAX)){
    const a=mission(x.m,skills[x.m.id]);
    await addDoc(collection(db,"tasks"),{
      userId:uid,date:d,source:"engine",schedulerVersion:4,
      text:a.text,skillId:x.m.id,category:x.m.category,goalId:x.m.category,
      level:a.level,priority:a.priority,difficulty:Math.min(5,(skills[x.m.id]?.difficulty||1)+1),
      proofRequired:a.proofRequired,completed:false,status:"pending",
      deadline:MASTER,why:"Selected automatically from your current skill state, prerequisites, performance and deadlines.",
      output:a.output,effort:a.effort,score:x.n,createdAt:serverTimestamp()
    });
  }
  await setDoc(doc(db,"users",uid),{lastGeneratedDate:d,schedulerVersion:4,updatedAt:serverTimestamp()},{merge:true});
}
let lastDate="";
async function tick(user){
  const d=today();
  if(d!==lastDate){lastDate=d;await generate(user.uid);}
}
onAuthStateChanged(auth,user=>{
  if(!user)return;
  setTimeout(()=>tick(user).catch(console.error),1800);
  setInterval(()=>tick(user).catch(console.error),60000);
});
