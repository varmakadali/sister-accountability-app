import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
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
  setDoc,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCoM00m6KgrWHOn_UB9_Qf9MAowGtovZSA",
  authDomain: "sister-accountability-app.firebaseapp.com",
  projectId: "sister-accountability-app",
  storageBucket: "sister-accountability-app.firebasestorage.app",
  messagingSenderId: "311794164387",
  appId: "1:311794164387:web:ccb0dbc236fe8111d51516",
  measurementId: "G-S95T59VWRJ"
};


// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

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


// ============================================================
// MASTER CURRICULUM
// ============================================================

const CURRICULUM = [

  // ----------------------------------------------------------
  // FOUNDATION
  // ----------------------------------------------------------

  ["computer-fundamentals", "Computer Fundamentals", "foundation", 1, []],

  [
    "internet-fundamentals",
    "Internet Fundamentals",
    "foundation",
    1,
    ["computer-fundamentals"]
  ],

  [
    "number-system",
    "Number System & Binary",
    "foundation",
    1,
    ["computer-fundamentals"]
  ],

  [
    "cli",
    "CLI / Terminal Basics",
    "foundation",
    1,
    ["computer-fundamentals"]
  ],

  [
    "git",
    "Git",
    "engineering",
    2,
    ["cli"]
  ],

  [
    "github",
    "GitHub",
    "engineering",
    2,
    ["git"]
  ],

  [
    "linux",
    "Linux",
    "engineering",
    2,
    ["cli"]
  ],

  [
    "vscode",
    "VS Code",
    "engineering",
    1,
    ["cli"]
  ],


  // ----------------------------------------------------------
  // PROGRAMMING
  // ----------------------------------------------------------

  [
    "python-basics",
    "Python",
    "programming",
    3,
    ["cli", "vscode"]
  ],

  [
    "python-oop",
    "Python OOP",
    "programming",
    3,
    ["python-basics"]
  ],

  [
    "java-basics",
    "Java Basics",
    "programming",
    2,
    ["python-basics"]
  ],

  [
    "debugging",
    "Debugging",
    "programming",
    2,
    ["python-basics"]
  ],

  [
    "problem-solving",
    "Problem Solving Basics",
    "programming",
    3,
    ["python-basics"]
  ],


  // ----------------------------------------------------------
  // WEB
  // ----------------------------------------------------------

  [
    "html",
    "HTML",
    "web",
    2,
    ["internet-fundamentals"]
  ],

  [
    "css",
    "CSS",
    "web",
    2,
    ["html"]
  ],

  [
    "responsive",
    "Responsive Design",
    "web",
    2,
    ["css"]
  ],

  [
    "javascript",
    "JavaScript",
    "web",
    3,
    ["html", "css"]
  ],

  [
    "dom",
    "Browser & DOM",
    "web",
    3,
    ["javascript"]
  ],

  [
    "static-web",
    "Static Websites",
    "web",
    2,
    ["html", "css", "javascript"]
  ],

  [
    "react",
    "React",
    "web",
    3,
    ["javascript", "dom"]
  ],

  [
    "redux",
    "Redux Basics",
    "web",
    2,
    ["react"]
  ],

  [
    "https",
    "HTTPS",
    "backend",
    1,
    ["internet-fundamentals"]
  ],

  [
    "rest",
    "REST API",
    "backend",
    2,
    ["javascript", "https"]
  ],

  [
    "json",
    "JSON",
    "backend",
    1,
    ["javascript"]
  ],


  // ----------------------------------------------------------
  // BACKEND
  // ----------------------------------------------------------

  [
    "node",
    "Node.js",
    "backend",
    2,
    ["javascript"]
  ],

  [
    "express",
    "Express.js",
    "backend",
    2,
    ["node", "rest"]
  ],

  [
    "sql",
    "SQL",
    "backend",
    3,
    ["problem-solving"]
  ],

  [
    "postgresql",
    "PostgreSQL",
    "backend",
    3,
    ["sql"]
  ],

  [
    "mongodb",
    "MongoDB",
    "backend",
    2,
    ["sql"]
  ],

  [
    "supabase",
    "Supabase",
    "backend",
    2,
    ["postgresql"]
  ],

  [
    "fastapi",
    "FastAPI",
    "backend",
    3,
    ["python-basics", "rest"]
  ],

  [
    "auth",
    "Authentication JWT OAuth",
    "backend",
    3,
    ["fastapi", "rest"]
  ],

  [
    "file-upload",
    "File Upload",
    "backend",
    2,
    ["fastapi"]
  ],

  [
    "email-service",
    "Email Service",
    "backend",
    2,
    ["fastapi"]
  ],

  [
    "api-docs",
    "API Documentation",
    "engineering",
    2,
    ["rest"]
  ],


  // ----------------------------------------------------------
  // ENGINEERING
  // ----------------------------------------------------------

  [
    "complexity",
    "Time & Space Complexity",
    "dsa",
    3,
    ["problem-solving"]
  ],

  [
    "dsa",
    "DSA",
    "dsa",
    5,
    ["python-basics", "complexity"]
  ],

  [
    "cp-basics",
    "Competitive Programming Basics",
    "dsa",
    2,
    ["dsa"]
  ],

  [
    "clean-code",
    "Clean Code",
    "engineering",
    2,
    ["python-oop"]
  ],

  [
    "solid",
    "SOLID Principles",
    "engineering",
    2,
    ["python-oop", "clean-code"]
  ],

  [
    "design-patterns",
    "Design Patterns",
    "engineering",
    2,
    ["solid"]
  ],

  [
    "refactoring",
    "Refactoring",
    "engineering",
    2,
    ["clean-code"]
  ],

  [
    "testing",
    "Testing",
    "engineering",
    2,
    ["python-basics"]
  ],

  [
    "logging",
    "Logging",
    "engineering",
    1,
    ["python-basics"]
  ],

  [
    "git-workflow",
    "Git Workflow",
    "engineering",
    2,
    ["git", "github"]
  ],

  [
    "cicd",
    "CI/CD",
    "engineering",
    2,
    ["git-workflow"]
  ],

  [
    "docker",
    "Docker",
    "engineering",
    3,
    ["linux", "fastapi"]
  ],

  [
    "kubernetes",
    "Kubernetes Basics",
    "engineering",
    1,
    ["docker"]
  ],

  [
    "redis",
    "Redis",
    "engineering",
    1,
    ["express"]
  ],

  [
    "messaging",
    "RabbitMQ / Kafka Basics",
    "engineering",
    1,
    ["express"]
  ],

  [
    "agile",
    "Agile & Scrum",
    "engineering",
    1,
    ["git-workflow"]
  ],


  // ----------------------------------------------------------
  // COMPUTER SCIENCE
  // ----------------------------------------------------------

  [
    "os",
    "Operating Systems",
    "cs",
    3,
    ["computer-fundamentals"]
  ],

  [
    "dbms",
    "DBMS",
    "cs",
    3,
    ["sql"]
  ],

  [
    "networks",
    "Computer Networks",
    "cs",
    3,
    ["internet-fundamentals"]
  ],

  [
    "coa",
    "Computer Organization & Architecture",
    "cs",
    2,
    ["number-system"]
  ],

  [
    "compiler",
    "Compiler Basics",
    "cs",
    1,
    ["computer-fundamentals"]
  ],

  [
    "system-design",
    "System Design Basics",
    "cs",
    3,
    ["networks", "dbms", "dsa"]
  ],


  // ----------------------------------------------------------
  // ML / DEEP LEARNING
  // ----------------------------------------------------------

  [
    "math-ml",
    "Mathematics for ML",
    "ml",
    4,
    ["number-system"]
  ],

  [
    "ml",
    "Machine Learning",
    "ml",
    4,
    ["math-ml", "python-basics"]
  ],

  [
    "neural-networks",
    "Neural Networks",
    "dl",
    4,
    ["ml"]
  ],

  [
    "pytorch",
    "PyTorch",
    "dl",
    3,
    ["neural-networks"]
  ],

  [
    "tensorflow",
    "TensorFlow Familiarity",
    "dl",
    1,
    ["neural-networks"]
  ],

  [
    "cnn-fnn",
    "CNN / FNN",
    "dl",
    3,
    ["pytorch"]
  ],

  [
    "rnn",
    "RNN",
    "dl",
    2,
    ["pytorch"]
  ],

  [
    "lstm-gru",
    "LSTM / GRU",
    "dl",
    2,
    ["rnn"]
  ],

  [
    "attention",
    "Attention",
    "genai",
    3,
    ["lstm-gru"]
  ],

  [
    "transformers",
    "Transformers",
    "genai",
    5,
    ["attention"]
  ],

  [
    "finetuning",
    "Fine-tuning",
    "genai",
    3,
    ["transformers"]
  ],


  // ----------------------------------------------------------
  // GENAI
  // ----------------------------------------------------------

  [
    "llm",
    "LLM Fundamentals",
    "genai",
    5,
    ["transformers"]
  ],

  [
    "nlp",
    "NLP",
    "genai",
    3,
    ["ml", "llm"]
  ],

  [
    "prompt",
    "Prompt Engineering",
    "genai",
    3,
    ["llm"]
  ],

  [
    "huggingface",
    "Hugging Face",
    "genai",
    3,
    ["llm", "python-basics"]
  ],

  [
    "ollama",
    "Ollama",
    "genai",
    2,
    ["llm"]
  ],

  [
    "embeddings",
    "Embeddings",
    "genai",
    3,
    ["llm"]
  ],

  [
    "vector-db",
    "Vector Database",
    "genai",
    3,
    ["embeddings", "sql"]
  ],

  [
    "rag",
    "RAG",
    "genai",
    5,
    ["embeddings", "vector-db", "llm"]
  ],

  [
    "langchain",
    "LangChain",
    "genai",
    2,
    ["rag"]
  ],

  [
    "langgraph",
    "LangGraph",
    "genai",
    3,
    ["langchain"]
  ],

  [
    "llamaindex",
    "LlamaIndex",
    "genai",
    2,
    ["rag"]
  ],

  [
    "mcp",
    "MCP",
    "genai",
    3,
    ["langgraph"]
  ],

  [
    "crewai",
    "CrewAI",
    "agents",
    2,
    ["mcp", "langgraph"]
  ],

  [
    "multi-agent",
    "Multi-Agent Systems",
    "agents",
    4,
    ["crewai"]
  ],

  [
    "eval",
    "AI Evaluation",
    "production",
    4,
    ["rag", "llm"]
  ],

  [
    "guardrails",
    "AI Guardrails",
    "production",
    3,
    ["eval"]
  ],


  // ----------------------------------------------------------
  // AUTOMATION / CLOUD
  // ----------------------------------------------------------

  [
    "n8n",
    "n8n",
    "automation",
    2,
    ["rest", "api-docs"]
  ],

  [
    "zapier",
    "Zapier",
    "automation",
    1,
    ["rest"]
  ],

  [
    "aws",
    "AWS IAM / EC2 / S3 / RDS / Lambda",
    "cloud",
    4,
    ["linux", "docker"]
  ],

  [
    "azure-ai",
    "Azure AI",
    "cloud",
    1,
    ["aws"]
  ],

  [
    "firebase",
    "Firebase Basics",
    "cloud",
    2,
    ["javascript"]
  ],

  [
    "deployment",
    "Deployment",
    "cloud",
    3,
    ["docker", "aws"]
  ],

  [
    "monitoring",
    "Monitoring",
    "production",
    2,
    ["deployment"]
  ],

  [
    "docker-deploy",
    "Docker Deployment",
    "production",
    3,
    ["docker", "deployment"]
  ],


  // ----------------------------------------------------------
  // CAREER / PROOF
  // ----------------------------------------------------------

  [
    "project-portfolio",
    "Portfolio Project",
    "project",
    5,
    ["github", "fastapi", "react"]
  ],

  [
    "internship-prep",
    "November Internship Prep",
    "career",
    5,
    ["dsa", "github", "project-portfolio"]
  ],

  [
    "gsoc-open-source",
    "GSoC / Open Source",
    "career",
    4,
    ["git", "github", "problem-solving"]
  ],

  [
    "gate",
    "GATE Preparation",
    "gate",
    4,
    ["problem-solving", "math-ml"]
  ],

  [
    "english",
    "English Communication",
    "communication",
    2,
    []
  ],

  [
    "youtube",
    "YouTube / Personal Brand",
    "brand",
    1,
    []
  ],

  [
    "startup",
    "Startup / AI Automation",
    "business",
    1,
    ["python-basics", "n8n"]
  ],

  [
    "fitness",
    "Fitness",
    "fitness",
    1,
    []
  ]

];


