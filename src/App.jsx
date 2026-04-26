import React, { useState, useEffect, useRef, createContext, useContext } from "react";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SB_URL = "https://kbovooabxvlcmexbosnx.supabase.co";
const SB_KEY = "sb_publishable_l_IkFXFhNnfS5D-bV9xvpw_B4ChW5X9";
let DEMO = false;
const STORE = {};

const db = {
  slug() {
    const c = "abcdefghijkmnpqrstuvwxyz23456789";
    return Array.from({length:8},()=>c[Math.floor(Math.random()*c.length)]).join("");
  },
  async req(path, opts={}) {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
      ...opts,
      headers: { apikey: SB_KEY, Authorization:`Bearer ${SB_KEY}`,
        "Content-Type":"application/json", Prefer:"return=representation",
        ...(opts.headers||{}) }
    });
    if (!r.ok) throw new Error(await r.text());
    const tx = await r.text(); return tx ? JSON.parse(tx) : null;
  },
  async save(config, lang) {
    const slug = this.slug();
    if (DEMO) { STORE[slug]={...config,slug,lang}; return {slug}; }
    try {
      const d = await this.req("reveals", { method:"POST",
        body: JSON.stringify({ slug, gender:config.gender, anim:config.anim,
          from_name:config.from||null, message:config.message||null,
          role:config.role||null, lang:lang||"fr" }) });
      return d?.[0]||{slug};
    } catch { DEMO=true; STORE[slug]={...config,slug,lang}; return {slug}; }
  },
  async load(slug) {
    if (DEMO||STORE[slug]) return STORE[slug]||null;
    try {
      const d = await this.req(`reveals?slug=eq.${slug}&select=*`);
      if (!d||!d.length) return null;
      this.req(`reveals?slug=eq.${slug}`,{method:"PATCH",
        body:JSON.stringify({view_count:(d[0].view_count||0)+1})}).catch(()=>{});
      return d[0];
    } catch { DEMO=true; return null; }
  },
  async upload(slug, blob) {
    if (DEMO) return null;
    try {
      const ext = blob.type.includes("mp4")?"mp4":"webm";
      const path = `${slug}/${Date.now()}.${ext}`;
      const r = await fetch(`${SB_URL}/storage/v1/object/reactions/${path}`, {
        method:"POST", headers:{apikey:SB_KEY,Authorization:`Bearer ${SB_KEY}`,"Content-Type":blob.type}, body:blob });
      if (!r.ok) return null;
      await this.req("reactions",{method:"POST",
        body:JSON.stringify({reveal_slug:slug,storage_path:path})});
      return path;
    } catch { return null; }
  },
  async reactions(slug) {
    if (DEMO) return [];
    try { return await this.req(`reactions?reveal_slug=eq.${slug}&select=*&order=created_at.desc`) || []; }
    catch { return []; }
  },
  videoUrl(path) { return `${SB_URL}/storage/v1/object/public/reactions/${path}`; }
};

// ─── i18n ─────────────────────────────────────────────────────────────────────
const LANGS = [
  {code:"fr",flag:"🇫🇷",name:"Français",dir:"ltr"},
  {code:"en",flag:"🇬🇧",name:"English",dir:"ltr"},
  {code:"es",flag:"🇪🇸",name:"Español",dir:"ltr"},
  {code:"de",flag:"🇩🇪",name:"Deutsch",dir:"ltr"},
  {code:"pt",flag:"🇧🇷",name:"Português",dir:"ltr"},
  {code:"it",flag:"🇮🇹",name:"Italiano",dir:"ltr"},
  {code:"ar",flag:"🇸🇦",name:"العربية",dir:"rtl"},
  {code:"zh",flag:"🇨🇳",name:"中文",dir:"ltr"},
];

