import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCoM00m6KgrWHOn_UB9_Qf9MAowGtovZSA",authDomain:"sister-accountability-app.firebaseapp.com",projectId:"sister-accountability-app",storageBucket:"sister-accountability-app.firebasestorage.app",messagingSenderId:"311794164387",appId:"1:311794164387:web:ccb0dbc236fe8111d51516",measurementId:"G-S95T59VWRJ"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,"0");
const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=dateKey(new Date());
const tomorrowDate=new Date();tomorrowDate.setDate(tomorrowDate.getDate()+1);const tomorrow=dateKey(tomorrowDate);
const fmtDate=d=>new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(d).toUpperCase();
const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));

const ROADMAP=[
 {phase:1,title:"Programming Foundations",skills:"Python • Git • Linux",priority:"CRITICAL"},
 {phase:2,title:"DSA + CS Fundamentals",skills:"DSA • OOP • DBMS • OS • Networks",priority:"CRITICAL"},
 {phase:3,title:"Mathematics for ML",skills:"Linear algebra • probability • calculus",priority:"IMPORTANT"},
 {phase:4,title:"Machine Learning",skills:"Supervised • unsupervised • evaluation",priority:"IMPORTANT"},
 {phase:5,title:"Deep Learning",skills:"PyTorch • neural networks • training",priority:"IMPORTANT"},
 {phase:6,title:"LLM Fundamentals",skills:"Transformers • tokenization • fine-tuning",priority:"CRITICAL"},
 {phase:7,title:"RAG Systems",skills:"Embeddings • vector DB • retrieval",priority:"CRITICAL"},
 {phase:8,title:"AI Agents",skills:"Tools • function calling • MCP • agents",priority:"CRITICAL"},
 {phase:9,title:"AI Engineering",skills:"APIs • evals • reliability • LLMOps",priority:"CRITICAL"},
 {phase:10,title:"System Design + Cloud",skills:"AWS • Docker • deployment • scale",priority:"IMPORTANT"},
 {phase:11,title:"Production Projects",skills:"GitHub • portfolio • real users",priority:"CRITICAL"},
 {phase:12,title:"Internship + Interviews",skills:"DSA • system design • communication",priority:"CRITICAL"}
];
const TASK_TEMPLATES=[
 {key:"python",title:"Python fundamentals: learn one concept and write 2 small examples",goal:"GenAI Engineering",skill:"Programming",priority:"CRITICAL",points:10},
 {key:"dsa",title:"DSA: solve 1 problem and write the approach in your own words",goal:"FAANG / GSoC",skill:"DSA",priority:"CRITICAL",points:10},
 {key:"math",title:"ML math: study one foundation concept and explain it without notes",goal:"ML Foundation",skill:"Mathematics",priority:"IMPORTANT",points:7},
 {key:"project",title:"Project: ship one small improvement to GitHub",goal:"Portfolio / Internship",skill:"Project",priority:"IMPORTANT",points:8},
 {key:"english",title:"English: speak for 10 minutes and write 5 corrected sentences",goal:"Communication",skill:"English",priority:"SUPPORTING",points:4}
];
let unsubscribeTasks=null,attendanceTimer=null,allTasks=[];

function setHeader(){ $("todayDate").textContent=fmtDate(new Date());$("todayDay").textContent=new Intl.DateTimeFormat("en-IN",{weekday:"long"}).format(new Date()).toUpperCase(); }
function checkpoint(){const d=new Date(),m=d.getHours()*60+d.getMinutes();return m<270?"WAITING":m===270?"OPEN":"MISSED";}
function attendanceText(s){return s==="PRESENT"?"Attendance recorded":"Daily checkpoint at exactly 4:30 AM";}

async function getUserAttendance(uid){const snap=await getDocs(query(collection(db,"attendance"),where("userId","==",uid)));return snap.docs.map(x=>({id:x.id,...x.data()}));}
async function markAttendance(){const user=auth.currentUser;if(!user)return;const now=new Date(),status=checkpoint();if(status!=="OPEN"){alert(status==="WAITING"?"Attendance opens at exactly 4:30 AM.":"Today's 4:30 AM checkpoint was missed.");return;}const key=dateKey(now);try{await setDoc(doc(db,"attendance",`${user.uid}_${key}`),{userId:user.uid,date:key,requiredTime:"04:30",status:"PRESENT",actualTime:now.toISOString(),createdAt:serverTimestamp()},{merge:true});await refreshAttendance();}catch(e){console.error(e);alert("Attendance could not be saved. Check Firestore rules.");}}
async function refreshAttendance(){const user=auth.currentUser;if(!user)return;let records=[];try{records=await getUserAttendance(user.uid);}catch(e){console.error(e);}const present=records.some(r=>r.date===today&&r.status==="PRESENT");const state=present?"PRESENT":checkpoint();$("attendanceStatus").textContent=state;$("attendanceText").textContent=attendanceText(state);$("checkpointDetail").textContent=state==="PRESENT"?"You're checked in. Now execute today's highest-priority mission.":state==="OPEN"?"Checkpoint is open right now. Mark attendance before starting your mission.":state==="MISSED"?"Checkpoint missed. It will be recorded for Sunday review.":"The checkpoint opens at exactly 4:30 AM.";$("attendanceButton").disabled=state!=="OPEN";return records;}