// ============================================================
// MODULE MAP
// ============================================================

const modules = new Map(
  CURRICULUM.map(
    ([id, name, category, weight, prereqs]) => [
      id,
      {
        id,
        name,
        category,
        weight,
        prereqs
      }
    ]
  )
);


// ============================================================
// TASK PHRASES
// ============================================================

const PHRASES = {

  foundation: [
    "Learn the concept in simple words",
    "Make 5 recall questions"
  ],

  programming: [
    "Code the concept from memory",
    "Solve 3 small programs"
  ],

  web: [
    "Build a tiny working example",
    "Explain the concept without notes"
  ],

  backend: [
    "Build one API/example",
    "Test the API with real input"
  ],

  dsa: [
    "Solve 3 problems",
    "Write the approach + Big-O"
  ],

  engineering: [
    "Apply it to a small codebase",
    "Write one practical checklist"
  ],

  cs: [
    "Study one core concept",
    "Answer 10 exam/interview questions"
  ],

  ml: [
    "Learn with one numeric example",
    "Solve 5 concept questions"
  ],

  dl: [
    "Implement a tiny example",
    "Explain the architecture"
  ],

  genai: [
    "Build a minimal working example",
    "Test it with 3 inputs"
  ],

  agents: [
    "Build one small agent workflow",
    "Test failure and success cases"
  ],

  production: [
    "Add one reliability/evaluation check",
    "Document the design"
  ],

  automation: [
    "Build one automation workflow",
    "Test one failure path"
  ],

  cloud: [
    "Deploy or configure one small component",
    "Write the deployment steps"
  ],

  project: [
    "Produce a GitHub artifact",
    "Write a short README update"
  ],

  career: [
    "Create one proof-of-skill artifact",
    "Record what was learned"
  ],

  gate: [
    "Solve 10 GATE questions",
    "Review every mistake"
  ],

  communication: [
    "Speak for 5 minutes",
    "Write 150 words and self-correct"
  ],

  brand: [
    "Create one useful content asset",
    "Publish or prepare it for publishing"
  ],

  business: [
    "Validate one small idea",
    "Document one user/problem insight"
  ],

  fitness: [
    "Complete today's planned workout",
    "Log completion honestly"
  ]

};