const T = {
  fr:{
    title:"Partagez l'instant",em:"magique",title2:"avec ceux que vous aimez",
    tagline:"Créez une révélation de genre unique, envoyez un lien à vos proches — où qu'ils soient dans le monde — et capturez leur réaction.",
    cta:"✨ Créer ma révélation",s1:"Choisissez le sexe & l'animation",s2:"Partagez le lien",s3:"Regardez leurs réactions",
    create_title:"Créer ma révélation",create_sub:"Tout reste secret jusqu'au moment choisi par vos proches 🤫",
    iam:"Je suis…",parents:"Les parents",doctor:"Un médecin / sage-femme",
    its_a:"C'est une…",girl:"Fille",boy:"Garçon",
    anim_label:"Animation de révélation",
    from_label:"De la part de",from_ph_doc:"Ex: Dr. Martin, Cabinet Bellevue…",from_ph_par:"Ex: Maman & Papa, Sophie & Lucas…",
    msg_label:"Message d'accompagnement",opt:"optionnel",
    msg_hint:"Choisissez une suggestion ou écrivez votre propre message ci-dessous.",
    custom_ph:"Ou écrivez votre propre message…",free_ph:"Ex: Vous êtes les premiers à le savoir… 💕",
    gen:"🔗 Générer mon lien",
    link_title:"Votre lien est prêt !",link_sub:"Partagez-le avec vos proches — ils vivront la révélation à leur rythme.",
    copy:"Copier",copied:"✓ Copié !",wa:"💬 WhatsApp",email:"✉️ Email",sms:"📱 SMS",
    preview:"👀 Prévisualiser la révélation",
    reaction_note:"📹 Vos proches pourront activer leur caméra pour capturer leur réaction.",
    from_label2:"De la part de",cam_on:"📷 Caméra activée ✓",cam_off:"📷 Activer ma caméra",
    cam_note:"L'enregistrement démarrera automatiquement",
    discover:"🎁 Découvrir le sexe du bébé",hint:"🎵 ~30 secondes avec musique — montez le son !",
    its_girl:"C'est une fille ! 🩷",its_boy:"C'est un garçon ! 🩵",
    she:"💕 Elle arrive bientôt 💕",he:"💙 Il arrive bientôt 💙",
    captured:"Votre réaction a été capturée !",watch:"👁 Revoir ma réaction",
    send_to:"ENVOYER AUX PARENTS",send_wa:"💬 Envoyer via WhatsApp",
    send_sms:"📱 Envoyer par SMS",dl:"⬇️ Télécharger la vidéo",
    no_send:"Ne pas envoyer",sent:"Réaction envoyée !",
    sent_sub:"Les parents vont adorer voir votre moment de surprise.",close:"✓ Fermer",
    back:"← Retour",edit:"← Modifier",
    p1:["Vous êtes les premiers à partager ce moment magique avec nous. Préparez-vous… 💕",
        "On a attendu ce moment si longtemps, et on voulait que vous le viviez avec nous. 🌟",
        "Ce petit être va bouleverser nos vies… et les vôtres aussi ! 👶",
        "Un secret qu'on garde depuis des semaines, enfin prêt à être partagé. 🎁"],
    d1:["Les résultats de votre analyse sont prêts. Cliquez pour découvrir le sexe de votre bébé. 🩺",
        "Votre médecin vous invite à ouvrir cette révélation. 💙🩷",
        "Bonne nouvelle — les résultats sont là ! Découvrez le sexe de votre futur enfant. ✨",
        "Le cabinet médical vous transmet ce moment en toute confidentialité. 🌸"],
    notfound_title:"Révélation introuvable",notfound_sub:"Ce lien ne correspond à aucune révélation.",
    expired_title:"Ce lien a expiré",expired_sub:"Les révélations sont disponibles pendant 90 jours.",
    new:"✨ Créer une nouvelle révélation",loading:"Chargement de la révélation…",
    reactions_title:"Réactions reçues",no_reactions:"Aucune réaction reçue pour l'instant.",
  },
  en:{
    title:"Share the",em:"magical moment",title2:"with the ones you love",
    tagline:"Create a unique gender reveal, send a link to your loved ones — wherever they are — and capture their reaction.",
    cta:"✨ Create my reveal",s1:"Choose gender & animation",s2:"Share the link",s3:"Watch their reactions",
    create_title:"Create my reveal",create_sub:"Everything stays secret until your loved ones choose to open it 🤫",
    iam:"I am…",parents:"The parents",doctor:"A doctor / midwife",
    its_a:"It's a…",girl:"Girl",boy:"Boy",
    anim_label:"Reveal animation",
    from_label:"From",from_ph_doc:"E.g. Dr. Smith, City Medical…",from_ph_par:"E.g. Mum & Dad, Emma & Tom…",
    msg_label:"Accompanying message",opt:"optional",
    msg_hint:"Choose a suggestion or write your own message below.",
    custom_ph:"Or write your own message…",free_ph:"E.g. You're the first to know… 💕",
    gen:"🔗 Generate my link",
    link_title:"Your link is ready!",link_sub:"Share it with your loved ones — they'll experience the reveal at their own pace.",
    copy:"Copy",copied:"✓ Copied!",wa:"💬 WhatsApp",email:"✉️ Email",sms:"📱 SMS",
    preview:"👀 Preview the reveal",
    reaction_note:"📹 Your loved ones can activate their camera to capture their reaction.",
    from_label2:"From",cam_on:"📷 Camera on ✓",cam_off:"📷 Activate camera",
    cam_note:"Recording will start automatically",
    discover:"🎁 Discover the baby's gender",hint:"🎵 ~30 seconds with music — turn up the volume!",
    its_girl:"It's a girl! 🩷",its_boy:"It's a boy! 🩵",
    she:"💕 She's coming soon 💕",he:"💙 He's coming soon 💙",
    captured:"Your reaction has been captured!",watch:"👁 Watch my reaction",
    send_to:"SEND TO PARENTS",send_wa:"💬 Send via WhatsApp",
    send_sms:"📱 Send by SMS",dl:"⬇️ Download video",
    no_send:"Don't send",sent:"Reaction sent!",
    sent_sub:"The parents are going to love seeing your surprise moment.",close:"✓ Close",
    back:"← Back",edit:"← Edit",
    p1:["You're the first to share this magical moment with us. Get ready… 💕",
        "We've waited so long for this, and we wanted you to experience it with us. 🌟",
        "This little one is about to change our lives… and yours too! 👶",
        "A secret we've kept for weeks, finally ready to share with you. 🎁"],
    d1:["Your test results are ready. Click to discover your baby's gender. 🩺",
        "Your doctor invites you to open this reveal to learn the result of your blood test. 💙🩷",
        "Great news — the results are in! Discover the gender of your future child. ✨",
        "The medical practice shares this moment with you in complete confidentiality. 🌸"],
    notfound_title:"Reveal not found",notfound_sub:"This link doesn't match any reveal.",
    expired_title:"This link has expired",expired_sub:"Reveals are available for 90 days.",
    new:"✨ Create a new reveal",loading:"Loading the reveal…",
    reactions_title:"Reactions received",no_reactions:"No reactions received yet.",
  },
  es:{
    title:"Comparte el momento",em:"mágico",title2:"con quienes más quieres",
    tagline:"Crea una revelación de género única, envía un enlace a tus seres queridos y captura su reacción.",
    cta:"✨ Crear mi revelación",s1:"Elige el sexo y la animación",s2:"Comparte el enlace",s3:"Mira sus reacciones",
    create_title:"Crear mi revelación",create_sub:"Todo queda en secreto hasta que tus seres queridos elijan abrirlo 🤫",
    iam:"Soy…",parents:"Los padres",doctor:"Un médico / comadrona",
    its_a:"Es un/una…",girl:"Niña",boy:"Niño",
    anim_label:"Animación de revelación",
    from_label:"De parte de",from_ph_doc:"Ej: Dr. García, Clínica…",from_ph_par:"Ej: Mamá y Papá, Laura y Carlos…",
    msg_label:"Mensaje adjunto",opt:"opcional",
    msg_hint:"Elige una sugerencia o escribe tu propio mensaje.",
    custom_ph:"O escribe tu propio mensaje…",free_ph:"Ej: Sois los primeros en saberlo… 💕",
    gen:"🔗 Generar mi enlace",
    link_title:"¡Tu enlace está listo!",link_sub:"Compártelo con tus seres queridos.",
    copy:"Copiar",copied:"✓ ¡Copiado!",wa:"💬 WhatsApp",email:"✉️ Email",sms:"📱 SMS",
    preview:"👀 Previsualizar la revelación",
    reaction_note:"📹 Tus seres queridos podrán activar su cámara para capturar su reacción.",
    from_label2:"De parte de",cam_on:"📷 Cámara activada ✓",cam_off:"📷 Activar cámara",
    cam_note:"La grabación comenzará automáticamente",
    discover:"🎁 Descubrir el sexo del bebé",hint:"🎵 ~30 segundos con música — ¡sube el volumen!",
    its_girl:"¡Es una niña! 🩷",its_boy:"¡Es un niño! 🩵",
    she:"💕 Ella viene pronto 💕",he:"💙 Él viene pronto 💙",
    captured:"¡Tu reacción ha sido capturada!",watch:"👁 Ver mi reacción",
    send_to:"ENVIAR A LOS PADRES",send_wa:"💬 Enviar por WhatsApp",
    send_sms:"📱 Enviar por SMS",dl:"⬇️ Descargar vídeo",
    no_send:"No enviar",sent:"¡Reacción enviada!",
    sent_sub:"Los padres van a adorar ver tu momento de sorpresa.",close:"✓ Cerrar",
    back:"← Volver",edit:"← Editar",
    p1:["Sois los primeros en compartir este momento mágico con nosotros. 💕",
        "Llevamos tanto tiempo esperando esto y queríamos que lo viviérais con nosotros. 🌟",
        "Este pequeño ser va a cambiar nuestras vidas… ¡y las vuestras también! 👶",
        "¡Un secreto que guardamos semanas, por fin listo para compartir! 🎁"],
    d1:["Los resultados de su análisis están listos. Haga clic para descubrir el sexo de su bebé. 🩺",
        "Su médico le invita a abrir esta revelación para conocer el resultado del análisis. 💙🩷",
        "¡Buenas noticias — los resultados están aquí! Descubra el sexo de su futuro hijo. ✨",
        "La consulta médica le transmite este momento con total confidencialidad. 🌸"],
    notfound_title:"Revelación no encontrada",notfound_sub:"Este enlace no corresponde a ninguna revelación.",
    expired_title:"Este enlace ha caducado",expired_sub:"Las revelaciones están disponibles durante 90 días.",
    new:"✨ Crear una nueva revelación",loading:"Cargando la revelación…",
    reactions_title:"Reacciones recibidas",no_reactions:"No se han recibido reacciones aún.",
  },
  de:{
    title:"Teile den",em:"magischen Moment",title2:"mit deinen Liebsten",
    tagline:"Erstelle eine einzigartige Gender-Reveal, sende einen Link an deine Liebsten und halte ihre Reaktion fest.",
    cta:"✨ Meine Enthüllung erstellen",s1:"Geschlecht & Animation wählen",s2:"Link teilen",s3:"Reaktionen ansehen",
    create_title:"Meine Enthüllung erstellen",create_sub:"Alles bleibt geheim, bis deine Liebsten es öffnen 🤫",
    iam:"Ich bin…",parents:"Die Eltern",doctor:"Ein Arzt / Hebamme",
    its_a:"Es ist ein/eine…",girl:"Mädchen",boy:"Junge",
    anim_label:"Enthüllungs-Animation",
    from_label:"Von",from_ph_doc:"Z.B. Dr. Müller, Praxis…",from_ph_par:"Z.B. Mama & Papa, Lisa & Tom…",
    msg_label:"Begleitnachricht",opt:"optional",
    msg_hint:"Wähle einen Vorschlag oder schreibe deine eigene Nachricht.",
    custom_ph:"Oder schreibe deine eigene Nachricht…",free_ph:"Z.B. Ihr seid die Ersten… 💕",
    gen:"🔗 Meinen Link generieren",
    link_title:"Dein Link ist fertig!",link_sub:"Teile ihn mit deinen Liebsten.",
    copy:"Kopieren",copied:"✓ Kopiert!",wa:"💬 WhatsApp",email:"✉️ E-Mail",sms:"📱 SMS",
    preview:"👀 Vorschau der Enthüllung",
    reaction_note:"📹 Deine Liebsten können ihre Kamera aktivieren, um ihre Reaktion aufzunehmen.",
    from_label2:"Von",cam_on:"📷 Kamera an ✓",cam_off:"📷 Kamera aktivieren",
    cam_note:"Die Aufnahme startet automatisch",
    discover:"🎁 Das Geschlecht des Babys entdecken",hint:"🎵 ~30 Sekunden mit Musik — Lautstärke aufdrehen!",
    its_girl:"Es ist ein Mädchen! 🩷",its_boy:"Es ist ein Junge! 🩵",
    she:"💕 Sie kommt bald 💕",he:"💙 Er kommt bald 💙",
    captured:"Deine Reaktion wurde aufgenommen!",watch:"👁 Meine Reaktion ansehen",
    send_to:"AN DIE ELTERN SENDEN",send_wa:"💬 Via WhatsApp senden",
    send_sms:"📱 Per SMS senden",dl:"⬇️ Video herunterladen",
    no_send:"Nicht senden",sent:"Reaktion gesendet!",
    sent_sub:"Die Eltern werden deinen Überraschungsmoment lieben.",close:"✓ Schließen",
    back:"← Zurück",edit:"← Bearbeiten",
    p1:["Ihr seid die Ersten, die diesen magischen Moment mit uns teilen. 💕",
        "Wir haben so lange auf diesen Moment gewartet. 🌟",
        "Dieses kleine Wesen wird unser Leben verändern… und eures auch! 👶",
        "Ein Geheimnis, das wir wochenlang gehütet haben — endlich bereit! 🎁"],
    d1:["Ihre Testergebnisse sind bereit. Klicken Sie, um das Geschlecht zu erfahren. 🩺",
        "Ihr Arzt lädt Sie ein, diese Enthüllung zu öffnen. 💙🩷",
        "Gute Neuigkeiten — die Ergebnisse sind da! ✨",
        "Die Arztpraxis übermittelt Ihnen diesen Moment vertraulich. 🌸"],
    notfound_title:"Enthüllung nicht gefunden",notfound_sub:"Dieser Link entspricht keiner Enthüllung.",
    expired_title:"Dieser Link ist abgelaufen",expired_sub:"Enthüllungen sind 90 Tage verfügbar.",
    new:"✨ Neue Enthüllung erstellen",loading:"Enthüllung wird geladen…",
    reactions_title:"Erhaltene Reaktionen",no_reactions:"Noch keine Reaktionen erhalten.",
  },
  pt:{
    title:"Compartilhe o momento",em:"mágico",title2:"com quem você ama",
    tagline:"Crie uma revelação de gênero única, envie um link para seus entes queridos e capture a reação deles.",
    cta:"✨ Criar minha revelação",s1:"Escolha o sexo e a animação",s2:"Compartilhe o link",s3:"Veja as reações",
    create_title:"Criar minha revelação",create_sub:"Tudo fica em segredo até o momento escolhido 🤫",
    iam:"Eu sou…",parents:"Os pais",doctor:"Um médico / parteira",
    its_a:"É uma…",girl:"Menina",boy:"Menino",anim_label:"Animação da revelação",
    from_label:"De",from_ph_doc:"Ex: Dr. Silva, Clínica…",from_ph_par:"Ex: Mamãe e Papai, Ana e João…",
    msg_label:"Mensagem de acompanhamento",opt:"opcional",
    msg_hint:"Escolha uma sugestão ou escreva sua própria mensagem.",
    custom_ph:"Ou escreva sua própria mensagem…",free_ph:"Ex: Vocês são os primeiros a saber… 💕",
    gen:"🔗 Gerar meu link",link_title:"Seu link está pronto!",link_sub:"Compartilhe com seus entes queridos.",
    copy:"Copiar",copied:"✓ Copiado!",wa:"💬 WhatsApp",email:"✉️ E-mail",sms:"📱 SMS",
    preview:"👀 Pré-visualizar a revelação",
    reaction_note:"📹 Seus entes queridos poderão ativar a câmera para capturar a reação.",
    from_label2:"De",cam_on:"📷 Câmera ativada ✓",cam_off:"📷 Ativar câmera",
    cam_note:"A gravação começará automaticamente",
    discover:"🎁 Descobrir o sexo do bebê",hint:"🎵 ~30 segundos com música — aumente o volume!",
    its_girl:"É uma menina! 🩷",its_boy:"É um menino! 🩵",
    she:"💕 Ela vem em breve 💕",he:"💙 Ele vem em breve 💙",
    captured:"Sua reação foi capturada!",watch:"👁 Ver minha reação",
    send_to:"ENVIAR AOS PAIS",send_wa:"💬 Enviar pelo WhatsApp",
    send_sms:"📱 Enviar por SMS",dl:"⬇️ Baixar vídeo",
    no_send:"Não enviar",sent:"Reação enviada!",
    sent_sub:"Os pais vão adorar ver seu momento de surpresa.",close:"✓ Fechar",
    back:"← Voltar",edit:"← Editar",
    p1:["Vocês são os primeiros a compartilhar este momento mágico conosco. 💕",
        "Esperamos tanto por isso e queríamos que vocês vivessem com a gente. 🌟",
        "Este pequeno ser vai mudar nossas vidas… e as de vocês também! 👶",
        "Um segredo que guardamos por semanas, finalmente pronto! 🎁"],
    d1:["Os resultados do seu exame estão prontos. Clique para descobrir o sexo do seu bebê. 🩺",
        "Seu médico convida você a abrir esta revelação. 💙🩷",
        "Ótimas notícias — os resultados chegaram! ✨",
        "O consultório transmite este momento com total confidencialidade. 🌸"],
    notfound_title:"Revelação não encontrada",notfound_sub:"Este link não corresponde a nenhuma revelação.",
    expired_title:"Este link expirou",expired_sub:"As revelações ficam disponíveis por 90 dias.",
    new:"✨ Criar uma nova revelação",loading:"Carregando a revelação…",
    reactions_title:"Reações recebidas",no_reactions:"Nenhuma reação recebida ainda.",
  },
  it:{
    title:"Condividi il momento",em:"magico",title2:"con chi ami",
    tagline:"Crea un gender reveal unico, invia un link ai tuoi cari e cattura la loro reazione.",
    cta:"✨ Crea la mia rivelazione",s1:"Scegli il sesso e l'animazione",s2:"Condividi il link",s3:"Guarda le loro reazioni",
    create_title:"Crea la mia rivelazione",create_sub:"Tutto rimane segreto fino al momento scelto dai tuoi cari 🤫",
    iam:"Sono…",parents:"I genitori",doctor:"Un medico / ostetrica",
    its_a:"È una…",girl:"Femmina",boy:"Maschio",anim_label:"Animazione della rivelazione",
    from_label:"Da parte di",from_ph_doc:"Es: Dr. Rossi, Studio Medico…",from_ph_par:"Es: Mamma e Papà, Sara e Luca…",
    msg_label:"Messaggio di accompagnamento",opt:"opzionale",
    msg_hint:"Scegli un suggerimento o scrivi il tuo messaggio.",
    custom_ph:"O scrivi il tuo messaggio…",free_ph:"Es: Siete i primi a saperlo… 💕",
    gen:"🔗 Genera il mio link",link_title:"Il tuo link è pronto!",link_sub:"Condividilo con i tuoi cari.",
    copy:"Copia",copied:"✓ Copiato!",wa:"💬 WhatsApp",email:"✉️ Email",sms:"📱 SMS",
    preview:"👀 Anteprima della rivelazione",
    reaction_note:"📹 I tuoi cari potranno attivare la fotocamera per catturare la loro reazione.",
    from_label2:"Da parte di",cam_on:"📷 Fotocamera attiva ✓",cam_off:"📷 Attiva fotocamera",
    cam_note:"La registrazione partirà automaticamente",
    discover:"🎁 Scoprire il sesso del bambino",hint:"🎵 ~30 secondi con musica — alza il volume!",
    its_girl:"È una femmina! 🩷",its_boy:"È un maschio! 🩵",
    she:"💕 Sta arrivando presto 💕",he:"💙 Sta arrivando presto 💙",
    captured:"La tua reazione è stata catturata!",watch:"👁 Rivedi la mia reazione",
    send_to:"INVIA AI GENITORI",send_wa:"💬 Invia via WhatsApp",
    send_sms:"📱 Invia per SMS",dl:"⬇️ Scarica il video",
    no_send:"Non inviare",sent:"Reazione inviata!",
    sent_sub:"I genitori adoreranno vedere il tuo momento di sorpresa.",close:"✓ Chiudi",
    back:"← Indietro",edit:"← Modifica",
    p1:["Siete i primi a condividere questo momento magico con noi. 💕",
        "Abbiamo aspettato così tanto questo momento. 🌟",
        "Questo piccolo essere cambierà le nostre vite… e anche le vostre! 👶",
        "Un segreto custodito per settimane, finalmente pronto! 🎁"],
    d1:["I risultati della sua analisi sono pronti. Clicchi per scoprire il sesso del bambino. 🩺",
        "Il suo medico la invita ad aprire questa rivelazione. 💙🩷",
        "Buone notizie — i risultati sono arrivati! ✨",
        "Lo studio medico le trasmette questo momento in totale riservatezza. 🌸"],
    notfound_title:"Rivelazione non trovata",notfound_sub:"Questo link non corrisponde a nessuna rivelazione.",
    expired_title:"Questo link è scaduto",expired_sub:"Le rivelazioni sono disponibili per 90 giorni.",
    new:"✨ Crea una nuova rivelazione",loading:"Caricamento della rivelazione…",
    reactions_title:"Reazioni ricevute",no_reactions:"Nessuna reazione ricevuta ancora.",
  },
  ar:{
    title:"شاركوا اللحظة",em:"السحرية",title2:"مع من تحبون",
    tagline:"أنشئ كشف جنس الجنين فريداً، أرسل رابطاً لأحبائك والتقط ردود أفعالهم.",
    cta:"✨ إنشاء الكشف",s1:"اختر الجنس والرسوم",s2:"شارك الرابط",s3:"شاهد ردود الفعل",
    create_title:"إنشاء الكشف",create_sub:"كل شيء يبقى سراً حتى يختار أحباؤك فتحه 🤫",
    iam:"أنا…",parents:"الوالدان",doctor:"طبيب / قابلة",
    its_a:"إنه/إنها…",girl:"بنت",boy:"ولد",anim_label:"رسوم الكشف",
    from_label:"من",from_ph_doc:"مثال: د. أحمد، عيادة…",from_ph_par:"مثال: ماما وبابا، سارة وأحمد…",
    msg_label:"رسالة مرافقة",opt:"اختياري",
    msg_hint:"اختر اقتراحاً أو اكتب رسالتك الخاصة.",
    custom_ph:"أو اكتب رسالتك الخاصة…",free_ph:"مثال: أنتم أول من يعلم… 💕",
    gen:"🔗 إنشاء الرابط",link_title:"رابطك جاهز!",link_sub:"شاركه مع أحبائك.",
    copy:"نسخ",copied:"✓ تم النسخ!",wa:"💬 واتساب",email:"✉️ بريد إلكتروني",sms:"📱 رسالة",
    preview:"👀 معاينة الكشف",
    reaction_note:"📹 يمكن لأحبائك تفعيل الكاميرا لالتقاط ردود أفعالهم.",
    from_label2:"من",cam_on:"📷 الكاميرا مفعّلة ✓",cam_off:"📷 تفعيل الكاميرا",
    cam_note:"سيبدأ التسجيل تلقائياً",
    discover:"🎁 اكتشاف جنس الطفل",hint:"🎵 ~٣٠ ثانية مع موسيقى — ارفع الصوت!",
    its_girl:"إنها بنت! 🩷",its_boy:"إنه ولد! 🩵",
    she:"💕 ستأتي قريباً 💕",he:"💙 سيأتي قريباً 💙",
    captured:"تم التقاط ردّ فعلك!",watch:"👁 مشاهدة ردّ فعلي",
    send_to:"إرسال للوالدين",send_wa:"💬 إرسال عبر واتساب",
    send_sms:"📱 إرسال برسالة",dl:"⬇️ تحميل الفيديو",
    no_send:"لا ترسل",sent:"تم إرسال ردّ الفعل!",
    sent_sub:"سيحبّ الوالدان رؤية لحظة مفاجأتك.",close:"✓ إغلاق",
    back:"← رجوع",edit:"← تعديل",
    p1:["أنتم أول من يشارك هذه اللحظة السحرية معنا. 💕",
        "انتظرنا هذه اللحظة طويلاً وأردنا أن تعيشوها معنا. 🌟",
        "هذا الكائن الصغير سيغيّر حياتنا… وحياتكم أيضاً! 👶",
        "سرّ حفظناه أسابيع، جاهز أخيراً للمشاركة! 🎁"],
    d1:["نتائج تحليلك جاهزة. انقر لاكتشاف جنس طفلك. 🩺",
        "يدعوك طبيبك لفتح هذا الكشف لمعرفة نتيجة فحص الدم. 💙🩷",
        "أخبار رائعة — النتائج وصلت! ✨",
        "تُرسل إليك العيادة هذه اللحظة بسرية تامة. 🌸"],
    notfound_title:"الكشف غير موجود",notfound_sub:"هذا الرابط لا يتوافق مع أي كشف.",
    expired_title:"انتهت صلاحية هذا الرابط",expired_sub:"الكشوفات متاحة لمدة 90 يوماً.",
    new:"✨ إنشاء كشف جديد",loading:"جارٍ تحميل الكشف…",
    reactions_title:"ردود الفعل المستلمة",no_reactions:"لم يتم استلام أي ردود فعل بعد.",
  },
  zh:{
    title:"与您爱的人",em:"分享神奇时刻",title2:"",
    tagline:"创建独特的性别揭示，向世界各地的亲人发送链接，并捕捉他们的反应。",
    cta:"✨ 创建我的揭示",s1:"选择性别和动画",s2:"分享链接",s3:"观看反应",
    create_title:"创建揭示",create_sub:"一切保密，直到您的亲人选择打开 🤫",
    iam:"我是…",parents:"父母",doctor:"医生 / 助产士",
    its_a:"是…",girl:"女孩",boy:"男孩",anim_label:"揭示动画",
    from_label:"来自",from_ph_doc:"例如：李医生，诊所…",from_ph_par:"例如：爸爸妈妈，小明和小红…",
    msg_label:"附加消息",opt:"可选",
    msg_hint:"选择一个建议或在下方写下您自己的消息。",
    custom_ph:"或写下您自己的消息…",free_ph:"例如：你们是第一个知道的… 💕",
    gen:"🔗 生成我的链接",link_title:"您的链接已准备好！",link_sub:"与您的亲人分享。",
    copy:"复制",copied:"✓ 已复制！",wa:"💬 WhatsApp",email:"✉️ 电子邮件",sms:"📱 短信",
    preview:"👀 预览揭示",
    reaction_note:"📹 您的亲人可以开启摄像头捕捉他们的反应。",
    from_label2:"来自",cam_on:"📷 摄像头已开启 ✓",cam_off:"📷 开启摄像头",
    cam_note:"录制将自动开始",
    discover:"🎁 发现宝宝的性别",hint:"🎵 约30秒带音乐 — 请调高音量！",
    its_girl:"是个女孩！🩷",its_boy:"是个男孩！🩵",
    she:"💕 她快来了 💕",he:"💙 他快来了 💙",
    captured:"您的反应已被捕捉！",watch:"👁 观看我的反应",
    send_to:"发送给父母",send_wa:"💬 通过WhatsApp发送",
    send_sms:"📱 通过短信发送",dl:"⬇️ 下载视频",
    no_send:"不发送",sent:"反应已发送！",
    sent_sub:"父母会喜欢看到您惊喜的那一刻。",close:"✓ 关闭",
    back:"← 返回",edit:"← 编辑",
    p1:["你们是第一个与我们分享这个神奇时刻的人。 💕",
        "我们等待这一刻很久了，希望你们能和我们一起体验。 🌟",
        "这个小生命即将改变我们的生活… 也会改变你们的！ 👶",
        "保守了几周的秘密，终于可以和你们分享了！ 🎁"],
    d1:["您的检测结果已准备好。点击发现您宝宝的性别。 🩺",
        "您的医生邀请您打开此揭示，了解血液检测结果。 💙🩷",
        "好消息 — 结果出来了！ ✨",
        "诊所以完全保密的方式向您传递这一时刻。 🌸"],
    notfound_title:"未找到揭示",notfound_sub:"此链接不对应任何揭示。",
    expired_title:"此链接已过期",expired_sub:"揭示在90天内有效。",
    new:"✨ 创建新的揭示",loading:"正在加载揭示…",
    reactions_title:"收到的反应",no_reactions:"尚未收到任何反应。",
  },
};