function taskPlan(existing){
 const used=new Set(existing.filter(t=>t.date===today).map(t=>t.templateKey).filter(Boolean));
 const completedBySkill=new Set(existing.filter(t=>t.completed).map(t=>t.skill));
 const plan=[];
 for(const base of TASK_TEMPLATES){if(used.has(base.key))continue;plan.push(base);}
 // On a blank day create the full core set; on subsequent days use completion history to adapt priority.
 return plan.map((t,i)=>({...t,adjustedPriority:(t.priority==="SUPPORTING"&&completedBySkill.size<2)?"IMPORTANT":t.priority,index:i}));
}
async function ensureDailyTasks(uid,existing){const todayExisting=existing.filter(t=>t.date===today);if(todayExisting.length>0)return;const plan=taskPlan(existing);if(!plan.length)return;for(const t of plan){await addDoc(collection(db,"tasks"),{text:t.title,userId:uid,date:today,completed:false,priority:t.adjustedPriority,goal:t.goal,skill:t.skill,points:t.points,templateKey:t.key,source:"JARVIS_RULE_ENGINE",difficulty:"FOUNDATION",proofRequired:t.key!=="english",createdAt:serverTimestamp()});}}

function renderToday(tasks){const list=$("taskList");list.innerHTML="";tasks.sort((a,b)=>({CRITICAL:0,IMPORTANT:1,SUPPORTING:2}[a.priority]??3)-({CRITICAL:0,IMPORTANT:1,SUPPORTING:2}[b.priority]??3));$("missionCount").textContent=`${tasks.length} mission${tasks.length===1?"":"s"}`;if(!tasks.length){list.innerHTML='<div class="empty-state">JARVIS is preparing your next mission…</div>';return;}for(const task of tasks){const row=document.createElement("div");row.className=`task-row ${task.completed?"done":""}`;row.innerHTML=`<div class="task-main"><button class="check" aria-label="Complete mission">${task.completed?"✓":""}</button><div class="task-copy"><div class="task-name">${escapeHtml(task.text)}</div><div class="task-meta"><span class="priority-badge priority-${String(task.priority||"IMPORTANT").toLowerCase()}">${escapeHtml(task.priority||"IMPORTANT")}</span><span>•</span><span>${escapeHtml(task.skill||"Skill")}</span><span>•</span><span>${escapeHtml(task.goal||"Goal")}</span></div></div></div><span class="task-status">${task.completed?"DONE":"NEXT"}</span>`;row.querySelector(".check").addEventListener("click",async()=>{try{await updateDoc(doc(db,"tasks",task.id),{completed:!task.completed,completedAt:!task.completed?serverTimestamp():null});}catch(e){console.error(e);alert("Could not update mission.");}});list.appendChild(row);}}

function updateProgress(tasks){const total=tasks.length,done=tasks.filter(t=>t.completed).length,pct=total?Math.round(done/total*100):0;$("progressPercent").textContent=`${pct}%`;$("progressPercentBottom").textContent=`${pct}%`;$("completedSummary").textContent=`${done} / ${total} missions`;$("completedCount").textContent=done;$("pendingCount").textContent=total-done;$("totalCount").textContent=total;$("ringPercent").textContent=`${pct}%`;$("progressRing").style.background=`conic-gradient(var(--red) ${pct*3.6}deg,#1d2530 ${pct*3.6}deg)`;$("barFill").style.width=`${pct}%`;$("jarvisPercent").textContent=`${pct}%`;const critical=tasks.find(t=>!t.completed&&t.priority==="CRITICAL")||tasks.find(t=>!t.completed);$("jarvisPriority").textContent=critical?critical.priority:"CLEAR";$("jarvisObjective").textContent=critical?critical.text:"All missions complete. Protect the streak.";$("jarvisMessage").textContent=!tasks.length?"Preparing today's mission...":pct===100?"Mission complete. Review what you learned and protect tomorrow's checkpoint.":critical?`Highest priority: ${critical.skill}. Finish this before supporting work.`:"Keep moving. Consistency beats intensity.";}