// ============================================================
// DATE HELPERS
// ============================================================

function dateStr(d = new Date()) {

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

}


function addDays(s, n) {

  const d = new Date(`${s}T00:00:00`);

  d.setDate(d.getDate() + n);

  return dateStr(d);

}


function pretty(s) {

  return new Date(
    `${s}T00:00:00`
  ).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  ).toUpperCase();

}


function esc(v) {

  return String(v ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[m])
  );

}


function daysLeft() {

  return Math.max(
    1,
    Math.ceil(
      (
        new Date(`${DEADLINE}T23:59:59`) -
        new Date()
      ) / 86400000
    )
  );

}


// ============================================================
// ENGINE PANEL
// ============================================================

function ensureEnginePanel() {

  if ($("enginePanel")) return;

  const taskList = $("taskList");

  if (!taskList || !taskList.parentElement) {
    return;
  }

  const card = document.createElement("section");

  card.className = "card";
  card.id = "enginePanel";

  card.innerHTML = `
    <div class="card-title">
      <h2>🧠 JARVIS TASK ENGINE</h2>
      <small>ADAPTIVE ROADMAP</small>
    </div>

    <div
      id="engineText"
      style="color:#aeb5ba;line-height:1.7;font-size:13px"
    ></div>

    <div
      style="
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin-top:14px
      "
    >

      <button
        id="addManualTask"
        style="
          padding:10px 14px;
          border-radius:9px;
          border:1px solid #394047;
          background:#0c1012;
          color:#fff;
          cursor:pointer
        "
      >
        + Add Real-Life Task
      </button>

      <button
        id="checkIn430"
        style="
          padding:10px 14px;
          border-radius:9px;
          border:1px solid #394047;
          background:#0c1012;
          color:#fff;
          cursor:pointer
        "
      >
        04:30 AM Check-in
      </button>

    </div>
  `;

  taskList.parentElement.appendChild(card);

  const addButton = $("addManualTask");
  const attendanceButton = $("checkIn430");

  if (addButton) {
    addButton.onclick = () => addManualTask();
  }

  if (attendanceButton) {
    attendanceButton.onclick = () => checkAttendance();
  }

}


