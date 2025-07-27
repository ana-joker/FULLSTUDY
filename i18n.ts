// --- INTERNATIONALIZATION (i18n) ---

const uiStringsEn = {
    // General
    backToHome: "Back to Home",
    close: "Close",
    cancel: "Cancel",

    // Home Page
    mainAppTitle: "Study & Quiz Hub",
    mainAppSubtitle: "Your personal AI-powered learning environment.",
    studyHubTitle: "Study Hub",
    studyHubDescription: "Start a conversation with your AI tutor, ask questions, and explore topics in depth.",
    quizHubTitle: "Quiz Hub",
    quizHubDescription: "Generate custom quizzes from text, documents, or images to test your knowledge.",
    
    // Chat
    newChat: "New Chat +",
    systemInstruction: "System Instruction",
    chatWelcomeTitle: "How can I help you learn today?",
    chatWelcomeDescription: "Ask a question, upload a file, or send a voice note to get started.",
    stopRecording: "Stop Recording",
    copy: "Copy",
    regenerate: "Regenerate",
    delete: "Delete",
    pin: "Pin",
    unpin: "Unpin",
    edit: "Edit",

    // Quiz
    generateQuiz: "Generate Quiz",
    generateDifferentQuiz: "Generate Different Quiz",
    startQuiz: "Start Quiz",
    submitAnswer: "Submit Answer",
    nextQuestion: "Next Question",
    finishQuiz: "Finish Quiz",
    reviewAnswers: "Review Answers",
    retakeQuiz: "Retake Quiz",
    createNewQuiz: "Create New Quiz",
    backToResults: "Back to Results",
    backToCreator: "Create a New Quiz",
    landingMessage: "Welcome! Test your knowledge. Click the button below to start.",
    resultsHeader: "Quiz Results",
    resultsScoreLabel: "Your Score:",
    resultsPercentageLabel: "Percentage:",
    reviewHeader: "Review Your Answers",
    resumeHeader: "Resume Quiz?",
    resumeText: "We found a quiz in progress. Would you like to resume where you left off?",
    resumeYes: "Yes, Resume",
    resumeNo: "No, Start New",
    passMessage: "Congratulations! You passed the quiz and demonstrated a great understanding of the material.",
    failMessage: "Don't worry, practice makes perfect. Review the explanations and try again to solidify your understanding.",
    quizHistory: "Quiz History",
    historyHeader: "Your Quiz History",
    noHistory: "You haven't completed any quizzes yet. Generate a new one to get started!",
    correct: "Correct!",
    incorrect: "Incorrect",
    numQuestions: "Number of Questions",
    difficulty: "Difficulty",
    easy: "Easy",
    mediumDifficulty: "Medium",
    hard: "Hard",
    mixed: "Mixed",
    knowledgeLevel: "Your Knowledge Level",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    learningGoal: "Your Learning Goal",
    understandConcepts: "Understand Concepts",
    applyInfo: "Apply Information",
    learning: "Learning",
    questionTypes: "Question Types",
    qMcq: "Multiple Choice",
    qTf: "True/False",
    qSa: "Short Answer",
    qOrd: "Ordering",
    qMatch: "Matching",
    quizLanguage: "Quiz Language",
    summaryHeader: "Summary to Get You Started",
    addToRecall: "🧠 Add to Smart Recall",
    addedToRecall: "✅ Added",
    recallHeader: "Smart Recall",
    showAnswer: "Show Answer",
    recallForgot: "Forgot",
    recallGood: "Good",
    recallEasy: "Easy",
    recallCompleteHeader: "All done for now!",
    recallCompleteText: "You've reviewed all your due cards. Come back later to keep your memory sharp.",
    learnMore: "Learn More",
    learnMoreHeader: "Learn More",
    resourceSummary: "Summary",
    resourceVideos: "Helpful Videos",
    resourceArticles: "Further Reading",
    exportForAnki: "Export for Anki",
    appTitle: "Interactive Quiz Generator",
    appSubtitle: "Describe the quiz you want, or upload a document and let AI build it for you instantly.",
    uploadDocument: "Upload Document",
    uploadImage: "Upload Image",
    subjectLabel: "Subject/Field (Optional)",
    explanationLanguage: "Explanation Language",
    
    // Settings
    settings: "Settings",
    // -- General Settings
    appearance: "Appearance",
    interfaceLanguage: "Interface Language",
    theme: "Theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    fontSize: "Font Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    startupPage: "Startup Page",
    startupHomePage: "Home Page",
    startupLastSession: "Last Active Session",
    dataManagement: "Data Management",
    dataBackupDescription: "Export your settings and all history (chats, quizzes) to a single JSON file.",
    exportData: "Export All Data",
    apiKeyMissing: "API Key not set. Please add it in your .env file or deployment configuration.",
    // -- Chat Settings
    modelParameters: "Model Parameters",
    settingsChatBehavior: "Behavior",
    autoCreateTitle: "Auto Create Chat Titles",
    streamingOutput: "Streaming Output",
};

