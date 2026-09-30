const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {defineSecret}=require("firebase-functions/params");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore}=require("firebase-admin/firestore");
const OpenAI=require("openai");

initializeApp();
const db=getFirestore();
const XAI_API_KEY=defineSecret("XAI_API_KEY");

exports.mentorChat=onCall({secrets:[XAI_API_KEY],region:"asia-south1",timeoutSeconds:60,memory:"256MiB"},async(request)=>{
  if(!request.auth) throw new HttpsError("unauthenticated","Login required.");
  const message=String(request.data?.message||"").trim();
  if(!message) throw new HttpsError("invalid-argument","Message is required.");
  if(message.length>4000) throw new HttpsError("invalid-argument","Message is too long.");

  const uid=request.auth.uid;
  const [userSnap,skillsSnap,tasksSnap,testsSnap]=await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.collection("skills").where("userId","==",uid).get(),
    db.collection("tasks").where("userId","==",uid).get(),
    db.collection("tests").where("userId","==",uid).get()
  ]);
  const user=userSnap.exists?userSnap.data():{};
  const skills=skillsSnap.docs.map(d=>d.data()).slice(0,120);
  const tasks=tasksSnap.docs.map(d=>d.data()).filter(x=>!x.deleted).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,40);
  const tests=testsSnap.docs.map(d=>d.data()).sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||""))).slice(0,30);

  const client=new OpenAI({apiKey:XAI_API_KEY.value(),baseURL:"https://api.x.ai/v1"});
  const response=await client.responses.create({
    model:"grok-4.7",
    instructions:`You are the user's Personal Career OS mentor. Be direct, beginner-friendly, practical, and concise. Use the supplied workspace state as the source of truth. Do not invent progress or completed work. Prioritize the Feb 12 2027 master deadline, prerequisites, weak skills, GATE preparation, November internship preparation, GenAI engineering, projects, and college workload. Give at most 3 concrete next actions. If the user asks to change their roadmap, explain the tradeoff and propose a data-driven change; do not blindly agree. Completion always needs evidence. Respond in simple English with occasional Telugu phrases when useful.`,
    input:[{role:"user",content:`WORKSPACE STATE:
Profile: ${JSON.stringify({deadline:user.deadline,goals:user.goals,preferences:user.preferences,roadmapPhase:user.roadmapPhase})}
Skills: ${JSON.stringify(skills)}
Recent tasks: ${JSON.stringify(tasks)}
Recent tests: ${JSON.stringify(tests)}
USER MESSAGE:
${message}`}]
  });
  const answer=response.output_text||"I could not generate a mentor response.";
  await db.collection("mentorChats").add({userId:uid,message,answer,createdAt:new Date().toISOString()});
  return {answer};
});


exports.planMissions=onCall({secrets:[XAI_API_KEY],region:"asia-south1",timeoutSeconds:60,memory:"256MiB"},async(request)=>{
  if(!request.auth) throw new HttpsError("unauthenticated","Login required.");
  const uid=request.auth.uid;
  const state=request.data?.state||{};
  const client=new OpenAI({apiKey:XAI_API_KEY.value(),baseURL:"https://api.x.ai/v1"});
  const schema={type:"object",properties:{missions:{type:"array",items:{type:"object",properties:{skillId:{type:"string"},text:{type:"string"},priority:{type:"string",enum:["critical","important","supporting"]},why:{type:"string"},output:{type:"string"},effort:{type:"string"}},required:["skillId","text","priority","why","output","effort"],additionalProperties:false}}},required:["missions"],additionalProperties:false};
  try{
    const response=await client.responses.create({
      model:"grok-4.7",
      instructions:"You are the planning brain of a personal Career OS. Return only valid JSON matching the schema. Choose only skillIds supplied in the state. Respect prerequisites, academicMode, daily capacity, deadlines, completed/missed history, and non-negotiables. Never invent completed work. Keep the plan realistic and balanced.",
      input:[{role:"user",content:JSON.stringify(state)}],
      text:{format:{type:"json_schema",name:"career_missions",schema,strict:true}}
    });
    const parsed=JSON.parse(response.output_text||'{"missions":[]}');
    const allowed=new Set((state.skills||[]).map(x=>x.skillId));
    const missions=(parsed.missions||[]).filter(x=>allowed.has(x.skillId)).slice(0,5);
    await db.collection("plannerRuns").add({userId:uid,date:new Date().toISOString(),count:missions.length,createdAt:new Date().toISOString()});
    return {missions};
  }catch(error){
    console.error("planMissions failed",error);
    throw new HttpsError("internal","AI planner unavailable.");
  }
});
