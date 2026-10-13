"use strict";
/* NIMBU: 100 extra starter tools. Loads AFTER data.js and BEFORE app.js */
(function () {
  const PRICE = { f: "freemium", fr: "free", p: "paid", o: "opensource", u: "unknown" };
  const AUD = { s: "students", t: "teachers", sc: "schools", u: "universities", st: "startups" };
  /* slug, name, url, category, pricing, level, audiences, tags, description */
  const ROWS = [
    ["chatgpt","ChatGPT","https://chatgpt.com","Chatbots","f","all","s,t,u,st","chat,writing,coding,research,assistant","General AI assistant for writing, coding, learning and analysis."],
    ["claude","Claude","https://claude.ai","Chatbots","f","all","s,t,u,st","chat,writing,coding,analysis,documents","AI assistant for writing, analysis, coding and working with long documents."],
    ["gemini","Google Gemini","https://gemini.google.com","Chatbots","f","all","s,t,u,st","chat,google,research,writing","Google's AI assistant that works with Google apps and search."],
    ["copilot","Microsoft Copilot","https://copilot.microsoft.com","Chatbots","f","all","s,t,st","chat,microsoft,search,writing","Microsoft's AI assistant for chat, search and creating content."],
    ["perplexity","Perplexity","https://www.perplexity.ai","Research","f","all","s,u,st","search,research,sources,answers","AI search engine that answers questions and shows its sources."],
    ["grok","Grok","https://grok.com","Chatbots","u","all","st","chat,assistant,search","AI assistant from xAI."],
    ["deepseek","DeepSeek","https://www.deepseek.com","Chatbots","f","all","s,u,st","chat,reasoning,coding,math","Chat assistant and AI models from DeepSeek, known for reasoning and code."],
    ["le-chat","Le Chat (Mistral)","https://chat.mistral.ai","Chatbots","f","all","s,st","chat,assistant,europe","Chat assistant from the French company Mistral AI."],
    ["poe","Poe","https://poe.com","Chatbots","f","all","s,st","chat,multiple models,bots","One app for chatting with many different AI models and bots."],

    ["grammarly","Grammarly","https://www.grammarly.com","Writing","f","beginner","s,t,u,st","writing,grammar,editing,essay","Checks grammar, spelling and tone as you write."],
    ["quillbot","QuillBot","https://quillbot.com","Writing","f","beginner","s,u","paraphrase,summarize,grammar,essay","Paraphrasing, grammar checking and summarizing tools for writers."],
    ["wordtune","Wordtune","https://www.wordtune.com","Writing","f","beginner","s,st","rewrite,writing,editing","Rewrites and improves your sentences while keeping the meaning."],
    ["jasper","Jasper","https://www.jasper.ai","Marketing","p","pro","st","marketing,copywriting,brand,content","AI content platform for marketing teams."],
    ["copy-ai","Copy.ai","https://www.copy.ai","Marketing","f","all","st","copywriting,sales,marketing,workflow","AI for marketing and sales copy and go-to-market workflows."],
    ["writesonic","Writesonic","https://writesonic.com","Writing","f","all","st","writing,seo,articles,ads","AI writer for articles, ads and SEO content."],
    ["languagetool","LanguageTool","https://languagetool.org","Writing","f","beginner","s,t,u","grammar,spelling,multilingual,editing","Grammar and style checker that supports many languages."],

    ["github-copilot","GitHub Copilot","https://github.com/features/copilot","Coding","f","pro","s,u,st","coding,code completion,developer","AI pair programmer that suggests code inside your editor."],
    ["cursor","Cursor","https://cursor.com","Coding","f","pro","u,st","coding,editor,agent,developer","Code editor built around AI assistance."],
    ["windsurf","Windsurf","https://windsurf.com","Coding","f","pro","u,st","coding,editor,agent,developer","AI code editor with an agent that helps with coding tasks."],
    ["replit","Replit","https://replit.com","Coding","f","beginner","s,t,st","coding,browser,apps,learn to code","Build and run apps in your browser with an AI agent."],
    ["bolt-new","Bolt","https://bolt.new","Coding","f","beginner","st","app builder,web apps,prompt,no code","Describe an app and have it built in your browser."],
    ["lovable","Lovable","https://lovable.dev","Coding","f","beginner","st","app builder,web apps,prompt,no code","Turns plain-language prompts into working web apps."],
    ["tabnine","Tabnine","https://www.tabnine.com","Coding","u","pro","st","coding,code completion,teams","AI code completion and chat for development teams."],
    ["continue-dev","Continue","https://www.continue.dev","Coding","o","pro","u,st","coding,open source,vs code,assistant","Open-source AI code assistant for VS Code and JetBrains."],
    ["aider","Aider","https://aider.chat","Coding","o","pro","u,st","coding,terminal,open source,pair programming","Open-source AI pair programming in your terminal."],
    ["ollama","Ollama","https://ollama.com","Coding","o","pro","u,st","local,models,open source,privacy","Run open AI models locally on your own computer."],
    ["lm-studio","LM Studio","https://lmstudio.ai","Coding","f","all","u,st","local,models,privacy,desktop","Download and chat with open AI models on your own PC."],
    ["hugging-face","Hugging Face","https://huggingface.co","Coding","f","pro","u,st","models,datasets,open source,community","Hub for open AI models, datasets and demo apps."],
    ["google-ai-studio","Google AI Studio","https://aistudio.google.com","Coding","f","pro","u,st","gemini,developer,prototype,api","Try and build with Google's Gemini models in the browser."],

    ["midjourney","Midjourney","https://www.midjourney.com","Image","p","all","st","image generation,art,design","AI image generator known for artistic, high-quality visuals."],
    ["leonardo-ai","Leonardo.Ai","https://leonardo.ai","Image","f","all","st","image generation,design,game art","AI image generation for artwork, design and game assets."],
    ["ideogram","Ideogram","https://ideogram.ai","Image","f","all","st","image generation,text in images,posters","AI image generator that is good at putting readable text in images."],
    ["comfyui","ComfyUI","https://www.comfy.org","Image","o","pro","st","image generation,open source,workflow,local","Node-based tool for running image and video models."],
    ["adobe-firefly","Adobe Firefly","https://firefly.adobe.com","Image","f","all","t,st","image generation,design,adobe","Adobe's AI for creating and editing images."],
    ["canva","Canva","https://www.canva.com","Design","f","beginner","s,t,sc,st","design,presentations,posters,social media","Easy design tool with AI features for images, text and layouts."],
    ["playground-ai","Playground","https://playground.com","Image","f","beginner","st","image generation,design,graphics","Create images and graphic designs with AI."],
    ["krea","Krea","https://www.krea.ai","Image","f","all","st","image generation,video,enhance","Generate and enhance images and video with AI."],
    ["remove-bg","remove.bg","https://www.remove.bg","Image","f","beginner","s,st","background removal,photos,editing","Removes the background from a photo automatically."],
    ["photoroom","Photoroom","https://www.photoroom.com","Image","f","beginner","st","product photos,background removal,ecommerce","Edit product photos and remove backgrounds quickly."],
    ["upscayl","Upscayl","https://upscayl.org","Image","o","all","s,st","upscale,image quality,open source,desktop","Free open-source AI image upscaler."],
    ["picsart","Picsart","https://picsart.com","Image","f","beginner","s,st","photo editing,video,social media","Photo and video editor with AI tools."],

    ["runway","Runway","https://runwayml.com","Video","f","all","st","video generation,editing,creative","AI tools for generating and editing video."],
    ["pika","Pika","https://pika.art","Video","f","beginner","st","video generation,short clips","Create short AI-generated videos from text or images."],
    ["luma","Luma AI","https://lumalabs.ai","Video","f","all","st","video generation,3d,creative","AI video and 3D generation tools."],
    ["kling-ai","Kling AI","https://klingai.com","Video","f","all","st","video generation,image to video","AI video generator from Kuaishou."],
    ["heygen","HeyGen","https://www.heygen.com","Video","f","beginner","t,st","avatar,video,translation,presenter","Make videos with AI avatars and translate them into other languages."],
    ["synthesia","Synthesia","https://www.synthesia.io","Video","u","beginner","t,st","avatar,training videos,presenter","Create presenter-style videos from text with AI avatars."],
    ["descript","Descript","https://www.descript.com","Video","f","all","st","video editing,podcast,transcription","Edit video and audio by editing the text transcript."],
    ["capcut","CapCut","https://www.capcut.com","Video","f","beginner","s,st","video editing,short videos,social media","Popular video editor with AI features, built for short videos."],
    ["opus-clip","OpusClip","https://www.opus.pro","Video","f","beginner","st","video clips,shorts,repurpose,social media","Turns long videos into short clips for social media."],
    ["veed","VEED","https://www.veed.io","Video","f","beginner","s,st","video editing,subtitles,online","Browser-based video editor with AI subtitles and tools."],

    ["elevenlabs","ElevenLabs","https://elevenlabs.io","Audio","f","all","t,st","text to speech,voice,dubbing","Realistic AI voices for narration, voiceovers and dubbing."],
    ["suno","Suno","https://suno.com","Audio","f","beginner","s,st","music,songs,generation","Creates songs with vocals from a text prompt."],
    ["otter","Otter.ai","https://otter.ai","Productivity","f","beginner","s,u,st","meeting notes,transcription,lectures","Records and transcribes meetings and lectures with AI notes."],
    ["fireflies","Fireflies.ai","https://fireflies.ai","Productivity","f","all","st","meeting notes,transcription,summaries","AI notetaker that records, transcribes and summarizes meetings."],
    ["murf","Murf","https://murf.ai","Audio","f","beginner","t,st","text to speech,voiceover,narration","AI voiceover studio for narration and presentations."],
    ["speechify","Speechify","https://speechify.com","Audio","f","beginner","s,t,u","text to speech,reading,accessibility","Reads documents and web pages aloud with natural AI voices."],
    ["adobe-podcast","Adobe Podcast","https://podcast.adobe.com","Audio","f","beginner","s,st","audio cleanup,podcast,voice","Improves voice recordings and removes background noise."],
    ["notebooklm","NotebookLM","https://notebooklm.google","Research","f","beginner","s,t,u","study,notes,documents,summaries,audio","Google's AI notebook that works from your own documents and sources."],

    ["elicit","Elicit","https://elicit.com","Research","f","all","u","papers,literature review,research","Helps find and summarize academic papers."],
    ["consensus","Consensus","https://consensus.app","Research","f","all","u,s","papers,research,evidence,citations","AI search engine for finding answers in scientific research."],
    ["scispace","SciSpace","https://scispace.com","Research","f","all","u,s","papers,research,explain,pdf","Find, read and understand research papers with AI help."],
    ["semantic-scholar","Semantic Scholar","https://www.semanticscholar.org","Research","fr","all","u,s","papers,search,academic,citations","Free AI-powered academic paper search from the Allen Institute for AI."],
    ["connected-papers","Connected Papers","https://www.connectedpapers.com","Research","f","all","u","papers,graph,literature review","Visual map of related academic papers for a given paper."],
    ["chatpdf","ChatPDF","https://www.chatpdf.com","Research","f","beginner","s,u","pdf,summarize,study,questions","Upload a PDF and ask questions about it."],
    ["khanmigo","Khanmigo","https://www.khanmigo.ai","Education","u","beginner","s,t,sc","tutor,learning,teachers,khan academy","AI tutor and teaching assistant from Khan Academy."],
    ["duolingo","Duolingo","https://www.duolingo.com","Education","f","beginner","s,sc","language learning,practice,mobile","Language learning app that uses AI in its practice features."],
    ["quizlet","Quizlet","https://quizlet.com","Education","f","beginner","s,t,sc","flashcards,quiz,study,exam","Flashcards and study modes with AI study tools."],
    ["photomath","Photomath","https://photomath.com","Education","f","beginner","s,sc","math,homework,step by step","Scan a math problem and see step-by-step explanations."],
    ["wolfram-alpha","Wolfram|Alpha","https://www.wolframalpha.com","Education","f","all","s,u,t","math,science,computation,homework","Computational engine that answers math and science questions."],

    ["magicschool","MagicSchool","https://www.magicschool.ai","Education","f","beginner","t,sc","lesson plans,teachers,worksheets,assessment","AI assistant built for teachers, with tools for lesson plans and more."],
    ["diffit","Diffit","https://web.diffit.me","Education","f","beginner","t,sc","reading level,differentiation,teachers","Adapts reading material to different levels for your class."],
    ["curipod","Curipod","https://curipod.com","Education","f","beginner","t,sc","interactive lessons,slides,classroom","Create interactive lessons and slides for the classroom."],
    ["eduaide","Eduaide.Ai","https://www.eduaide.ai","Education","f","beginner","t,sc","lesson plans,teachers,resources","Teaching assistant for planning lessons and making resources."],
    ["brisk-teaching","Brisk Teaching","https://www.briskteaching.com","Education","f","beginner","t,sc","feedback,teachers,google docs,chrome","AI tools for teachers that work inside the browser."],
    ["kahoot","Kahoot!","https://kahoot.com","Education","f","beginner","t,s,sc","quiz,classroom,games,engagement","Game-based quizzes with AI help for creating questions."],

    ["gamma","Gamma","https://gamma.app","Presentations","f","beginner","s,t,u,st","slides,presentations,documents,websites","Generates presentations, documents and simple websites from a prompt."],
    ["beautiful-ai","Beautiful.ai","https://www.beautiful.ai","Presentations","p","beginner","st","slides,presentations,design","Presentation tool that formats slides automatically."],
    ["prezi","Prezi","https://prezi.com","Presentations","f","beginner","s,t,st","presentations,slides,storytelling","Presentation software with AI features for building talks."],

    ["notion","Notion","https://www.notion.com","Productivity","f","all","s,t,u,st","notes,docs,wiki,projects","Workspace for notes, docs and projects with built-in AI features."],
    ["zapier","Zapier","https://zapier.com","Automation","f","all","st","automation,workflow,no code,integrations","Connect apps and automate tasks without coding."],
    ["make","Make","https://www.make.com","Automation","f","all","st","automation,workflow,no code,visual","Visual platform for building automated workflows."],
    ["n8n","n8n","https://n8n.io","Automation","f","pro","st","automation,workflow,self-hosted,agents","Workflow automation tool you can self-host."],
    ["clickup","ClickUp","https://clickup.com","Productivity","f","all","st","tasks,projects,docs,team","Project and task management with AI features."],
    ["airtable","Airtable","https://www.airtable.com","Productivity","f","all","st","database,spreadsheet,apps,workflow","Spreadsheet-style database with automations and AI features."],
    ["motion","Motion","https://www.usemotion.com","Productivity","p","all","st","calendar,tasks,planning,scheduling","AI calendar and task planner."],
    ["reclaim","Reclaim.ai","https://reclaim.ai","Productivity","f","all","st,u","calendar,scheduling,habits,focus time","Smart calendar that schedules tasks and habits automatically."],
    ["taskade","Taskade","https://www.taskade.com","Productivity","f","beginner","s,st","tasks,notes,agents,team","Tasks, notes and AI agents in one workspace."],
    ["fathom","Fathom","https://fathom.video","Productivity","f","beginner","st","meeting notes,video calls,summaries","Records and summarizes video meetings."],

    ["hubspot","HubSpot","https://www.hubspot.com","Marketing","f","all","st","crm,marketing,sales,email","CRM and marketing platform with AI features."],
    ["buffer","Buffer","https://buffer.com","Marketing","f","beginner","st","social media,scheduling,posts","Schedule social media posts, with AI help for writing them."],
    ["semrush","Semrush","https://www.semrush.com","Marketing","p","pro","st","seo,keywords,marketing,competitors","SEO and marketing research platform with AI tools."],
    ["surfer-seo","Surfer","https://surferseo.com","Marketing","p","pro","st","seo,content,optimization","Helps write and optimize content for search engines."],
    ["tidio","Tidio","https://www.tidio.com","Marketing","f","beginner","st","customer support,chatbot,website","Customer-service chat for websites with an AI assistant."],
    ["manychat","ManyChat","https://manychat.com","Marketing","f","beginner","st","chatbot,instagram,whatsapp,automation","Build chat automations for Instagram, WhatsApp and more."],
    ["chatbase","Chatbase","https://www.chatbase.co","Marketing","f","beginner","st","chatbot,support,website,knowledge base","Build a chatbot trained on your own content."],

    ["julius-ai","Julius AI","https://julius.ai","Data","f","beginner","s,u,st","data analysis,charts,spreadsheets","Analyze data and create charts by chatting."],

    ["figma","Figma","https://www.figma.com","Design","f","all","s,u,st","design,ui,prototype,collaboration","Collaborative design tool with AI features."],
    ["framer","Framer","https://www.framer.com","Design","f","all","st","website builder,design,no code","Design and publish websites, with AI to speed up the first draft."],
    ["uizard","Uizard","https://uizard.io","Design","f","beginner","st","ui design,wireframes,prototype","Turns ideas and sketches into app and web design mockups."]
  ];

  const list = window.NIMBU.tools;
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
  const slugs = new Set(list.map(t => t.slug));
  const hosts = new Set(list.map(t => host(t.url)));
  let added = 0;

  ROWS.forEach(r => {
    const [slug, name, url, cat, price, level, aud, tags, desc] = r;
    if (slugs.has(slug) || hosts.has(host(url))) return; /* skip duplicates */
    list.push({
      slug, name, desc, url,
      cats: [cat],
      tags: tags.split(","),
      pricing: PRICE[price],
      level,
      status: "unverified",
      verified: "",
      added: "2026-10-13",
      aud: aud.split(",").map(a => AUD[a])
    });
    slugs.add(slug); hosts.add(host(url)); added++;
  });
  console.log("NIMBU: added " + added + " tools");
})();