// ============================================================
// MODULE SCORING
// ============================================================

function scoreModule(
  m,
  skills,
  history,
  todayTasks
) {

  const s = skills[m.id] || {};

  if (s.status === "mastered") {
    return -Infinity;
  }

  if (
    m.prereqs.some(
      p =>
        (skills[p]?.status || "not_started") ===
        "not_started"
    )
  ) {
    return -Infinity;
  }

  let score = m.weight * 10;

  if (s.status === "tested") {
    score += 12;
  }

  if (s.status === "practicing") {
    score += 8;
  }

  if (s.status === "learning") {
    score += 5;
  }

  if (s.status === "failed") {
    score += 25;
  }

  if (
    s.revisionDue &&
    s.revisionDue <= dateStr()
  ) {
    score += 18;
  }

  if (
    [
      "internship-prep",
      "gsoc-open-source",
      "gate",
      "project-portfolio"
    ].includes(m.id)
  ) {
    score += 18;
  }

  if (m.category === "genai") {
    score += 8;
  }

  const pressure = Math.max(
    0,
    20 - Math.floor(daysLeft() / 14)
  );

  if (
    [
      "internship-prep",
      "gate",
      "gsoc-open-source",
      "project-portfolio"
    ].includes(m.id)
  ) {
    score += pressure;
  }

  if (
    m.category === "fitness" ||
    m.category === "communication"
  ) {
    score += 5;
  }

  if (
    m.id === "youtube" ||
    m.id === "startup"
  ) {
    score += 2;
  }

  return score;

}


// ============================================================
// BUILD MISSION
// ============================================================

function buildMission(m, skills) {

  const s = skills[m.id] || {};

  const phraseList =
    PHRASES[m.category] ||
    PHRASES.foundation;

  const action =
    phraseList[
      s.status === "practicing"
        ? 1
        : 0
    ];

  const level =
    s.status || "not_started";

  const text =
    `${m.name}: ${action}`;

  return {

    text,

    skillId: m.id,

    category: m.category,

    priority:
      m.weight >= 4
        ? "critical"
        : m.weight >= 2
          ? "important"
          : "supporting",

    difficulty:
      Math.min(
        5,
        (s.difficulty || 1) +
        (s.status === "failed" ? 0 : 1)
      ),

    proofRequired:
      m.weight >= 4 ||
      ["project", "career", "gate"].includes(
        m.category
      ),

    level

  };

}


// ============================================================
// LOAD STATE
// ============================================================

async function loadState(uid) {

  const [
    skillsSnap,
    taskSnap
  ] = await Promise.all([

    getDocs(
      query(
        collection(db, "skills"),
        where("userId", "==", uid)
      )
    ),

    getDocs(
      query(
        collection(db, "tasks"),
        where("userId", "==", uid)
      )
    )

  ]);

  const skills = {};

  skillsSnap.forEach(d => {

    const v = d.data();

    skills[
      v.skillId || d.id
    ] = v;

  });


  const tasks = [];

  taskSnap.forEach(d => {

    tasks.push({
      id: d.id,
      ...d.data()
    });

  });


  return {
    skills,
    tasks
  };

}


// ============================================================
// SEED SKILLS
// ============================================================

