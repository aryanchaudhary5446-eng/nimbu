/* NIMBU starter data. Schema per tool:
   slug, name, desc (my own wording), url (official site), cats[], tags[], pricing
   ("free"|"freemium"|"paid"|"opensource"|"unknown"), level ("beginner"|"pro"|"all"),
   added ("YYYY-MM-DD"), verified (null until a human checks the site), status.
   status "unverified" = name/URL recorded from general knowledge, NOT yet checked by a person. */
const T = (slug, name, url, cats, tags, pricing, level, desc) => ({
  slug, name, url, cats, tags, pricing, level, desc,
  added: "2026-10-09", verified: null, status: "unverified"
});

window.NIMBU = {
  tools: [
    T("chatgpt","ChatGPT","https://chatgpt.com",["General AI Assistants","Writing and Content"],["chatbot","writing","coding"],"freemium","beginner","General-purpose chat assistant for questions, writing, and analysis."),
    T("claude","Claude","https://claude.ai",["General AI Assistants","Programming and Development"],["chatbot","long documents","coding"],"freemium","beginner","Chat assistant from Anthropic for writing, analysis, and coding."),
    T("gemini","Gemini","https://gemini.google.com",["General AI Assistants"],["chatbot","multimodal","google"],"freemium","beginner","Google's multimodal assistant."),
    T("perplexity","Perplexity","https://www.perplexity.ai",["General AI Assistants","Research and Science"],["search","research","citations"],"freemium","beginner","AI search assistant that answers with linked sources."),
    T("github-copilot","GitHub Copilot","https://github.com/features/copilot",["Programming and Development"],["code generation","ide","autocomplete"],"freemium","pro","Code suggestions and chat inside popular editors."),
    T("cursor","Cursor","https://cursor.com",["Programming and Development"],["ai code editor","agent","refactor"],"freemium","pro","Code editor built around AI-assisted editing."),
    T("replit","Replit","https://replit.com",["Programming and Development","No-Code and Automation"],["app builder","browser ide","deploy"],"freemium","beginner","Browser-based coding and app building with an AI agent."),
    T("hugging-face","Hugging Face","https://huggingface.co",["Data Science and Analytics","Programming and Development"],["models","datasets","open source ecosystem"],"freemium","pro","Hub for open models, datasets, and demos."),
    T("ollama","Ollama","https://ollama.com",["Programming and Development","General AI Assistants"],["local models","privacy","open source"],"opensource","pro","Run open language models on your own computer."),
    T("notebooklm","NotebookLM","https://notebooklm.google",["Education and Learning","Research and Science","Productivity and Organization"],["summaries","pdf","study"],"unknown","beginner","Ask questions about documents you upload; pricing not recorded."),
    T("khanmigo","Khanmigo","https://www.khanmigo.ai",["Education and Learning"],["tutor","homework","students"],"unknown","beginner","AI tutor and teaching assistant from Khan Academy."),
    T("gamma","Gamma","https://gamma.app",["Education and Learning","Productivity and Organization"],["presentation","slides","documents"],"freemium","beginner","Generates presentations and web pages from a prompt."),
    T("grammarly","Grammarly","https://www.grammarly.com",["Writing and Content"],["grammar","paraphrasing","email"],"freemium","beginner","Writing assistant for grammar, tone, and clarity."),
    T("jasper","Jasper","https://www.jasper.ai",["Writing and Content","Marketing and SEO"],["copywriting","brand voice","marketing"],"paid","all","AI writing platform aimed at marketing teams."),
    T("elicit","Elicit","https://elicit.com",["Research and Science"],["papers","literature review","summaries"],"freemium","pro","Finds and summarizes academic papers."),
    T("consensus","Consensus","https://consensus.app",["Research and Science"],["papers","evidence","citations"],"freemium","all","Search engine that answers from scientific papers."),
    T("midjourney","Midjourney","https://www.midjourney.com",["Image and Graphic Design"],["text-to-image","art"],"paid","all","Text-to-image generator."),
    T("canva","Canva","https://www.canva.com",["Image and Graphic Design","Marketing and SEO"],["design","social media","templates"],"freemium","beginner","Design platform with AI image and layout tools."),
    T("stability-ai","Stability AI","https://stability.ai",["Image and Graphic Design"],["stable diffusion","open models","image"],"unknown","pro","Maker of the Stable Diffusion image models."),
    T("runway","Runway","https://runwayml.com",["Video and Animation"],["text-to-video","video editing"],"freemium","all","Generative video and editing tools."),
    T("opus-clip","Opus Clip","https://www.opus.pro",["Video and Animation"],["video repurposing","short-form","clips"],"freemium","beginner","Turns long videos into short clips."),
    T("descript","Descript","https://www.descript.com",["Video and Animation","Audio, Voice and Music"],["transcript editing","podcast","video editing"],"freemium","beginner","Edit audio and video by editing the transcript."),
    T("elevenlabs","ElevenLabs","https://elevenlabs.io",["Audio, Voice and Music"],["text-to-speech","voice cloning","dubbing"],"freemium","all","Realistic text-to-speech and voice tools."),
    T("otter","Otter.ai","https://otter.ai",["Productivity and Organization","Business and Entrepreneurship"],["meeting notes","transcription"],"freemium","beginner","Records and transcribes meetings."),
    T("notion","Notion","https://www.notion.com",["Productivity and Organization"],["notes","wiki","tasks"],"freemium","beginner","Workspace for notes and projects with built-in AI features."),
    T("zapier","Zapier","https://zapier.com",["No-Code and Automation","Business and Entrepreneurship"],["workflow","integrations","agents"],"freemium","beginner","Connects apps and automates workflows."),
    T("n8n","n8n","https://n8n.io",["No-Code and Automation"],["workflow","self-host","agents"],"freemium","pro","Workflow automation that can be self-hosted.")
  ],
  prompts: [
    {id:"p1",title:"Learn a topic step by step",cat:"Education",level:"Beginner",tools:["Any chat assistant"],text:"Teach me [YOUR TOPIC] as if I am at [YOUR SKILL LEVEL]. Give a 7-day plan with one small exercise per day, then quiz me on day 1."},
    {id:"p2",title:"Debug my code",cat:"Coding",level:"Beginner",tools:["Any chat assistant"],text:"Here is my [LANGUAGE] code and the error I get. Explain the cause in plain words, then show a corrected version.\n\nCode:\n[PASTE CODE]\n\nError:\n[PASTE ERROR]"},
    {id:"p3",title:"Professional email",cat:"Writing",level:"Beginner",tools:["Any chat assistant"],text:"Write a short, polite email to [RECIPIENT] about [PURPOSE]. Tone: [TONE]. Include a clear request and a deadline of [DATE]."},
    {id:"p4",title:"Validate a business idea",cat:"Business",level:"Intermediate",tools:["Any chat assistant"],text:"I plan to start [YOUR IDEA] with a budget of [YOUR BUDGET]. List the 5 riskiest assumptions, a cheap test for each, and what result would make me stop."},
    {id:"p5",title:"Summarize a PDF",cat:"Research",level:"Beginner",tools:["Chat assistants with file upload"],text:"Summarize the attached document in 5 bullet points, list any numbers or claims I should double-check, and suggest 3 questions to ask next."},
    {id:"p6",title:"Freelance proposal",cat:"Freelancing",level:"Intermediate",tools:["Any chat assistant"],text:"Write a proposal under 200 words for this job post: [PASTE JOB POST]. My relevant experience: [YOUR EXPERIENCE]. Open with their problem, not my biography."},
    {id:"p7",title:"Image prompt builder",cat:"Image generation",level:"Beginner",tools:["Image generators"],text:"A [SUBJECT], [STYLE] style, [LIGHTING] lighting, [COLOR PALETTE] colors, shot from [ANGLE], high detail."}
  ]
};