function detectLang() {
  const c = (navigator.language||"fr").slice(0,2).toLowerCase();
  return LANGS.find(l=>l.code===c)?.code||"fr";
}

const LangCtx = createContext({lang:"fr",t:T.fr,setLang:()=>{}});
const useLang = () => useContext(LangCtx);

// ─── Animations config ────────────────────────────────────────────────────────
const ANIMS = [
  {id:"balloons",icon:"🎈",name:{fr:"Ballons",en:"Balloons",es:"Globos",de:"Ballons",pt:"Balões",it:"Palloncini",ar:"بالونات",zh:"气球"}},
  {id:"confetti",icon:"🎉",name:{fr:"Confettis",en:"Confetti",es:"Confetis",de:"Konfetti",pt:"Confetes",it:"Coriandoli",ar:"قصاصات",zh:"彩纸"}},
  {id:"stars",icon:"✨",name:{fr:"Étoiles",en:"Stars",es:"Estrellas",de:"Sterne",pt:"Estrelas",it:"Stelle",ar:"نجوم",zh:"星星"}},
  {id:"gift",icon:"🎁",name:{fr:"Cadeau",en:"Gift",es:"Regalo",de:"Geschenk",pt:"Presente",it:"Regalo",ar:"هدية",zh:"礼物"}},
  {id:"butterfly",icon:"🦋",name:{fr:"Papillons",en:"Butterflies",es:"Mariposas",de:"Schmetterlinge",pt:"Borboletas",it:"Farfalle",ar:"فراشات",zh:"蝴蝶"}},
  {id:"rainbow",icon:"🌈",name:{fr:"Arc-en-ciel",en:"Rainbow",es:"Arcoíris",de:"Regenbogen",pt:"Arco-íris",it:"Arcobaleno",ar:"قوس قزح",zh:"彩虹"}},
];

// ─── Audio Engine ─────────────────────────────────────────────────────────────
class FairyAudio {
  constructor() { this.ctx=null; this.nodes=[]; }
  boot() { if(this.ctx)return; this.ctx=new(window.AudioContext||window.webkitAudioContext)(); }
  stop() { this.nodes.forEach(n=>{try{n.stop?.();}catch(e){}}); this.nodes=[]; if(this.ctx){this.ctx.close();this.ctx=null;} }
  bell(f,t,dec=1.4,g=0.22) {
    if(!this.ctx)return;
    const o=this.ctx.createOscillator(),o2=this.ctx.createOscillator(),gn=this.ctx.createGain(),g2=this.ctx.createGain();
    o.type="sine";o.frequency.value=f;o2.type="sine";o2.frequency.value=f*2.756;g2.gain.value=0.08;
    gn.gain.setValueAtTime(g,t);gn.gain.exponentialRampToValueAtTime(0.0001,t+dec);
    o.connect(gn);o2.connect(g2);g2.connect(gn);gn.connect(this.ctx.destination);
    o.start(t);o.stop(t+dec+0.05);o2.start(t);o2.stop(t+dec+0.05);this.nodes.push(o,o2);
  }
  harp(f,t,g=0.15) {
    if(!this.ctx)return;
    const o=this.ctx.createOscillator(),gn=this.ctx.createGain();
    o.type="sine";o.frequency.value=f;
    gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g,t+0.008);gn.gain.exponentialRampToValueAtTime(0.0001,t+1.1);
    o.connect(gn);gn.connect(this.ctx.destination);o.start(t);o.stop(t+1.2);this.nodes.push(o);
  }
  sparkle(f,t,g=0.1) {
    if(!this.ctx)return;
    const o=this.ctx.createOscillator(),gn=this.ctx.createGain();
    o.type="sine";o.frequency.value=f;
    gn.gain.setValueAtTime(g,t);gn.gain.exponentialRampToValueAtTime(0.0001,t+0.35);
    o.connect(gn);gn.connect(this.ctx.destination);o.start(t);o.stop(t+0.4);this.nodes.push(o);
  }
  pad(f,t,dur,g=0.05) {
    if(!this.ctx)return;
    [-3,0,3].forEach(d=>{
      const o=this.ctx.createOscillator(),gn=this.ctx.createGain();
      o.type="sine";o.frequency.value=f+d;
      gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g,t+1);
      gn.gain.setValueAtTime(g,t+dur-1);gn.gain.linearRampToValueAtTime(0,t+dur);
      o.connect(gn);gn.connect(this.ctx.destination);o.start(t);o.stop(t+dur+0.1);this.nodes.push(o);
    });
  }
  gliss(base,t,steps=10,sp=0.055,g=0.13) {
    for(let i=0;i<steps;i++) this.sparkle(base*(1+(i/steps)*1.5),t+i*sp,g*(0.6+i/steps*0.7));
  }
  bloom(root,t,g=0.18) {
    [1,1.25,1.5,2,2.5,3].forEach((r,i)=>{
      this.harp(root*r,t+i*0.11,g*(1-i*0.08));
      this.harp(root*r*0.5,t+i*0.11+0.04,g*0.5);
    });
  }
  celebrate(root,t,gender) {
    this.bloom(root,t,0.28);this.bloom(root*1.5,t+0.6,0.22);this.bloom(root*2,t+1.2,0.18);
    this.gliss(root,t,14,0.045,0.16);this.gliss(root*1.5,t+0.5,12,0.05,0.14);this.gliss(root*2,t+1.1,10,0.055,0.12);
    for(let i=0;i<50;i++){
      const ts=t+0.1+i*0.18+Math.random()*0.1;
      const pool=gender==="girl"?[root*4,root*5,root*6,root*7,root*8]:[root*3,root*4,root*5,root*6,root*7];
      this.sparkle(pool[Math.floor(Math.random()*pool.length)],ts,0.1+Math.random()*0.07);
    }
    [root*2,root*2.5,root*3,root*4,root*2.5].forEach((f,i)=>this.bell(f,t+i*1.4,2.2,0.28));
  }
  play(animId,gender) {
    this.boot();
    const t=this.ctx.currentTime+0.1;
    const root=gender==="girl"?261.63:293.66;
    this.pad(root*0.5,t,8,0.04);this.pad(root*0.75,t+0.5,7,0.03);
    const m0={balloons:[[0,2],[2,2.5],[4,3],[6,2]],confetti:[[0,2],[1.5,2.5],[3,3],[5,2.5],[6.5,3]],
      stars:[[0,4],[1,3],[2,3.5],[3.5,3],[5,4]],gift:[[0,2.5],[2,2],[4,2.5],[6,3]],
      butterfly:[[0,3],[0.8,3.5],[2,3],[3,4],[4.5,3.5]],rainbow:[[0,2],[1,2.5],[2,3],[3,3.5],[4,4],[5,3]]};
    (m0[animId]||m0.balloons).forEach(([o,r])=>this.bell(root*r,t+o,1.8,0.15));
    [0.5,2.2,3.8,5.5,7].forEach((o,i)=>this.sparkle(root*[5,6,4,5.5,6][i],t+o,0.08));
    this.pad(root*0.75,t+8,10,0.05);this.pad(root,t+8.5,9.5,0.04);
    const bn=[1,1.25,1.5,1.75,2,2.25,2.5,2.75,3];
    bn.slice(0,5).forEach((r,i)=>this.harp(root*r,t+8+i*0.55,0.15));
    bn.forEach((r,i)=>this.harp(root*r,t+11+i*0.42,0.19));
    bn.forEach((r,i)=>{this.harp(root*r*1.5,t+14.5+i*0.28,0.21);this.sparkle(root*r*3,t+14.5+i*0.28+0.05,0.09);});
    this.gliss(root,t+10,8,0.07,0.11);this.gliss(root*1.5,t+13,8,0.065,0.12);
    this.gliss(root*2,t+16,10,0.06,0.14);this.gliss(root*2,t+17.5,12,0.04,0.17);
    this.celebrate(root,t+18,gender);
  }
}
const audio = new FairyAudio();