async function seedSkills(uid) {

  const snap = await getDocs(
    query(
      collection(db, "skills"),
      where("userId", "==", uid)
    )
  );

  if (!snap.empty) {
    return;
  }

  const batch = [];

  for (const m of modules.values()) {

    batch.push(
      setDoc(
        doc(
          db,
          "skills",
          `${uid}_${m.id}`
        ),
        {
          userId: uid,
          skillId: m.id,
          name: m.name,
          status: "not_started",
          progress: 0,
          confidence: 0,
          difficulty: 1,
          updatedAt: serverTimestamp()
        }
      )
    );

  }

  await Promise.all(batch);

}


// ============================================================
// DAILY MISSION GENERATOR
// ============================================================

async function generateDailyMissions(
  uid,
  force = false
) {

  const {
    skills,
    tasks
  } = await loadState(uid);

  const today = dateStr();

  const existing =
    tasks.filter(
      t => t.date === today &&
      !t.deleted
    );

  if (
    existing.some(
      t => t.source === "engine"
    ) &&
    !force
  ) {
    return existing;
  }

  if (
    existing.length >= MAX_DAILY &&
    !force
  ) {
    return existing;
  }


  const todayTasks = existing;

  const chosen = [];

  const used = new Set(
    todayTasks
      .map(t => t.skillId)
      .filter(Boolean)
  );


  const candidates =
    [...modules.values()]
      .map(m => ({
        m,
        score: scoreModule(
          m,
          skills,
          {},
          todayTasks
        )
      }))
      .filter(
        x => Number.isFinite(x.score)
      )
      .sort(
        (a, b) => b.score - a.score
      );


  // ----------------------------------------------------------
  // DAILY BUCKETS
  // ----------------------------------------------------------

  const buckets = [

    // Core learning
    m =>
      [
        "programming",
        "dsa",
        "cs",
        "ml"
      ].includes(m.category),

    // DSA / GATE
    m =>
      m.category === "dsa" ||
      m.id === "gate",

    // GenAI / engineering
    m =>
      [
        "genai",
        "dl",
        "backend",
        "engineering",
        "cloud"
      ].includes(m.category),

    // Career / projects
    m =>
      [
        "career",
        "project",
        "communication",
        "brand",
        "business"
      ].includes(m.category),

    // Non-negotiable
    m =>
      m.id === "english" ||
      m.id === "fitness"

  ];


  for (const bucket of buckets) {

    const pick =
      candidates.find(
        x =>
          bucket(x.m) &&
          !used.has(x.m.id)
      );

    if (pick) {

      chosen.push(pick);

      used.add(pick.m.id);

    }

  }


  // Fill remaining slots
  for (const x of candidates) {

    if (chosen.length >= MAX_DAILY) {
      break;
    }

    if (!used.has(x.m.id)) {

      chosen.push(x);

      used.add(x.m.id);

    }

  }


  // ----------------------------------------------------------
  // CREATE FIRESTORE TASKS
  // ----------------------------------------------------------

  const created = [];

  for (
    const x of chosen.slice(
      0,
      MAX_DAILY
    )
  ) {

    const m = x.m;

    const mission =
      buildMission(
        m,
        skills
      );


    const taskData = {

      text: mission.text,

      userId: uid,

      date: today,

      completed: false,

      source: "engine",

      goalId: goalFor(m),

      skillId: m.id,

      category: m.category,

      priority: mission.priority,

      difficulty: mission.difficulty,

      proofRequired:
        mission.proofRequired,

      deadline: DEADLINE,

      createdAt:
        serverTimestamp()

    };


    const refDoc =
      await addDoc(
        collection(db, "tasks"),
        taskData
      );


    created.push({
      id: refDoc.id,
      ...taskData
    });

  }


  await setDoc(
    doc(db, "users", uid),
    {
      userId: uid,
      deadline: DEADLINE,
      engineVersion: 2,
      lastGeneratedDate: today,
      updatedAt: serverTimestamp()
    },
    {
      merge: true
    }
  );


  return created;

}


// ============================================================
// GOAL MAPPING
// ============================================================

function goalFor(m) {

  if (m.category === "gate") {
    return "GATE";
  }

  if (
    [
      "career",
      "project",
      "brand",
      "business"
    ].includes(m.category)
  ) {
    return "Career / Projects";
  }

  if (
    [
      "genai",
      "dl",
      "ml"
    ].includes(m.category)
  ) {
    return "GenAI Engineer";
  }

  if (
    [
      "dsa",
      "cs",
      "programming"
    ].includes(m.category)
  ) {
    return "Software Engineering";
  }

  if (
    m.category === "communication"
  ) {
    return "English";
  }

  if (
    m.category === "fitness"
  ) {
    return "Fitness";
  }

  return "Core Roadmap";

}


// ============================================================
// COMPLETE TASK
// ============================================================