const uiStringsAr = {
    // General
    backToHome: "العودة للرئيسية",
    close: "إغلاق",
    cancel: "إلغاء",

    // Home Page
    mainAppTitle: "مركز المذاكرة والاختبارات",
    mainAppSubtitle: "بيئة التعلم الشخصية المدعومة بالذكاء الاصطناعي.",
    studyHubTitle: "مركز المذاكرة",
    studyHubDescription: "ابدأ محادثة مع معلمك الذكي، اطرح الأسئلة، واستكشف المواضيع بعمق.",
    quizHubTitle: "مركز الاختبارات",
    quizHubDescription: "أنشئ اختبارات مخصصة من النصوص، المستندات، أو الصور لاختبار معرفتك.",
    
    // Chat
    newChat: "محادثة جديدة +",
    systemInstruction: "تعليمات النظام",
    chatWelcomeTitle: "كيف يمكنني مساعدتك على التعلم اليوم؟",
    chatWelcomeDescription: "اطرح سؤالاً، ارفع ملفاً، أو أرسل ملاحظة صوتية للبدء.",
    stopRecording: "إيقاف التسجيل",
    copy: "نسخ",
    regenerate: "إعادة إنشاء",
    delete: "حذف",
    pin: "تثبيت",
    unpin: "إلغاء التثبيت",
    edit: "تعديل",

    // Quiz
    generateQuiz: "أنشئ اختبار",
    generateDifferentQuiz: "أنشئ اختبار مختلف",
    startQuiz: "ابدأ الاختبار",
    submitAnswer: "إرسال الإجابة",
    nextQuestion: "السؤال التالي",
    finishQuiz: "إنهاء الاختبار",
    reviewAnswers: "مراجعة الإجابات",
    retakeQuiz: "إعادة الاختبار",
    createNewQuiz: "إنشاء اختبار جديد",
    backToResults: "العودة للنتائج",
    backToCreator: "العودة للإنشاء",
    landingMessage: "أهلاً بك! اختبر معلوماتك. اضغط على الزر أدناه للبدء.",
    resultsHeader: "نتائج الاختبار",
    resultsScoreLabel: "درجتك:",
    resultsPercentageLabel: "النسبة المئوية:",
    reviewHeader: "مراجعة إجاباتك",
    resumeHeader: "استئناف الاختبار؟",
    resumeText: "وجدنا اختبارًا قيد التقدم. هل ترغب في الاستئناف من حيث توقفت؟",
    resumeYes: "نعم، استئناف",
    resumeNo: "لا، ابدأ من جديد",
    passMessage: "تهانينا! لقد نجحت في الاختبار وأظهرت فهمًا كبيرًا للمادة.",
    failMessage: "لا تقلق، الممارسة تؤدي إلى الإتقان. راجع الشروحات وحاول مرة أخرى لترسيخ فهمك.",
    quizHistory: "سجل الاختبارات",
    historyHeader: "سجل اختباراتك",
    noHistory: "لم تكمل أي اختبارات بعد. أنشئ اختبارًا جديدًا للبدء!",
    correct: "صحيح!",
    incorrect: "غير صحيح",
    numQuestions: "عدد الأسئلة",
    difficulty: "مستوى الصعوبة",
    easy: "سهل",
    mediumDifficulty: "متوسط",
    hard: "صعب",
    mixed: "مختلط",
    knowledgeLevel: "مستوى معرفتك",
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
    learningGoal: "هدف التعلم",
    understandConcepts: "فهم المفاهيم",
    applyInfo: "تطبيق المعلومات",
    learning: "تعلم",
    questionTypes: "أنواع الأسئلة",
    qMcq: "اختيار من متعدد",
    qTf: "صح/خطأ",
    qSa: "إجابة قصيرة",
    qOrd: "ترتيب",
    qMatch: "مطابقة",
    quizLanguage: "لغة الاختبار",
    summaryHeader: "ملخص لتبدأ به",
    addToRecall: "🧠 إضافة إلى التذكير الذكي",
    addedToRecall: "✅ تمت الإضافة",
    recallHeader: "التذكير الذكي",
    showAnswer: "إظهار الإجابة",
    recallForgot: "نسيت",
    recallGood: "جيد",
    recallEasy: "سهل",
    recallCompleteHeader: "انتهى كل شيء الآن!",
    recallCompleteText: "لقد راجعت جميع بطاقاتك المستحقة. عد لاحقًا للحفاظ على ذاكرتك قوية.",
    learnMore: "افهم ده أكتر",
    learnMoreHeader: "اعرف المزيد",
    resourceSummary: "ملخص",
    resourceVideos: "فيديوهات مفيدة",
    resourceArticles: "قراءات إضافية",
    exportForAnki: "تصدير إلى Anki",
    appTitle: "مولد الاختبارات التفاعلي",
    appSubtitle: "صف الاختبار الذي تريده، أو ارفع مستندًا ودع الذكاء الاصطناعي يبنيه لك فورًا.",
    uploadDocument: "رفع مستند",
    uploadImage: "رفع صورة",
    subjectLabel: "الموضوع/المجال (اختياري)",
    explanationLanguage: "لغة الشرح",

    // Settings
    settings: "الإعدادات",
    // -- General Settings
    appearance: "المظهر",
    interfaceLanguage: "لغة الواجهة",
    theme: "السمة",
    lightTheme: "فاتح",
    darkTheme: "داكن",
    fontSize: "حجم الخط",
    small: "صغير",
    medium: "متوسط",
    large: "كبير",
    startupPage: "صفحة بدء التشغيل",
    startupHomePage: "الصفحة الرئيسية",
    startupLastSession: "آخر جلسة نشطة",
    dataManagement: "إدارة البيانات",
    dataBackupDescription: "تصدير الإعدادات وجميع السجلات (المحادثات، الاختبارات) إلى ملف JSON واحد.",
    exportData: "تصدير كل البيانات",
    apiKeyMissing: "لم يتم تعيين مفتاح API. يرجى إضافته في ملف .env أو في إعدادات النشر.",
    // -- Chat Settings
    modelParameters: "معلمات النموذج",
    settingsChatBehavior: "سلوك المحادثة",
    autoCreateTitle: "إنشاء عناوين تلقائي",
    streamingOutput: "إخراج متدفق",
};


