import {initializeApp} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {getFirestore,collection,addDoc,onSnapshot,doc,updateDoc,setDoc,serverTimestamp,query,where,getDocs,deleteDoc} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCoM00m6KgrWHOn_UB9_Qf9MAowGtovZSA",authDomain:"sister-accountability-app.firebaseapp.com",projectId:"sister-accountability-app",storageBucket:"sister-accountability-app.firebasestorage.app",messagingSenderId:"311794164387",appId:"1:311794164387:web:ccb0dbc236fe8111d51516",measurementId:"G-S95T59VWRJ"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app); const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,"0"), dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=dateKey(new Date()); const tomorrowD=new Date();tomorrowD.setDate(tomorrowD.getDate()+1);const tomorrow=dateKey(tomorrowD);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const TARGET=new Date("2027-02-12T23:59:59");

const GOALS=[
{id:"genai",name:"GenAI Engineering",desc:"LLMs, RAG, agents, evaluation and production AI",rank:1},
{id:"software",name:"Software Engineering",desc:"Python, DSA, Git, Linux, backend and clean code",rank:2},
{id:"gate",name:"GATE",desc:"Core ECE/CS subjects, aptitude, PYQs and revision",rank:3},
{id:"internship",name:"November Internship",desc:"Projects, resume, interview readiness and applications",rank:4},
{id:"gsoc",name:"GSoC / Open Source",desc:"GitHub, issues, pull requests and community work",rank:5},
{id:"projects",name:"Projects / Portfolio",desc:"Ship useful products and prove your skills",rank:6},
{id:"youtube",name:"YouTube / Personal Brand",desc:"AI/tech content without stealing core study time",rank:7},
{id:"startup",name:"Entrepreneurship",desc:"Problem discovery, AI automation and product experiments",rank:8},
{id:"english",name:"English / Communication",desc:"Speaking, writing, GD and interviews",rank:9},
{id:"college",name:"College",desc:"Assignments, labs, exams and urgent academic work",rank:10},
{id:"fitness",name:"Fitness",desc:"Training, movement, recovery and energy",rank:11},
{id:"future",name:"Quantum / Future Tech",desc:"Only after the core AI foundation is stable",rank:12}
];

const ROADMAP=[
[1,"Computer + Developer Foundations","Computer fundamentals • Internet • binary • CLI • Linux • VS Code • Git/GitHub • debugging • problem solving","CORE"],
[2,"Python + Programming","Python • OOP • Java fundamentals • clean code • testing • time/space complexity","CORE"],
[3,"DSA + CS Core","DSA • competitive programming basics • OS • DBMS • networks • computer organization • compiler basics • system design basics","CORE"],
[4,"Web + Backend","HTML • CSS • responsive UI • JavaScript/DOM • React • REST/JSON • Node/Express • FastAPI • SQL/PostgreSQL • MongoDB • Supabase • auth • file/email APIs","BUILD"],
[5,"Engineering Practice","Design patterns • SOLID • refactoring • logging • Git workflow • CI/CD • Docker • Kubernetes basics • Redis • messaging basics • Agile/Scrum","BUILD"],
[6,"Math + ML","Math foundations • probability • linear algebra • ML concepts • evaluation","CORE"],
[7,"Deep Learning","Neural networks • PyTorch • TensorFlow familiarity • CNN/FNN • RNN/LSTM/GRU • attention • transformers • fine-tuning","BUILD"],
[8,"LLM Engineering","LLMs • NLP • prompting • Hugging Face • Ollama • embeddings • vector DB • RAG • structured output • tool calling","PRO"],
[9,"Agents + AI Reliability","LangChain/LangGraph/LlamaIndex • MCP • CrewAI • multi-agent systems • evaluation • guardrails • observability","PRO"],
[10,"Cloud + Production AI","AWS IAM/EC2/S3/RDS/Lambda • Firebase • deployment • Docker deployment • monitoring • API design • production project","PROVE"],
[11,"Career Proof","2–3 strong projects • GitHub proof • GSoC/open source • internship applications • resume • interviews • system design","PROVE"],
[12,"Personal Operating System","GATE • English • YouTube • entrepreneurship • fitness run in controlled weekly slots; quantum stays future/optional","SUPPORT"]
];