async function completeTask(task) {

  if (task.completed) {
    return;
  }

  let proof = "";


  if (task.proofRequired) {

    proof =
      prompt(
        "Proof required for this important mission. Enter a short proof (GitHub link, score, output, or what you built):"
      ) || "";


    if (!proof.trim()) {

      alert(
        "Important mission needs proof before completion."
      );

      return;

    }

  }


  await updateDoc(
    doc(db, "tasks", task.id),
    {
      completed: true,
      completedAt: serverTimestamp(),
      proof: proof.trim()
    }
  );


  if (task.skillId) {

    await setDoc(
      doc(
        db,
        "skills",
        `${currentUser.uid}_${task.skillId}`
      ),
      {
        userId: currentUser.uid,

        skillId: task.skillId,

        status: "tested",

        progress: Math.max(
          70,
          (task.difficulty || 1) * 15
        ),

        confidence: 1,

        lastPassed: dateStr(),

        revisionDue:
          addDays(dateStr(), 3),

        updatedAt:
          serverTimestamp()

      },
      {
        merge: true
      }
    );

  }

}


// ============================================================
// FAIL / DELETE TASK
// ============================================================

async function failOrDelete(task) {

  if (
    task.source === "manual"
  ) {

    if (
      confirm(
        "Delete this real-life task?"
      )
    ) {

      await updateDoc(
        doc(db, "tasks", task.id),
        {
          deleted: true
        }
      );

    }

    return;

  }


  if (
    confirm(
      "Mark this mission as MISSED? It will be reviewed on Sunday and can be repeated."
    )
  ) {

    await updateDoc(
      doc(db, "tasks", task.id),
      {
        status: "missed",
        missedAt: serverTimestamp()
      }
    );


    if (task.skillId) {

      await setDoc(
        doc(
          db,
          "skills",
          `${currentUser.uid}_${task.skillId}`
        ),
        {
          userId: currentUser.uid,
          skillId: task.skillId,
          status: "failed",
          updatedAt: serverTimestamp()
        },
        {
          merge: true
        }
      );

    }

  }

}


// ============================================================
// RENDER TODAY
// ============================================================

function renderToday(tasks) {

  const list = $("taskList");

  if (!list) {
    return;
  }

  list.innerHTML = "";


  if (!tasks.length) {

    list.innerHTML =
      '<div class="empty">Generating today\'s missions...</div>';

    return;

  }


  tasks.sort(
    (a, b) =>
      ({
        critical: 0,
        important: 1,
        supporting: 2
      }[a.priority] ?? 3) -
      ({
        critical: 0,
        important: 1,
        supporting: 2
      }[b.priority] ?? 3)
  );


  for (const t of tasks) {

    const row =
      document.createElement("div");

    row.className =
      `task ${t.completed ? "completed" : ""}`;


    row.innerHTML = `

      <div class="task-left">

        <button class="task-check">
          ${t.completed ? "✓" : ""}
        </button>

        <div>

          <div class="task-name">
            ${esc(t.text)}
          </div>

          <small style="color:#7d858b">

            ${esc(
              t.priority || "supporting"
            ).toUpperCase()}

            •
            ${esc(
              t.source === "manual"
                ? "REAL-LIFE"
                : "JARVIS"
            )}

            ${
              t.proofRequired &&
              !t.completed
                ? " • PROOF"
                : ""
            }

          </small>

        </div>

      </div>

      <span
        class="badge ${
          t.completed
            ? "done"
            : "pending"
        }"
      >
        ${
          t.completed
            ? "DONE"
            : "PENDING"
        }
      </span>

    `;


    const checkButton =
      row.querySelector(
        ".task-check"
      );

    if (checkButton) {

      checkButton.onclick =
        () => completeTask(t);

    }


    list.appendChild(row);

  }

}


// ============================================================
// UPDATE PROGRESS
// ============================================================

function updateProgress(tasks) {

  const visible =
    tasks.filter(
      t => !t.deleted
    );

  const done =
    visible.filter(
      t => t.completed
    ).length;

  const total =
    visible.length;

  const pct =
    total
      ? Math.round(
          done / total * 100
        )
      : 0;


  if ($("completedCount")) {
    $("completedCount").textContent =
      done;
  }


  if ($("pendingCount")) {
    $("pendingCount").textContent =
      total - done;
  }


  if ($("totalCount")) {
    $("totalCount").textContent =
      total;
  }


  const ring =
    $("progressCircle");


  if (ring) {

    ring.style.background =
      `conic-gradient(
        var(--red)
        ${pct * 3.6}deg,
        #351313
        ${pct * 3.6}deg
      )`;

  }


  if ($("progressNumber")) {

    $("progressNumber").textContent =
      `${pct}%`;

  }


  if ($("progressText")) {

    $("progressText").textContent =
      `${pct}%`;

  }

}


// ============================================================
// HISTORY
// ============================================================

function renderHistory(tasks) {

  const by = {};


  for (const t of tasks) {

    if (!t.date || t.deleted) {
      continue;
    }


    by[t.date] ??= {
      total: 0,
      done: 0,
      missed: 0
    };


    by[t.date].total++;


    if (t.completed) {
      by[t.date].done++;
    }


    if (t.status === "missed") {
      by[t.date].missed++;
    }

  }


  const list =
    $("historyList");


  if (!list) {
    return;
  }


  list.innerHTML = "";


  const dates =
    Object.keys(by)
      .sort()
      .reverse()
      .slice(0, 7);


  if (!dates.length) {

    list.innerHTML =
      '<div class="empty">No history yet.</div>';

    return;

  }


  for (const d of dates) {

    const x = by[d];


    const pct =
      Math.round(
        x.done / x.total * 100
      );


    const el =
      document.createElement("div");


    el.className =
      "history-card";


    el.innerHTML = `

      <div class="history-top">

        <span>
          ${pretty(d)}
        </span>

        <b>
          ${pct}%
        </b>

      </div>

      <div class="history-bar">

        <i
          style="width:${pct}%"
        ></i>

      </div>

      <div class="history-result">

        ${x.done}/${x.total}
        complete

        •
        ${x.missed}
        missed

      </div>

    `;


    list.appendChild(el);

  }

}


