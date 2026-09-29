const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {defineSecret}=require("firebase-functions/params");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore}=require("firebase-admin/firestore");
const OpenAI=require("openai");

initializeApp();
const db=getFirestore();
const OPENAI_API_KEY=defineSecret("OPENAI_API_KEY");

exports.mentorChat=onCall({secrets:[OPENAI_API_KEY],region:"asia-south1",timeoutSeconds:60,memory:"256MiB"},async(request)=>{
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

  const client=new OpenAI({apiKey:OPENAI_API_KEY.value()});
  const response=await client.responses.create({
    model:"gpt-5.6-luna",
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