// The system intentionally avoids deep Azure, advanced Kubernetes, deep Kafka/RabbitMQ, deep Redux and learning many clouds/frameworks at once.
const TEMPLATES={
python:{title:"Python deep practice",goal:"software",skill:"Python",p:"CRITICAL",body:"Learn one concept, code it without copying, then solve one small problem."},
dsa:{title:"DSA problem solving",goal:"software",skill:"DSA",p:"CRITICAL",body:"Solve one problem. Write approach, complexity and one edge case."},
gate:{title:"GATE focused study + PYQs",goal:"gate",skill:"GATE",p:"CRITICAL",body:"Study one concept and solve 5 previous-year questions."},
genai:{title:"GenAI concept + implementation",goal:"genai",skill:"GenAI",p:"CRITICAL",body:"Learn one concept and build a tiny example or explain it from memory."},
backend:{title:"Backend/API practice",goal:"software",skill:"Backend",p:"IMPORTANT",body:"Build or improve one API endpoint, database flow or authentication feature."},
cs:{title:"CS fundamentals",goal:"software",skill:"CS Core",p:"IMPORTANT",body:"Learn one OS/DBMS/network/architecture concept and answer 5 checks."},
project:{title:"Ship one project improvement",goal:"projects",skill:"Project",p:"IMPORTANT",body:"Make one measurable GitHub improvement: feature, test, docs or deployment."},
intern:{title:"Internship proof",goal:"internship",skill:"Career",p:"IMPORTANT",body:"Improve one resume, portfolio, application or interview-proof item."},
gsoc:{title:"Open-source step",goal:"gsoc",skill:"Open Source",p:"IMPORTANT",body:"Inspect one repository, issue or PR and make one concrete contribution step."},
english:{title:"English communication",goal:"english",skill:"English",p:"SUPPORTING",body:"Speak for 10 minutes and write 5 professional sentences; correct mistakes."},
youtube:{title:"YouTube content block",goal:"youtube",skill:"Content",p:"SUPPORTING",body:"Create one useful AI/tech outline, short or publish-ready draft."},
startup:{title:"Startup experiment",goal:"startup",skill:"Entrepreneurship",p:"SUPPORTING",body:"Identify one user problem and write a tiny AI/product experiment."},
college:{title:"College priority block",goal:"college",skill:"College",p:"IMPORTANT",body:"Clear the most urgent assignment, lab, exam or faculty requirement."},
fitness:{title:"Fitness + recovery",goal:"fitness",skill:"Fitness",p:"SUPPORTING",body:"Complete your planned workout or 30-minute movement/recovery session."},
future:{title:"Future-tech reading",goal:"future",skill:"Quantum",p:"SUPPORTING",body:"Only if core tasks are complete: 20 minutes of quantum/quantum-ML exploration."}
};
let tasks=[],unsub=null,attendance=[];