export const i18nDictionary = { en: uiStringsEn, ar: uiStringsAr };
export let currentStrings = i18nDictionary.ar; // Default to Arabic

export function applyLanguage(lang: 'ar' | 'en') {
    currentStrings = i18nDictionary[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    initializeUiText();
}

export function initializeUiText() {
    document.querySelectorAll<HTMLElement>('[data-i18n-key]').forEach(el => {
        const key = el.dataset.i18nKey as keyof typeof uiStringsEn;
        if (key && currentStrings[key]) {
            // For buttons in a button group, they might just have the key and need textContent
            // For other elements, they might have child nodes that need preserving.
            // A simple check to see if it's a button or has no element children.
            if (el.tagName === 'BUTTON' || el.children.length === 0) {
                 el.textContent = currentStrings[key];
            } else {
                // If it has children, find the first text node and change it.
                // This is a bit fragile but works for cases like <label><input><span>text</span></label>
                const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
                if(textNode) {
                    textNode.textContent = ` ${currentStrings[key]} `;
                }
            }
        }
    });

    // Handle elements that might not have the data attribute, like buttons in modals
    const recallShowAnswerBtn = document.getElementById('recall-show-answer-btn');
    if (recallShowAnswerBtn) recallShowAnswerBtn.textContent = currentStrings.showAnswer;
    const historyContainer = document.getElementById('history-container');
    if (historyContainer && historyContainer.querySelector('.no-history-message')) {
        historyContainer.querySelector('.no-history-message')!.textContent = currentStrings.noHistory;
    }
}