// ─── Canvas confetti ──────────────────────────────────────────────────────────
function runConfetti(canvas,gender,dur=9000) {
  const ctx=canvas.getContext("2d");
  canvas.width=window.innerWidth;canvas.height=window.innerHeight;
  const pal=gender==="girl"?["#FF6B9D","#FF8FB1","#FFB3C6","#E8567A","#FF4D8D"]:["#4A90D9","#6BAED6","#48C9B0","#2C5F8A","#74C0E8"];
  const sh=["rect","circle","tri"];
  const ps=Array.from({length:220},()=>({x:Math.random()*canvas.width,y:-30-Math.random()*300,
    w:Math.random()*12+5,h:Math.random()*18+6,c:pal[Math.floor(Math.random()*pal.length)],
    t:Math.random()*Math.PI*2,ti:(Math.random()*0.08+0.02)*(Math.random()>.5?1:-1),
    vx:Math.random()*3-1.5,vy:Math.random()*2.5+1.5,s:sh[Math.floor(Math.random()*3)]}));
  const st=performance.now();
  function draw(now) {
    const p=Math.min((now-st)/dur,1);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ps.forEach(p2=>{
      ctx.save();ctx.globalAlpha=0.9*(1-Math.max(0,(p-0.75)/0.25));
      ctx.translate(p2.x,p2.y);ctx.rotate(p2.t);ctx.fillStyle=p2.c;
      if(p2.s==="rect")ctx.fillRect(-p2.w/2,-p2.h/2,p2.w,p2.h);
      else if(p2.s==="circle"){ctx.beginPath();ctx.arc(0,0,p2.w/2,0,Math.PI*2);ctx.fill();}
      else{ctx.beginPath();ctx.moveTo(0,-p2.h/2);ctx.lineTo(p2.w/2,p2.h/2);ctx.lineTo(-p2.w/2,p2.h/2);ctx.closePath();ctx.fill();}
      ctx.restore();
      p2.y+=p2.vy;p2.x+=p2.vx+Math.sin(p2.t*2)*0.8;p2.t+=p2.ti;
      if(p2.y>canvas.height+20){p2.y=-20;p2.x=Math.random()*canvas.width;}
    });
    if(p<1)requestAnimationFrame(draw);else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  requestAnimationFrame(draw);
}

// ─── Scene phases ─────────────────────────────────────────────────────────────
const PHASES = {
  balloons:[{d:8000},{d:10000},{d:14000}],confetti:[{d:8000},{d:10000},{d:14000}],
  stars:[{d:8000},{d:10000},{d:14000}],gift:[{d:8000},{d:10000},{d:14000}],
  butterfly:[{d:8000},{d:10000},{d:14000}],rainbow:[{d:8000},{d:10000},{d:14000}],
};

const BG0="linear-gradient(135deg,#0a0a1a 0%,#1a1a2e 100%)";
const BG1="linear-gradient(135deg,#0f0a1f 0%,#1a0f2e 100%)";
const BG_GIRL="linear-gradient(135deg,#FF6B9D 0%,#C44569 50%,#FF8E72 100%)";
const BG_BOY="linear-gradient(135deg,#4A90D9 0%,#2C5F8A 50%,#48C9B0 100%)";

// ─── Shared scene helpers ─────────────────────────────────────────────────────
function Particles({icons,count=14}) {
  const [pos]=useState(()=>Array.from({length:count},()=>({
    left:`${5+Math.random()*90}%`,top:`${10+Math.random()*80}%`,
    size:1.2+Math.random()*1.8,dur:1.8+Math.random()*2.5,delay:Math.random()*2.5,
    icon:icons[Math.floor(Math.random()*icons.length)]})));
  return <>{pos.map((p,i)=>(
    <span key={i} style={{position:"fixed",left:p.left,top:p.top,fontSize:`${p.size}rem`,
      pointerEvents:"none",opacity:0.4,animationName:"twinkle",
      animationDuration:`${p.dur}s`,animationTimingFunction:"ease-in-out",
      animationIterationCount:"infinite",animationDelay:`${p.delay}s`,zIndex:0}}>{p.icon}</span>
  ))}</>;
}

function Burst({icons,count=28}) {
  const [items]=useState(()=>Array.from({length:count},(_,i)=>{
    const a=(i/count)*360+Math.random()*15,d=100+Math.random()*260;
    return {icon:icons[i%icons.length],dx:Math.cos(a*Math.PI/180)*d,dy:Math.sin(a*Math.PI/180)*d,
      size:1.1+Math.random()*1.8,dur:1.6+Math.random()*1.6,delay:i*0.045};
  }));
  return <>{items.map((it,i)=>(
    <span key={i} style={{position:"fixed",left:"50%",top:"45%",fontSize:`${it.size}rem`,
      "--dx":`${it.dx}px`,"--dy":`${it.dy}px`,animationName:"starBurst",
      animationDuration:`${it.dur}s`,animationDelay:`${it.delay}s`,animationFillMode:"forwards",
      pointerEvents:"none",zIndex:10}}>{it.icon}</span>
  ))}</>;
}

function RevealText({gender,color,t}) {
  return (
    <div style={{animation:"revealPop 0.75s cubic-bezier(0.175,0.885,0.32,1.275) forwards",position:"relative",zIndex:20}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2.4rem,8vw,5.5rem)",
        fontWeight:700,color:"white",textShadow:`0 0 80px ${color},0 4px 24px rgba(0,0,0,0.3)`,lineHeight:1.1,padding:"0 1rem"}}>
        {gender==="girl"?t.its_girl:t.its_boy}
      </div>
      <p style={{marginTop:"1rem",fontSize:"1rem",opacity:0.8}}>
        {gender==="girl"?t.she:t.he}
      </p>
    </div>
  );
}

function ProgressBar({progress,color}) {
  return (
    <div style={{position:"fixed",bottom:"6%",left:"50%",transform:"translateX(-50%)",
      width:"60%",maxWidth:280,height:4,background:"rgba(255,255,255,0.15)",borderRadius:4,zIndex:50}}>
      <div style={{height:"100%",borderRadius:4,width:`${Math.min(progress*100,100)}%`,
        background:`linear-gradient(90deg,rgba(255,255,255,0.4),${color})`,transition:"width 0.15s"}}/>
    </div>
  );
}

// ─── Scene components ─────────────────────────────────────────────────────────
function SceneConfetti({phase,progress,gender}) {
  const {t}=useLang();
  const color=gender==="girl"?"#FF8FB1":"#74C0E8";
  const icons=gender==="girl"?["💗","🎀","🌸","💕"]:["💙","⭐","🌊","🎠"];
  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"white",textAlign:"center"}}>
      {phase<2&&<Particles icons={phase===0?["✨","💫","⭐"]:icons} count={16}/>}
      {phase===0&&<div style={{position:"relative",zIndex:1}}>
        <div style={{fontSize:"4rem",marginBottom:"1rem"}}>💗</div>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.4rem,4vw,2.2rem)",opacity:0.92}}>Préparez-vous…</p>
        <p style={{fontSize:"0.8rem",opacity:0.45,marginTop:"0.6rem",letterSpacing:"0.18em"}}>UN MOMENT MAGIQUE VOUS ATTEND</p>
      </div>}
      {phase===1&&<div style={{position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"center",gap:"0.5rem",marginBottom:"1.5rem"}}>
          {icons.map((ic,i)=><span key={i} style={{fontSize:"2rem"}}>{ic}</span>)}
        </div>
        <p style={{fontSize:"0.8rem",opacity:0.5,letterSpacing:"0.2em",marginBottom:"0.8rem"}}>LE MOMENT APPROCHE…</p>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,5vw,2.5rem)",fontStyle:"italic",opacity:0.85}}>
          {Math.floor(progress*10)%2===0?"Ça va éclater…":"Prêt… Prêt…"}
        </div>
        <ProgressBar progress={progress} color={color}/>
      </div>}
      {phase===2&&<>
        <Burst icons={[...icons,"🎉","✨"]} count={30}/>
        <canvas id="cfx" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:100}}/>
        <div style={{position:"relative",zIndex:20}}><RevealText gender={gender} color={color} t={t}/></div>
      </>}
    </div>
  );
}

function SceneBalloons({phase,progress,gender}) {
  const {t}=useLang();
  const color=gender==="girl"?"#FF8FB1":"#74C0E8";
  const icons=gender==="girl"?["🩷","💗","🎀","🌸","💕"]:["🩵","💙","⭐","🌊","🎠"];
  const [balls]=useState(()=>Array.from({length:16},(_,i)=>({
    icon:icons[i%icons.length],left:`${4+i*6}%`,dur:3.5+Math.random()*3,
    delay:i*0.18,tilt:Math.random()*30-15,size:2.5+Math.random()*2})));
  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"white",textAlign:"center"}}>
      {phase===0&&<div style={{position:"relative",zIndex:1}}>
        <div style={{fontSize:"5rem",animation:"floatSlow 2.5s ease-in-out infinite",display:"inline-block"}}>🎈</div>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.3rem,4vw,2rem)",marginTop:"1.5rem",fontStyle:"italic",opacity:0.9}}>Un secret flotte dans l'air…</p>
        <p style={{fontSize:"0.78rem",opacity:0.4,marginTop:"0.6rem",letterSpacing:"0.18em"}}>LES BALLONS VONT TOUT RÉVÉLER</p>
      </div>}
      {phase===1&&<div style={{position:"relative",zIndex:1}}>
        <div style={{position:"fixed",bottom:`${-60+progress*80}px`,left:0,right:0,display:"flex",justifyContent:"space-around",pointerEvents:"none",zIndex:5}}>
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} style={{fontSize:`${2+Math.random()}rem`,opacity:0.7+Math.random()*0.3}}>{icons[i%icons.length]}</div>
          ))}
        </div>
        <p style={{fontSize:"0.8rem",opacity:0.5,letterSpacing:"0.2em",marginBottom:"0.8rem"}}>ILS S'ENVOLENT…</p>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,5vw,2.5rem)",fontStyle:"italic",opacity:0.88}}>Regardez bien…</div>
        <ProgressBar progress={progress} color={color}/>
      </div>}
      {phase===2&&<>
        <div style={{position:"fixed",bottom:"-10px",left:0,right:0,display:"flex",justifyContent:"space-around",pointerEvents:"none",zIndex:5}}>
          {balls.map((b,i)=>(
            <div key={i} style={{fontSize:`${b.size}rem`,animationName:"riseUp",animationDuration:`${b.dur}s`,
              animationDelay:`${b.delay}s`,animationTimingFunction:"ease-out",animationFillMode:"forwards",
              transform:`rotate(${b.tilt}deg)`}}>{b.icon}</div>
          ))}
        </div>
        <Burst icons={icons} count={22}/>
        <div style={{position:"relative",zIndex:20}}><RevealText gender={gender} color={color} t={t}/></div>
      </>}
    </div>
  );
}