function daysLeft(){return Math.max(0,Math.ceil((TARGET-new Date())/86400000));}
function weekNo(){return Math.max(1,Math.floor((new Date()-new Date("2026-09-29T00:00:00"))/604800000)+1);}
function planKeys(){
 const day=new Date().getDay(), w=weekNo();
 const base={0:["gate","dsa","english","fitness"],1:["python","genai","intern","english"],2:["dsa","gate","backend","fitness"],3:["genai","gsoc","project","english"],4:["python","gate","cs","intern"],5:["genai","project","youtube","startup"],6:["dsa","backend","english","college"]}[day];
 // Every week rotates the secondary track; core GenAI/DSA/GATE stay frequent.
 const extra=w%3===0?"cs":w%3===1?"project":"backend";
 return [...new Set([...base,extra])];
}
function autoPriority(goalId){
 const urgent={internship:1,gate:2,genai:3,software:4,gsoc:5,projects:6,college:7,english:8,youtube:9,startup:10,fitness:11,future:12};
 return urgent[goalId]||20;
}
async function ensurePlan(uid,existing){
 const todayTasks=existing.filter(t=>t.date===today); if(todayTasks.some(t=>t.source==="JARVIS_V6"))return;
 const keys=planKeys();
 const missing=keys.filter(k=>!todayTasks.some(t=>t.templateKey===k)).slice(0,5);
 for(const key of missing){const t=TEMPLATES[key];await addDoc(collection(db,"tasks"),{userId:uid,title:t.title,description:t.body,goalId:t.goal,goal:GOALS.find(g=>g.id===t.goal)?.name||t.goal,skill:t.skill,priority:t.p,difficulty:"adaptive",date:today,templateKey:key,source:"JARVIS_V6",completed:false,points:t.p==="CRITICAL"?10:t.p==="IMPORTANT"?7:4,createdAt:serverTimestamp()});}
}
function renderGoals(){
 const day=new Date().getDay(); const focus=planKeys().map(k=>TEMPLATES[k]?.goal).filter(Boolean);
 $("goalGrid").innerHTML=GOALS.map(g=>`<div class="goal ${focus.includes(g.id)?"focus":""}"><div class="goal-top"><strong>${esc(g.name)}</strong><span class="goal-rank">${focus.includes(g.id)?"TODAY":"#"+g.rank}</span></div><small>${esc(g.desc)}</small></div>`).join("");
}
function renderRoadmap(){ $("roadmapList").innerHTML=ROADMAP.map(p=>`<div class="phase"><div class="phase-no">${p[0]}</div><div><strong>${esc(p[1])}</strong><small>${esc(p[2])}</small></div><span>${p[3]}</span></div>`).join(""); }
function renderTasks(){
 const todayTasks=tasks.filter(t=>t.date===today).sort((a,b)=>({CRITICAL:0,IMPORTANT:1,SUPPORTING:2}[a.priority]??3)-({CRITICAL:0,IMPORTANT:1,SUPPORTING:2}[b.priority]??3));
 const rank={CRITICAL:0,IMPORTANT:1,SUPPORTING:2}; todayTasks.sort((a,b)=>Number(a.completed)-Number(b.completed)||rank[a.priority]-rank[b.priority]);
 $("missionCount").textContent=`${todayTasks.length} missions`;
 $("taskList").innerHTML=todayTasks.length?todayTasks.map(t=>`<div class="task ${t.completed?"done":""}"><button class="check ${t.completed?"done":""}" data-complete="${t.id}">${t.completed?"✓":""}</button><div><h3>${esc(t.title)}</h3><div class="task-meta"><span class="badge ${t.priority?.toLowerCase()}">${esc(t.priority||"SUPPORTING")}</span><span>${esc(t.goal||"")}</span><span>${esc(t.skill||"")}</span>${t.source==="PERSONAL"?"<span>PERSONAL</span>":"<span>JARVIS</span>"}</div></div>${t.source==="PERSONAL"?`<button class="delete" data-delete="${t.id}" title="Delete">×</button>`:"<span></span>"}</div>`).join(""):`<div class="empty"><strong>JARVIS is preparing your plan.</strong><p>Refresh once if this is your first login.</p></div>`;
 document.querySelectorAll("[data-complete]").forEach(b=>b.onclick=()=>toggleTask(b.dataset.complete)); document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>removeTask(b.dataset.delete));
 const done=todayTasks.filter(t=>t.completed).length,total=todayTasks.length,pct=total?Math.round(done/total*100):0;
 $("progressPercent").textContent=pct+"%";$("progressPercentBottom").textContent=pct+"%";$("barFill").style.width=pct+"%";$("ringPercent").textContent=pct+"%";$("completedCount").textContent=done;$("pendingCount").textContent=total-done;$("totalCount").textContent=total;$("completedSummary").textContent=`${done} / ${total} missions complete`;$("jarvisPercent").textContent=pct+"%";
 const top=todayTasks.find(t=>!t.completed);$("jarvisPriority").textContent=top?.priority||"DONE";$("jarvisObjective").textContent=top?.title||"All missions complete. Review or build.";$("jarvisMessage").textContent=top?`Your highest-value move is ${top.title.toLowerCase()}. Finish it before adding more work.`:"Core mission complete. Use remaining time for a project, review or recovery.";
 const deg=pct*3.6;$("ringPercent").parentElement.parentElement.style.background=`conic-gradient(var(--red) ${deg}deg,#202834 ${deg}deg)`;
}
async function toggleTask(id){const t=tasks.find(x=>x.id===id);if(!t)return;await updateDoc(doc(db,"tasks",id),{completed:!t.completed,completedAt:!t.completed?serverTimestamp():null});}
async function removeTask(id){if(!confirm("Delete this personal task?"))return;await deleteDoc(doc(db,"tasks",id));}
async function loadTasks(uid){
 if(unsub)unsub(); const q=query(collection(db,"tasks"),where("userId","==",uid));
 unsub=onSnapshot(q,async snap=>{tasks=snap.docs.map(d=>({id:d.id,...d.data()}));try{await ensurePlan(uid,tasks);}catch(e){console.error("plan",e)}renderTasks();renderGoals();renderHistory();await refreshAttendance();});
}
function renderHistory(){const recent=[...tasks].filter(t=>t.completed).sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,7);$("historyList").innerHTML=recent.length?recent.map(t=>`<div class="history-item"><div><strong>${esc(t.title)}</strong><small>${esc(t.date)} • ${esc(t.goal||"")}</small></div><b>DONE</b></div>`).join(""):`<div class="muted">No completed missions yet. Your history starts with today's execution.</div>`;}
async function getAttendance(uid){const s=await getDocs(query(collection(db,"attendance"),where("userId","==",uid)));return s.docs.map(d=>({id:d.id,...d.data()}));}
function checkpointState(){const n=new Date(),mins=n.getHours()*60+n.getMinutes(),secs=n.getSeconds();if(mins<270)return"WAITING";if(mins===270)return secs<60?"OPEN":"MISSED";return"MISSED";}
async function refreshAttendance(){const u=auth.currentUser;if(!u)return;try{attendance=await getAttendance(u.uid)}catch(e){attendance=[];console.error(e)}const present=attendance.some(a=>a.date===today&&a.status==="PRESENT");const state=present?"PRESENT":checkpointState();$("attendanceStatus").textContent=state==="PRESENT"?"CHECKED IN":state==="OPEN"?"OPEN NOW":state;$("attendanceText").textContent=present?"Today's checkpoint is recorded.":state==="WAITING"?"Opens at exactly 04:30 AM.":state==="OPEN"?"This minute is your attendance window.":"Missed — recorded for Sunday review.";$("checkpointDetail").textContent=present?"Good. Now protect the first critical mission.":state==="OPEN"?"Mark attendance now; after this minute it becomes missed.":"The system will keep the miss for the weekly review.";$("attendanceButton").disabled=state!=="OPEN";calcStreak();}
function calcStreak(){const set=new Set(attendance.filter(a=>a.status==="PRESENT").map(a=>a.date));let d=new Date();if(!set.has(dateKey(d)))d.setDate(d.getDate()-1);let n=0;while(set.has(dateKey(d))){n++;d.setDate(d.getDate()-1)}$("streakNumber").textContent=n;const score=Math.min(100,Math.round((tasks.filter(t=>t.date===today&&t.completed).reduce((s,t)=>s+(t.points||5),0))));$("accountabilityScore").textContent=score;}
async function markAttendance(){const u=auth.currentUser;if(!u)return;const state=checkpointState();if(state!=="OPEN"){alert(state==="WAITING"?"Attendance opens exactly at 04:30 AM.":"The 04:30 AM attendance window has passed.");return}const key=dateKey(new Date());await setDoc(doc(db,"attendance",`${u.uid}_${key}`),{userId:u.uid,date:key,requiredTime:"04:30",status:"PRESENT",actualTime:new Date().toISOString(),createdAt:serverTimestamp()},{merge:true});await refreshAttendance();}
function sundayReview(){const sunday=new Date().getDay()===0;const missed=tasks.filter(t=>t.date<today&&!t.completed&&t.source==="JARVIS_V6").slice(-12);$("sundayReviewCard").classList.toggle("hidden",!sunday);if(sunday){$("missedCount").textContent=`${missed.length} missed`;$("missedList").innerHTML=missed.length?missed.map(t=>`<div class="missed-item">${esc(t.date)} — ${esc(t.title)} <small>Review and reschedule instead of ignoring it.</small></div>`).join(""):`<div class="muted">Clean week. Nothing to carry into review.</div>`;}}
function openModal(){$("taskDate").value=today;$("taskTitle").value="";$("taskSkill").value="";$("taskFormMessage").textContent="";$("taskModal").classList.remove("hidden");$("taskTitle").focus()}
function closeModal(){$("taskModal").classList.add("hidden")}
function setupModal(){ $("taskGoal").innerHTML=GOALS.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("");["addTaskTop","addTaskMission"].forEach(id=>$(id).onclick=openModal);$("closeTaskModal").onclick=closeModal;$("cancelTask").onclick=closeModal;$("taskModal").onclick=e=>{if(e.target===$("taskModal"))closeModal()};$("taskForm").onsubmit=async e=>{e.preventDefault();const u=auth.currentUser;if(!u)return;const goal=$("taskGoal").value,g=GOALS.find(x=>x.id===goal);try{await addDoc(collection(db,"tasks"),{userId:u.uid,title:$('taskTitle').value.trim(),goalId:goal,goal:g.name,skill:$('taskSkill').value.trim()||"Personal",priority:$('taskPriority').value,date:$('taskDate').value,source:"PERSONAL",completed:false,points:$('taskPriority').value==="CRITICAL"?10:$('taskPriority').value==="IMPORTANT"?7:4,createdAt:serverTimestamp()});closeModal()}catch(err){console.error(err);$("taskFormMessage").textContent="Could not save. Check Firebase rules.";}}}
function header(){const d=new Date();$("daysLeft").textContent=`${daysLeft()} days remaining`;}

$("loginButton").onclick=async()=>{const email=$("email").value.trim(),password=$("password").value;if(!email||!password){$("loginMessage").textContent="Enter email and password.";return}try{await signInWithEmailAndPassword(auth,email,password)}catch(e){console.error(e);$("loginMessage").textContent="Invalid email or password."}};
$("password").onkeydown=e=>{if(e.key==="Enter")$("loginButton").click()};$("logoutButton").onclick=()=>signOut(auth);$("attendanceButton").onclick=markAttendance;
setupModal();renderRoadmap();header();setInterval(()=>{header();if(auth.currentUser)refreshAttendance()},15000);
onAuthStateChanged(auth,u=>{if(u){$("loginBox").classList.add("hidden");$("app").classList.remove("hidden");loadTasks(u.uid);sundayReview()}else{$("loginBox").classList.remove("hidden");$("app").classList.add("hidden");if(unsub){unsub();unsub=null}}});