// ============================================================
// STREAK
// ============================================================

function updateStreak(tasks) {

  const by = {};


  for (const t of tasks) {

    if (!t.date || t.deleted) {
      continue;
    }


    by[t.date] ??= {
      t: 0,
      d: 0
    };


    by[t.date].t++;


    if (t.completed) {
      by[t.date].d++;
    }

  }


  let s = 0;

  let d = dateStr();


  while (
    by[d] &&
    by[d].t > 0 &&
    by[d].d === by[d].t
  ) {

    s++;

    d = addDays(
      d,
      -1
    );

  }


  if ($("streakNumber")) {

    $("streakNumber").textContent =
      s;

  }


  [
    1,
    3,
    7,
    30
  ].forEach(n => {

    const el =
      $(`achievement${n}`);


    if (!el) {
      return;
    }


    el.classList.toggle(
      "locked",
      s < n
    );


    const sm =
      el.querySelector("small");


    if (sm) {

      sm.textContent =
        s >= n
          ? "UNLOCKED"
          : "LOCKED";

    }

  });

}


// ============================================================
// MANUAL TASK
// ============================================================

async function addManualTask() {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;

  }


  const text =
    prompt(
      "Real-life / college task for today:"
    );


  if (!text?.trim()) {
    return;
  }


  await addDoc(
    collection(db, "tasks"),
    {
      text: text.trim(),

      userId:
        currentUser.uid,

      date:
        dateStr(),

      completed:
        false,

      source:
        "manual",

      category:
        "real-life",

      priority:
        "important",

      createdAt:
        serverTimestamp()
    }
  );

}


// ============================================================
// 04:30 ATTENDANCE
// ============================================================

async function checkAttendance() {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;

  }


  const now =
    new Date();


  const hh =
    String(
      now.getHours()
    ).padStart(2, "0");


  const mm =
    String(
      now.getMinutes()
    ).padStart(2, "0");


  if (
    `${hh}:${mm}` !==
    ATTENDANCE_TIME
  ) {

    alert(
      `Attendance is a hard 04:30 AM rule. Current time: ${hh}:${mm}.`
    );

    return;

  }


  await setDoc(
    doc(
      db,
      "attendance",
      `${currentUser.uid}_${dateStr()}`
    ),
    {
      userId:
        currentUser.uid,

      date:
        dateStr(),

      requiredTime:
        ATTENDANCE_TIME,

      actualTime:
        now.toISOString(),

      status:
        "present",

      createdAt:
        serverTimestamp()
    }
  );


  alert(
    "04:30 AM attendance recorded."
  );

}


// ============================================================
// ENGINE MESSAGE
// ============================================================

function engineMessage(tasks) {

  const engine =
    tasks.filter(
      t =>
        t.source === "engine" &&
        !t.deleted
    );


  const done =
    engine.filter(
      t => t.completed
    ).length;


  const missed =
    tasks.filter(
      t => t.status === "missed"
    ).length;


  const engineText =
    $("engineText");


  if (!engineText) {
    return;
  }


  engineText.innerHTML = `

    Deadline:
    <b>${DEADLINE}</b>

    •
    ${daysLeft()}
    days left.

    <br>

    Today:
    <b>${done}/${engine.length}</b>
    JARVIS missions complete

    ${
      missed
        ? `• <b>${missed}</b> missed mission(s) queued for Sunday review.`
        : "."
    }

    <br>

    Engine chooses tasks using
    prerequisites, priority,
    performance, revision need
    and career deadlines.

    It does not unlock advanced
    topics before their prerequisites.

  `;

}


// ============================================================
// MARK OVERDUE MISSIONS
// ============================================================

async function markOverdueAsMissed(tasks) {

  const today =
    dateStr();


  const overdue =
    tasks.filter(
      t =>
        t.date &&
        t.date < today &&
        !t.completed &&
        !t.deleted &&
        t.source === "engine" &&
        t.status !== "missed"
    );


  if (!overdue.length) {
    return;
  }


  await Promise.all(

    overdue.map(
      t =>
        updateDoc(
          doc(
            db,
            "tasks",
            t.id
          ),
          {
            status: "missed",
            missedAt:
              serverTimestamp()
          }
        )
    )

  );


  await Promise.all(

    overdue
      .filter(
        t => t.skillId
      )
      .map(
        t =>
          setDoc(
            doc(
              db,
              "skills",
              `${currentUser.uid}_${t.skillId}`
            ),
            {
              userId:
                currentUser.uid,

              skillId:
                t.skillId,

              status:
                "failed",

              updatedAt:
                serverTimestamp()
            },
            {
              merge: true
            }
          )
      )

  );

}