function SceneStars({phase,progress,gender}) {
  const {t}=useLang();
  const color=gender==="girl"?"#FF8FB1":"#74C0E8";
  const icons=gender==="girl"?["💫","🌸","✨","💕","🌟"]:["💫","⭐","✨","💙","🌟"];
  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"white",textAlign:"center"}}>
      <Particles icons={icons} count={phase===0?20:10}/>
      {phase===0&&<div style={{position:"relative",zIndex:1,marginTop:"38vh",transform:"translateY(-50%)"}}>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.3rem,4vw,2rem)",fontStyle:"italic"}}>Les étoiles ont un secret pour vous…</p>
        <p style={{fontSize:"0.78rem",opacity:0.4,marginTop:"0.6rem",letterSpacing:"0.18em"}}>REGARDEZ LE CIEL</p>
      </div>}
      {phase===1&&<div style={{position:"relative",zIndex:1}}>
        <div style={{fontSize:"3.5rem",animation:"spin 1.5s linear infinite",display:"inline-block"}}>✨</div>
        <p style={{fontSize:"0.8rem",opacity:0.5,letterSpacing:"0.2em",margin:"0.8rem 0"}}>LES ÉTOILES CONVERGENT…</p>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,5vw,2.5rem)",fontStyle:"italic",opacity:0.85}}>Le secret va briller…</div>
        <ProgressBar progress={progress} color={color}/>
      </div>}
      {phase===2&&<>
        <Burst icons={icons} count={32}/>
        <div style={{position:"relative",zIndex:20}}><RevealText gender={gender} color={color} t={t}/></div>
      </>}
    </div>
  );
}

function SceneGift({phase,progress,gender}) {
  const {t}=useLang();
  const color=gender==="girl"?"#FF8FB1":"#74C0E8";
  const shakeX=phase===1?Math.sin(progress*Math.PI*28)*(4+progress*8):0;
  const lidY=phase===2?Math.min(progress*3,1)*-140:0;
  const glow=phase===2?Math.min(progress*3,1):0;
  const bicons=gender==="girl"?["🎀","💕","🌸","✨"]:["🎠","💙","⭐","✨"];
  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"white",textAlign:"center"}}>
      {phase===0&&<div style={{position:"relative",zIndex:1}}>
        <div style={{fontSize:"6rem",animation:"floatSlow 2.5s ease-in-out infinite",display:"inline-block"}}>🎁</div>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.3rem,4vw,2rem)",marginTop:"1.5rem",fontStyle:"italic",opacity:0.9}}>Un cadeau vous attend…</p>
        <p style={{fontSize:"0.78rem",opacity:0.4,marginTop:"0.6rem",letterSpacing:"0.18em"}}>MAIS NE L'OUVREZ PAS ENCORE</p>
      </div>}
      {phase===1&&<div style={{position:"relative",zIndex:1}}>
        <div style={{fontSize:"7rem",transform:`translateX(${shakeX}px)`,transition:"transform 0.02s",lineHeight:1}}>🎁</div>
        <p style={{fontSize:"0.8rem",opacity:0.5,letterSpacing:"0.2em",marginTop:"1rem"}}>LE CADEAU TREMBLE…</p>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.3rem,4vw,2rem)",fontStyle:"italic",marginTop:"0.5rem",opacity:0.85}}>Quelque chose va éclater…</div>
        <ProgressBar progress={progress} color={color}/>
      </div>}
      {phase===2&&<>
        <canvas id="cfx" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:100}}/>
        <div style={{position:"relative",zIndex:5,marginBottom:"1rem"}}>
          <div style={{fontSize:"7rem",lineHeight:1,filter:`drop-shadow(0 0 ${glow*60}px ${color})`}}>🎁</div>
          <div style={{position:"absolute",top:0,left:"50%",transform:`translateX(-50%) translateY(${lidY}px) rotate(${lidY*0.25}deg)`,
            fontSize:"3.5rem",opacity:Math.max(0,1-progress*2.5)}}>🎀</div>
        </div>
        <Burst icons={bicons} count={24}/>
        <div style={{position:"relative",zIndex:20}}><RevealText gender={gender} color={color} t={t}/></div>
      </>}
    </div>
  );
}

function SceneButterfly({phase,progress,gender}) {
  const {t}=useLang();
  const color=gender==="girl"?"#FF8FB1":"#74C0E8";
  const icons=gender==="girl"?["🦋","🌸","💕","🌺","🌷"]:["🦋","🌊","💙","⭐","🌿"];
  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"white",textAlign:"center"}}>
      {phase===0&&<><Particles icons={["🦋"]} count={10}/>
        <div style={{position:"relative",zIndex:1,marginTop:"38vh",transform:"translateY(-50%)"}}>
          <p style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.3rem,4vw,2rem)",fontStyle:"italic"}}>Les papillons portent votre secret…</p>
        </div>
      </>}
      {phase===1&&<><Particles icons={icons} count={18}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:"4rem",animationName:"flutterIn",animationDuration:"0.6s",animationIterationCount:"infinite",display:"inline-block"}}>🦋</div>
          <p style={{fontSize:"0.8rem",opacity:0.5,letterSpacing:"0.2em",margin:"0.8rem 0"}}>LES AILES S'OUVRENT…</p>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,5vw,2.5rem)",fontStyle:"italic",opacity:0.85}}>Presque là…</div>
          <ProgressBar progress={progress} color={color}/>
        </div>
      </>}
      {phase===2&&<>
        <Burst icons={icons} count={28}/>
        <div style={{position:"relative",zIndex:20}}><RevealText gender={gender} color={color} t={t}/></div>
      </>}
    </div>
  );
}

function SceneRainbow({phase,progress,gender}) {
  const {t}=useLang();
  const color=gender==="girl"?"#FF8FB1":"#74C0E8";
  const arcColors=gender==="girl"?["#FFB3C6","#FF8FB1","#FF6B9D","#E8567A","#C44569","#9B2335"]:["#B3D9FF","#74C0E8","#4A90D9","#2C5F8A","#1E4080","#5BC0EB"];
  const arcP=phase===1?progress:phase===2?1:0;
  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"white",textAlign:"center"}}>
      {phase>=1&&<div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",pointerEvents:"none",zIndex:3}}>
        {arcColors.map((c,i)=>{const s=(400-i*42)*arcP;return(
          <div key={i} style={{position:"absolute",bottom:0,left:"50%",width:s*2,height:s,transform:"translateX(-50%)",
            borderRadius:`${s}px ${s}px 0 0`,border:`20px solid ${c}`,borderBottom:"none",opacity:(0.9-i*0.07)*arcP}}/>
        );})}
      </div>}
      {phase===0&&<div style={{position:"relative",zIndex:10,marginTop:"35vh",transform:"translateY(-50%)"}}>
        <div style={{fontSize:"4rem",marginBottom:"1rem"}}>🌈</div>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.3rem,4vw,2rem)",fontStyle:"italic"}}>Un arc-en-ciel cache la réponse…</p>
        <p style={{fontSize:"0.78rem",opacity:0.4,marginTop:"0.6rem",letterSpacing:"0.18em"}}>IL VA BIENTÔT ÉCLATER</p>
      </div>}
      {phase===1&&<div style={{position:"relative",zIndex:10,marginTop:"10vh"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.5rem,5vw,2.5rem)",fontStyle:"italic",opacity:0.88}}>Chaque couleur révèle quelque chose…</div>
      </div>}
      {phase===2&&<>
        <canvas id="cfx" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:100}}/>
        <Burst icons={["🌈","✨","🌟","💫","🎉"]} count={24}/>
        <div style={{position:"relative",zIndex:20,marginTop:"10vh"}}>
          <RevealText gender={gender} color={color} t={t}/>
          <div style={{fontSize:"2.5rem",marginTop:"1rem"}}>🌈✨🌈</div>
        </div>
      </>}
    </div>
  );
}