function calculateStreak(records){const present=new Set(records.filter(r=>r.status==="PRESENT").map(r=>r.date));let d=new Date();let streak=0;while(present.has(dateKey(d))){streak++;d.setDate(d.getDate()-1);}return streak;}
function accountabilityScore(tasks,records,history){const recent=history.filter(t=>t.date>=dateKey(new Date(Date.now()-6*86400000)));const done=recent.filter(t=>t.completed).length,total=recent.length;const taskScore=total?Math.round(done/total*70):0;const att=Math.min(calculateStreak(records)*5,30);return Math.min(100,taskScore+att);}
function renderHistory(tasks){const grouped={};for(const t of tasks){if(!grouped[t.date])grouped[t.date]={done:0,total:0};grouped[t.date].total++;if(t.completed)grouped[t.date].done++;}const rows=Object.entries(grouped).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,6);$("historyList").innerHTML=rows.length?rows.map(([d,v])=>`<div class="history-item"><strong>${escapeHtml(d)}</strong><span>${v.done}/${v.total} complete</span></div>`).join(""):'<div class="empty-state">No activity yet.</div>';}
function renderRoadmap(){const currentPhase=Math.min(12,1+Math.floor(allTasks.filter(t=>t.completed).length/10));$("roadmapList").innerHTML=ROADMAP.map(r=>`<div class="roadmap-item ${r.phase===currentPhase?"active":""} ${r.phase<currentPhase?"done":""}"><strong>${r.phase}. ${escapeHtml(r.title)}</strong><span>${escapeHtml(r.skills)}</span></div>`).join("");}
function renderSunday(tasks){const sunday=new Date().getDay()===0;const card=$("sundayReviewCard");if(!sunday){card.classList.add("hidden");return;}card.classList.remove("hidden");const missed=tasks.filter(t=>t.date<today&&!t.completed).slice(0,8);$("missedCount").textContent=`${missed.length} missed`;$("sundayText").textContent=missed.length?"These missions were not completed. Review the reason, then let the next plan recover the gap.":"Clean week. No missed missions found.";$("missedList").innerHTML=missed.map(t=>`<div class="missed-item">${escapeHtml(t.date)} • ${escapeHtml(t.text)}</div>`).join("");}

function loadTasks(uid){const q=query(collection(db,"tasks"),where("userId","==",uid));unsubscribeTasks=onSnapshot(q,async snap=>{allTasks=snap.docs.map(d=>({id:d.id,...d.data()}));try{await ensureDailyTasks(uid,allTasks);}catch(e){console.error("Daily generation failed",e);}const todayTasks=allTasks.filter(t=>t.date===today);renderToday(todayTasks);updateProgress(todayTasks);renderHistory(allTasks);renderRoadmap();renderSunday(allTasks);try{const records=await refreshAttendance();const streak=calculateStreak(records);$("streakNumber").textContent=streak;$("accountabilityScore").textContent=accountabilityScore(todayTasks,records,allTasks);}catch(e){console.error(e);}},e=>{console.error("FIRESTORE ERROR",e);$("taskList").innerHTML='<div class="empty-state">Could not load missions. Check Firebase rules.</div>';});}

$("loginButton").addEventListener("click",async()=>{const email=$("email").value.trim(),password=$("password").value;$("loginMessage").textContent="";if(!email||!password){$("loginMessage").textContent="Enter email and password.";return;}try{await signInWithEmailAndPassword(auth,email,password);}catch(e){console.error(e);$("loginMessage").textContent="Invalid email or password.";}});
$("password").addEventListener("keydown",e=>{if(e.key==="Enter")$("loginButton").click();});
$("logoutButton").addEventListener("click",()=>signOut(auth));
$("attendanceButton").addEventListener("click",markAttendance);
setHeader();
if(attendanceTimer)clearInterval(attendanceTimer);attendanceTimer=setInterval(()=>{if(auth.currentUser)refreshAttendance();},15000);
onAuthStateChanged(auth,user=>{if(user){$("loginBox").classList.add("hidden");$("app").classList.remove("hidden");loadTasks(user.uid);}else{$("loginBox").classList.remove("hidden");$("app").classList.add("hidden");if(unsubscribeTasks){unsubscribeTasks();unsubscribeTasks=null;}}});