// ============================================================
// SUNDAY REVIEW
// ============================================================

async function sundayReview(
  uid,
  tasks
) {

  const day =
    new Date().getDay();


  // Sunday only
  if (day !== 0) {
    return;
  }


  const missed =
    tasks.filter(
      t =>
        t.status === "missed" &&
        !t.reviewedSunday
    );


  if (!missed.length) {
    return;
  }


  await setDoc(
    doc(
      db,
      "weeklyReviews",
      `${uid}_${dateStr()}`
    ),
    {
      userId:
        uid,

      date:
        dateStr(),

      missedCount:
        missed.length,

      missedSkillIds:
        missed
          .map(
            t => t.skillId
          )
          .filter(Boolean),

      createdAt:
        serverTimestamp()

    },
    {
      merge: true
    }
  );


  await Promise.all(

    missed.map(
      t =>
        updateDoc(
          doc(
            db,
            "tasks",
            t.id
          ),
          {
            reviewedSunday:
              true
          }
        )
    )

  );

}


// ============================================================
// LOAD TASKS
// ============================================================

async function loadTasks(uid) {

  if (stopTasks) {
    stopTasks();
  }


  const q =
    query(
      collection(db, "tasks"),
      where(
        "userId",
        "==",
        uid
      )
    );


  stopTasks =
    onSnapshot(

      q,

      async snap => {

        allTasks = [];


        snap.forEach(
          d => {

            allTasks.push({
              id: d.id,
              ...d.data()
            });

          }
        );


        const todayTasks =
          allTasks.filter(
            t =>
              t.date === dateStr() &&
              !t.deleted
          );


        renderToday(
          todayTasks
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


        engineMessage(
          allTasks
        );


        await sundayReview(
          uid,
          allTasks
        );

      },

      err => {

        console.error(
          "TASK LOAD ERROR:",
          err
        );


        const list =
          $("taskList");


        if (list) {

          list.innerHTML =
            `
            <div class="empty">
              Unable to load missions.
              Check Firestore rules.
            </div>
            `;

        }

      }

    );


  await seedSkills(
    uid
  );


  const state =
    await loadState(
      uid
    );


  await markOverdueAsMissed(
    state.tasks
  );


  await generateDailyMissions(
    uid
  );

}


// ============================================================
// INITIAL UI
// ============================================================

ensureEnginePanel();


if ($("todayDate")) {

  $("todayDate").textContent =
    pretty(
      dateStr()
    );

}


// ============================================================
// LOGIN
// ============================================================

const loginButton =
  $("loginButton");

const emailInput =
  $("email");

const passwordInput =
  $("password");

const loginMessage =
  $("loginMessage");

const logoutButton =
  $("logoutButton");


if (loginButton) {

  loginButton.onclick =
    async () => {

      const email =
        emailInput
          ? emailInput.value.trim()
          : "";

      const password =
        passwordInput
          ? passwordInput.value
          : "";


      if (!email || !password) {

        if (loginMessage) {

          loginMessage.textContent =
            "Please enter email and password.";

        }

        return;

      }


      try {

        if (loginMessage) {

          loginMessage.textContent =
            "Connecting to JARVIS...";

        }


        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        if (loginMessage) {

          loginMessage.textContent =
            "";

        }

      }

      catch (err) {

        console.error(
          "LOGIN ERROR:",
          err
        );


        if (loginMessage) {

          loginMessage.textContent =
            "Login failed. Check your email/password.";

        }

      }

    };

}


// ============================================================
// ENTER KEY LOGIN
// ============================================================

if (passwordInput) {

  passwordInput.onkeydown =
    e => {

      if (
        e.key === "Enter" &&
        loginButton
      ) {

        loginButton.click();

      }

    };

}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

  logoutButton.onclick =
    () => {

      signOut(auth)
        .catch(
          err =>
            console.error(
              "LOGOUT ERROR:",
              err
            )
        );

    };

}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
  auth,
  user => {

    currentUser =
      user;


    console.log(
      "AUTH STATE:",
      user
        ? "LOGGED IN"
        : "LOGGED OUT"
    );


    // IMPORTANT:
    // These elements may not exist in the HTML.
    // Therefore we check them before using .style.

    const loginPage =
      $("loginPage");

    const dashboard =
      $("dashboard");


    if (user) {

      // ------------------------------------------------------
      // USER LOGGED IN
      // ------------------------------------------------------

      if (loginPage) {

        loginPage.style.display =
          "none";

      }


      if (dashboard) {

        dashboard.style.display =
          "block";

      }


      // Load user's tasks
      loadTasks(
        user.uid
      ).catch(
        err =>
          console.error(
            "LOAD TASKS ERROR:",
            err
          )
      );

    }

    else {

      // ------------------------------------------------------
      // USER LOGGED OUT
      // ------------------------------------------------------

      if (loginPage) {

        loginPage.style.display =
          "flex";

      }


      if (dashboard) {

        dashboard.style.display =
          "none";

      }

    }

  }
);