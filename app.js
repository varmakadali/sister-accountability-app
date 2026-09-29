import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   FIREBASE CONFIG
========================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyCoM00m6KgrWHOn_UB9_Qf9MAowGtovZSA",

  authDomain:
    "sister-accountability-app.firebaseapp.com",

  projectId:
    "sister-accountability-app",

  storageBucket:
    "sister-accountability-app.firebasestorage.app",

  messagingSenderId:
    "311794164387",

  appId:
    "1:311794164387:web:ccb0dbc236fe8111d51516",

  measurementId:
    "G-S95T59VWRJ"

};


/* =========================
   INITIALIZE
========================= */

const app =
  initializeApp(firebaseConfig);

const auth =
  getAuth(app);

const db =
  getFirestore(app);


/* =========================
   HELPER
========================= */

const $ = (id) =>
  document.getElementById(id);


function getDateString(date){

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2,"0")}-${String(
    date.getDate()
  ).padStart(2,"0")}`;

}


function prettyDate(dateString){

  return new Date(
    `${dateString}T00:00:00`
  ).toLocaleDateString(
    "en-IN",
    {
      day:"numeric",
      month:"short",
      year:"numeric"
    }
  ).toUpperCase();

}


function escapeHtml(text){

  return String(text).replace(
    /[&<>"']/g,

    (char) => ({

      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"

    }[char])

  );

}


/* =========================
   ACCOUNTABILITY ENGINE
========================= */

const ROADMAP = [
  { title:"Python fundamentals + one coding problem", goal:"GenAI Engineering", skill:"Programming", priority:"CRITICAL", points:10 },
  { title:"DSA practice: solve 1 problem and write the approach", goal:"FAANG / GSoC", skill:"DSA", priority:"CRITICAL", points:10 },
  { title:"ML/AI foundation: learn one concept and explain it in your own words", goal:"GenAI Engineering", skill:"ML", priority:"IMPORTANT", points:7 },
  { title:"Build or improve one small GitHub project component", goal:"Projects / Internship", skill:"Project", priority:"IMPORTANT", points:7 },
  { title:"English speaking: 10 minutes + write 5 corrected sentences", goal:"Communication", skill:"English", priority:"SUPPORTING", points:4 }
];

let attendanceState = null;
let autoTasksCreated = false;

function localDateTime(){
  const d=new Date();
  return { date:getDateString(d), hour:d.getHours(), minute:d.getMinutes() };
}

function isSunday(){ return new Date().getDay() === 0; }

function attendanceStatus(){
  const t=localDateTime();
  const minutes=t.hour*60+t.minute;
  const target=4*60+30;
  if(minutes===target) return "OPEN";
  if(minutes<target) return "WAITING";
  return "MISSED";
}

function ensureAccountabilityUI(){
  if(document.getElementById("attendanceCard")) return;
  const taskList=document.getElementById("taskList");
  if(!taskList) return;
  const card=document.createElement("div");
  card.id="attendanceCard";
  card.className="accountability-card";
  card.innerHTML=`<div class="accountability-head"><span>04:30 AM ATTENDANCE</span><b id="attendanceStatus">CHECKING...</b></div>
  <p id="attendanceText">Daily attendance is required at exactly 4:30 AM.</p>
  <button id="attendanceButton" class="attendance-button">MARK ATTENDANCE</button>`;
  taskList.parentNode.insertBefore(card,taskList);
  document.getElementById("attendanceButton").addEventListener("click", markAttendance);
  refreshAttendanceUI();
}

async function markAttendance(){
  const user=auth.currentUser; if(!user) return;
  const now=new Date();
  const mins=now.getHours()*60+now.getMinutes();
  if(mins!==270){
    alert("Attendance opens at exactly 4:30 AM. Come back at 4:30 AM.");
    return;
  }
  const key=getDateString(now);
  try{
    await setDoc(doc(db,"attendance",`${user.uid}_${key}`),{
      userId:user.uid,date:key,requiredTime:"04:30",status:"PRESENT",actualTime:now.toISOString(),createdAt:serverTimestamp()
    },{merge:true});
    attendanceState="PRESENT";
    refreshAttendanceUI();
  }catch(e){ console.error("ATTENDANCE ERROR",e); alert("Attendance save failed."); }
}

async function refreshAttendanceUI(){
  const statusEl=document.getElementById("attendanceStatus");
  const textEl=document.getElementById("attendanceText");
  const btn=document.getElementById("attendanceButton");
  if(!statusEl) return;
  const user=auth.currentUser; if(!user) return;
  const key=getDateString(new Date());
  try{
    const snap=await getDocs(query(collection(db,"attendance"),where("userId","==",user.uid)));
    let found=false; snap.forEach(d=>{if(d.data().date===key && d.data().status==="PRESENT") found=true;});
    attendanceState=found?"PRESENT":attendanceStatus();
  }catch(e){ attendanceState=attendanceStatus(); }
  statusEl.textContent=attendanceState;
  btn.disabled=attendanceState!=="OPEN";
  if(attendanceState==="PRESENT") textEl.textContent="Attendance recorded. Discipline starts at 4:30 AM.";
  else if(attendanceState==="WAITING") textEl.textContent="Next checkpoint: exactly 4:30 AM.";
  else if(attendanceState==="OPEN") textEl.textContent="CHECKPOINT OPEN — mark attendance now.";
  else textEl.textContent="Today's 4:30 AM checkpoint was missed. It will be reviewed on Sunday.";
}

async function ensureDailyTasks(userId, existingTasks){
  if(autoTasksCreated || existingTasks.some(t=>t.date===today)) return;
  autoTasksCreated=true;
  const todayTasks=ROADMAP.map((r,i)=>({
    text:r.title, userId, date:today, completed:false, priority:r.priority,
    goal:r.goal, skill:r.skill, points:r.points, source:"AI_MENTOR",
    difficulty:i<2?"FOUNDATION":"BUILD", proofRequired:i!==4, createdAt:serverTimestamp()
  }));
  try{
    for(const task of todayTasks) await addDoc(collection(db,"tasks"),task);
  }catch(e){ console.error("AUTO TASK ERROR",e); autoTasksCreated=false; }
}

function sundayReview(allTasks){
  const old=document.getElementById("sundayReviewCard"); if(old) old.remove();
  if(!isSunday()) return;
  const missed=allTasks.filter(t=>t.date && t.date<today && !t.completed);
  const card=document.createElement("section"); card.id="sundayReviewCard"; card.className="accountability-card sunday-card";
  card.innerHTML=`<div class="accountability-head"><span>SUNDAY ACCOUNTABILITY REVIEW</span><b>${missed.length} MISSED</b></div><p>${missed.length?"Missed work is recorded for review. Do not delete it; recover it through the next plan.":"Clean week. No missed missions found."}</p>`;
  document.querySelector(".phone-column")?.appendChild(card);
}

function mentorMessage(tasks){
  const pending=tasks.filter(t=>!t.completed);
  if(!tasks.length) return "JARVIS: No mission exists. Daily mission generation is ready.";
  if(!pending.length) return "JARVIS: Mission complete. Protect the streak and prepare for tomorrow.";
  const critical=pending.filter(t=>t.priority==="CRITICAL").length;
  return critical?`JARVIS: ${critical} critical mission${critical>1?"s":""} pending. Finish the highest-priority work before supporting tasks.`:`JARVIS: ${pending.length} mission${pending.length>1?"s":""} pending. Keep moving; consistency beats intensity.`;
}

/* =========================
   DATES
========================= */

const today =
  getDateString(
    new Date()
  );


const tomorrowDate =
  new Date();


tomorrowDate.setDate(
  tomorrowDate.getDate() + 1
);


const tomorrow =
  getDateString(
    tomorrowDate
  );


let unsubscribeTasks = null;


$("todayDate").textContent =
  prettyDate(today);


/* =========================
   LOGIN
========================= */

$("loginButton").addEventListener(
  "click",
  async () => {

    const email =
      $("email").value.trim();

    const password =
      $("password").value;

    $("loginMessage").textContent =
      "";


    if(!email || !password){

      $("loginMessage").textContent =
        "Enter email and password.";

      return;

    }


    try{

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    }

    catch(error){

      console.error(
        "LOGIN ERROR:",
        error
      );

      $("loginMessage").textContent =
        "Invalid email or password.";

    }

  }
);


/* ENTER LOGIN */

$("password").addEventListener(
  "keydown",
  (event) => {

    if(event.key === "Enter"){

      $("loginButton").click();

    }

  }
);


/* =========================
   LOGOUT
========================= */

$("logoutButton").addEventListener(
  "click",
  async () => {

    try{

      await signOut(auth);

    }

    catch(error){

      console.error(
        "LOGOUT ERROR:",
        error
      );

    }

  }
);


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(
  auth,
  (user) => {

    if(user){

      $("loginBox")
        .classList
        .add("hidden");

      $("app")
        .classList
        .remove("hidden");


      if(unsubscribeTasks){

        unsubscribeTasks();

      }


      ensureAccountabilityUI();
      loadTasks(
        user.uid
      );
      setInterval(refreshAttendanceUI, 30000);

    }

    else{

      $("loginBox")
        .classList
        .remove("hidden");

      $("app")
        .classList
        .add("hidden");


      if(unsubscribeTasks){

        unsubscribeTasks();

        unsubscribeTasks = null;

      }

    }

  }
);


/* =========================
   ADD TASK
========================= */

async function addTask(
  date,
  inputId
){

  const user =
    auth.currentUser;


  if(!user){

    alert(
      "Please login first."
    );

    return;

  }


  const input =
    $(inputId);


  const text =
    input.value.trim();


  if(!text){

    return;

  }


  try{

    await addDoc(
      collection(
        db,
        "tasks"
      ),
      {

        text:text,

        completed:false,

        userId:user.uid,

        date:date,

        createdAt:
          serverTimestamp()

      }
    );


    input.value = "";


  }

  catch(error){

    console.error(
      "ADD TASK ERROR:",
      error
    );

    alert(
      "Could not add task."
    );

  }

}


/* =========================
   ADD TODAY
========================= */

$("addButton").addEventListener(
  "click",
  () => {

    addTask(
      today,
      "taskInput"
    );

  }
);


/* =========================
   ADD TOMORROW
========================= */

$("tomorrowAddButton").addEventListener(
  "click",
  () => {

    addTask(
      tomorrow,
      "tomorrowInput"
    );

  }
);


/* ENTER ADD TODAY */

$("taskInput").addEventListener(
  "keydown",
  (event) => {

    if(event.key === "Enter"){

      $("addButton").click();

    }

  }
);


/* ENTER ADD TOMORROW */

$("tomorrowInput").addEventListener(
  "keydown",
  (event) => {

    if(event.key === "Enter"){

      $("tomorrowAddButton").click();

    }

  }
);


/* =========================
   LOAD TASKS
========================= */

function loadTasks(userId){

  const tasksQuery =
    query(
      collection(
        db,
        "tasks"
      ),

      where(
        "userId",
        "==",
        userId
      )
    );


  unsubscribeTasks =
    onSnapshot(
      tasksQuery,

      (snapshot) => {

        const allTasks = [];


        snapshot.forEach(
          (taskDoc) => {

            allTasks.push({

              id:taskDoc.id,

              ...taskDoc.data()

            });

          }
        );


        ensureDailyTasks(userId, allTasks);

        const todayTasks =
          allTasks.filter(
            (task) =>
              task.date === today
          );


        const tomorrowTasks =
          allTasks.filter(
            (task) =>
              task.date === tomorrow
          );


        renderToday(
          todayTasks
        );


        renderTomorrow(
          tomorrowTasks
        );


        updateProgress(
          todayTasks
        );


        renderHistory(
          allTasks
        );


        updateStreak(
          allTasks
        );

        sundayReview(allTasks);

      },

      (error) => {

        console.error(
          "FIRESTORE ERROR:",
          error
        );

      }

    );

}


/* =========================
   RENDER TODAY
========================= */

function renderToday(tasks){

  window.__todayTasks = tasks;

  const list =
    $("taskList");


  list.innerHTML = "";


  if(tasks.length === 0){

    list.innerHTML = `

      <div class="task-row">

        <div class="task-main">

          <div class="check">
            –
          </div>

          <div class="task-name">
            No missions assigned.
          </div>

        </div>

      </div>

    `;

    return;

  }


  tasks.forEach(
    (task) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "task-row";


      if(task.completed){

        row.classList.add(
          "done"
        );

      }


      row.innerHTML = `

        <div class="task-main">

          <button
            type="button"
            class="check"
          >
            ${
              task.completed
                ? "✓"
                : ""
            }
          </button>

          <div class="task-name">
            <span class="priority-badge priority-${String(task.priority||"IMPORTANT").toLowerCase()}">${escapeHtml(task.priority||"IMPORTANT")}</span>
            ${escapeHtml(task.text)}
          </div>

        </div>


        <div
          style="
            display:flex;
            align-items:center;
            gap:6px;
          "
        >

          <span class="task-status">

            ${
              task.completed
                ? "COMPLETED"
                : "PENDING"
            }

          </span>

          <button
            type="button"
            class="delete-task"
          >
            ×
          </button>

        </div>

      `;


      /* =========================
         COMPLETE
      ========================== */

      const checkButton =
        row.querySelector(
          ".check"
        );


      checkButton.addEventListener(
        "click",
        async (event) => {

          event.preventDefault();

          event.stopPropagation();


          try{

            checkButton.disabled =
              true;


            await updateDoc(
              doc(
                db,
                "tasks",
                task.id
              ),

              {
                completed:
                  !Boolean(
                    task.completed
                  )
              }

            );


          }

          catch(error){

            console.error(
              "TASK UPDATE ERROR:",
              error
            );

            alert(
              "Task update failed."
            );

          }

          finally{

            checkButton.disabled =
              false;

          }

        }
      );


      /* =========================
         DELETE
      ========================== */

      const deleteButton =
        row.querySelector(
          ".delete-task"
        );


      deleteButton.addEventListener(
        "click",
        async (event) => {

          event.preventDefault();

          event.stopPropagation();


          try{

            await deleteDoc(
              doc(
                db,
                "tasks",
                task.id
              )
            );

          }

          catch(error){

            console.error(
              "DELETE ERROR:",
              error
            );

            alert(
              "Could not delete task."
            );

          }

        }
      );


      list.appendChild(
        row
      );

    }
  );

}


/* =========================
   RENDER TOMORROW
========================= */

function renderTomorrow(tasks){

  const list =
    $("tomorrowList");


  list.innerHTML = "";


  if(tasks.length === 0){

    list.innerHTML = `

      <div class="tomorrow-row">

        <i></i>

        <span>
          No plan added yet.
        </span>

      </div>

    `;

    return;

  }


  tasks.forEach(
    (task) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "tomorrow-row";


      row.innerHTML = `

        <i></i>

        <span>
          ${escapeHtml(task.text)}
        </span>

        <button
          type="button"
        >
          ×
        </button>

      `;


      row
        .querySelector("button")
        .addEventListener(
          "click",
          async () => {

            try{

              await deleteDoc(
                doc(
                  db,
                  "tasks",
                  task.id
                )
              );

            }

            catch(error){

              console.error(
                "DELETE TOMORROW ERROR:",
                error
              );

            }

          }
        );


      list.appendChild(
        row
      );

    }
  );

}


/* =========================
   PROGRESS + JARVIS
========================= */

function updateProgress(tasks){

  const total =
    tasks.length;


  const completed =
    tasks.filter(
      (task) =>
        task.completed === true
    ).length;


  const pending =
    total - completed;


  const percentage =
    total === 0
      ? 0
      : Math.round(
          completed /
          total *
          100
        );


  /* NORMAL PROGRESS */

  $("completedCount")
    .textContent =
    completed;


  $("pendingCount")
    .textContent =
    pending;


  $("totalCount")
    .textContent =
    total;


  $("completedSummary")
    .textContent =
    `${completed} / ${total} MISSIONS COMPLETED`;


  $("progressPercent")
    .textContent =
    `${percentage}%`;


  $("ringPercent")
    .textContent =
    `${percentage}%`;


  $("barFill")
    .style.width =
    `${percentage}%`;


  const degree =
    percentage * 3.6;


  $("progressRing").style.background =
    `conic-gradient(
      #ff0020
      0deg,
      #ff0020
      ${degree}deg,
      #222
      ${degree}deg,
      #222
      360deg
    )`;


  /* =========================
     JARVIS
  ========================== */

  $("jarvisPercent")
    .textContent =
    `${percentage}%`;


  $("jarvisBar")
    .style.width =
    `${percentage}%`;


  if(total === 0){

    $("jarvisSystemStatus")
      .textContent =
      "SYSTEM: AWAITING MISSIONS";


    $("jarvisMessage")
      .textContent =
      "Good evening. Your missions are waiting.";


    $("jarvisObjective")
      .textContent =
      "Add today's first mission.";

  }

  else if(percentage === 100){

    $("jarvisSystemStatus")
      .textContent =
      "SYSTEM: MISSION COMPLETE";


    $("jarvisMessage")
      .textContent =
      "Excellent work. All missions completed.";


    $("jarvisObjective")
      .textContent =
      "All missions complete. Maintain the streak.";

  }

  else if(percentage >= 75){

    $("jarvisSystemStatus")
      .textContent =
      "SYSTEM: ALMOST COMPLETE";


    $("jarvisMessage")
      .textContent =
      "Almost there. Complete the remaining missions.";


    $("jarvisObjective")
      .textContent =
      `${pending} mission${pending === 1 ? "" : "s"} remaining.`;

  }

  else if(percentage >= 50){

    $("jarvisSystemStatus")
      .textContent =
      "SYSTEM: OPERATIONAL";


    $("jarvisMessage")
      .textContent =
      "Good progress. Stay focused and keep going.";


    $("jarvisObjective")
      .textContent =
      `${pending} mission${pending === 1 ? "" : "s"} remaining.`;

  }

  else{

    $("jarvisSystemStatus")
      .textContent =
      "SYSTEM: OPERATIONAL";


    $("jarvisMessage")
      .textContent =
      "Your mission has begun. Do not lose focus.";


    $("jarvisObjective")
      .textContent =
      `${pending} mission${pending === 1 ? "" : "s"} remaining.`;

  }

  const tasksForMentor = window.__todayTasks || [];
  const mentor = document.getElementById("jarvisMessage");
  if(mentor) mentor.textContent = mentorMessage(tasksForMentor);

}


/* =========================
   HISTORY
========================= */

function renderHistory(allTasks){

  const days = {};


  allTasks.forEach(
    (task) => {

      if(!task.date)
        return;


      if(!days[task.date]){

        days[task.date] = {

          total:0,

          completed:0

        };

      }


      days[task.date].total++;


      if(task.completed === true){

        days[task.date].completed++;

      }

    }
  );


  const dates =
    Object.keys(days)
      .sort()
      .reverse()
      .slice(0,5);


  const list =
    $("historyList");


  list.innerHTML = "";


  if(dates.length === 0){

    list.innerHTML = `

      <div class="history-item">

        <div class="history-top">

          <span>
            No history yet
          </span>

          <b>
            0%
          </b>

        </div>

      </div>

    `;

    return;

  }


  dates.forEach(
    (date) => {

      const day =
        days[date];


      const percentage =
        day.total === 0
          ? 0
          : Math.round(
              day.completed /
              day.total *
              100
            );


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "history-item";


      item.innerHTML = `

        <div class="history-top">

          <span>
            ${prettyDate(date)}
          </span>

          <b>
            ${percentage}%
          </b>

        </div>


        <div class="history-bar">

          <i
            style="
              width:${percentage}%
            "
          ></i>

        </div>


        <div class="history-count">

          ${day.completed}
          /
          ${day.total}
          Completed

        </div>

      `;


      list.appendChild(
        item
      );

    }
  );

}


/* =========================
   STREAK
========================= */

function updateStreak(allTasks){

  const daily = {};


  allTasks.forEach(
    (task) => {

      if(!task.date)
        return;


      if(!daily[task.date]){

        daily[task.date] = {

          total:0,

          completed:0

        };

      }


      daily[task.date].total++;


      if(task.completed === true){

        daily[task.date].completed++;

      }

    }
  );


  let streak = 0;


  const date =
    new Date();


  while(true){

    const key =
      getDateString(date);


    const day =
      daily[key];


    if(
      !day ||
      day.total === 0 ||
      day.completed !== day.total
    ){

      break;

    }


    streak++;


    date.setDate(
      date.getDate() - 1
    );

  }


  $("streakNumber")
    .textContent =
    streak;


  $("rightStreak")
    .textContent =
    streak;


  if(streak === 0){

    $("streakMessage")
      .textContent =
      "Keep the armor strong.";

  }

  else{

    $("streakMessage")
      .textContent =
      `${streak} days strong. Keep the armor strong.`;

  }


  updateAchievements(
    streak
  );

}


/* =========================
   ACHIEVEMENTS
========================= */

function updateAchievements(
  streak
){

  const achievements = [

    ["achievement1",1],

    ["achievement3",3],

    ["achievement7",7],

    ["achievement30",30]

  ];


  achievements.forEach(
    ([id,required]) => {

      const element =
        $(id);


      if(!element)
        return;


      const status =
        element.querySelector(
          "small"
        );


      if(streak >= required){

        element.classList
          .remove("locked");


        if(status){

          status.textContent =
            "UNLOCKED";

        }

      }

      else{

        element.classList
          .add("locked");


        if(status){

          status.textContent =
            "LOCKED";

        }

      }

    }
  );

}