const SCENES = {balloons:SceneBalloons,confetti:SceneConfetti,stars:SceneStars,gift:SceneGift,butterfly:SceneButterfly,rainbow:SceneRainbow};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    :root{--cream:#FDF6EC;--gold:#C9A96E;--deep:#2C1A0E;--pink:#E8567A;--blue:#4A90D9;--green:#6DBF6D;--touch:44px;}
    html{-webkit-text-size-adjust:100%;}
    body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--deep);min-height:100vh;min-height:100dvh;overscroll-behavior:none;-webkit-tap-highlight-color:transparent;}
    .app{min-height:100vh;min-height:100dvh;}

    /* Buttons */
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;background:var(--deep);color:var(--cream);border:none;padding:0.9rem 2rem;min-height:var(--touch);border-radius:60px;font-family:'DM Sans',sans-serif;font-size:clamp(0.9rem,2.5vw,1rem);font-weight:500;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 4px 20px rgba(44,26,14,0.2);touch-action:manipulation;-webkit-appearance:none;}
    @media(hover:hover){.btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(44,26,14,0.28);}}
    .btn:active{transform:scale(0.97);}
    .btn-w{width:100%;}

    /* Nav back */
    .nav-back{position:fixed;top:max(1rem,env(safe-area-inset-top,0px));left:max(1rem,env(safe-area-inset-left,0px));background:rgba(255,255,255,0.88);border:none;padding:0.5rem 1rem;min-height:var(--touch);border-radius:30px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:0.88rem;color:var(--deep);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:50;touch-action:manipulation;display:flex;align-items:center;}

    /* Home */
    .home{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:clamp(1.5rem,5vw,2.5rem) clamp(1rem,4vw,2rem);position:relative;overflow:hidden;background:linear-gradient(135deg,#FDF6EC 0%,#FAF0E8 50%,#F5E6D0 100%);}
    .home::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 20% 20%,rgba(242,168,184,0.15) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(168,212,242,0.15) 0%,transparent 60%);pointer-events:none;}
    .home-content{position:relative;z-index:1;text-align:center;width:100%;max-width:560px;}
    .logo-wrap{margin-bottom:clamp(1rem,3vw,1.5rem);}
    .logo-icon{font-size:clamp(2.4rem,7vw,3.5rem);display:block;animation:float 3s ease-in-out infinite;margin-bottom:0.5rem;}
    .site-name{font-family:'Playfair Display',serif;font-size:clamp(1rem,3vw,1.3rem);font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:var(--gold);opacity:0.85;}
    .home h1{font-family:'Playfair Display',serif;font-size:clamp(1.8rem,5vw,3.2rem);font-weight:700;line-height:1.15;margin-bottom:0.75rem;color:var(--deep);}
    .home h1 em{font-style:italic;color:var(--gold);}
    .home .tagline{font-size:clamp(0.92rem,2.5vw,1.05rem);color:#7A5C3E;margin-bottom:clamp(1.5rem,4vw,2.5rem);font-weight:300;line-height:1.65;max-width:420px;margin-left:auto;margin-right:auto;}
    .steps{display:flex;gap:clamp(1rem,4vw,2rem);margin-top:clamp(1.5rem,4vw,2.5rem);flex-wrap:wrap;justify-content:center;}
    .step{display:flex;flex-direction:column;align-items:center;gap:0.4rem;font-size:clamp(0.72rem,2vw,0.82rem);color:#9A7A5E;max-width:110px;text-align:center;}
    .step-num{width:34px;height:34px;border-radius:50%;border:1.5px solid var(--gold);color:var(--gold);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:500;flex-shrink:0;}

    /* Create */
    .create-page{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;padding:clamp(4.5rem,10vw,5.5rem) clamp(1rem,4vw,1.5rem) clamp(1.5rem,4vw,2.5rem);background:linear-gradient(135deg,#FDF6EC 0%,#F5E6D0 100%);}
    .card{background:white;border-radius:clamp(16px,4vw,24px);padding:clamp(1.1rem,5vw,2.5rem);max-width:540px;width:100%;box-shadow:0 8px 48px rgba(44,26,14,0.1);}
    .card h2{font-family:'Playfair Display',serif;font-size:clamp(1.35rem,4vw,1.8rem);margin-bottom:0.4rem;}
    .card .sub{color:#9A7A5E;font-size:clamp(0.8rem,2.2vw,0.9rem);margin-bottom:clamp(1rem,3vw,1.5rem);}
    .field{margin-bottom:clamp(1rem,3vw,1.5rem);}
    .field label{display:block;font-size:clamp(0.78rem,2.2vw,0.88rem);font-weight:500;color:var(--deep);margin-bottom:0.45rem;letter-spacing:0.02em;}
    .field input,.field textarea,.msg-area{width:100%;padding:0.75rem 0.9rem;min-height:var(--touch);border:1.5px solid #E8DDD0;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:1rem;color:var(--deep);background:#FDFAF6;outline:none;transition:border-color 0.2s;-webkit-appearance:none;}
    .field input:focus,.field textarea:focus,.msg-area:focus{border-color:var(--gold);}
    .field textarea,.msg-area{resize:vertical;min-height:88px;}
    .divider{height:1px;background:#E8DDD0;margin:clamp(1rem,3vw,1.5rem) 0;}
    .opt{color:#CCBBAA;font-weight:400;font-size:0.78rem;}

    /* Role */
    .role-row{display:flex;gap:0.65rem;}
    .role-btn{flex:1;padding:0.85rem 0.5rem;min-height:var(--touch);border-radius:14px;border:2px solid #E8DDD0;background:white;cursor:pointer;text-align:center;transition:all 0.2s;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;align-items:center;gap:0.3rem;touch-action:manipulation;}
    .role-btn .ri{font-size:clamp(1.3rem,4vw,1.7rem);}
    .role-btn .rl{font-size:clamp(0.68rem,1.8vw,0.8rem);font-weight:500;color:#9A7A5E;line-height:1.3;}
    .role-btn.sel{border-color:var(--gold);background:#FDF5E6;}
    .role-btn.sel .rl{color:var(--deep);}

    /* Gender */
    .gender-row{display:flex;gap:0.65rem;}
    .gbtn{flex:1;padding:clamp(0.7rem,3vw,1rem);min-height:var(--touch);border-radius:14px;border:2px solid #E8DDD0;background:white;cursor:pointer;text-align:center;transition:all 0.2s;font-family:'DM Sans',sans-serif;touch-action:manipulation;}
    .gbtn .gi{font-size:clamp(1.5rem,5vw,2rem);display:block;margin-bottom:0.3rem;}
    .gbtn .gl{font-size:clamp(0.78rem,2.2vw,0.88rem);font-weight:500;color:#9A7A5E;}
    .gbtn.girl{border-color:var(--pink);background:#FFF0F4;}
    .gbtn.girl .gl{color:var(--pink);}
    .gbtn.boy{border-color:var(--blue);background:#F0F6FF;}
    .gbtn.boy .gl{color:var(--blue);}

    /* Anim grid */
    .anim-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0.55rem;}
    @media(min-width:420px){.anim-grid{grid-template-columns:repeat(6,1fr);}}
    .abtn{padding:clamp(0.5rem,2vw,0.9rem) 0.3rem;min-height:var(--touch);border-radius:12px;border:2px solid #E8DDD0;background:white;cursor:pointer;text-align:center;transition:all 0.2s;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.2rem;touch-action:manipulation;}
    .abtn .ai{font-size:clamp(1.2rem,4vw,1.6rem);display:block;}
    .abtn .an{font-size:clamp(0.6rem,1.6vw,0.72rem);color:#9A7A5E;font-weight:500;}
    .abtn.sel{border-color:var(--gold);background:#FDF5E6;}
    .abtn.sel .an{color:var(--deep);}

    /* Suggestions */
    .suggest-hint{font-size:0.78rem;color:#B09A82;margin-bottom:0.65rem;}
    .sugg-list{display:flex;flex-direction:column;gap:0.45rem;margin-bottom:0.65rem;}
    .sugg-item{display:flex;align-items:flex-start;gap:0.55rem;padding:0.7rem 0.85rem;min-height:var(--touch);border-radius:12px;border:1.5px solid #E8DDD0;background:#FDFAF6;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif;transition:all 0.18s;touch-action:manipulation;}
    .sugg-item:active,.sugg-item:hover{border-color:var(--gold);background:#FFF8EE;}
    .sugg-item.sel{border-color:var(--gold);background:#FDF5E6;}
    .sugg-check{flex-shrink:0;width:22px;height:22px;border-radius:50%;border:1.5px solid #D0C0A8;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#B09A82;transition:all 0.15s;}
    .sugg-item.sel .sugg-check{background:var(--gold);border-color:var(--gold);color:white;font-weight:700;}
    .sugg-text{font-size:clamp(0.78rem,2.2vw,0.88rem);color:#5A3E28;line-height:1.5;}

    /* Link */
    .link-page{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:clamp(1.5rem,5vw,2.5rem) clamp(1rem,4vw,1.5rem);background:linear-gradient(135deg,#FDF6EC 0%,#F5E6D0 100%);}
    .link-card{background:white;border-radius:clamp(16px,4vw,24px);padding:clamp(1.1rem,5vw,2.5rem);max-width:480px;width:100%;box-shadow:0 8px 48px rgba(44,26,14,0.1);text-align:center;}
    .link-card h2{font-family:'Playfair Display',serif;font-size:clamp(1.35rem,4vw,1.7rem);margin-bottom:0.5rem;}
    .link-card .lsub{color:#9A7A5E;font-size:clamp(0.8rem,2.2vw,0.9rem);margin-bottom:1.1rem;}
    .link-box{display:flex;gap:0.4rem;align-items:center;background:#FDFAF6;border:1.5px solid #E8DDD0;border-radius:12px;padding:0.5rem 0.5rem 0.5rem 0.85rem;margin-bottom:0.9rem;}
    .link-box span{flex:1;font-size:clamp(0.7rem,1.8vw,0.8rem);color:#7A5C3E;word-break:break-all;text-align:left;}
    .copy-btn{background:var(--deep);color:white;border:none;padding:0.5rem 0.85rem;min-height:var(--touch);border-radius:8px;font-size:clamp(0.76rem,1.8vw,0.83rem);cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif;touch-action:manipulation;display:flex;align-items:center;}
    .share-btns{display:flex;gap:0.45rem;justify-content:center;margin-top:0.7rem;flex-wrap:wrap;}
    .share-btn{padding:0.55rem 0.9rem;min-height:var(--touch);border-radius:30px;border:1.5px solid #E8DDD0;background:white;cursor:pointer;font-size:clamp(0.78rem,2.2vw,0.86rem);font-family:'DM Sans',sans-serif;color:var(--deep);display:flex;align-items:center;gap:0.35rem;transition:background 0.15s;touch-action:manipulation;}
    @media(hover:hover){.share-btn:hover{background:#F5E6D0;}}
    .reaction-note{margin-top:1.1rem;padding:0.85rem;border-radius:12px;background:#F5F0FF;font-size:clamp(0.76rem,2vw,0.84rem);color:#6B4E8A;line-height:1.55;}

    /* Lang selector */
    .lang-trigger{position:fixed;top:max(0.9rem,env(safe-area-inset-top,0px));right:max(0.9rem,env(safe-area-inset-right,0px));z-index:200;display:flex;align-items:center;gap:0.35rem;background:rgba(255,255,255,0.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(0,0,0,0.08);border-radius:30px;padding:0.38rem 0.75rem;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:0.88rem;color:var(--deep);box-shadow:0 2px 12px rgba(0,0,0,0.1);min-height:var(--touch);touch-action:manipulation;}
    .lang-menu{position:absolute;top:calc(100% + 6px);right:0;background:white;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);border:1px solid rgba(0,0,0,0.06);overflow:hidden;min-width:160px;animation:slideUp 0.18s ease;}
    .lang-item{display:flex;align-items:center;gap:0.6rem;width:100%;padding:0.65rem 1rem;background:white;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:0.88rem;color:var(--deep);border-bottom:1px solid rgba(0,0,0,0.04);touch-action:manipulation;transition:background 0.12s;}
    .lang-item:hover,.lang-item.active{background:#FDF5E6;}
    .lang-item:last-child{border-bottom:none;}

    /* Keyframes */
    @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
    @keyframes floatSlow{0%,100%{transform:translateY(0) rotate(-3deg);}50%{transform:translateY(-20px) rotate(3deg);}}
    @keyframes twinkle{0%,100%{transform:scale(1) rotate(0deg);opacity:0.4;}50%{transform:scale(1.4) rotate(20deg);opacity:1;}}
    @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
    @keyframes flutterIn{0%,100%{transform:scaleX(1) translateY(0);}25%{transform:scaleX(0.6) translateY(-8px);}75%{transform:scaleX(0.6) translateY(8px);}}
    @keyframes riseUp{0%{transform:translateY(0) rotate(var(--tilt,0deg));opacity:1;}100%{transform:translateY(-130vh) rotate(calc(var(--tilt,0deg)*-1.5));opacity:0.1;}}
    @keyframes starBurst{0%{transform:translate(0,0) scale(0) rotate(0deg);opacity:1;}70%{opacity:1;}100%{transform:translate(var(--dx),var(--dy)) scale(1.2) rotate(360deg);opacity:0;}}
    @keyframes revealPop{0%{transform:scale(0.2) rotate(-5deg);opacity:0;}60%{transform:scale(1.12) rotate(1deg);}100%{transform:scale(1) rotate(0deg);opacity:1;}}
    @keyframes slideUp{from{transform:translateY(8px);opacity:0;}to{transform:translateY(0);opacity:1;}}
  `}</style>
);

// ─── Language Selector ────────────────────────────────────────────────────────
function LangSelector() {
  const {lang,setLang}=useLang();
  const [open,setOpen]=useState(false);
  const cur=LANGS.find(l=>l.code===lang)||LANGS[0];
  return (
    <div style={{position:"fixed",top:"max(0.9rem,env(safe-area-inset-top,0px))",right:"max(0.9rem,env(safe-area-inset-right,0px))",zIndex:200}}>
      <button className="lang-trigger" onClick={()=>setOpen(o=>!o)} aria-label="Change language">
        <span style={{fontSize:"1.1rem",lineHeight:1}}>{cur.flag}</span>
        <span style={{fontSize:"0.75rem",fontWeight:500,letterSpacing:"0.02em"}}>{cur.code.toUpperCase()}</span>
        <span style={{fontSize:"0.6rem",opacity:0.5}}>{open?"▲":"▼"}</span>
      </button>
      {open&&<>
        <div style={{position:"fixed",inset:0,zIndex:-1}} onClick={()=>setOpen(false)}/>
        <div className="lang-menu">
          {LANGS.map(l=>(
            <button key={l.code} className={`lang-item${l.code===lang?" active":""}`}
              onClick={()=>{setLang(l.code);setOpen(false);}}>
              <span style={{fontSize:"1.1rem"}}>{l.flag}</span>
              <span>{l.name}</span>
              {l.code===lang&&<span style={{marginLeft:"auto",color:"var(--gold)",fontSize:"0.8rem"}}>✓</span>}
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({onStart}) {
  const {t}=useLang();
  return (
    <div className="home">
      <div className="home-content">
        <div className="logo-wrap">
          <span className="logo-icon">🌟</span>
          <div className="site-name">Gender Reveal</div>
        </div>
        <h1>{t.title} <em>{t.em}</em>{t.title2?" "+t.title2:""}</h1>
        <p className="tagline">{t.tagline}</p>
        <button className="btn" onClick={onStart}>{t.cta}</button>
        <div className="steps">
          {[t.s1,t.s2,t.s3].map((s,i)=>(
            <div className="step" key={i}>
              <div className="step-num">{i+1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Create Page ──────────────────────────────────────────────────────────────
function CreatePage({onGenerate,onBack}) {
  const {t,lang}=useLang();
  const [role,setRole]=useState(null);
  const [gender,setGender]=useState(null);
  const [anim,setAnim]=useState("confetti");
  const [from,setFrom]=useState("");
  const [selSugg,setSelSugg]=useState(null);
  const [custom,setCustom]=useState("");

  const suggestions=role==="parents"?t.p1:role==="doctor"?t.d1:[];
  const finalMsg=custom.trim()||selSugg||"";

  return (
    <div className="create-page">
      <button className="nav-back" onClick={onBack}>{t.back}</button>
      <div className="card">
        <h2>{t.create_title}</h2>
        <p className="sub">{t.create_sub}</p>

        <div className="field">
          <label>{t.iam}</label>
          <div className="role-row">
            <button className={`role-btn${role==="parents"?" sel":""}`} onClick={()=>{setRole("parents");setSelSugg(null);}}>
              <span className="ri">👨‍👩‍👶</span><span className="rl">{t.parents}</span>
            </button>
            <button className={`role-btn${role==="doctor"?" sel":""}`} onClick={()=>{setRole("doctor");setSelSugg(null);}}>
              <span className="ri">🩺</span><span className="rl">{t.doctor}</span>
            </button>
          </div>
        </div>

        <div className="field">
          <label>{t.its_a}</label>
          <div className="gender-row">
            <button className={`gbtn${gender==="girl"?" girl":""}`} onClick={()=>setGender("girl")}>
              <span className="gi">🩷</span><span className="gl">{t.girl}</span>
            </button>
            <button className={`gbtn${gender==="boy"?" boy":""}`} onClick={()=>setGender("boy")}>
              <span className="gi">🩵</span><span className="gl">{t.boy}</span>
            </button>
          </div>
        </div>

        <div className="field">
          <label>{t.anim_label}</label>
          <div className="anim-grid">
            {ANIMS.map(a=>(
              <button key={a.id} className={`abtn${anim===a.id?" sel":""}`} onClick={()=>setAnim(a.id)}>
                <span className="ai">{a.icon}</span>
                <span className="an">{a.name[lang]||a.name.fr}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="divider"/>

        <div className="field">
          <label>{t.from_label}</label>
          <input type="text" placeholder={role==="doctor"?t.from_ph_doc:t.from_ph_par} value={from} onChange={e=>setFrom(e.target.value)}/>
        </div>

        {role&&<div className="field">
          <label>{t.msg_label} <span className="opt">{t.opt}</span></label>
          <p className="suggest-hint">{t.msg_hint}</p>
          <div className="sugg-list">
            {suggestions.map((s,i)=>(
              <button key={i} className={`sugg-item${selSugg===s&&!custom?" sel":""}`}
                onClick={()=>{setSelSugg(s===selSugg?null:s);setCustom("");}}>
                <span className="sugg-check">{selSugg===s&&!custom?"✓":"+"}</span>
                <span className="sugg-text">{s}</span>
              </button>
            ))}
          </div>
          <textarea className="msg-area" placeholder={t.custom_ph} value={custom}
            onChange={e=>{setCustom(e.target.value);if(e.target.value)setSelSugg(null);}}/>
        </div>}

        {!role&&<div className="field">
          <label>{t.msg_label} <span className="opt">{t.opt}</span></label>
          <textarea placeholder={t.free_ph} value={custom} onChange={e=>setCustom(e.target.value)}/>
        </div>}

        <button className="btn btn-w" style={{opacity:gender?1:0.4}}
          onClick={()=>gender&&onGenerate({gender,anim,from,message:finalMsg,role})}>
          {t.gen}
        </button>
      </div>
    </div>
  );
}

// ─── Link Page ────────────────────────────────────────────────────────────────
function LinkPage({config,onPreview,onBack}) {
  const {t,lang}=useLang();
  const [copied,setCopied]=useState(false);
  const [saving,setSaving]=useState(true);
  const [slug,setSlug]=useState(null);

  useEffect(()=>{
    db.save(config,lang)
      .then(r=>{setSlug(r.slug);setSaving(false);})
      .catch(()=>setSaving(false));
  },[]);

  const base=window.location.origin+window.location.pathname;
  const fullLink=slug?`${base}?r=${slug}`:"";
  const display=slug?`${window.location.host}?r=${slug}`:"…";

  const handleCopy=()=>{navigator.clipboard?.writeText(fullLink).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const handleShare=(ch)=>{
    const m=encodeURIComponent(fullLink);
    if(ch==="wa")window.open(`https://wa.me/?text=${m}`,"_blank");
    if(ch==="sms")window.open(`sms:?body=${m}`,"_blank");
    if(ch==="email")window.open(`mailto:?subject=Gender+Reveal&body=${m}`,"_blank");
  };

  return (
    <div className="link-page">
      <button className="nav-back" onClick={onBack}>{t.edit}</button>
      <div className="link-card">
        <div style={{fontSize:"3rem",marginBottom:"0.75rem"}}>{saving?"⏳":"🔗"}</div>
        <h2>{saving?"Création du lien…":t.link_title}</h2>
        <p className="lsub">{t.link_sub}</p>
        {!saving&&<>
          <div className="link-box">
            <span>{display}</span>
            <button className="copy-btn" onClick={handleCopy}>{copied?t.copied:t.copy}</button>
          </div>
          <div className="share-btns">
            <button className="share-btn" onClick={()=>handleShare("wa")}>{t.wa}</button>
            <button className="share-btn" onClick={()=>handleShare("email")}>{t.email}</button>
            <button className="share-btn" onClick={()=>handleShare("sms")}>{t.sms}</button>
          </div>
          <div className="divider"/>
          <button className="btn btn-w" onClick={onPreview}>{t.preview}</button>
          <div className="reaction-note">{t.reaction_note}</div>
        </>}
      </div>
    </div>
  );
}

// ─── Reaction Review Page ─────────────────────────────────────────────────────
function ReactionReview({videoBlob,gender,slug,onSend,onDiscard}) {
  const {t}=useLang();
  const [watching,setWatching]=useState(false);
  const [sent,setSent]=useState(false);
  const [uploading,setUploading]=useState(false);
  const vRef=useRef(null);
  const vUrl=useState(()=>URL.createObjectURL(videoBlob))[0];
  const bg=gender==="girl"?BG_GIRL:BG_BOY;

  useEffect(()=>()=>URL.revokeObjectURL(vUrl),[]);

  const handleWatch=()=>{setWatching(true);setTimeout(()=>{if(vRef.current){vRef.current.src=vUrl;vRef.current.play().catch(()=>{});}},50);};

  const share=async(ch)=>{
    setUploading(true);
    // Use correct extension based on actual mime type
    const ext=videoBlob.type.includes("mp4")?"mp4":"webm";
    const file=new File([videoBlob],`ma-reaction-gender-reveal.${ext}`,{type:videoBlob.type});
    setUploading(false);
    if(navigator.canShare?.({files:[file]})){
      try{
        await navigator.share({files:[file],title:"Ma réaction Gender Reveal 🎉"});
        setSent(true);onSend(ch);return;
      }catch(e){
        if(e.name==="AbortError")return;
      }
    }
    dlOnly();
  };

  const dlOnly=()=>{
    const a=document.createElement("a");
    a.href=vUrl;a.download="ma-reaction-gender-reveal.mp4";a.click();
  };

  const B={width:"100%",padding:"0.9rem 1.5rem",borderRadius:40,fontFamily:"'DM Sans',sans-serif",
    fontSize:"0.95rem",fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",
    justifyContent:"center",gap:"0.6rem",border:"none",transition:"opacity 0.15s"};

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:bg,padding:"2rem",overflow:"hidden"}}>
      <div style={{background:"rgba(0,0,0,0.38)",backdropFilter:"blur(20px)",borderRadius:28,padding:"2rem",maxWidth:420,width:"100%",border:"1px solid rgba(255,255,255,0.18)",textAlign:"center"}}>
        {!sent?<>
          <div style={{fontSize:"2.8rem",marginBottom:"0.6rem"}}>🎬</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",color:"white",fontSize:"1.55rem",marginBottom:"0.4rem"}}>{t.captured}</h2>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:"0.86rem",marginBottom:"1.6rem",lineHeight:1.55}}>{t.watch} avant de décider si vous voulez l'envoyer aux parents.</p>
          {watching?(
            <div style={{borderRadius:16,overflow:"hidden",marginBottom:"1.4rem",background:"#000",aspectRatio:"4/3",position:"relative"}}>
              <video ref={vRef} playsInline controls loop style={{width:"100%",height:"100%",objectFit:"cover",display:"block",transform:"scaleX(-1)"}}/>
            </div>
          ):(
            <div style={{borderRadius:16,overflow:"hidden",marginBottom:"1.4rem",background:"rgba(0,0,0,0.4)",aspectRatio:"4/3",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"1.5px solid rgba(255,255,255,0.15)",cursor:"pointer"}} onClick={handleWatch}>
              <div style={{width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.9)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"0.75rem"}}>
                <span style={{fontSize:"1.6rem",marginLeft:4}}>▶</span>
              </div>
              <p style={{color:"rgba(255,255,255,0.7)",fontSize:"0.85rem"}}>Appuyez pour revoir votre réaction</p>
            </div>
          )}
          {!watching&&<button onClick={handleWatch} style={{...B,background:"rgba(255,255,255,0.15)",border:"1.5px solid rgba(255,255,255,0.3)",color:"white",marginBottom:"1rem"}}>{t.watch}</button>}
          <div style={{height:1,background:"rgba(255,255,255,0.12)",margin:"1rem 0"}}/>

          <div style={{display:"flex",flexDirection:"column",gap:"0.6rem",marginBottom:"0.8rem"}}>
            {/* Native share — lets the device propose all available apps */}
            <button onClick={()=>share("native")} disabled={uploading}
              style={{...B,background:"white",color:"#1a1a2e",opacity:uploading?0.7:1}}>
              {uploading?"⏳…":"📤 Partager ma réaction"}
            </button>
            {/* Download only — stays on device */}
            <button onClick={dlOnly}
              style={{...B,background:"rgba(255,255,255,0.1)",border:"1.5px solid rgba(255,255,255,0.25)",color:"rgba(255,255,255,0.8)"}}>
              ⬇️ Télécharger sur mon appareil
            </button>
          </div>
          <button onClick={onDiscard}
            style={{background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:"0.8rem",cursor:"pointer",textDecoration:"underline",fontFamily:"'DM Sans',sans-serif"}}>
            Fermer sans partager
          </button>
        </>:<div style={{padding:"1rem 0"}}>
          <div style={{fontSize:"3.5rem",marginBottom:"0.75rem"}}>🎉</div>
          <p style={{color:"white",fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",marginBottom:"0.5rem"}}>{t.sent}</p>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:"0.85rem",marginBottom:"2rem",lineHeight:1.5}}>{t.sent_sub}</p>
          <button onClick={onDiscard} style={{...B,background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.3)",color:"white"}}>{t.close}</button>
        </div>}
      </div>
    </div>
  );
}

// ─── Reveal Page ──────────────────────────────────────────────────────────────
function RevealPage({config,onBack}) {
  const {t}=useLang();
  const [flow,setFlow]=useState("waiting");
  const [phase,setPhase]=useState(0);
  const [prog,setProg]=useState(0);
  const [camOn,setCamOn]=useState(false);
  const [blob,setBlob]=useState(null);
  const vRef=useRef(null);
  const streamRef=useRef(null);
  const recRef=useRef(null);
  const chunksRef=useRef([]);
  const rafRef=useRef(null);
  const t0Ref=useRef(null);
  const compRef=useRef(null);

  // Is this a guest (opened via shared link)?
  const isGuest = !!config.slug;

  const Scene=SCENES[config.anim]||SceneConfetti;
  const bg=flow==="waiting"?BG0:phase===2?(config.gender==="girl"?BG_GIRL:BG_BOY):phase===1?BG1:BG0;

  const camVideoRef=useRef(null); // separate ref for PiP during animation

  const toggleCam=async()=>{
    if(camOn){streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;setCamOn(false);}
    else{
      try{
        const s=await navigator.mediaDevices.getUserMedia({
          video:{facingMode:"user",width:{ideal:640},height:{ideal:480}},
          audio:true
        });
        streamRef.current=s;
        if(vRef.current){vRef.current.srcObject=s;vRef.current.play().catch(()=>{});}
        setCamOn(true);
      }catch{alert("Impossible d'accéder à la caméra.");}
    }
  };

  const handleStart=()=>{
    setFlow("animating");
    audio.play(config.anim,config.gender);

    // Start recording directly from camera stream
    if(streamRef.current&&window.MediaRecorder){
      chunksRef.current=[];
      // Try MP4 first for WhatsApp compatibility, fallback to webm
      const mime=["video/mp4","video/webm;codecs=vp9","video/webm"]
        .find(m=>MediaRecorder.isTypeSupported(m))||"";
      try{
        const rec=new MediaRecorder(streamRef.current,mime?{mimeType:mime}:{});
        recRef.current=rec;
        rec.ondataavailable=e=>{if(e.data?.size>0)chunksRef.current.push(e.data);};
        rec.start(500);
      }catch(e){console.warn("Recording failed:",e);}
    }

    let cur=0;t0Ref.current=performance.now();
    const phases=PHASES[config.anim]||PHASES.confetti;
    let revealReached=false;

    const tick=(now)=>{
      const el=now-t0Ref.current,d=phases[cur].d,p=Math.min(el/d,1);
      setProg(p);
      if(p>=1&&cur<phases.length-1){
        cur++;t0Ref.current=now;setPhase(cur);
        if(cur===2){
          revealReached=true;
          const c=document.getElementById("cfx");
          if(c&&["confetti","gift","rainbow"].includes(config.anim))runConfetti(c,config.gender,12000);
        }
      }
      if(p>=1&&cur===phases.length-1){
        cancelAnimationFrame(rafRef.current);
        // Wait 7 extra seconds after reveal so we capture the full reaction
        setTimeout(()=>{
          audio.stop();
          if(recRef.current&&recRef.current.state!=="inactive"){
            recRef.current.onstop=()=>{
              const mimeType=recRef.current.mimeType||"video/webm";
              const b=new Blob(chunksRef.current,{type:mimeType});
              if(b.size>5000){
                setBlob(b);
                streamRef.current?.getTracks().forEach(t=>t.stop());
                setFlow("review");
              }else{
                streamRef.current?.getTracks().forEach(t=>t.stop());
                setFlow("done");
              }
            };
            recRef.current.stop();
          }else{
            setFlow("done");
          }
        },7000); // 7 seconds after reveal ends
        return;
      }
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
  };

  useEffect(()=>()=>{
    cancelAnimationFrame(rafRef.current);
    audio.stop();
    streamRef.current?.getTracks().forEach(t=>t.stop());
  },[]);

  if(flow==="review"&&blob){
    return <ReactionReview videoBlob={blob} gender={config.gender} slug={config.slug||null} onSend={()=>setFlow("done")} onDiscard={()=>setFlow("done")}/>;
  }

  if(flow==="done"){
    return(
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:config.gender==="girl"?BG_GIRL:BG_BOY,padding:"2rem"}}>
        <div style={{textAlign:"center",color:"white"}}>
          <div style={{fontSize:"4rem",marginBottom:"1rem"}}>✨</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.8rem,6vw,2.5rem)",marginBottom:"0.75rem"}}>
            {config.gender==="girl"?t.its_girl:t.its_boy}
          </h2>
          <p style={{opacity:0.8,marginBottom:"2rem",fontSize:"1rem"}}>
            {config.gender==="girl"?t.she:t.he}
          </p>
          {/* Only show back button if not a guest */}
          {!isGuest&&(
            <button onClick={()=>{audio.stop();onBack();}} style={{padding:"0.75rem 2rem",borderRadius:40,background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.3)",color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:"0.9rem",cursor:"pointer"}}>
              {t.back}
            </button>
          )}
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:bg,transition:"background 1.8s ease",overflow:"hidden",position:"relative",padding:"2rem"}}>
      {/* Only show back button if not a guest */}
      {!isGuest&&(
        <button className="nav-back" onClick={()=>{audio.stop();onBack();}} style={{background:"rgba(255,255,255,0.15)",color:"white",border:"1px solid rgba(255,255,255,0.3)"}}>
          {t.back}
        </button>
      )}

      {flow==="waiting"&&(
        <div style={{textAlign:"center",color:"white",maxWidth:480}}>
          {config.from&&<p style={{fontSize:"0.85rem",opacity:0.6,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"0.5rem"}}>{t.from_label2} {config.from}</p>}
          {config.message&&<p style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:"clamp(1rem,3vw,1.3rem)",opacity:0.85,marginBottom:"2rem",lineHeight:1.6}}>"{config.message}"</p>}
          <div style={{marginBottom:"2rem"}}>
            <button onClick={toggleCam} style={{display:"inline-flex",alignItems:"center",gap:"0.6rem",background:camOn?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.12)",border:`1.5px solid ${camOn?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.3)"}`,color:"white",padding:"0.7rem 1.3rem",borderRadius:"30px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"0.85rem",backdropFilter:"blur(8px)"}}>
              {camOn?t.cam_on:t.cam_off}
            </button>
            {camOn&&(
              <div style={{marginTop:"1rem",position:"relative",display:"inline-block"}}>
                <video ref={vRef} autoPlay muted playsInline style={{width:160,height:120,borderRadius:16,objectFit:"cover",border:"2px solid rgba(255,255,255,0.5)",display:"block",transform:"scaleX(-1)"}}/>
                <div style={{position:"absolute",top:8,right:8,width:10,height:10,borderRadius:"50%",background:"#FF3B30",boxShadow:"0 0 6px #FF3B30",animation:"twinkle 1s ease-in-out infinite"}}/>
                <p style={{fontSize:"0.7rem",opacity:0.55,marginTop:"0.4rem",letterSpacing:"0.08em"}}>{t.cam_note}</p>
              </div>
            )}
          </div>
          <button style={{background:"white",color:"var(--deep)",border:"none",padding:"1.2rem 3.5rem",borderRadius:"60px",fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",cursor:"pointer",boxShadow:"0 8px 40px rgba(0,0,0,0.3)"}}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
            onClick={handleStart}>{t.discover}</button>
          <p style={{fontSize:"0.75rem",opacity:0.35,marginTop:"1.2rem"}}>{t.hint}</p>
        </div>
      )}

      {flow==="animating"&&<>
        <canvas ref={compRef} style={{display:"none"}} width={640} height={480}/>
        {/* Camera PiP — visible during animation */}
        {camOn&&streamRef.current&&(
          <div style={{position:"fixed",bottom:20,right:16,zIndex:200,borderRadius:14,overflow:"hidden",border:"2px solid rgba(255,255,255,0.7)",boxShadow:"0 4px 24px rgba(0,0,0,0.6)",width:110,height:82,background:"#000"}}>
            <video
              autoPlay muted playsInline
              ref={el=>{
                if(el&&streamRef.current&&el.srcObject!==streamRef.current){
                  el.srcObject=streamRef.current;
                  el.play().catch(()=>{});
                }
              }}
              style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)",display:"block"}}
            />
            <div style={{position:"absolute",top:4,left:5,display:"flex",alignItems:"center",gap:3,background:"rgba(0,0,0,0.6)",borderRadius:20,padding:"2px 6px"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#FF3B30",animation:"twinkle 1s infinite"}}/>
              <span style={{fontSize:"0.52rem",color:"white",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.06em"}}>REC</span>
            </div>
          </div>
        )}
        <Scene phase={phase} progress={prog} gender={config.gender}/>
      </>}
    </div>
  );
}

// ─── Reactions Dashboard ──────────────────────────────────────────────────────
function ReactionsPage({slug,onBack}) {
  const {t}=useLang();
  const [reactions,setReactions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [reveal,setReveal]=useState(null);
  const bg=reveal?.gender==="girl"?BG_GIRL:BG_BOY;

  useEffect(()=>{
    Promise.all([db.load(slug),db.reactions(slug)])
      .then(([r,rx])=>{setReveal(r);setReactions(rx);setLoading(false);})
      .catch(()=>setLoading(false));
  },[slug]);

  return(
    <div style={{minHeight:"100vh",background:reveal?bg:BG0,padding:"2rem",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <button className="nav-back" onClick={onBack} style={{background:"rgba(255,255,255,0.2)",color:"white",border:"1px solid rgba(255,255,255,0.3)"}}>{t.back}</button>
      <div style={{maxWidth:520,width:"100%",marginTop:"4rem"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",color:"white",fontSize:"1.8rem",marginBottom:"0.5rem",textAlign:"center"}}>📹 {t.reactions_title}</h2>
        {loading&&<p style={{color:"rgba(255,255,255,0.6)",textAlign:"center",marginTop:"2rem"}}>Chargement…</p>}
        {!loading&&reactions.length===0&&(
          <div style={{textAlign:"center",color:"rgba(255,255,255,0.55)",marginTop:"3rem"}}>
            <div style={{fontSize:"3rem",marginBottom:"1rem"}}>🎬</div>
            <p>{t.no_reactions}</p>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:"1rem",marginTop:"1rem"}}>
          {reactions.map((r,i)=>(
            <div key={r.id} style={{background:"rgba(0,0,0,0.3)",backdropFilter:"blur(12px)",borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,0.15)"}}>
              <video src={db.videoUrl(r.storage_path)} controls playsInline style={{width:"100%",display:"block",maxHeight:320,objectFit:"cover",transform:"scaleX(-1)"}}/>
              <div style={{padding:"0.75rem 1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:"rgba(255,255,255,0.6)",fontSize:"0.78rem"}}>Réaction #{i+1} · {new Date(r.created_at).toLocaleDateString()}</span>
                <a href={db.videoUrl(r.storage_path)} download style={{color:"white",fontSize:"0.78rem",textDecoration:"none",background:"rgba(255,255,255,0.15)",padding:"0.3rem 0.7rem",borderRadius:20}}>⬇️</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page,setPage]=useState("home");
  const [config,setConfig]=useState(null);
  const [lang,setLang]=useState(()=>detectLang());
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    document.title="Gender Reveal ✨";
    const svg=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌟</text></svg>`;
    const lk=document.querySelector("link[rel*='icon']")||document.createElement("link");
    lk.type="image/svg+xml";lk.rel="icon";lk.href=`data:image/svg+xml,${encodeURIComponent(svg)}`;
    document.head.appendChild(lk);
  },[]);

  useEffect(()=>{
    const p=new URLSearchParams(window.location.search);
    const r=p.get("r"),rx=p.get("reactions");
    if(rx){setPage("reactions");setConfig({slug:rx});return;}
    if(r){
      setLoading(true);
      db.load(r).then(row=>{
        setLoading(false);
        if(!row){setPage("notfound");return;}
        if(row.expires_at&&new Date(row.expires_at)<new Date()){setPage("expired");return;}
        setConfig({gender:row.gender,anim:row.anim,from:row.from_name,message:row.message,role:row.role,slug:row.slug});
        if(row.lang)setLang(row.lang);
        setPage("reveal");
      }).catch(()=>{setLoading(false);setPage("notfound");});
    }
  },[]);

  useEffect(()=>{
    const dir=LANGS.find(l=>l.code===lang)?.dir||"ltr";
    document.documentElement.setAttribute("dir",dir);
    document.documentElement.setAttribute("lang",lang);
  },[lang]);

  const ctx={lang,setLang,t:T[lang]||T.fr};

  const goHome=()=>{setPage("home");setConfig(null);window.history.pushState({},"",window.location.pathname);};

  const PageBg=({children})=>(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:BG0,padding:"2rem",textAlign:"center"}}>
      <LangCtx.Provider value={ctx}><CSS/><LangSelector/>{children}</LangCtx.Provider>
    </div>
  );

  if(loading)return(
    <PageBg>
      <div style={{color:"white"}}>
        <div style={{fontSize:"3rem",marginBottom:"1rem",animation:"float 1.5s ease-in-out infinite"}}>🌟</div>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",opacity:0.7}}>{ctx.t.loading}</p>
      </div>
    </PageBg>
  );

  if(page==="notfound")return(
    <PageBg>
      <div style={{color:"white",maxWidth:400}}>
        <div style={{fontSize:"4rem",marginBottom:"1rem"}}>🔍</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",marginBottom:"0.75rem"}}>{ctx.t.notfound_title}</h2>
        <p style={{opacity:0.65,fontSize:"0.95rem",lineHeight:1.6,marginBottom:"2rem"}}>{ctx.t.notfound_sub}</p>
        <button style={{background:"white",color:"var(--deep)",border:"none",padding:"0.9rem 2rem",borderRadius:60,fontFamily:"'DM Sans',sans-serif",fontSize:"0.95rem",cursor:"pointer",fontWeight:500}} onClick={goHome}>{ctx.t.new}</button>
      </div>
    </PageBg>
  );

  if(page==="expired")return(
    <PageBg>
      <div style={{color:"white",maxWidth:400}}>
        <div style={{fontSize:"4rem",marginBottom:"1rem"}}>⏳</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",marginBottom:"0.75rem"}}>{ctx.t.expired_title}</h2>
        <p style={{opacity:0.65,fontSize:"0.95rem",lineHeight:1.6,marginBottom:"2rem"}}>{ctx.t.expired_sub}</p>
        <button style={{background:"white",color:"var(--deep)",border:"none",padding:"0.9rem 2rem",borderRadius:60,fontFamily:"'DM Sans',sans-serif",fontSize:"0.95rem",cursor:"pointer",fontWeight:500}} onClick={goHome}>{ctx.t.new}</button>
      </div>
    </PageBg>
  );

  return(
    <LangCtx.Provider value={ctx}>
      <div className="app">
        <CSS/>
        <LangSelector/>
        {page==="home"&&<HomePage onStart={()=>setPage("create")}/>}
        {page==="create"&&<CreatePage onBack={()=>setPage("home")} onGenerate={cfg=>{setConfig(cfg);setPage("link");}}/>}
        {page==="link"&&<LinkPage config={config} onBack={()=>setPage("create")} onPreview={()=>setPage("reveal")}/>}
        {page==="reveal"&&<RevealPage config={config} onBack={()=>setPage("link")}/>}
        {page==="reactions"&&config?.slug&&<ReactionsPage slug={config.slug} onBack={goHome}/>}
      </div>
    </LangCtx.Provider>
  );
}
