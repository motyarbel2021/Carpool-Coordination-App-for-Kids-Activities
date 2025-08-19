const { useState, useEffect, useCallback, useRef } = React;

// Icon Components (using Font Awesome classes instead of Lucide)
const Icon = ({ name, className = "w-5 h-5" }) => (
  React.createElement('i', { 
    className: name + ' ' + className,
    'aria-hidden': 'true' 
  })
);

const App = () => {
  const [currentView, setCurrentView] = useState('family-home');
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [availability, setAvailability] = useState({});
  const [classForm, setClassForm] = useState({
    name: '',
    addresses: [{ name: '', address: '' }],
    sessions: [{ day: '', startTime: '', endTime: '', addressIndex: 0 }],
    coachName: '',
    coachPhone: '',
    managerName: '',
    managerPhone: '',
    managerEmail: ''
  });
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: 'שלום! אני כאן לעזור לך לנהל שינויים בחוגים. תוכל להדביק הודעות מהוואטסאפ או לכתוב שינויים ישירות.',
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingScheduleChange, setPendingScheduleChange] = useState(null);
  const [availabilityStatus, setAvailabilityStatus] = useState({
    'משפחת כהן': false,
    'משפחת לוי': false, 
    'משפחת אברהם': false,
    'משפחת דוד': true,
    'משפחת שלום': false,
    'משפחת חן': false
  });
  const [userGuideSection, setUserGuideSection] = useState('overview');
  const [isClassManager, setIsClassManager] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [waitingRoomFilters, setWaitingRoomFilters] = useState({
    city: '',
    classType: '',
    searchText: '',
    showFullGroups: false
  });
  const [childForm, setChildForm] = useState({
    name: '',
    birthDate: '',
    phone: '',
    address: ''
  });
  const [weeklyAvailability, setWeeklyAvailability] = useState({
    'ראשון': { morning: false, afternoon: false, evening: false },
    'שני': { morning: false, afternoon: false, evening: false },
    'שלישי': { morning: false, afternoon: false, evening: false },
    'רביעי': { morning: false, afternoon: false, evening: false },
    'חמישי': { morning: false, afternoon: false, evening: false },
    'שישי': { morning: false, afternoon: false, evening: false },
    'שבת': { morning: false, afternoon: false, evening: false }
  });
  // נתוני מערכת מדומים למנהל
  const [systemStats, setSystemStats] = useState({
    totalFamilies: 24,
    totalChildren: 48,
    totalClasses: 12,
    activeTransportGroups: 8,
    pendingRequests: 5,
    emergencyAlerts: 2
  });
  
  const [allFamilies, setAllFamilies] = useState([]);
  
  const [availableClasses, setAvailableClasses] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'תזכורת: מלא זמינות לחוג כדורסל עד מחר בערב', type: 'warning', time: '14:30' },
    { id: 2, text: 'שיבוץ חדש פורסם לחוג שחייה', type: 'info', time: '09:15' }
  ]);

  // נתוני המשפחה הראשית - יהפוך לדינמי לאחר יצירת המשפחה הראשונה
  const [currentFamily, setCurrentFamily] = useState({
    familyName: '',
    parents: {
      parent1: { name: '', phone: '', email: '' },
      parent2: { name: '', phone: '', email: '' }
    },
    children: []
  });

  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // Mobile keyboard fix - apply global styles to prevent keyboard issues
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input[type="text"], 
      input[type="email"], 
      input[type="tel"], 
      input[type="password"],
      textarea {
        font-size: 16px !important; /* Prevent iOS zoom */
        padding: 12px !important;
        line-height: 1.5 !important;
        -webkit-appearance: none !important;
        background-color: white !important;
        border-radius: 8px !important;
      }
      
      /* Touch-friendly form elements */
      input, button, select, textarea {
        min-height: 44px; /* Apple's minimum touch target */
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Dynamic family and class management functions
  const createNewClass = (classData, creatorFamily) => {
    const newClass = {
      ...classData,
      id: 'CLS' + (Date.now().toString().slice(-6)),
      createdAt: new Date().toISOString(),
      managers: [creatorFamily.id], // Creator becomes first manager
      members: [creatorFamily.id], // Creator becomes first member
      currentMembers: 1,
      maxMembers: classData.maxMembers || 10
    };
    
    setAvailableClasses(prev => [...prev, newClass]);
    
    // Update family's classes
    setAllFamilies(prev => prev.map(family => 
      family.id === creatorFamily.id 
        ? { ...family, activeClasses: family.activeClasses + 1 }
        : family
    ));
    
    return newClass;
  };

  const addFamilyToClass = (classId, familyId) => {
    setAvailableClasses(prev => prev.map(classItem => 
      classItem.id === classId 
        ? {
            ...classItem,
            members: [...(classItem.members || []), familyId],
            currentMembers: (classItem.currentMembers || 0) + 1
          }
        : classItem
    ));
    
    // Update family's classes count
    setAllFamilies(prev => prev.map(family => 
      family.id === familyId 
        ? { ...family, activeClasses: family.activeClasses + 1 }
        : family
    ));
  };

  const transferClassManagement = (classId, fromFamilyId, toFamilyId) => {
    setAvailableClasses(prev => prev.map(classItem => 
      classItem.id === classId 
        ? {
            ...classItem,
            managers: classItem.managers.map(managerId => 
              managerId === fromFamilyId ? toFamilyId : managerId
            )
          }
        : classItem
    ));
  };

  const addClassManager = (classId, newManagerId) => {
    setAvailableClasses(prev => prev.map(classItem => 
      classItem.id === classId 
        ? {
            ...classItem,
            managers: [...(classItem.managers || []), newManagerId]
          }
        : classItem
    ));
  };

  const removeClassManager = (classId, managerIdToRemove) => {
    setAvailableClasses(prev => prev.map(classItem => 
      classItem.id === classId 
        ? {
            ...classItem,
            managers: (classItem.managers || []).filter(id => id !== managerIdToRemove)
          }
        : classItem
    ));
  };

  const createNewFamily = (familyData) => {
    const newFamily = {
      id: Date.now(),
      name: familyData.familyName,
      children: familyData.children.length || 0,
      activeClasses: 0,
      phone: familyData.parents.parent1.phone || '',
      email: familyData.parents.parent1.email || '',
      lastActive: new Date().toISOString().split('T')[0],
      availabilityStatus: 'טרם מילא',
      parents: familyData.parents,
      childrenDetails: familyData.children || []
    };
    
    setAllFamilies(prev => [...prev, newFamily]);
    setCurrentFamily(familyData);
    
    return newFamily;
  };

  const getFamilyById = (familyId) => {
    return allFamilies.find(family => family.id === familyId);
  };

  const getClassById = (classId) => {
    return availableClasses.find(classItem => classItem.id === classId);
  };

  const isUserFamilyManager = (classId, userFamilyId) => {
    const classItem = getClassById(classId);
    return classItem?.managers?.includes(userFamilyId) || false;
  };

  // Advanced data management functions
  const showDataResetOptions = () => {
    const options = `בחר מה לאפס:

1️⃣ אפס הכל (מחזיר לאפליקציה ריקה)
2️⃣ אפס רק את הילדים והחוגים  
3️⃣ אפס רק את הזמינות השבועית
4️⃣ אפס רק את הודעות הצ'אט
5️⃣ אפס רק את נתוני המשפחות
6️⃣ אפס רק את הגדרות הסינון
7️⃣ ביטול - חזור`;

    const choice = prompt(options + '\n\nהכנס מספר (1-7):');
    
    switch(choice) {
      case '1': resetAllData(); break;
      case '2': resetChildrenAndClasses(); break;
      case '3': resetAvailability(); break;  
      case '4': resetChatMessages(); break;
      case '5': resetFamilyData(); break;
      case '6': resetFilters(); break;
      case '7': case null: return;
      default: 
        alert('❌ מספר לא תקין. נסה שוב.');
        showDataResetOptions();
    }
  };

  const resetAllData = () => {
    if (confirm('🚨 האם אתה בטוח שברצונך לאפס את כל הנתונים? האפליקציה תחזור למצב ראשוני ריק לחלוטין!')) {
      // Reset ALL state variables to their initial empty values
      setCurrentView('family-home');
      setSelectedChild(null);
      setSelectedClass(null);
      setEditingClass(null);
      setIsEditingClass(false);
      setAvailability({});
      setAvailabilityStatus({}); // Clear family availability status
      setAllFamilies([]); // Clear all families including "משפחת כהן"
      setAvailableClasses([]); // Clear all classes
      setSystemStats({
        totalFamilies: 0,
        totalChildren: 0,
        totalClasses: 0,
        activeTransportGroups: 0,
        pendingRequests: 0,
        emergencyAlerts: 0
      }); // Clear statistics
      setClassForm({
        name: '',
        addresses: [{ name: '', address: '' }],
        sessions: [{ day: '', startTime: '', endTime: '', addressIndex: 0 }],
        coachName: '',
        coachPhone: '',
        managerName: '',
        managerPhone: '',
        managerEmail: ''
      });
      setChatMessages([{
        id: 1,
        type: 'bot',
        message: 'שלום! אני כאן לעזור לך לנהל שינויים בחוגים. תוכל להדביק הודעות מהוואטסאפ או לכתוב שינויים ישירות.',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
      setChatInput('');
      setChildForm({
        name: '',
        birthDate: '',
        phone: '',
        address: ''
      });
      setWeeklyAvailability({
        'ראשון': { morning: false, afternoon: false, evening: false },
        'שני': { morning: false, afternoon: false, evening: false },
        'שלישי': { morning: false, afternoon: false, evening: false },
        'רביעי': { morning: false, afternoon: false, evening: false },
        'חמישי': { morning: false, afternoon: false, evening: false },
        'שישי': { morning: false, afternoon: false, evening: false },
        'שבת': { morning: false, afternoon: false, evening: false }
      });
      setIsAdminMode(false);
      setAdminPassword('');
      setShowAdminLogin(false);
      setWaitingRoomFilters({
        city: '',
        classType: '',
        searchText: '',
        showFullGroups: false
      });
      
      // Clear any storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.log('No storage to clear');
      }
      
      alert('🔄 כל הנתונים אופסו בהצלחה! האפליקציה ריקה לחלוטין.');
    }
  };

  const resetChildrenAndClasses = () => {
    if (confirm('האם לאפס את כל הילדים והחוגים?')) {
      setSelectedChild(null);
      setSelectedClass(null);
      setEditingClass(null);
      setIsEditingClass(false);
      setAvailableClasses([]); // Clear all available classes
      setClassForm({
        name: '',
        addresses: [{ name: '', address: '' }],
        sessions: [{ day: '', startTime: '', endTime: '', addressIndex: 0 }],
        coachName: '',
        coachPhone: '',
        managerName: '',
        managerPhone: '',
        managerEmail: ''
      });
      setChildForm({
        name: '',
        birthDate: '',
        phone: '',
        address: ''
      });
      setSystemStats(prev => ({
        ...prev,
        totalClasses: 0
      })); // Update class statistics
      alert('✅ נתוני הילדים והחוגים אופסו בהצלחה!');
    }
  };

  const resetAvailability = () => {
    if (confirm('האם לאפס את כל הזמינות השבועית?')) {
      setAvailability({});
      setWeeklyAvailability({
        'ראשון': { morning: false, afternoon: false, evening: false },
        'שני': { morning: false, afternoon: false, evening: false },
        'שלישי': { morning: false, afternoon: false, evening: false },
        'רביעי': { morning: false, afternoon: false, evening: false },
        'חמישי': { morning: false, afternoon: false, evening: false },
        'שישי': { morning: false, afternoon: false, evening: false },
        'שבת': { morning: false, afternoon: false, evening: false }
      });
      alert('✅ נתוני הזמינות אופסו בהצלחה!');
    }
  };

  const resetChatMessages = () => {
    if (confirm('האם לאפס את כל הודעות הצ\'אט?')) {
      setChatMessages([{
        id: 1,
        type: 'bot',
        message: 'שלום! אני כאן לעזור לך לנהל שינויים בחוגים. תוכל להדביק הודעות מהוואטסאפ או לכתוב שינויים ישירות.',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
      setChatInput('');
      alert('✅ הודעות הצ\'אט אופסו בהצלחה!');
    }
  };

  const resetFamilyData = () => {
    if (confirm('האם לאפס את נתוני המשפחות (כולל משפחת כהן, לוי וכו\')?')) {
      setAvailabilityStatus({});
      setAllFamilies([]); // This will remove "משפחת כהן" and all other families
      setSystemStats(prev => ({
        ...prev,
        totalFamilies: 0,
        totalChildren: 0
      })); // Update statistics
      alert('✅ נתוני המשפחות אופסו בהצלחה! (כולל משפחת כהן)');
    }
  };

  const resetFilters = () => {
    if (confirm('האם לאפס את הגדרות הסינון?')) {
      setWaitingRoomFilters({
        city: '',
        classType: '',
        searchText: '',
        showFullGroups: false
      });
      alert('✅ הגדרות הסינון אופסו בהצלחה!');
    }
  };

  const exportUserData = () => {
    const userData = {
      currentView,
      availability,
      weeklyAvailability,
      childForm,
      classForm,
      waitingRoomFilters,
      chatMessages: chatMessages.slice(1), // Remove default bot message
      isClassManager,
      exportDate: new Date().toLocaleString('he-IL'),
      appVersion: '2.0.0'
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'transport-app-data-' + new Date().toISOString().split('T')[0] + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('📁 הנתונים יוצאו בהצלחה! הקובץ ירד למחשב.');
  };

  const openSupportContact = () => {
    const supportInfo = `🎯 צור קשר עם תמיכה

📧 אימייל: support@transport-app.co.il
📱 טלפון: 03-1234567  
💬 וואטסאפ: 050-1234567

⏰ שעות פעילות:
ראשון-חמישי: 8:00-18:00
שישי: 8:00-12:00

🌐 אתר: www.transport-app.co.il
📍 כתובת: רחוב התחבורה 123, תל אביב

💡 טיפים לפנייה יעילה:
• ציין את מספר הגרסה (2.0.0)
• תאר את הבעיה בפירוט
• צרף צילומי מסך במידת הצורך`;
    
    alert(supportInfo);
    
    // Option to open WhatsApp or email
    if (confirm('האם לפתוח את וואטסאפ לפנייה מהירה?')) {
      window.open('https://wa.me/972501234567?text=שלום, אני צריך עזרה עם אפליקציית ניהול הסעות החוג', '_blank');
    }
  };

  const openPrivacyPolicy = () => {
    const privacyPolicy = `🔒 מדיניות פרטיות - אפליקציית ניהול הסעות החוג

📋 איסוף מידע:
• פרטים אישיים: שם, טלפון, כתובת
• פרטי ילדים: שם, גיל, חוגים  
• העדפות הסעה וזמינות
• היסטורית שימוש באפליקציה

🛡️ שימוש במידע:
• תיאום הסעות בין משפחות
• יצירת קשר עם הורים אחרים
• שיפור שירותי האפליקציה
• שליחת התראות והודעות רלוונטיות

🔐 אבטחת מידע:
• כל המידע מוצפן ומאובטח
• אין שיתוף מידע עם צדדים שלישיים
• גיבוי בטוח של כל הנתונים
• מחיקת מידע לפי בקשת המשתמש

📞 זכויות המשתמש:
• צפייה במידע השמור עליך
• עדכון או תיקון פרטים
• מחיקת המידע (זכות לשכחה)
• ייצוא הנתונים שלך

⚖️ תנאי שימוש:
• השימוש באפליקציה כפוף לחוקי ישראל
• אסור שימוש לרעה במידע של משתמשים אחרים
• החברה שומרת זכות לעדכן תנאים
• צור קשר לשאלות או בקשות

📅 עדכון אחרון: דצמבר 2024
📧 לשאלות: privacy@transport-app.co.il`;
    
    alert(privacyPolicy);
    
    if (confirm('האם לפתוח את מדיניות הפרטיות המלאה באתר?')) {
      window.open('https://transport-app.co.il/privacy', '_blank');
    }
  };

  // פונקציה לחישוב גיל
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // פונקציה לבדיקת יום הולדת היום
  const getTodaysBirthdays = () => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDate = today.getDate();
    
    const birthdays = [];
    
    (currentFamily.children || []).forEach(child => {
      if (child.birthDate) {
        const birth = new Date(child.birthDate);
        if (birth.getMonth() + 1 === todayMonth && birth.getDate() === todayDate) {
          birthdays.push({ name: child.name, isMyChild: true });
        }
      }
    });

    // בדיקה של ילדים מחוגים (לדוגמה - יובל לוי)
    if (todayMonth === 8 && todayDate === 13) {
      birthdays.push({ name: 'יובל לוי', isMyChild: false });
    }

    return birthdays;
  };

  // Chatbot processing function
  const processChatMessage = async (message) => {
    setIsProcessing(true);
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: message,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMessage]);

    setTimeout(() => {
      let botResponse = '';
      let scheduleChangeType = null;
      let requiresNewAvailability = false;

      if (message.includes('חולה') || message.includes('לא יכול') || message.includes('לא יכולה') || message.includes('חירום')) {
        botResponse = '🚨 **זוהתה בקשת חירום!**\n\n' +
          '📞 **פעולה מיידית:** שולח SMS לכל המשפחות בחוג\n' +
          '💬 תוכן ההודעה: ' + message + '\n\n' +
          '⚡ **חיפוש תחליף מהיר:**\n' +
          '• הודעה נשלחה לכל ההורים הזמינים\n' +
          '• בקשה דחופה למציאת תחליף\n\n' +
          '📋 **מה קורה עכשיו:**\n' +
          '1. כל המשפחות מקבלות התראה דחופה\n' +
          '2. המשפחה הראשונה שתענה תהיה התחליף\n' +
          '3. השיבוץ יעודכן אוטומטית ברגע שימצא תחליף\n' +
          '4. כולם יקבלו עדכון על התחליף החדש\n\n' +
          '⏰ **זמן תגובה צפוי:** 5-15 דקות';
        scheduleChangeType = { action: 'emergency_substitute', message: message, description: 'בקשת תחליף חירום' };
        requiresNewAvailability = false;
      } else if (message.includes('ביטול') || message.includes('לא יתקיים')) {
        botResponse = '✅ זוהה ביטול חוג.\n\n' +
          '📋 **שלב הבא:** יש למלא זמינות מחדש\n' +
          'נשלחה בקשה לכל המשפחות למלא זמינות עבור השבוע המעודכן.\n\n' +
          '⏳ **סטטוס מילוי זמינות:**\n' +
          '• משפחת דוד: ✅ מילא\n' +
          '• שאר המשפחות: ⏳ ממתינות\n\n' +
          'השיבוץ החדש יפורסם אוטומטית ברגע שכולם ימלאו זמינות.';
        scheduleChangeType = { action: 'cancel', description: 'ביטול חוג' };
        requiresNewAvailability = true;
      } else {
        botResponse = '✅ קיבלתי את ההודעה. אם זו הודעה מהמאמן שדורשת עדכון השיבוץ, אני יכול לעזור.\n\n' +
          'נושאים שאני יכול לטפל בהם:\n' +
          '• 🚨 **חירום** - הורה/ילד חולה (טיפול מיידי)\n' +
          '• ❌ ביטולי חוגים\n' +
          '• 🕐 שינויי שעות\n' +
          '• 📍 שינויי מיקום\n' +
          '• 🔄 בקשות החלפה רגילות\n' +
          '• 📅 לוחות זמנים חדשים\n\n' +
          'פשוט הדבק את ההודעה מהוואטסאפ והיא תעודכן אוטומטית!';
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        message: botResponse,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        scheduleUpdate: scheduleChangeType,
        requiresAvailability: requiresNewAvailability
      };
      
      setChatMessages(prev => [...prev, botMessage]);
      
      if (requiresNewAvailability && scheduleChangeType) {
        setPendingScheduleChange(scheduleChangeType);
        setAvailabilityStatus({
          'משפחת כהן': false,
          'משפחת לוי': false, 
          'משפחת אברהם': false,
          'משפחת דוד': true,
          'משפחת שלום': false,
          'משפחת חן': false
        });

        const newNotification = {
          id: Date.now() + 2,
          text: 'נדרש מילוי זמינות מחדש: ' + scheduleChangeType.description,
          type: 'warning',
          time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
      
      setIsProcessing(false);
    }, 2000);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      processChatMessage(chatInput.trim());
      setChatInput('');
    }
  };

  // First Time Setup Page - for new users to create their family
  const FirstTimeSetupPage = () => {
    // Use refs instead of state to prevent re-renders and keyboard issues
    const familyNameRef = useRef(null);
    const parent1NameRef = useRef(null);
    const parent1PhoneRef = useRef(null);
    const parent1EmailRef = useRef(null);
    const parent2NameRef = useRef(null);
    const parent2PhoneRef = useRef(null);
    const parent2EmailRef = useRef(null);

    const handleSubmit = (e) => {
      e.preventDefault();
      
      const familyName = familyNameRef.current?.value || '';
      const parent1Name = parent1NameRef.current?.value || '';
      const parent1Phone = parent1PhoneRef.current?.value || '';
      const parent1Email = parent1EmailRef.current?.value || '';
      const parent2Name = parent2NameRef.current?.value || '';
      const parent2Phone = parent2PhoneRef.current?.value || '';
      const parent2Email = parent2EmailRef.current?.value || '';
      
      if (!familyName || !parent1Name || !parent1Phone) {
        alert('אנא מלא את השדות החובה: שם משפחה, שם הורה ראשון וטלפון');
        return;
      }

      // Create the family data structure
      const newFamily = {
        familyName: familyName,
        parents: {
          parent1: {
            name: parent1Name,
            phone: parent1Phone,
            email: parent1Email
          },
          parent2: {
            name: parent2Name,
            phone: parent2Phone,
            email: parent2Email
          }
        },
        children: []
      };

      setCurrentFamily(newFamily);
      alert(`✅ ברוכים הבאים, משפחת ${familyName}!`);
    };

    return React.createElement('div', { className: 'max-w-2xl mx-auto space-y-6 p-4', dir: 'rtl' },
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement('h1', { className: 'text-3xl font-bold text-blue-600 mb-2' }, 'ברוכים הבאים!'),
        React.createElement('p', { className: 'text-gray-600' }, 'בואו נגדיר את המשפחה שלכם')
      ),

      React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-6' },
        // Family Name
        React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
          React.createElement('h3', { className: 'font-medium mb-4 text-blue-800' }, 'פרטי המשפחה'),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'שם משפחה ',
              React.createElement('span', { className: 'text-red-500' }, '*')
            ),
            React.createElement('input', {
              ref: familyNameRef,
              type: 'text',
              placeholder: 'לוי, כהן, אברהם...',
              className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'family-name',
              required: true
            })
          )
        ),

        // Parent 1
        React.createElement('div', { className: 'bg-blue-50 rounded-lg border border-blue-200 p-4' },
          React.createElement('h3', { className: 'font-medium mb-4 text-blue-800' }, 'הורה ראשון'),
          React.createElement('div', { className: 'space-y-3' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                'שם פרטי ',
                React.createElement('span', { className: 'text-red-500' }, '*')
              ),
              React.createElement('input', {
                ref: parent1NameRef,
                type: 'text',
                placeholder: 'יוסי, דוד, משה...',
                className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
                style: { 
                  fontSize: '16px', // Prevent iOS zoom
                  WebkitAppearance: 'none',
                  appearance: 'none'
                },
                autoComplete: 'given-name',
                required: true
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                'מספר טלפון ',
                React.createElement('span', { className: 'text-red-500' }, '*')
              ),
              React.createElement('input', {
                ref: parent1PhoneRef,
                type: 'tel',
                placeholder: '050-123-4567',
                className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
                style: { 
                  fontSize: '16px', // Prevent iOS zoom
                  WebkitAppearance: 'none',
                  appearance: 'none'
                },
                autoComplete: 'tel',
                inputMode: 'tel',
                required: true
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                'כתובת אימייל (רשות)'
              ),
              React.createElement('input', {
                ref: parent1EmailRef,
                type: 'email',
                placeholder: 'yossi@gmail.com',
                className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
                style: { 
                  fontSize: '16px', // Prevent iOS zoom
                  WebkitAppearance: 'none',
                  appearance: 'none'
                },
                autoComplete: 'email'
              })
            )
          )
        ),

        // Parent 2 (optional)
        React.createElement('div', { className: 'bg-pink-50 rounded-lg border border-pink-200 p-4' },
          React.createElement('h3', { className: 'font-medium mb-4 text-pink-800' }, 'הורה שני (רשות)'),
          React.createElement('div', { className: 'space-y-3' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                'שם פרטי'
              ),
              React.createElement('input', {
                ref: parent2NameRef,
                type: 'text',
                placeholder: 'רחל, שרה, מרים...',
                className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
                style: { 
                  fontSize: '16px', // Prevent iOS zoom
                  WebkitAppearance: 'none',
                  appearance: 'none'
                },
                autoComplete: 'given-name'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                'מספר טלפון'
              ),
              React.createElement('input', {
                ref: parent2PhoneRef,
                type: 'tel',
                placeholder: '052-987-6543',
                className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
                style: { 
                  fontSize: '16px', // Prevent iOS zoom
                  WebkitAppearance: 'none',
                  appearance: 'none'
                },
                autoComplete: 'tel',
                inputMode: 'tel'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                'כתובת אימייל'
              ),
              React.createElement('input', {
                ref: parent2EmailRef,
                type: 'email',
                placeholder: 'rachel@gmail.com',
                className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
                style: { 
                  fontSize: '16px', // Prevent iOS zoom
                  WebkitAppearance: 'none',
                  appearance: 'none'
                },
                autoComplete: 'email'
              })
            )
          )
        ),

        // Submit Button
        React.createElement('div', { className: 'text-center' },
          React.createElement('button', {
            type: 'submit',
            className: 'bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium text-lg shadow-lg'
          }, 'צור את המשפחה שלי 🏠')
        )
      )
    );
  };

  // Family Home Page Component
  const FamilyHomePage = () => {
    const todaysBirthdays = getTodaysBirthdays();
    
    // If no family data exists, show setup screen
    if (!currentFamily.familyName) {
      return React.createElement(FirstTimeSetupPage);
    }
    
    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      // Header
      React.createElement('div', { className: 'bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white' },
        React.createElement('h1', { className: 'text-2xl font-bold mb-2' }, 'שלום, ' + currentFamily.familyName + '!'),
        React.createElement('p', { className: 'text-blue-100' }, 'ניהול חוגים וקואורדינציה')
      ),

      // Birthday Messages
      todaysBirthdays.length > 0 && React.createElement('div', { className: 'space-y-2' },
        todaysBirthdays.map((birthday, index) =>
          React.createElement('div', { 
            key: index, 
            className: 'bg-gradient-to-r from-pink-500 to-yellow-500 rounded-xl p-4 text-white' 
          },
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('span', { className: 'text-2xl ml-3' }, '🎉'),
              React.createElement('div', null,
                React.createElement('h3', { className: 'font-bold text-lg' }, 'יום הולדת שמח!'),
                React.createElement('p', { className: 'text-pink-100' }, 
                  birthday.isMyChild ? birthday.name + ' חוגג/ת היום' : birthday.name + ' מהחוג חוגג/ת היום'
                )
              )
            )
          )
        )
      ),

      // Quick Stats
      React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
        React.createElement('div', { className: 'bg-green-50 rounded-lg p-4 text-center border border-green-200' },
          React.createElement('div', { className: 'text-2xl font-bold text-green-600' },
            currentFamily.children?.reduce((total, child) => total + (child.classes?.length || 0), 0) || 0
          ),
          React.createElement('div', { className: 'text-sm text-green-700' }, 'חוגים פעילים')
        ),
        React.createElement('div', { className: 'bg-blue-50 rounded-lg p-4 text-center border border-blue-200' },
          React.createElement('div', { className: 'text-2xl font-bold text-blue-600' }, currentFamily.children?.length || 0),
          React.createElement('div', { className: 'text-sm text-blue-700' }, 'ילדים')
        ),
        React.createElement('div', { className: 'bg-purple-50 rounded-lg p-4 text-center border border-purple-200' },
          React.createElement('div', { className: 'text-2xl font-bold text-purple-600' },
            currentFamily.children?.reduce((total, child) => 
              total + (child.classes?.reduce((classTotal, cls) => classTotal + (cls.myTasks?.length || 0), 0) || 0), 0
            ) || 0
          ),
          React.createElement('div', { className: 'text-sm text-purple-700' }, 'משימות השבוע')
        )
      ),

      // Notifications
      notifications.length > 0 && React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-semibold mb-3 flex items-center' },
          React.createElement(Icon, { name: 'fas fa-bell', className: 'w-5 h-5 ml-2 text-orange-500' }),
          'התראות'
        ),
        notifications.map(notif =>
          React.createElement('div', { 
            key: notif.id, 
            className: 'p-3 rounded-lg mb-2 last:mb-0 ' + (
              notif.type === 'warning' ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'
            )
          },
            React.createElement('div', { className: 'flex justify-between items-start' },
              React.createElement('span', { className: 'text-sm' }, notif.text),
              React.createElement('span', { className: 'text-xs text-gray-500' }, notif.time)
            )
          )
        )
      ),

      // Children and Classes
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-semibold mb-4 flex items-center' },
          React.createElement(Icon, { name: 'fas fa-users', className: 'w-5 h-5 ml-2 text-blue-500' }),
          'הילדים והחוגים שלהם'
        ),
        
        (currentFamily.children || []).map(child => {
          const age = calculateAge(child.birthDate);
          return React.createElement('div', { key: child.id, className: 'mb-6 last:mb-0' },
            React.createElement('div', { className: 'flex items-center justify-between mb-3' },
              React.createElement('h4', { className: 'font-medium text-lg' }, child.name),
              React.createElement('span', { className: 'text-sm text-gray-600' },
                age ? 'גיל ' + age : 'ללא גיל'
              )
            ),
            
            React.createElement('div', { className: 'grid gap-3' },
              child.classes.map(classItem =>
                React.createElement('div', { 
                  key: classItem.id,
                  onClick: () => {
                    setSelectedChild(child);
                    setSelectedClass(classItem);
                    setCurrentView('class-home');
                  },
                  className: 'bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors'
                },
                  React.createElement('div', { className: 'flex justify-between items-start' },
                    React.createElement('div', { className: 'flex-1' },
                      React.createElement('div', { className: 'font-medium text-blue-600' }, classItem.name),
                      React.createElement('div', { className: 'text-sm text-gray-600 mt-1' }, classItem.location),
                      React.createElement('div', { className: 'text-sm text-gray-500' }, classItem.schedule),
                      classItem.myTasks.length > 0 && React.createElement('div', { className: 'text-sm text-green-600 mt-1' },
                        classItem.myTasks.length + ' משימות השבוע'
                      )
                    ),
                    React.createElement(Icon, { name: 'fas fa-arrow-left', className: 'w-5 h-5 text-gray-400' })
                  )
                )
              ),
              
              React.createElement('button', { 
                onClick: () => setCurrentView('class-add-edit'),
                className: 'border border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:bg-gray-50 transition-colors'
              },
                React.createElement(Icon, { name: 'fas fa-plus', className: 'w-5 h-5 mx-auto mb-1' }),
                React.createElement('div', { className: 'text-sm' }, 'הוסף חוג ל' + child.name)
              )
            )
          );
        }),
        
        React.createElement('button', { 
          onClick: () => setCurrentView('add-child'),
          className: 'w-full border border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:bg-gray-50 transition-colors mt-4'
        },
          React.createElement(Icon, { name: 'fas fa-plus', className: 'w-5 h-5 mx-auto mb-1' }),
          React.createElement('div', { className: 'text-sm' }, 'הוסף ילד למשפחה')
        )
      ),

      // Quick Access to Waiting Room
      React.createElement('div', { className: 'bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 text-white' },
        React.createElement('div', { className: 'flex items-center mb-3' },
          React.createElement('span', { className: 'text-2xl ml-3' }, '🔍'),
          React.createElement('div', null,
            React.createElement('h3', { className: 'font-bold text-lg' }, 'מחפש קבוצת הסעות חדשה?'),
            React.createElement('p', { className: 'text-green-100 text-sm' }, 'מצא הורים לחוגים חדשים או צור קבוצה משלך')
          )
        ),
        React.createElement('button', { 
          onClick: () => setCurrentView('waiting-room'),
          className: 'bg-white bg-opacity-20 backdrop-blur-sm text-white border border-white border-opacity-30 rounded-lg px-6 py-3 font-medium hover:bg-opacity-30 transition-all'
        },
          '🚀 כנס לחדר המתנה'
        )
      ),

      // Admin Access (hidden button for admin)
      React.createElement('div', { className: 'text-center' },
        React.createElement('button', {
          onClick: () => setShowAdminLogin(true),
          className: 'text-xs text-gray-400 hover:text-gray-600 transition-colors',
          title: 'כניסה למנהל מערכת'
        }, 'ניהול מערכת')
      )
    );
  };

  // Class Home Page Component
  const ClassHomePage = () => {
    if (!selectedClass || !selectedChild) return null;

    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      // Header with back button
      React.createElement('div', { className: 'flex items-center mb-4' },
        React.createElement('button', { 
          onClick: () => setCurrentView('family-home'),
          className: 'ml-3 p-2 hover:bg-gray-100 rounded-lg'
        },
          React.createElement(Icon, { name: 'fas fa-home' })
        ),
        React.createElement('div', { className: 'flex-1' },
          React.createElement('h2', { className: 'text-xl font-bold' }, selectedClass.name),
          React.createElement('p', { className: 'text-gray-600' }, selectedChild.name + ' • ' + selectedClass.location)
        )
      ),

      // Class Info
      React.createElement('div', { className: 'bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white' },
        React.createElement('h3', { className: 'text-lg font-bold mb-2' }, selectedClass.name),
        React.createElement('div', { className: 'space-y-1 text-green-100' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement(Icon, { name: 'fas fa-map-marker-alt', className: 'w-4 h-4 ml-2' }),
            React.createElement('span', null, selectedClass.address)
          ),
          React.createElement('div', { className: 'flex items-center' },
            React.createElement(Icon, { name: 'fas fa-clock', className: 'w-4 h-4 ml-2' }),
            React.createElement('span', null, selectedClass.schedule)
          ),
          React.createElement('div', { className: 'flex items-center' },
            React.createElement(Icon, { name: 'fas fa-phone', className: 'w-4 h-4 ml-2' }),
            React.createElement('span', null, selectedClass.coach)
          )
        )
      ),

      // Quick Actions
      React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
        React.createElement('button', { 
          onClick: () => setCurrentView('availability'),
          className: 'bg-blue-600 text-white rounded-lg p-4 hover:bg-blue-700 transition-colors'
        },
          React.createElement(Icon, { name: 'fas fa-clock', className: 'w-6 h-6 mx-auto mb-2' }),
          React.createElement('span', { className: 'block text-sm font-medium' }, 'מלא זמינות')
        ),
        React.createElement('button', { 
          onClick: () => setCurrentView('class-families'),
          className: 'bg-purple-600 text-white rounded-lg p-4 hover:bg-purple-700 transition-colors'
        },
          React.createElement(Icon, { name: 'fas fa-users', className: 'w-6 h-6 mx-auto mb-2' }),
          React.createElement('span', { className: 'block text-sm font-medium' }, 'משפחות בחוג')
        )
      )
    );
  };

  // ChatBot Page Component
  const ChatBotPage = () => (
    React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('h2', { className: 'text-xl font-bold' }, 'עוזר החוגים'),
      
      React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-center mb-2' },
          React.createElement('div', { className: 'w-3 h-3 bg-green-400 rounded-full ml-2' }),
          React.createElement('span', { className: 'font-medium text-blue-800' }, 'עוזר פעיל')
        ),
        React.createElement('p', { className: 'text-sm text-blue-700' },
          'שלח הודעות מהמאמן או כתוב שינויים ישירות. העוזר יעדכן את השיבוץ השבועי אוטומטית!'
        )
      ),

      // Chat Messages
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200' },
        React.createElement('div', { className: 'h-80 overflow-y-auto p-4 space-y-4' },
          chatMessages.map(msg =>
            React.createElement('div', { 
              key: msg.id, 
              className: 'flex ' + (msg.type === 'user' ? 'justify-start' : 'justify-end')
            },
              React.createElement('div', { 
                className: 'max-w-sm p-3 rounded-lg ' + (
                  msg.type === 'user' 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-blue-100 text-blue-800'
                )
              },
                React.createElement('div', { className: 'whitespace-pre-wrap text-sm' }, msg.message),
                React.createElement('div', { className: 'text-xs text-gray-500 mt-2' }, msg.timestamp),
                msg.scheduleUpdate && React.createElement('div', { 
                  className: 'mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700'
                },
                  '✅ השיבוץ עודכן בהתאם'
                )
              )
            )
          ),
          
          isProcessing && React.createElement('div', { className: 'flex justify-end' },
            React.createElement('div', { className: 'bg-blue-100 text-blue-800 p-3 rounded-lg' },
              React.createElement('div', { className: 'flex items-center text-sm' },
                React.createElement('div', { className: 'animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full ml-2' }),
                'מעבד הודעה...'
              )
            )
          )
        ),

        // Chat Input
        React.createElement('div', { className: 'border-t border-gray-200 p-4' },
          React.createElement('form', { onSubmit: handleChatSubmit, className: 'space-y-3' },
            React.createElement('div', { className: 'flex space-x-2 space-x-reverse' },
              React.createElement('input', {
                type: 'text',
                value: chatInput,
                onChange: (e) => setChatInput(e.target.value),
                placeholder: 'הדבק הודעה מוואטסאפ או כתוב שינוי...',
                className: 'flex-1 p-3 border border-gray-300 rounded-lg text-right',
                style: { fontSize: '16px' }, // Prevent iOS zoom
                disabled: isProcessing
              }),
              React.createElement('button', {
                type: 'submit',
                disabled: isProcessing || !chatInput.trim(),
                className: 'bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium'
              },
                'שלח'
              )
            )
          ),
          
          // Quick Actions
          React.createElement('div', { className: 'mt-3 flex flex-wrap gap-2' },
            React.createElement('button', {
              onClick: () => setChatInput('הילד שלי חולה לא יכול להגיע לחוג היום'),
              className: 'px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200'
            },
              '🚨 חירום - ילד חולה'
            ),
            React.createElement('button', {
              onClick: () => setChatInput('אני חולה לא יכול להסיע היום'),
              className: 'px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200'
            },
              '🚨 חירום - הורה חולה'
            ),
            React.createElement('button', {
              onClick: () => setChatInput('ביטול חוג ביום ראשון'),
              className: 'px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200'
            },
              'ביטול חוג'
            )
          )
        )
      ),

      // Usage Tips
      React.createElement('div', { className: 'bg-green-50 border border-green-200 rounded-lg p-4' },
        React.createElement('h3', { className: 'font-medium text-green-800 mb-2' }, '💡 טיפים לשימוש:'),
        React.createElement('ul', { className: 'text-sm text-green-700 space-y-1' },
          React.createElement('li', null, '• העתק והדבק הודעות ישירות מקבוצת הוואטסאפ'),
          React.createElement('li', null, '• כתוב שינויים בעברית פשוטה'),
          React.createElement('li', null, '• העוזר יזהה אוטומטית ביטולים, שינויי שעות ובקשות החלפה'),
          React.createElement('li', null, '• כל עדכון ישלח התראה למשפחות הרלוונטיות')
        )
      )
    )
  );

  // Navigation Component
  const Navigation = () => {
    const getNavItems = () => {
      if (isAdminMode) {
        return [
          { id: 'admin-dashboard', icon: 'fas fa-chart-bar', label: 'לוח מחוונים' },
          { id: 'admin-families', icon: 'fas fa-users', label: 'משפחות' },
          { id: 'admin-classes', icon: 'fas fa-calendar', label: 'חוגים' },
          { id: 'admin-reports', icon: 'fas fa-clipboard-list', label: 'דוחות' }
        ];
      } else if (currentView === 'family-home' || currentView === 'chatbot' || currentView === 'settings' || currentView === 'user-guide' || currentView === 'waiting-room' || currentView === 'create-group') {
        return [
          { id: 'family-home', icon: 'fas fa-home', label: 'בית' },
          { id: 'waiting-room', icon: 'fas fa-users', label: 'חדר המתנה' },
          { id: 'chatbot', icon: 'fas fa-bell', label: 'עוזר החוגים' },
          { id: 'settings', icon: 'fas fa-cog', label: 'הגדרות' }
        ];
      } else {
        return [
          { id: 'family-home', icon: 'fas fa-home', label: 'בית המשפחה' },
          { id: 'class-home', icon: 'fas fa-calendar', label: 'החוג' },
          { id: 'availability', icon: 'fas fa-clock', label: 'זמינות' },
          { id: 'class-families', icon: 'fas fa-users', label: 'משפחות' }
        ];
      }
    };

    return React.createElement('div', { 
      className: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2', 
      dir: 'rtl' 
    },
      React.createElement('div', { className: 'flex justify-around' },
        getNavItems().map(item =>
          React.createElement('button', {
            key: item.id,
            onClick: () => setCurrentView(item.id),
            className: 'flex flex-col items-center py-2 px-3 rounded-lg transition-colors ' + (
              currentView === item.id 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            )
          },
            React.createElement(Icon, { name: item.icon, className: 'w-5 h-5 mb-1' }),
            React.createElement('span', { className: 'text-xs' }, item.label)
          )
        )
      )
    );
  };

  // Settings Page Component
  const SettingsPage = () => {
    // Use refs instead of controlled inputs to prevent keyboard issues
    const familyNameRef = useRef(null);
    const parent1NameRef = useRef(null);
    const parent1PhoneRef = useRef(null);
    const parent1EmailRef = useRef(null);
    const parent2NameRef = useRef(null);
    const parent2PhoneRef = useRef(null);
    const parent2EmailRef = useRef(null);

    // Initialize default values when component mounts
    useEffect(() => {
      if (familyNameRef.current) familyNameRef.current.value = currentFamily.familyName || '';
      if (parent1NameRef.current) parent1NameRef.current.value = currentFamily.parents?.parent1?.name || '';
      if (parent1PhoneRef.current) parent1PhoneRef.current.value = currentFamily.parents?.parent1?.phone || '';
      if (parent1EmailRef.current) parent1EmailRef.current.value = currentFamily.parents?.parent1?.email || '';
      if (parent2NameRef.current) parent2NameRef.current.value = currentFamily.parents?.parent2?.name || '';
      if (parent2PhoneRef.current) parent2PhoneRef.current.value = currentFamily.parents?.parent2?.phone || '';
      if (parent2EmailRef.current) parent2EmailRef.current.value = currentFamily.parents?.parent2?.email || '';
    }, [currentFamily]);

    return (
    React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('h2', { className: 'text-xl font-bold' }, 'הגדרות'),
      
      // Profile Section
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4 flex items-center' },
          React.createElement(Icon, { name: 'fas fa-users', className: 'w-5 h-5 ml-2 text-blue-500' }),
          'פרטים אישיים'
        ),
        React.createElement('div', { className: 'space-y-4' },
          // Family Name
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'שם משפחה ',
              React.createElement('span', { className: 'text-red-500' }, '*')
            ),
            React.createElement('input', { 
              ref: familyNameRef,
              type: 'text', 
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'family-name',
              required: true
            })
          ),

          // Parent 1
          React.createElement('div', { className: 'bg-blue-50 rounded-lg p-3 border border-blue-200' },
            React.createElement('h4', { className: 'font-medium text-blue-800 mb-3' }, 'הורה 1'),
            React.createElement('div', { className: 'space-y-3' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                  'שם פרטי ',
                  React.createElement('span', { className: 'text-red-500' }, '*')
                ),
                React.createElement('input', { 
                  ref: parent1NameRef,
                  type: 'text', 
                  placeholder: 'יוסי',
                  className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
                  style: { 
                    fontSize: '16px', // Prevent iOS zoom
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  },
                  autoComplete: 'given-name',
                  required: true
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                  'טלפון ',
                  React.createElement('span', { className: 'text-red-500' }, '*')
                ),
                React.createElement('input', { 
                  type: 'tel', 
                  placeholder: '050-123-4567',
                  defaultValue: currentFamily.parents.parent1.phone,
                  className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
                  required: true
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                  'אימייל (רשות)'
                ),
                React.createElement('input', { 
                  type: 'email', 
                  placeholder: 'yossi@gmail.com',
                  defaultValue: currentFamily.parents.parent1.email,
                  className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
                })
              )
            )
          ),

          // Parent 2
          React.createElement('div', { className: 'bg-pink-50 rounded-lg p-3 border border-pink-200' },
            React.createElement('h4', { className: 'font-medium text-pink-800 mb-3' }, 'הורה 2'),
            React.createElement('div', { className: 'space-y-3' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                  'שם פרטי ',
                  React.createElement('span', { className: 'text-red-500' }, '*')
                ),
                React.createElement('input', { 
                  type: 'text', 
                  placeholder: 'רחל',
                  defaultValue: currentFamily.parents.parent2.name,
                  className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
                  required: true
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                  'טלפון ',
                  React.createElement('span', { className: 'text-red-500' }, '*')
                ),
                React.createElement('input', { 
                  type: 'tel', 
                  placeholder: '052-987-6543',
                  defaultValue: currentFamily.parents.parent2.phone,
                  className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
                  required: true
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                  'אימייל (רשות)'
                ),
                React.createElement('input', { 
                  type: 'email', 
                  placeholder: 'rachel@gmail.com',
                  defaultValue: currentFamily.parents.parent2.email,
                  className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
                })
              )
            )
          )
        )
      ),

      // Children Section
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4' }, 'ילדים במשפחה'),
        React.createElement('div', { className: 'space-y-4' },
          (currentFamily.children || []).map((child, index) => 
            React.createElement('div', { key: child.id, className: 'bg-gray-50 rounded-lg p-4 border border-gray-200' },
              React.createElement('div', { className: 'flex justify-between items-center mb-3' },
                React.createElement('h4', { className: 'font-medium' }, 'ילד ' + (index + 1)),
                React.createElement('button', { className: 'text-red-600 text-sm hover:text-red-800' }, 'הסר')
              ),
              
              React.createElement('div', { className: 'space-y-3' },
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                    'שם הילד ',
                    React.createElement('span', { className: 'text-red-500' }, '*')
                  ),
                  React.createElement('input', { 
                    type: 'text', 
                    value: child.name,
                    className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
                    required: true
                  })
                ),
                
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                    'טלפון הילד (רשות)'
                  ),
                  React.createElement('input', { 
                    type: 'tel', 
                    value: child.phone || '',
                    className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
                  })
                ),
                
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                    'תאריך לידה (רשות)'
                  ),
                  React.createElement('input', { 
                    type: 'date', 
                    value: child.birthDate || '',
                    className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
                  }),
                  child.birthDate && React.createElement('div', { className: 'text-xs text-gray-500 mt-1' },
                    'גיל: ' + calculateAge(child.birthDate) + ' שנים'
                  )
                ),

                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                    'כתובת הבית ',
                    React.createElement('span', { className: 'text-red-500' }, '*')
                  ),
                  React.createElement('input', { 
                    type: 'text', 
                    value: child.address || '',
                    className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
                    required: true
                  })
                )
              ),

              // Child's Classes
              React.createElement('div', { className: 'mt-4' },
                React.createElement('h5', { className: 'font-medium text-sm mb-2' }, 'חוגים:'),
                React.createElement('div', { className: 'space-y-1 text-sm text-gray-600' },
                  child.classes.map(cls =>
                    React.createElement('div', { key: cls.id, className: 'flex justify-between items-center' },
                      React.createElement('span', null, cls.name + ' - ' + cls.location),
                      React.createElement('button', { 
                        onClick: () => alert('עריכת חוג: ' + cls.name),
                        className: 'text-blue-600 hover:text-blue-800'
                      }, 'ערוך')
                    )
                  )
                ),
                React.createElement('button', { 
                  onClick: () => setCurrentView('class-add-edit'),
                  className: 'mt-2 text-blue-600 text-sm hover:text-blue-800'
                }, '+ הוסף חוג')
              )
            )
          )
        ),
        
        React.createElement('button', { 
          onClick: () => setCurrentView('add-child'),
          className: 'w-full mt-4 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors'
        }, '+ הוסף ילד למשפחה')
      ),

      // Notifications Settings
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4 flex items-center' },
          React.createElement(Icon, { name: 'fas fa-bell', className: 'w-5 h-5 ml-2 text-yellow-500' }),
          'הגדרות התראות'
        ),
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('span', { className: 'text-sm' }, 'תזכורת למילוי זמינות'),
            React.createElement('label', { className: 'relative inline-flex items-center cursor-pointer' },
              React.createElement('input', { type: 'checkbox', className: 'sr-only peer', defaultChecked: true }),
              React.createElement('div', { 
                className: 'w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600'
              })
            )
          ),
          
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('span', { className: 'text-sm' }, 'התראה על שיבוץ חדש'),
            React.createElement('label', { className: 'relative inline-flex items-center cursor-pointer' },
              React.createElement('input', { type: 'checkbox', className: 'sr-only peer', defaultChecked: true }),
              React.createElement('div', { 
                className: 'w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600'
              })
            )
          ),
          
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('span', { className: 'text-sm' }, 'תזכורת נסיעה'),
            React.createElement('label', { className: 'relative inline-flex items-center cursor-pointer' },
              React.createElement('input', { type: 'checkbox', className: 'sr-only peer', defaultChecked: true }),
              React.createElement('div', { 
                className: 'w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600'
              })
            )
          )
        )
      ),

      // App Settings
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4' }, 'הגדרות כלליות'),
        React.createElement('div', { className: 'space-y-3' },
          React.createElement('button', { 
            onClick: () => setCurrentView('user-guide'),
            className: 'w-full text-right p-3 hover:bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between'
          },
            React.createElement('span', null, '📖 מדריך למשתמש'),
            React.createElement('span', { className: 'text-blue-600' }, '←')
          ),
          React.createElement('button', { 
            onClick: () => exportUserData(),
            className: 'w-full text-right p-3 hover:bg-gray-50 rounded-lg border border-gray-200'
          }, 'ייצוא נתונים'),
          React.createElement('button', { 
            onClick: () => openSupportContact(),
            className: 'w-full text-right p-3 hover:bg-gray-50 rounded-lg border border-gray-200'
          }, 'צור קשר עם תמיכה'),
          React.createElement('button', { 
            onClick: () => openPrivacyPolicy(),
            className: 'w-full text-right p-3 hover:bg-gray-50 rounded-lg border border-gray-200'
          }, 'מדיניות פרטיות')
        )
      ),

      // Reset Data Section
      React.createElement('div', { className: 'bg-red-50 border border-red-200 rounded-lg p-4' },
        React.createElement('h3', { className: 'font-medium mb-3 text-red-800' }, '⚠️ איפוס נתונים'),
        React.createElement('p', { className: 'text-red-700 text-sm mb-4' },
          'בחר מה לאפס: הכל, רק חוגים, רק זמינות, רק משפחות ועוד אפשרויות'
        ),
        React.createElement('button', { 
          onClick: () => showDataResetOptions(),
          className: 'w-full bg-red-600 text-white rounded-lg py-3 font-medium hover:bg-red-700'
        }, '🎯 בחר מה לאפס')
      ),

      React.createElement('button', { 
        onClick: () => alert('השינויים נשמרו בהצלחה!'),
        className: 'w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700'
      }, 'שמור שינויים'),

      React.createElement('div', { className: 'text-center text-sm text-gray-500' },
        'גרסה 2.0.0 • אפליקציית הסעות חוג'
      )
    )
    );
  };

  const WaitingRoomPage = () => {
    const cities = [...new Set(availableClasses.map(c => c.city))];
    const classTypes = [...new Set(availableClasses.map(c => c.name))];
    
    const filteredClasses = availableClasses.filter(classItem => {
      const matchesCity = !waitingRoomFilters.city || classItem.city === waitingRoomFilters.city;
      const matchesType = !waitingRoomFilters.classType || classItem.name === waitingRoomFilters.classType;
      const matchesSearch = !waitingRoomFilters.searchText || 
        classItem.name.includes(waitingRoomFilters.searchText) ||
        classItem.coach.includes(waitingRoomFilters.searchText) ||
        classItem.location.includes(waitingRoomFilters.searchText) ||
        classItem.id.includes(waitingRoomFilters.searchText) ||
        classItem.description.includes(waitingRoomFilters.searchText);
      const matchesFullFilter = waitingRoomFilters.showFullGroups || classItem.currentMembers < classItem.maxMembers;
      
      return matchesCity && matchesType && matchesSearch && matchesFullFilter;
    });

    const joinGroup = (classId) => {
      const classItem = availableClasses.find(c => c.id === classId);
      if (!classItem) {
        alert('שגיאה: חוג לא נמצא.');
        return;
      }

      // Check if class is full
      if (classItem.currentMembers >= classItem.maxMembers) {
        alert('מצטער, הקבוצה מלאה. תוכל להתקשר למנהל לבירור אפשרויות נוספות.');
        return;
      }

      // Check if user has a family profile
      if (!currentFamily.familyName && allFamilies.length === 0) {
        const shouldCreateFamily = confirm('כדי להצטרף לחוג, תחילה צריך ליצור פרופיל משפחה. האם לעבור ליצירת פרופיל משפחה?');
        if (shouldCreateFamily) {
          setCurrentView('add-child');
          return;
        } else {
          return;
        }
      }

      // Get user family
      let userFamily = null;
      if (allFamilies.length > 0) {
        userFamily = allFamilies[0]; // First family as current family
      } else if (currentFamily.familyName) {
        userFamily = createNewFamily(currentFamily);
      }

      if (!userFamily) {
        alert('שגיאה: לא נמצאה משפחה. אנא צור פרופיל משפחה תחילה.');
        return;
      }

      // Check if family is already a member
      if (classItem.members && classItem.members.includes(userFamily.id)) {
        alert('המשפחה שלך כבר חברה בחוג זה.');
        return;
      }

      // Add family to class
      addFamilyToClass(classId, userFamily.id);

      const updatedClass = getClassById(classId);
      alert(`🎉 הצטרפת בהצלחה לחוג "${classItem.name}"!
      
👨‍👩‍👧‍👦 חברים בחוג: ${updatedClass.currentMembers}/${updatedClass.maxMembers}
📍 מיקום: ${classItem.location}
📞 מנהל: ${classItem.manager}

המנהל יצור איתך קשר בהקדם לתיאום פרטים נוספים.`);
    };

    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-xl font-bold' }, '🔍 חדר המתנה'),
        React.createElement('button', { 
          onClick: () => setCurrentView('create-group'),
          className: 'bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700'
        },
          '+ צור קבוצה חדשה'
        )
      ),

      React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-center mb-2' },
          React.createElement('span', { className: 'text-2xl ml-3' }, '👋'),
          React.createElement('div', null,
            React.createElement('h3', { className: 'font-bold text-blue-800' }, 'מחפש קבוצת הסעות?'),
            React.createElement('p', { className: 'text-blue-700 text-sm' },
              'כאן תמצא קבוצות הסעה פתוחות לחוגים שונים באזור שלך'
            )
          )
        )
      ),

      // Filters
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4' }, '🔍 סינון וחיפוש'),
        
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'עיר'),
            React.createElement('select', {
              value: waitingRoomFilters.city,
              onChange: (e) => setWaitingRoomFilters(prev => ({ ...prev, city: e.target.value })),
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
            },
              React.createElement('option', { value: '' }, 'כל הערים'),
              cities.map(city => React.createElement('option', { key: city, value: city }, city))
            )
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'סוג חוג'),
            React.createElement('select', {
              value: waitingRoomFilters.classType,
              onChange: (e) => setWaitingRoomFilters(prev => ({ ...prev, classType: e.target.value })),
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
            },
              React.createElement('option', { value: '' }, 'כל החוגים'),
              classTypes.map(type => React.createElement('option', { key: type, value: type }, type))
            )
          )
        ),

        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'חיפוש חופשי'),
          React.createElement('input', {
            type: 'text',
            value: waitingRoomFilters.searchText,
            onChange: (e) => setWaitingRoomFilters(prev => ({ ...prev, searchText: e.target.value })),
            placeholder: 'חפש לפי שם חוג, מאמן, מיקום או מספר חוג...',
            className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
          })
        ),

        React.createElement('div', { className: 'flex items-center' },
          React.createElement('input', {
            type: 'checkbox',
            id: 'showFull',
            checked: waitingRoomFilters.showFullGroups,
            onChange: (e) => setWaitingRoomFilters(prev => ({ ...prev, showFullGroups: e.target.checked })),
            className: 'ml-2'
          }),
          React.createElement('label', { htmlFor: 'showFull', className: 'text-sm' }, 'הצג גם קבוצות מלאות')
        )
      ),

      // Results
      React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'flex justify-between items-center' },
          React.createElement('h3', { className: 'font-medium' }, 'תוצאות חיפוש'),
          React.createElement('span', { className: 'text-sm text-gray-600' }, filteredClasses.length + ' חוגים נמצאו')
        ),

        filteredClasses.map(classItem =>
          React.createElement('div', { key: classItem.id, className: 'bg-white rounded-lg border border-gray-200 p-4' },
            React.createElement('div', { className: 'flex justify-between items-start mb-3' },
              React.createElement('div', { className: 'flex-1' },
                React.createElement('div', { className: 'flex items-center mb-2' },
                  React.createElement('h4', { className: 'font-bold text-lg text-blue-600' }, classItem.name),
                  React.createElement('span', { 
                    className: 'bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs mr-2'
                  }, '#' + classItem.id),
                  React.createElement('span', { 
                    className: 'px-2 py-1 rounded-full text-xs ' + (
                      classItem.currentMembers < classItem.maxMembers 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    )
                  }, classItem.currentMembers + '/' + classItem.maxMembers + ' מקומות')
                ),
                
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2' },
                  React.createElement('div', null, '📍 ' + classItem.location + ', ' + classItem.city),
                  React.createElement('div', null, '🕐 ' + classItem.schedule),
                  React.createElement('div', null, '👨‍🏫 מאמן: ' + classItem.coach),
                  React.createElement('div', null, '👶 גילאים: ' + classItem.ageGroup)
                ),
                
                React.createElement('p', { className: 'text-sm text-gray-700 mb-3' }, classItem.description),
                
                React.createElement('div', { className: 'bg-gray-50 rounded p-2 text-sm' },
                  React.createElement('strong', null, 'מנהל הקבוצה: '), classItem.manager
                )
              )
            ),

            React.createElement('div', { className: 'flex space-x-2 space-x-reverse' },
              classItem.currentMembers < classItem.maxMembers ? (
                React.createElement('button', {
                  onClick: () => joinGroup(classItem.id),
                  className: 'flex-1 bg-blue-600 text-white py-3 px-2 rounded-lg hover:bg-blue-700 text-sm font-medium min-h-[48px] leading-tight'
                }, '🤝 בקש להצטרף')
              ) : (
                React.createElement('button', {
                  disabled: true,
                  className: 'flex-1 bg-gray-300 text-gray-500 py-2 px-4 rounded-lg text-sm font-medium cursor-not-allowed'
                }, '🚫 קבוצה מלאה')
              ),
              
              React.createElement('button', {
                onClick: () => alert('מתקשר ל' + classItem.manager + ' - ' + classItem.managerPhone),
                className: 'px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm'
              }, '📞 התקשר למנהל'),
              
              React.createElement('button', {
                onClick: () => alert('נווט אל ' + classItem.address),
                className: 'px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm'
              }, '🗺️ מיקום')
            )
          )
        ),

        filteredClasses.length === 0 && React.createElement('div', { className: 'text-center py-8' },
          React.createElement('div', { className: 'text-4xl mb-4' }, '🔍'),
          React.createElement('h3', { className: 'text-lg font-medium text-gray-600 mb-2' }, 'לא נמצאו חוגים'),
          React.createElement('p', { className: 'text-gray-500 mb-4' }, 'נסה לשנות את קריטריוני החיפוש או צור קבוצה חדשה'),
          React.createElement('button', { 
            onClick: () => setCurrentView('create-group'),
            className: 'bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700'
          }, '+ צור קבוצה חדשה')
        )
      )
    );
  };

  // Create Group Component
  const CreateGroupPage = () => {
    const [newGroupForm, setNewGroupForm] = useState({
      name: '',
      city: '',
      location: '',
      address: '',
      coach: '',
      coachPhone: '',
      schedule: '',
      ageGroup: '',
      maxMembers: 8,
      description: ''
    });

    const handleCreateGroup = () => {
      if (!newGroupForm.name || !newGroupForm.city || !newGroupForm.location) {
        alert('אנא מלא את השדות החובה');
        return;
      }

      // Check if user has a family profile, if not - create one first
      if (!currentFamily.familyName && allFamilies.length === 0) {
        const shouldCreateFamily = confirm('כדי ליצור חוג חדש, תחילה צריך ליצור פרופיל משפחה. האם לעבור ליצירת פרופיל משפחה?');
        if (shouldCreateFamily) {
          setCurrentView('add-child'); // This will prompt family creation
          return;
        } else {
          return;
        }
      }

      // Get current user family (first family if exists, or prompt to create)
      let userFamily = allFamilies.length > 0 ? allFamilies[0] : null;
      if (!userFamily && currentFamily.familyName) {
        userFamily = createNewFamily(currentFamily);
      }

      if (!userFamily) {
        alert('שגיאה: לא נמצאה משפחה. אנא צור פרופיל משפחה תחילה.');
        return;
      }

      // Create the new class with user family as manager
      const newClass = createNewClass(newGroupForm, userFamily);
      
      alert(`קבוצה חדשה נוצרה בהצלחה! 
      
🎯 מספר חוג: ${newClass.id}
👑 מנהל החוג: ${userFamily.name}
👨‍👩‍👧‍👦 חברים: 1/${newClass.maxMembers}

כעת תוכל להוסיף משפחות נוספות לחוג או להעביר ניהול למשפחה אחרת.`);
      
      setCurrentView('waiting-room');
    };

    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-xl font-bold' }, '+ צור קבוצת הסעות חדשה'),
        React.createElement('button', { 
          onClick: () => setCurrentView('waiting-room'),
          className: 'text-gray-600 hover:text-gray-800'
        }, 'ביטול')
      ),

      React.createElement('div', { className: 'bg-green-50 border border-green-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-center mb-2' },
          React.createElement('span', { className: 'text-2xl ml-3' }, '🚀'),
          React.createElement('div', null,
            React.createElement('h3', { className: 'font-bold text-green-800' }, 'התחל קבוצת הסעות חדשה!'),
            React.createElement('p', { className: 'text-green-700 text-sm' },
              'מלא את פרטי החוג והקבוצה תופיע בחדר המתנה להורים אחרים'
            )
          )
        )
      ),

      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4' }, 'פרטי החוג'),
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'שם החוג ',
              React.createElement('span', { className: 'text-red-500' }, '*')
            ),
            React.createElement('input', {
              type: 'text',
              value: newGroupForm.name,
              onChange: (e) => setNewGroupForm(prev => ({ ...prev, name: e.target.value })),
              placeholder: 'כדורסל, שחייה, ריקוד...',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              required: true
            })
          ),

          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                'עיר ',
                React.createElement('span', { className: 'text-red-500' }, '*')
              ),
              React.createElement('input', {
                type: 'text',
                value: newGroupForm.city,
                onChange: (e) => setNewGroupForm(prev => ({ ...prev, city: e.target.value })),
                placeholder: 'תל אביב, רמת גן...',
                className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
                required: true
              })
            ),

            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'גילאים'),
              React.createElement('input', {
                type: 'text',
                value: newGroupForm.ageGroup,
                onChange: (e) => setNewGroupForm(prev => ({ ...prev, ageGroup: e.target.value })),
                placeholder: '8-12, 10-14...',
                className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
              })
            )
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'מיקום החוג ',
              React.createElement('span', { className: 'text-red-500' }, '*')
            ),
            React.createElement('input', {
              type: 'text',
              value: newGroupForm.location,
              onChange: (e) => setNewGroupForm(prev => ({ ...prev, location: e.target.value })),
              placeholder: 'בית ספר אילון, בריכת העיר...',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              required: true
            })
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'כתובת מדויקת'),
            React.createElement('input', {
              type: 'text',
              value: newGroupForm.address,
              onChange: (e) => setNewGroupForm(prev => ({ ...prev, address: e.target.value })),
              placeholder: 'רח׳ הרצל 45, תל אביב',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
            })
          ),

          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'מאמן'),
              React.createElement('input', {
                type: 'text',
                value: newGroupForm.coach,
                onChange: (e) => setNewGroupForm(prev => ({ ...prev, coach: e.target.value })),
                placeholder: 'דוד כהן',
                className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
              })
            ),

            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'טלפון מאמן'),
              React.createElement('input', {
                type: 'tel',
                value: newGroupForm.coachPhone,
                onChange: (e) => setNewGroupForm(prev => ({ ...prev, coachPhone: e.target.value })),
                placeholder: '052-987-6543',
                className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
              })
            )
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'לוח זמנים'),
            React.createElement('input', {
              type: 'text',
              value: newGroupForm.schedule,
              onChange: (e) => setNewGroupForm(prev => ({ ...prev, schedule: e.target.value })),
              placeholder: 'ראשון, שלישי, חמישי 16:00-17:30',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
            })
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'מספר משתתפים מקסימלי'
            ),
            React.createElement('input', {
              type: 'number',
              min: '2',
              max: '20',
              value: newGroupForm.maxMembers,
              onChange: (e) => setNewGroupForm(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 2 })),
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
            }),
            newGroupForm.maxMembers > 4 && React.createElement('div', { 
              className: 'mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800' 
            },
              React.createElement('div', { className: 'flex items-center' },
                React.createElement('span', { className: 'text-yellow-600 ml-1' }, '⚠️'),
                React.createElement('span', null, 'שים לב: ודא שגודל הרכב מתאים לכמות הנוסעים (' + newGroupForm.maxMembers + ' ילדים + נהג)')
              )
            )
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'תיאור החוג'),
            React.createElement('textarea', {
              value: newGroupForm.description,
              onChange: (e) => setNewGroupForm(prev => ({ ...prev, description: e.target.value })),
              placeholder: 'תאר את החוג, האווירה, מה מיוחד בו...',
              rows: 3,
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
            })
          )
        )
      ),

      React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
        React.createElement('h3', { className: 'font-medium text-blue-800 mb-2' }, 'אתה תהיה מנהל הקבוצה'),
        React.createElement('p', { className: 'text-sm text-blue-700' },
          'כמנהל הקבוצה, תוכל לאשר הצטרפות של הורים חדשים ולנהל את התיאום.'
        )
      ),

      React.createElement('div', { className: 'flex space-x-4 space-x-reverse' },
        React.createElement('button', {
          onClick: handleCreateGroup,
          className: 'flex-1 bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700'
        }, '🚀 צור קבוצה'),
        React.createElement('button', {
          onClick: () => setCurrentView('waiting-room'),
          className: 'flex-1 bg-gray-200 text-gray-700 rounded-lg py-3 font-medium hover:bg-gray-300'
        }, 'ביטול')
      )
    );
  };

  // Admin Login Component
  const AdminLogin = () => {
    const handleAdminLogin = () => {
      if (adminPassword === 'admin123') {
        setIsAdminMode(true);
        setShowAdminLogin(false);
        setCurrentView('admin-dashboard');
        setAdminPassword('');
      } else {
        alert('סיסמה שגויה!');
        setAdminPassword('');
      }
    };

    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-xl font-bold' }, 'כניסה למנהל מערכת'),
        React.createElement('button', { 
          onClick: () => {
            setShowAdminLogin(false);
            setAdminPassword('');
          },
          className: 'text-gray-600 hover:text-gray-800'
        }, 'ביטול')
      ),

      React.createElement('div', { className: 'bg-red-50 border border-red-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-center mb-2' },
          React.createElement('span', { className: 'text-2xl ml-3' }, '🔐'),
          React.createElement('div', null,
            React.createElement('h3', { className: 'font-bold text-red-800' }, 'אזור מוגבל - מנהלים בלבד'),
            React.createElement('p', { className: 'text-red-700 text-sm' },
              'הכנס סיסמה לגישה לפאנל הניהול'
            )
          )
        )
      ),

      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'סיסמת מנהל'
            ),
            React.createElement('input', { 
              type: 'password', 
              value: adminPassword,
              onChange: (e) => setAdminPassword(e.target.value),
              onKeyPress: (e) => e.key === 'Enter' && handleAdminLogin(),
              placeholder: 'הכנס סיסמה',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              autoFocus: true
            })
          )
        ),
        
        React.createElement('div', { className: 'mt-4 text-xs text-gray-500' },
          'לבדיקה: סיסמה = admin123'
        )
      ),

      React.createElement('button', { 
        onClick: handleAdminLogin,
        className: 'w-full bg-red-600 text-white rounded-lg py-3 font-medium hover:bg-red-700'
      }, 'התחבר כמנהל')
    );
  };

  // Admin Dashboard Component
  const AdminDashboard = () => {
    const handleLogout = () => {
      setIsAdminMode(false);
      setCurrentView('family-home');
    };

    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('div', null,
          React.createElement('h1', { className: 'text-2xl font-bold' }, '📊 לוח מחוונים - ניהול מערכת'),
          React.createElement('p', { className: 'text-gray-600 text-sm' }, 'סקירה כללית של אפליקציית ההסעות')
        ),
        React.createElement('button', { 
          onClick: handleLogout,
          className: 'bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300'
        }, 'יציאה')
      ),

      // System Overview Cards
      React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-3 gap-4' },
        React.createElement('div', { className: 'bg-blue-50 rounded-lg p-4 border border-blue-200' },
          React.createElement('div', { className: 'text-3xl font-bold text-blue-600' }, systemStats.totalFamilies),
          React.createElement('div', { className: 'text-sm text-blue-700' }, 'משפחות רשומות'),
          React.createElement('div', { className: 'text-xs text-blue-600 mt-1' }, '👨‍👩‍👧‍👦 פעילות במערכת')
        ),
        React.createElement('div', { className: 'bg-green-50 rounded-lg p-4 border border-green-200' },
          React.createElement('div', { className: 'text-3xl font-bold text-green-600' }, systemStats.totalChildren),
          React.createElement('div', { className: 'text-sm text-green-700' }, 'ילדים במערכת'),
          React.createElement('div', { className: 'text-xs text-green-600 mt-1' }, '👶 עם חוגים פעילים')
        ),
        React.createElement('div', { className: 'bg-purple-50 rounded-lg p-4 border border-purple-200' },
          React.createElement('div', { className: 'text-3xl font-bold text-purple-600' }, systemStats.totalClasses),
          React.createElement('div', { className: 'text-sm text-purple-700' }, 'חוגים פעילים'),
          React.createElement('div', { className: 'text-xs text-purple-600 mt-1' }, '⚽ באזורים שונים')
        ),
        React.createElement('div', { className: 'bg-orange-50 rounded-lg p-4 border border-orange-200' },
          React.createElement('div', { className: 'text-3xl font-bold text-orange-600' }, systemStats.activeTransportGroups),
          React.createElement('div', { className: 'text-sm text-orange-700' }, 'קבוצות הסעות'),
          React.createElement('div', { className: 'text-xs text-orange-600 mt-1' }, '🚗 פעילות כעת')
        ),
        React.createElement('div', { className: 'bg-yellow-50 rounded-lg p-4 border border-yellow-200' },
          React.createElement('div', { className: 'text-3xl font-bold text-yellow-600' }, systemStats.pendingRequests),
          React.createElement('div', { className: 'text-sm text-yellow-700' }, 'בקשות ממתינות'),
          React.createElement('div', { className: 'text-xs text-yellow-600 mt-1' }, '⏳ הצטרפות לקבוצות')
        ),
        React.createElement('div', { className: 'bg-red-50 rounded-lg p-4 border border-red-200' },
          React.createElement('div', { className: 'text-3xl font-bold text-red-600' }, systemStats.emergencyAlerts),
          React.createElement('div', { className: 'text-sm text-red-700' }, 'תראות חירום'),
          React.createElement('div', { className: 'text-xs text-red-600 mt-1' }, '⚠️ דורשות תשומת לב')
        )
      ),

      // Quick Actions
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4' }, 'פעולות מהירות'),
        React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-3' },
          React.createElement('button', {
            onClick: () => setCurrentView('admin-families'),
            className: 'bg-blue-100 text-blue-700 p-3 rounded-lg hover:bg-blue-200 text-sm'
          }, '👨‍👩‍👧‍👦 ניהול משפחות'),
          React.createElement('button', {
            onClick: () => setCurrentView('admin-classes'),
            className: 'bg-purple-100 text-purple-700 p-3 rounded-lg hover:bg-purple-200 text-sm'
          }, '⚽ ניהול חוגים'),
          React.createElement('button', {
            onClick: () => setCurrentView('admin-transports'),
            className: 'bg-orange-100 text-orange-700 p-3 rounded-lg hover:bg-orange-200 text-sm'
          }, '🚗 קבוצות הסעות'),
          React.createElement('button', {
            onClick: () => setCurrentView('admin-reports'),
            className: 'bg-green-100 text-green-700 p-3 rounded-lg hover:bg-green-200 text-sm'
          }, '📊 דוחות וסטטיסטיקות')
        )
      ),

      // Recent Activity
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4' }, 'פעילות אחרונה'),
        React.createElement('div', { className: 'space-y-3' },
          React.createElement('div', { className: 'flex items-center p-2 bg-blue-50 rounded' },
            React.createElement('span', { className: 'ml-2' }, '🔵'),
            React.createElement('span', { className: 'text-sm' }, 'משפחת כהן מילאה זמינות לחוג כדורסל'),
            React.createElement('span', { className: 'mr-auto text-xs text-gray-500' }, '14:30')
          ),
          React.createElement('div', { className: 'flex items-center p-2 bg-green-50 rounded' },
            React.createElement('span', { className: 'ml-2' }, '✅'),
            React.createElement('span', { className: 'text-sm' }, 'קבוצת הסעות חדשה נוצרה - חוג שחייה'),
            React.createElement('span', { className: 'mr-auto text-xs text-gray-500' }, '13:15')
          ),
          React.createElement('div', { className: 'flex items-center p-2 bg-red-50 rounded' },
            React.createElement('span', { className: 'ml-2' }, '⚠️'),
            React.createElement('span', { className: 'text-sm' }, 'עוזר חוגים טיפל בבקשת חירום'),
            React.createElement('span', { className: 'mr-auto text-xs text-gray-500' }, '12:45')
          )
        )
      )
    );
  };

  // Add Child Component - RADICAL FIX: Uncontrolled inputs
  const AddChildPage = () => {
    // Use refs instead of state to prevent re-renders
    const nameRef = useRef(null);
    const birthDateRef = useRef(null);
    const phoneRef = useRef(null);
    const addressRef = useRef(null);
    
    // Extra aggressive mobile keyboard fix for this page
    useEffect(() => {
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.style.fontSize = '16px';
        input.style.webkitAppearance = 'none';
        input.addEventListener('focus', () => {
          input.style.fontSize = '16px';
          // Prevent viewport changes
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
      
      // Prevent zoom on input focus
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
      
      return () => {
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
      };
    }, []);
    
    const handleSaveChild = () => {
      const name = nameRef.current?.value || '';
      const birthDate = birthDateRef.current?.value || '';
      const phone = phoneRef.current?.value || '';
      const address = addressRef.current?.value || '';
      
      if (!name || !address) {
        alert('אנא מלא את השדות החובה');
        return;
      }

      const newChild = {
        id: Date.now(),
        name: name,
        birthDate: birthDate,
        phone: phone,
        address: address,
        classes: []
      };

      // Add child to current family
      setCurrentFamily(prev => ({
        ...prev,
        children: [...(prev.children || []), newChild]
      }));
      
      console.log('הוספת ילד חדש:', newChild);
      alert('הילד ' + name + ' נוסף בהצלחה למשפחה!');
      
      // Reset form and navigate back
      if (nameRef.current) nameRef.current.value = '';
      if (birthDateRef.current) birthDateRef.current.value = '';
      if (phoneRef.current) phoneRef.current.value = '';
      if (addressRef.current) addressRef.current.value = '';
      setCurrentView('family-home');
    };

    const handleCancel = () => {
      // Reset form using refs
      if (nameRef.current) nameRef.current.value = '';
      if (birthDateRef.current) birthDateRef.current.value = '';
      if (phoneRef.current) phoneRef.current.value = '';
      if (addressRef.current) addressRef.current.value = '';
      setCurrentView('family-home');
    };

    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-xl font-bold' }, 'הוסף ילד למשפחה'),
        React.createElement('button', { 
          onClick: handleCancel,
          className: 'text-gray-600 hover:text-gray-800'
        }, 'ביטול')
      ),

      React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-center mb-2' },
          React.createElement('span', { className: 'text-2xl ml-3' }, '👶'),
          React.createElement('div', null,
            React.createElement('h3', { className: 'font-bold text-blue-800' }, 'הוסף ילד חדש'),
            React.createElement('p', { className: 'text-blue-700 text-sm' },
              'מלא את פרטי הילד כדי להוסיף אותו למשפחה'
            )
          )
        )
      ),

      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4' }, 'פרטי הילד'),
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'שם הילד ',
              React.createElement('span', { className: 'text-red-500' }, '*')
            ),
            React.createElement('input', { 
              key: 'child-name-input',
              ref: nameRef,
              type: 'text', 
              placeholder: 'דני כהן',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'name',
              autoCapitalize: 'words',
              spellCheck: false,
              required: true
            })
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'תאריך לידה (רשות)'
            ),
            React.createElement('input', { 
              key: 'child-birthdate-input',
              ref: birthDateRef,
              type: 'date', 
              className: 'w-full p-2 border border-gray-300 rounded-lg',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'bday'
            })
            // Age calculation removed for uncontrolled inputs
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'טלפון הילד (רשות)'
            ),
            React.createElement('input', { 
              key: 'child-phone-input',
              ref: phoneRef,
              type: 'tel', 
              placeholder: '050-111-2222',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'tel',
              inputMode: 'tel'
            })
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'כתובת הבית ',
              React.createElement('span', { className: 'text-red-500' }, '*')
            ),
            React.createElement('input', { 
              key: 'child-address-input',
              ref: addressRef,
              type: 'text', 
              placeholder: 'רח\' הרצל 123, תל אביב',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'street-address',
              spellCheck: false,
              required: true
            })
          )
        )
      ),

      React.createElement('div', { className: 'bg-green-50 border border-green-200 rounded-lg p-4' },
        React.createElement('h3', { className: 'font-medium text-green-800 mb-2' }, 'מה הלאה?'),
        React.createElement('p', { className: 'text-sm text-green-700' },
          'לאחר שתוסיף את הילד, תוכל להוסיף לו חוגים דרך מסך הבית או דרך ההגדרות.'
        )
      ),

      React.createElement('div', { className: 'flex space-x-4 space-x-reverse' },
        React.createElement('button', { 
          onClick: handleSaveChild,
          className: 'flex-1 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700'
        }, 'הוסף ילד'),
        React.createElement('button', { 
          onClick: handleCancel,
          className: 'flex-1 bg-gray-200 text-gray-700 rounded-lg py-3 font-medium hover:bg-gray-300'
        }, 'ביטול')
      )
    );
  };

  // Admin Families Management
  const AdminFamiliesPage = () => {
    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-xl font-bold' }, '👨‍👩‍👧‍👦 ניהול משפחות'),
        React.createElement('button', { 
          onClick: () => setCurrentView('admin-dashboard'),
          className: 'text-gray-600 hover:text-gray-800'
        }, 'חזור ללוח מחוונים')
      ),

      // Families Table
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 overflow-hidden' },
        React.createElement('div', { className: 'p-4 bg-gray-50 border-b' },
          React.createElement('h3', { className: 'font-medium' }, 'כל המשפחות במערכת (' + allFamilies.length + ')')
        ),
        
        React.createElement('div', { className: 'divide-y divide-gray-200' },
          allFamilies.map(family =>
            React.createElement('div', { key: family.id, className: 'p-4 hover:bg-gray-50' },
              React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('div', { className: 'flex-1' },
                  React.createElement('h4', { className: 'font-medium text-lg' }, family.name),
                  React.createElement('div', { className: 'text-sm text-gray-600 space-y-1 mt-2' },
                    React.createElement('div', null, '👶 ' + family.children + ' ילדים • ⚽ ' + family.activeClasses + ' חוגים פעילים'),
                    React.createElement('div', null, '📞 ' + family.phone + ' • ✉️ ' + family.email),
                    React.createElement('div', null, '📅 פעילות אחרונה: ' + family.lastActive)
                  )
                ),
                
                React.createElement('div', { className: 'flex flex-col items-end space-y-2' },
                  React.createElement('span', { 
                    className: 'px-3 py-1 rounded-full text-xs ' + (
                      family.availabilityStatus === 'מילא זמינות' ? 'bg-green-100 text-green-700' : 
                      family.availabilityStatus === 'ממלא זמינות' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    )
                  }, family.availabilityStatus),
                  
                  React.createElement('div', { className: 'flex space-x-2 space-x-reverse' },
                    React.createElement('button', {
                      onClick: () => alert('פתיחת פרופיל ' + family.name),
                      className: 'px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200'
                    }, 'צפייה'),
                    React.createElement('button', {
                      onClick: () => alert('שליחת הודעה ל' + family.name),
                      className: 'px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200'
                    }, 'הודעה'),
                    React.createElement('button', {
                      onClick: () => alert('עריכת פרטי ' + family.name),
                      className: 'px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200'
                    }, 'עריכה')
                  )
                )
              )
            )
          )
        )
      ),

      // Quick Stats
      React.createElement('div', { className: 'grid grid-cols-4 gap-4' },
        React.createElement('div', { className: 'bg-blue-50 rounded-lg p-3 border border-blue-200 text-center' },
          React.createElement('div', { className: 'text-2xl font-bold text-blue-600' }, 
            allFamilies.filter(f => f.availabilityStatus === 'מילא זמינות').length
          ),
          React.createElement('div', { className: 'text-sm text-blue-700' }, 'מילאו זמינות')
        ),
        React.createElement('div', { className: 'bg-yellow-50 rounded-lg p-3 border border-yellow-200 text-center' },
          React.createElement('div', { className: 'text-2xl font-bold text-yellow-600' }, 
            allFamilies.filter(f => f.availabilityStatus === 'ממלא זמינות').length
          ),
          React.createElement('div', { className: 'text-sm text-yellow-700' }, 'ממלאים זמינות')
        ),
        React.createElement('div', { className: 'bg-red-50 rounded-lg p-3 border border-red-200 text-center' },
          React.createElement('div', { className: 'text-2xl font-bold text-red-600' }, 
            allFamilies.filter(f => f.availabilityStatus === 'לא מילא זמינות').length
          ),
          React.createElement('div', { className: 'text-sm text-red-700' }, 'ללא זמינות')
        ),
        React.createElement('div', { className: 'bg-green-50 rounded-lg p-3 border border-green-200 text-center' },
          React.createElement('div', { className: 'text-2xl font-bold text-green-600' }, 
            allFamilies.reduce((sum, f) => sum + f.children, 0)
          ),
          React.createElement('div', { className: 'text-sm text-green-700' }, 'סה״כ ילדים')
        )
      )
    );
  };

  // Admin Classes Management
  const AdminClassesPage = () => {
    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-xl font-bold' }, '⚽ ניהול חוגים'),
        React.createElement('button', { 
          onClick: () => setCurrentView('admin-dashboard'),
          className: 'text-gray-600 hover:text-gray-800'
        }, 'חזור ללוח מחוונים')
      ),

      // Classes Grid
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        availableClasses.map(classItem =>
          React.createElement('div', { key: classItem.id, className: 'bg-white rounded-lg border border-gray-200 p-4' },
            React.createElement('div', { className: 'flex justify-between items-start mb-3' },
              React.createElement('div', null,
                React.createElement('h4', { className: 'font-bold text-lg text-blue-600' }, classItem.name),
                React.createElement('div', { className: 'text-sm text-gray-600' }, classItem.location + ', ' + classItem.city)
              ),
              React.createElement('span', { className: 'bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs' }, 
                '#' + classItem.id
              )
            ),
            
            React.createElement('div', { className: 'space-y-2 text-sm text-gray-700 mb-4' },
              React.createElement('div', null, '🕰️ ' + classItem.schedule),
              React.createElement('div', null, '👨‍🏫 מאמן: ' + classItem.coach),
              React.createElement('div', null, '👶 גילאים: ' + classItem.ageGroup),
              React.createElement('div', null, '👥 ' + classItem.currentMembers + '/' + classItem.maxMembers + ' משתתפים')
            ),
            
            React.createElement('div', { className: 'flex space-x-2 space-x-reverse' },
              React.createElement('button', {
                onClick: () => alert('צפייה בפרטי חוג ' + classItem.name),
                className: 'flex-1 bg-blue-100 text-blue-700 py-2 rounded text-xs hover:bg-blue-200'
              }, 'צפייה מלאה'),
              React.createElement('button', {
                onClick: () => alert('עריכת חוג ' + classItem.name),
                className: 'px-4 py-2 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200'
              }, 'עריכה')
            )
          )
        )
      )
    );
  };

  // Admin Reports Page
  const AdminReportsPage = () => {
    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-xl font-bold' }, '📊 דוחות וסטטיסטיקות'),
        React.createElement('button', { 
          onClick: () => setCurrentView('admin-dashboard'),
          className: 'text-gray-600 hover:text-gray-800'
        }, 'חזור ללוח מחוונים')
      ),

      // Reports Grid
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
        React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
          React.createElement('h3', { className: 'font-medium mb-4' }, '🔄 סטטיסטיקות זמינות'),
          React.createElement('div', { className: 'space-y-2 text-sm' },
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'משפחות שמילאו זמינות:'),
              React.createElement('span', { className: 'font-medium' }, '18/24 (75%)')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'זמני בוקר זמינים:'),
              React.createElement('span', { className: 'font-medium' }, '142/168 (85%)')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'זמני אחה"צ זמינים:'),
              React.createElement('span', { className: 'font-medium' }, '156/168 (93%)')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'זמני ערב זמינים:'),
              React.createElement('span', { className: 'font-medium' }, '98/168 (58%)')
            )
          )
        ),
        
        React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
          React.createElement('h3', { className: 'font-medium mb-4' }, '🚗 סטטיסטיקות הסעות'),
          React.createElement('div', { className: 'space-y-2 text-sm' },
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'סה"כ נסיעות השבוע:'),
              React.createElement('span', { className: 'font-medium' }, '156 נסיעות')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'משפחות עם איזון מלא:'),
              React.createElement('span', { className: 'font-medium text-green-600' }, '16/24 (67%)')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'משפחות עם חריגה:'),
              React.createElement('span', { className: 'font-medium text-red-600' }, '3/24 (13%)')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'ממוצע נסיעות למשפחה:'),
              React.createElement('span', { className: 'font-medium' }, '6.5 נסיעות')
            )
          )
        ),
        
        React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
          React.createElement('h3', { className: 'font-medium mb-4' }, '⚠️ תרוות חירום'),
          React.createElement('div', { className: 'space-y-2 text-sm' },
            React.createElement('div', { className: 'p-2 bg-red-50 rounded' },
              React.createElement('div', { className: 'font-medium text-red-800' }, 'משפחת אברהם - לא מילא זמינות'),
              React.createElement('div', { className: 'text-red-600 text-xs' }, 'לא מילא זמינות לחוג כדורסל כבר 3 שבועות')
            ),
            React.createElement('div', { className: 'p-2 bg-yellow-50 rounded' },
              React.createElement('div', { className: 'font-medium text-yellow-800' }, 'משפחת שלום - חריגה בנסיעות'),
              React.createElement('div', { className: 'text-yellow-600 text-xs' }, 'נסעה רק 2 פעמים השבוע במקום 6')
            )
          )
        ),
        
        React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
          React.createElement('h3', { className: 'font-medium mb-4' }, '📨 פעילות עוזר חוגים'),
          React.createElement('div', { className: 'space-y-2 text-sm' },
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'הודעות שנשלחו היום:'),
              React.createElement('span', { className: 'font-medium' }, '23 הודעות')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'בקשות חירום:'),
              React.createElement('span', { className: 'font-medium text-red-600' }, '4 בקשות')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'ביטולי חוגים:'),
              React.createElement('span', { className: 'font-medium' }, '2 ביטולים')
            ),
            React.createElement('div', { className: 'flex justify-between' },
              React.createElement('span', null, 'זמן תגובה ממוצע:'),
              React.createElement('span', { className: 'font-medium' }, '8 דקות')
            )
          )
        )
      )
    );
  };

  // Class Add/Edit Component
  const ClassAddEditPage = React.memo(() => {
    const isEditing = !!editingClass;
    const STORAGE_KEY = 'classFormData';
    
    // Use refs to prevent mobile keyboard issues
    const classNameRef = useRef(null);
    const coachNameRef = useRef(null);
    const coachPhoneRef = useRef(null);
    const managerNameRef = useRef(null);
    const managerPhoneRef = useRef(null);
    const managerEmailRef = useRef(null);
    
    // Address refs (for first address only - main fix)
    const address0NameRef = useRef(null);
    const address0AddressRef = useRef(null);
    
    // LocalStorage functions for persistent data
    const saveToLocalStorage = useCallback((data) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('💾 Saved to localStorage:', data);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, [STORAGE_KEY]);
    
    const loadFromLocalStorage = useCallback(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          console.log('📖 Loaded from localStorage:', data);
          return data;
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
      return null;
    }, [STORAGE_KEY]);
    
    const clearLocalStorage = useCallback(() => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ Cleared localStorage');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }, [STORAGE_KEY]);
    
    // Save current form data to localStorage
    const saveCurrentData = useCallback(() => {
      const currentData = {
        name: classNameRef.current?.value || '',
        coachName: coachNameRef.current?.value || '',
        coachPhone: coachPhoneRef.current?.value || '',
        managerName: managerNameRef.current?.value || '',
        managerPhone: managerPhoneRef.current?.value || '',
        managerEmail: managerEmailRef.current?.value || '',
        address0Name: address0NameRef.current?.value || '',
        address0Address: address0AddressRef.current?.value || ''
      };
      saveToLocalStorage(currentData);
      return currentData;
    }, [saveToLocalStorage]);
    
    // Restore form data from localStorage
    const restoreData = useCallback(() => {
      const savedData = loadFromLocalStorage();
      if (savedData) {
        console.log('🔄 Restoring data from localStorage:', savedData);
        
        // Restore with multiple attempts
        const restore = () => {
          if (classNameRef.current && savedData.name) {
            classNameRef.current.value = savedData.name;
          }
          if (coachNameRef.current && savedData.coachName) {
            coachNameRef.current.value = savedData.coachName;
          }
          if (coachPhoneRef.current && savedData.coachPhone) {
            coachPhoneRef.current.value = savedData.coachPhone;
          }
          if (managerNameRef.current && savedData.managerName) {
            managerNameRef.current.value = savedData.managerName;
          }
          if (managerPhoneRef.current && savedData.managerPhone) {
            managerPhoneRef.current.value = savedData.managerPhone;
          }
          if (managerEmailRef.current && savedData.managerEmail) {
            managerEmailRef.current.value = savedData.managerEmail;
          }
          if (address0NameRef.current && savedData.address0Name) {
            address0NameRef.current.value = savedData.address0Name;
          }
          if (address0AddressRef.current && savedData.address0Address) {
            address0AddressRef.current.value = savedData.address0Address;
          }
        };
        
        // Multiple restoration attempts
        restore(); // Immediate
        requestAnimationFrame(restore); // Next frame
        setTimeout(restore, 50); // Delayed backup
        setTimeout(restore, 200); // Extra delayed backup
        
        return true;
      }
      return false;
    }, [loadFromLocalStorage]);
    
    // Auto-save every time user types (with debounce)
    const autoSaveTimeoutRef = useRef(null);
    const debouncedSave = useCallback(() => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveCurrentData();
      }, 500); // Save 500ms after user stops typing
    }, [saveCurrentData]);
    
    // Add event listeners to all inputs for auto-save
    useEffect(() => {
      const refs = [
        classNameRef,
        coachNameRef,
        coachPhoneRef,
        managerNameRef,
        managerPhoneRef,
        managerEmailRef,
        address0NameRef,
        address0AddressRef
      ];
      
      const handleInput = () => {
        console.log('📝 Input detected - scheduling auto-save');
        debouncedSave();
      };
      
      refs.forEach(ref => {
        if (ref.current) {
          ref.current.addEventListener('input', handleInput);
          ref.current.addEventListener('blur', handleInput);
        }
      });
      
      return () => {
        refs.forEach(ref => {
          if (ref.current) {
            ref.current.removeEventListener('input', handleInput);
            ref.current.removeEventListener('blur', handleInput);
          }
        });
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
      };
    }, [debouncedSave]);
    
    // Initialize component on mount
    useEffect(() => {
      console.log('🚀 ClassAddEditPage mounted - initializing with localStorage');
      
      // Try to restore from localStorage first
      const restored = restoreData();
      
      if (!restored) {
        // If no saved data, initialize with classForm values
        console.log('🎆 No saved data, initializing with classForm values');
        const initialData = {
          name: classForm.name || '',
          coachName: classForm.coachName || '',
          coachPhone: classForm.coachPhone || '',
          managerName: classForm.managerName || '',
          managerPhone: classForm.managerPhone || '',
          managerEmail: classForm.managerEmail || '',
          address0Name: classForm.addresses[0]?.name || '',
          address0Address: classForm.addresses[0]?.address || ''
        };
        
        // Set initial values to refs
        if (classNameRef.current) classNameRef.current.value = initialData.name;
        if (coachNameRef.current) coachNameRef.current.value = initialData.coachName;
        if (coachPhoneRef.current) coachPhoneRef.current.value = initialData.coachPhone;
        if (managerNameRef.current) managerNameRef.current.value = initialData.managerName;
        if (managerPhoneRef.current) managerPhoneRef.current.value = initialData.managerPhone;
        if (managerEmailRef.current) managerEmailRef.current.value = initialData.managerEmail;
        if (address0NameRef.current) address0NameRef.current.value = initialData.address0Name;
        if (address0AddressRef.current) address0AddressRef.current.value = initialData.address0Address;
        
        // Save initial data to localStorage
        saveToLocalStorage(initialData);
      }
      
      // Cleanup on unmount
      return () => {
        console.log('🧹 ClassAddEditPage unmounting - keeping localStorage for next visit');
      };
    }, []); // Empty dependency array - runs only on mount!
    
    // Restore data after every render (in case refs get cleared)
    useEffect(() => {
      restoreData();
    });
    


    // Stable functions using useCallback to prevent re-renders
    const addAddress = useCallback(() => {
      console.log('🏠 Adding address - saving current data to localStorage first');
      
      // Save current form data before state change
      saveCurrentData();
      
      setClassForm(prev => ({
        ...prev,
        addresses: [...prev.addresses, { name: '', address: '' }]
      }));
      
      // Data will be restored automatically via useEffect after re-render
    }, [saveCurrentData]);

    const removeAddress = useCallback((index) => {
      console.log('🗑️ Removing address:', index);
      if (classForm.addresses.length > 1) {
        // Save current form data before state change
        saveCurrentData();
        
        setClassForm(prev => ({
          ...prev,
          addresses: prev.addresses.filter((_, i) => i !== index)
        }));
      }
    }, [classForm.addresses.length, saveCurrentData]);

    const updateAddress = useCallback((index, field, value) => {
      console.log('📝 Updating address:', index, field, value);
      setClassForm(prev => ({
        ...prev,
        addresses: prev.addresses.map((addr, i) => 
          i === index ? { ...addr, [field]: value } : addr
        )
      }));
    }, []);

    const addSession = useCallback(() => {
      console.log('📅 Adding session - CRITICAL SAVE TO LOCALSTORAGE');
      
      // Save current form data before state change
      saveCurrentData();
      
      setClassForm(prev => ({
        ...prev,
        sessions: [...prev.sessions, { day: '', startTime: '', endTime: '', addressIndex: 0 }]
      }));
      
      console.log('✨ Session added - data will be restored from localStorage after re-render');
    }, [saveCurrentData]);

    const removeSession = useCallback((index) => {
      console.log('🗑️ Removing session:', index);
      if (classForm.sessions.length > 1) {
        // Save current form data before state change
        saveCurrentData();
        
        setClassForm(prev => ({
          ...prev,
          sessions: prev.sessions.filter((_, i) => i !== index)
        }));
      }
    }, [classForm.sessions.length, saveCurrentData]);

    const updateSession = useCallback((index, field, value) => {
      console.log('📝 Updating session:', index, field, value);
      // Save before update
      saveCurrentData();
      
      setClassForm(prev => ({
        ...prev,
        sessions: prev.sessions.map((session, i) => 
          i === index ? { ...session, [field]: value } : session
        )
      }));
    }, [saveCurrentData]);

    const handleSave = () => {
      const name = classNameRef.current?.value || '';
      const coachName = coachNameRef.current?.value || '';
      const coachPhone = coachPhoneRef.current?.value || '';
      const managerName = managerNameRef.current?.value || '';
      const managerPhone = managerPhoneRef.current?.value || '';
      const managerEmail = managerEmailRef.current?.value || '';
      const address0Address = address0AddressRef.current?.value || '';
      
      if (!name || !coachName || !address0Address) {
        alert('אנא מלא את השדות החובה: שם חוג, שם מאמן וכתובת');
        return;
      }

      const newClass = {
        id: Date.now(),
        name: name,
        coachName: coachName,
        coachPhone: coachPhone,
        managerName: managerName,
        managerPhone: managerPhone,
        managerEmail: managerEmail,
        addresses: [
          {
            name: address0NameRef.current?.value || '',
            address: address0AddressRef.current?.value || ''
          }
        ],
        sessions: classForm.sessions // Keep existing sessions logic for now
      };

      console.log('שמירת חוג:', newClass);
      alert(isEditing ? 'החוג עודכן בהצלחה!' : 'החוג נוצר בהצלחה!');
      
      // Clear localStorage after successful save
      clearLocalStorage();
      
      setCurrentView('settings');
      setIsEditingClass(false);
      setEditingClass(null);
      
      // Reset form
      if (classNameRef.current) classNameRef.current.value = '';
      if (coachNameRef.current) coachNameRef.current.value = '';
      if (coachPhoneRef.current) coachPhoneRef.current.value = '';
      if (managerNameRef.current) managerNameRef.current.value = '';
      if (managerPhoneRef.current) managerPhoneRef.current.value = '';
      if (managerEmailRef.current) managerEmailRef.current.value = '';
      if (address0NameRef.current) address0NameRef.current.value = '';
      if (address0AddressRef.current) address0AddressRef.current.value = '';
      
      setClassForm({
        name: '',
        addresses: [{ name: '', address: '' }],
        sessions: [{ day: '', startTime: '', endTime: '', addressIndex: 0 }],
        coachName: '',
        coachPhone: '',
        managerName: '',
        managerPhone: '',
        managerEmail: ''
      });
    };

    const handleCancel = () => {
      // Clear localStorage on cancel
      clearLocalStorage();
      
      setCurrentView('settings');
      setIsEditingClass(false);
      setEditingClass(null);
      
      // Reset refs
      if (classNameRef.current) classNameRef.current.value = '';
      if (coachNameRef.current) coachNameRef.current.value = '';
      if (coachPhoneRef.current) coachPhoneRef.current.value = '';
      if (managerNameRef.current) managerNameRef.current.value = '';
      if (managerPhoneRef.current) managerPhoneRef.current.value = '';
      if (managerEmailRef.current) managerEmailRef.current.value = '';
      if (address0NameRef.current) address0NameRef.current.value = '';
      if (address0AddressRef.current) address0AddressRef.current.value = '';
      
      // Reset form state
      setClassForm({
        name: '',
        addresses: [{ name: '', address: '' }],
        sessions: [{ day: '', startTime: '', endTime: '', addressIndex: 0 }],
        coachName: '',
        coachPhone: '',
        managerName: '',
        managerPhone: '',
        managerEmail: ''
      });
    };

    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-xl font-bold' },
          isEditing ? 'ערוך חוג' : 'הוסף חוג חדש'
        ),
        React.createElement('button', { 
          onClick: handleCancel,
          className: 'text-gray-600 hover:text-gray-800'
        }, 'ביטול')
      ),

      // Class Name
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4' }, 'פרטי החוג'),
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'שם החוג ',
              React.createElement('span', { className: 'text-red-500' }, '*')
            ),
            React.createElement('input', { 
              ref: classNameRef,
              type: 'text', 
              placeholder: 'כדורסל, שחייה, ריקוד...',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'off',
              required: true
            })
          )
        )
      ),

      // Addresses
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('div', { className: 'flex justify-between items-center mb-4' },
          React.createElement('h3', { className: 'font-medium' }, 'כתובות החוג'),
          React.createElement('button', { 
            onClick: addAddress,
            className: 'text-blue-600 text-sm hover:text-blue-800'
          }, '+ הוסף כתובת')
        ),
        
        React.createElement('div', { className: 'space-y-4' },
          classForm.addresses.map((address, index) =>
            React.createElement('div', { key: index, className: 'bg-gray-50 rounded-lg p-3 border border-gray-200' },
              React.createElement('div', { className: 'flex justify-between items-center mb-3' },
                React.createElement('h4', { className: 'font-medium text-sm' }, 'כתובת ' + (index + 1)),
                classForm.addresses.length > 1 && React.createElement('button', { 
                  onClick: () => removeAddress(index),
                  className: 'text-red-600 text-sm hover:text-red-800'
                }, 'הסר')
              ),
              
              React.createElement('div', { className: 'space-y-3' },
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                    'שם המקום (רשות)'
                  ),
                  index === 0 ? 
                    React.createElement('input', { 
                      ref: address0NameRef,
                      type: 'text', 
                      placeholder: 'בית ספר רמת אביב, בריכת העיר...',
                      className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
                      style: { 
                        fontSize: '16px', // Prevent iOS zoom
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      },
                      autoComplete: 'off'
                    }) :
                    React.createElement('input', { 
                      type: 'text', 
                      value: address.name,
                      onChange: (e) => updateAddress(index, 'name', e.target.value),
                      placeholder: 'בית ספר רמת אביב, בריכת העיר...',
                      className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
                    })
                ),
                
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                    'כתובת ',
                    React.createElement('span', { className: 'text-red-500' }, '*')
                  ),
                  index === 0 ? 
                    React.createElement('input', { 
                      ref: address0AddressRef,
                      type: 'text', 
                      placeholder: 'רח׳ הרצל 45, תל אביב',
                      className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
                      style: { 
                        fontSize: '16px', // Prevent iOS zoom
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      },
                      autoComplete: 'street-address',
                      required: true
                    }) :
                    React.createElement('input', { 
                      type: 'text', 
                      value: address.address,
                      onChange: (e) => updateAddress(index, 'address', e.target.value),
                      placeholder: 'רח׳ הרצל 45, תל אביב',
                      className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
                      required: true
                    })
                )
              )
            )
          )
        )
      ),

      // Sessions
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('div', { className: 'flex justify-between items-center mb-4' },
          React.createElement('h3', { className: 'font-medium' }, 'מופעי החוג'),
          React.createElement('button', { 
            onClick: addSession,
            className: 'text-blue-600 text-sm hover:text-blue-800'
          }, '+ הוסף מופע')
        ),
        
        React.createElement('div', { className: 'space-y-4' },
          classForm.sessions.map((session, index) =>
            React.createElement('div', { key: index, className: 'bg-blue-50 rounded-lg p-3 border border-blue-200' },
              React.createElement('div', { className: 'flex justify-between items-center mb-3' },
                React.createElement('h4', { className: 'font-medium text-sm text-blue-800' }, 'מופע ' + (index + 1)),
                classForm.sessions.length > 1 && React.createElement('button', { 
                  onClick: () => removeSession(index),
                  className: 'text-red-600 text-sm hover:text-red-800'
                }, 'הסר')
              ),
              
              React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-3' },
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                    'יום ',
                    React.createElement('span', { className: 'text-red-500' }, '*')
                  ),
                  React.createElement('select', { 
                    value: session.day,
                    onChange: (e) => updateSession(index, 'day', e.target.value),
                    className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
                    required: true
                  },
                    React.createElement('option', { value: '' }, 'בחר יום'),
                    days.map(day => React.createElement('option', { key: day, value: day }, day))
                  )
                ),
                
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'מיקום'),
                  React.createElement('select', { 
                    value: session.addressIndex,
                    onChange: (e) => updateSession(index, 'addressIndex', parseInt(e.target.value)),
                    className: 'w-full p-2 border border-gray-300 rounded-lg text-right'
                  },
                    classForm.addresses.map((addr, addrIndex) =>
                      React.createElement('option', { key: addrIndex, value: addrIndex },
                        addr.name || ('כתובת ' + (addrIndex + 1))
                      )
                    )
                  )
                ),
                
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                    'שעת התחלה ',
                    React.createElement('span', { className: 'text-red-500' }, '*')
                  ),
                  React.createElement('input', { 
                    type: 'time', 
                    value: session.startTime,
                    onChange: (e) => updateSession(index, 'startTime', e.target.value),
                    className: 'w-full p-2 border border-gray-300 rounded-lg',
                    required: true
                  })
                ),
                
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
                    'שעת סיום ',
                    React.createElement('span', { className: 'text-red-500' }, '*')
                  ),
                  React.createElement('input', { 
                    type: 'time', 
                    value: session.endTime,
                    onChange: (e) => updateSession(index, 'endTime', e.target.value),
                    className: 'w-full p-2 border border-gray-300 rounded-lg',
                    required: true
                  })
                )
              )
            )
          )
        )
      ),

      // Coach Details
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4' }, 'פרטי המאמן'),
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'שם המאמן ',
              React.createElement('span', { className: 'text-red-500' }, '*')
            ),
            React.createElement('input', { 
              ref: coachNameRef,
              type: 'text', 
              placeholder: 'דוד כהן',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'name',
              required: true
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'טלפון המאמן'
            ),
            React.createElement('input', { 
              ref: coachPhoneRef,
              type: 'tel', 
              placeholder: '052-987-6543',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'tel'
            })
          )
        )
      ),

      // Class Manager Details
      React.createElement('div', { className: 'bg-blue-50 rounded-lg border border-blue-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4 text-blue-800' }, '👑 מנהל החוג'),
        React.createElement('p', { className: 'text-sm text-blue-700 mb-4' },
          'מנהל החוג אחראי על תיאום הזמינות, זירוז הורים שלא מגיבים ופתירת בעיות.'
        ),
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'שם המנהל ',
              React.createElement('span', { className: 'text-red-500' }, '*')
            ),
            React.createElement('input', { 
              ref: managerNameRef,
              type: 'text', 
              placeholder: 'יוסי כהן',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'name',
              required: true
            })
          ),
          
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'טלפון המנהל ',
              React.createElement('span', { className: 'text-red-500' }, '*')
            ),
            React.createElement('input', { 
              ref: managerPhoneRef,
              type: 'tel', 
              placeholder: '050-123-4567',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'tel',
              required: true
            })
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' },
              'אימייל המנהל (רשות)'
            ),
            React.createElement('input', { 
              ref: managerEmailRef,
              type: 'email', 
              placeholder: 'yossi@gmail.com',
              className: 'w-full p-2 border border-gray-300 rounded-lg text-right',
              style: { 
                fontSize: '16px', // Prevent iOS zoom
                WebkitAppearance: 'none',
                appearance: 'none'
              },
              autoComplete: 'email'
            })
          )
        )
      ),

      // Action Buttons
      React.createElement('div', { className: 'flex space-x-4 space-x-reverse' },
        React.createElement('button', { 
          onClick: handleSave,
          className: 'flex-1 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700'
        }, isEditing ? 'שמור שינויים' : 'צור חוג'),
        React.createElement('button', { 
          onClick: handleCancel,
          className: 'flex-1 bg-gray-200 text-gray-700 rounded-lg py-3 font-medium hover:bg-gray-300'
        }, 'ביטול')
      )
    );
  });

  const AvailabilityPage = () => {
    const timeSlots = [
      { key: 'morning', label: 'בוקר', time: '07:00-12:00', color: 'yellow' },
      { key: 'afternoon', label: 'אחר הצהריים', time: '12:00-17:00', color: 'blue' },
      { key: 'evening', label: 'ערב', time: '17:00-22:00', color: 'purple' }
    ];

    const toggleAvailability = (day, timeSlot) => {
      setWeeklyAvailability(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          [timeSlot]: !prev[day][timeSlot]
        }
      }));
    };

    const selectAllDay = (day) => {
      setWeeklyAvailability(prev => ({
        ...prev,
        [day]: {
          morning: true,
          afternoon: true,
          evening: true
        }
      }));
    };

    const clearAllDay = (day) => {
      setWeeklyAvailability(prev => ({
        ...prev,
        [day]: {
          morning: false,
          afternoon: false,
          evening: false
        }
      }));
    };

    const saveAvailability = () => {
      console.log('שמירת זמינות:', weeklyAvailability);
      alert('הזלינות שלך נשמרה בהצלחה!');
      setCurrentView('class-home');
    };

    const getAvailabilityCount = () => {
      let count = 0;
      Object.values(weeklyAvailability).forEach(day => {
        Object.values(day).forEach(slot => {
          if (slot) count++;
        });
      });
      return count;
    };

    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-xl font-bold' }, 'זמינות שבועית'),
        React.createElement('button', { 
          onClick: () => setCurrentView('class-home'),
          className: 'text-gray-600 hover:text-gray-800'
        }, 'חזור')
      ),

      // Info Card
      React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex items-center mb-2' },
          React.createElement('span', { className: 'text-2xl ml-3' }, '📅'),
          React.createElement('div', null,
            React.createElement('h3', { className: 'font-bold text-blue-800' }, 'מלא זמינות להסעות'),
            React.createElement('p', { className: 'text-blue-700 text-sm' },
              'בחר את השעות בהן אתה זמין להסיע או לאסוף מהחוג'
            )
          )
        ),
        React.createElement('div', { className: 'mt-3 text-sm text-blue-700' },
          'נבחרו: ' + getAvailabilityCount() + ' מתוך 21 זמנים'
        )
      ),

      // Time Legend
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-3' }, 'מפתח צבעים'),
        React.createElement('div', { className: 'grid grid-cols-3 gap-2 text-sm' },
          timeSlots.map(slot =>
            React.createElement('div', { key: slot.key, className: 'flex items-center' },
              React.createElement('div', { 
                className: 'w-4 h-4 rounded ml-2 bg-' + slot.color + '-200 border border-' + slot.color + '-300' 
              }),
              React.createElement('span', null, slot.label + ' (' + slot.time + ')')
            )
          )
        )
      ),

      // Weekly Availability Grid
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-4' }, 'בחר זמינות שבועית'),
        
        React.createElement('div', { className: 'space-y-4' },
          days.map(day => {
            const dayData = weeklyAvailability[day];
            const selectedCount = Object.values(dayData).filter(Boolean).length;
            
            return React.createElement('div', { key: day, className: 'border border-gray-200 rounded-lg p-3' },
              React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                React.createElement('h4', { className: 'font-medium text-lg' }, day),
                React.createElement('div', { className: 'flex space-x-2 space-x-reverse' },
                  React.createElement('button', {
                    onClick: () => selectAllDay(day),
                    className: 'px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200'
                  }, 'בחר הכל'),
                  React.createElement('button', {
                    onClick: () => clearAllDay(day),
                    className: 'px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200'
                  }, 'נקה הכל'),
                  React.createElement('span', { className: 'text-sm text-gray-600' },
                    selectedCount + '/3'
                  )
                )
              ),
              
              React.createElement('div', { className: 'grid grid-cols-3 gap-2' },
                timeSlots.map(slot =>
                  React.createElement('button', {
                    key: slot.key,
                    onClick: () => toggleAvailability(day, slot.key),
                    className: 'p-3 rounded-lg border transition-all ' + (
                      dayData[slot.key]
                        ? 'bg-' + slot.color + '-100 border-' + slot.color + '-300 text-' + slot.color + '-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    )
                  },
                    React.createElement('div', { className: 'text-sm font-medium' }, slot.label),
                    React.createElement('div', { className: 'text-xs mt-1' }, slot.time),
                    dayData[slot.key] && React.createElement('div', { className: 'text-lg mt-1' }, '✓')
                  )
                )
              )
            );
          })
        )
      ),

      // Action Buttons
      React.createElement('div', { className: 'flex space-x-4 space-x-reverse' },
        React.createElement('button', { 
          onClick: saveAvailability,
          className: 'flex-1 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700'
        }, 'שמור זמינות'),
        React.createElement('button', { 
          onClick: () => setCurrentView('class-home'),
          className: 'flex-1 bg-gray-200 text-gray-700 rounded-lg py-3 font-medium hover:bg-gray-300'
        }, 'ביטול')
      )
    );
  };

  const ClassFamiliesPage = () => {
    // Get current user's class (for demonstration, using first available class)
    const currentClass = availableClasses.length > 0 ? availableClasses[0] : null;
    const userFamily = allFamilies.length > 0 ? allFamilies[0] : null;
    const isManager = currentClass && userFamily && isUserFamilyManager(currentClass.id, userFamily.id);

    const handleTransferManagement = (toFamilyId) => {
      if (!currentClass || !userFamily) return;
      
      const toFamily = getFamilyById(toFamilyId);
      if (!toFamily) return;

      if (confirm(`האם אתה בטוח שברצונך להעביר את ניהול החוג "${currentClass.name}" למשפחת ${toFamily.name}?`)) {
        transferClassManagement(currentClass.id, userFamily.id, toFamilyId);
        alert(`🎉 ניהול החוג הועבר בהצלחה למשפחת ${toFamily.name}!`);
      }
    };

    const handleAddManager = (familyId) => {
      if (!currentClass) return;
      
      const family = getFamilyById(familyId);
      if (!family) return;

      if (currentClass.managers && currentClass.managers.includes(familyId)) {
        alert('משפחה זו כבר מנהלת את החוג.');
        return;
      }

      if (confirm(`האם להוסיף את משפחת ${family.name} כמנהל נוסף של החוג?`)) {
        addClassManager(currentClass.id, familyId);
        alert(`🎉 משפחת ${family.name} נוספה כמנהל החוג!`);
      }
    };

    const handleRemoveManager = (familyId) => {
      if (!currentClass) return;
      
      const family = getFamilyById(familyId);
      if (!family) return;

      if (currentClass.managers && currentClass.managers.length <= 1) {
        alert('לא ניתן להסיר את המנהל היחיד. העבר תחילה ניהול למשפחה אחרת.');
        return;
      }

      if (confirm(`האם להסיר את משפחת ${family.name} מניהול החוג?`)) {
        removeClassManager(currentClass.id, familyId);
        alert(`משפחת ${family.name} הוסרה מניהול החוג.`);
      }
    };

    // Get families that are members of the current class
    const classMembers = currentClass ? allFamilies.filter(family => 
      currentClass.members && currentClass.members.includes(family.id)
    ) : [];

    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-xl font-bold' }, 'משפחות בחוג'),
        React.createElement('button', { 
          onClick: () => setCurrentView('class-home'),
          className: 'text-gray-600 hover:text-gray-800'
        }, 'חזור')
      ),

      // Class info header
      currentClass && React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
        React.createElement('h3', { className: 'font-bold text-blue-800' }, `📚 ${currentClass.name}`),
        React.createElement('p', { className: 'text-blue-600 text-sm mt-1' }, `📍 ${currentClass.location}`),
        React.createElement('p', { className: 'text-blue-600 text-sm' }, 
          `👥 ${currentClass.currentMembers || 0}/${currentClass.maxMembers || 10} משפחות`)
      ),

      // Management section (only for managers)
      isManager && React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' },
        React.createElement('h3', { className: 'font-bold text-yellow-800 mb-3' }, '👑 ניהול החוג'),
        React.createElement('p', { className: 'text-yellow-700 text-sm mb-3' }, 
          'אתה מנהל החוג. תוכל להעביר ניהול או להוסיף מנהלים נוספים.'),
        React.createElement('div', { className: 'flex gap-2 flex-wrap' },
          React.createElement('button', { 
            onClick: () => alert('פונקציונליות בפיתוח - בקרוב תוכל להוסיף משפחות חדשות לחוג'),
            className: 'bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700'
          }, '➕ הוסף משפחה'),
          React.createElement('button', { 
            onClick: () => alert('פונקציונליות בפיתוח - ניהול הגדרות החוג'),
            className: 'bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700'
          }, '⚙️ הגדרות חוג')
        )
      ),

      // Family members list
      classMembers.length > 0 ? React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200' },
        React.createElement('h3', { className: 'font-bold p-4 border-b border-gray-200' }, 
          `👨‍👩‍👧‍👦 משפחות בחוג (${classMembers.length})`),
        
        ...classMembers.map(family => {
          const isCurrentManager = currentClass.managers && currentClass.managers.includes(family.id);
          
          return React.createElement('div', { 
            key: family.id,
            className: 'p-4 border-b border-gray-100 last:border-b-0'
          },
            React.createElement('div', { className: 'flex justify-between items-start' },
              React.createElement('div', { className: 'flex-1' },
                React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                  React.createElement('h4', { className: 'font-medium' }, family.name),
                  isCurrentManager && React.createElement('span', { 
                    className: 'px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full'
                  }, '👑 מנהל')
                ),
                React.createElement('div', { className: 'text-sm text-gray-600 space-y-1' },
                  React.createElement('div', null, `📞 ${family.phone}`),
                  React.createElement('div', null, `👶 ${family.children} ילדים`),
                  React.createElement('div', null, `📅 פעיל לאחרונה: ${family.lastActive}`)
                )
              ),
              
              // Management actions (only for current managers)
              isManager && family.id !== userFamily.id && React.createElement('div', { 
                className: 'flex flex-col gap-1'
              },
                !isCurrentManager && React.createElement('button', { 
                  onClick: () => handleTransferManagement(family.id),
                  className: 'bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700'
                }, '🔄 העבר ניהול'),
                
                !isCurrentManager && React.createElement('button', { 
                  onClick: () => handleAddManager(family.id),
                  className: 'bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700'
                }, '➕ הוסף כמנהל'),
                
                isCurrentManager && currentClass.managers.length > 1 && React.createElement('button', { 
                  onClick: () => handleRemoveManager(family.id),
                  className: 'bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700'
                }, '➖ הסר מניהול')
              )
            )
          );
        })
      ) : React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('p', { className: 'text-gray-600 text-center' }, 
          '🔍 אין משפחות בחוג זה כרגע.\nהוסף משפחות כדי להתחיל.')
      )
    );
  };

  // User Guide Component
  const UserGuidePage = () => {
    const guideSection = [
      {
        id: 'overview',
        title: '🏠 סקירה כללית',
        content: '**ברוכים הבאים לאפליקציית הסעות החוג!**\n\nהאפליקציה מיועדת לעזור למשפחות לתאם הסעות לחוגים בצורה הוגנת ויעילה.\n\n**עקרונות עבודה:**\n• כל משפחה ממלאה זמינות שבועית\n• המערכת יוצרת שיבוץ אוטומטי והוגן\n• עוזר חכם מעבד שינויים מהמאמן\n• מעקב אחר איזון הנסיעות בין המשפחות\n\n**התחלה מהירה:**\n1. מלא פרטים אישיים בהגדרות\n2. הוסף ילדים וחוגים\n3. מלא זמינות שבועית\n4. קבל שיבוץ אוטומטי'
      },
      {
        id: 'home',
        title: '🏠 מסך הבית',
        content: '**מסך הבית - מרכז הבקרה שלך**\n\n**סטטיסטיקות מהירות:**\n• מספר החוגים הפעילים במשפחה\n• מספר הילדים\n• מספר המשימות השבוע\n\n**התראות חשובות:**\n• תזכורות למילוי זמינות\n• שיבוצים חדשים\n• שינויים בחוגים\n• ימי הולדת של ילדים מהחוגים\n\n**רשימת ילדים וחוגים:**\n• לחיצה על חוג מעבירה לניהול החוג הספציפי\n• כפתור הוסף חוג לכל ילד\n• כפתור הוסף ילד למשפחה'
      },
      {
        id: 'assistant',
        title: '🤖 עוזר החוגים',
        content: '**העוזר החכם שלך לניהול שינויים**\n\n**איך זה עובד:**\n1. המאמן שולח הודעה בקבוצת הוואטסאפ או שיש לך מצב חירום\n2. העתק והדבק את ההודעה בעוזר או כתוב על המצב\n3. העוזר מזהה את השינוי ומגיב בהתאם\n4. במקרי חירום - פעולה מיידית, במקרים רגילים - מילוי זמינות מחדש\n\n**🚨 מצבי חירום (טיפול מיידי):**\n• הורה חולה ולא יכול להסיע/לאסוף\n• ילד חולה ולא יכול להגיע לחוג\n• מצבי חירום משפחתיים\n• תקלות ברכב בזמן אמת\n\n**📅 שינויים מתוכננים (דרך מילוי זמינות):**\n• ביטולי חוגים מהמאמן\n• שינויי שעות קבועים\n• שינויי מיקום\n• בקשות החלפה מתוכננות מראש\n• לוחות זמנים חדשים'
      }
    ];

    const currentSection = guideSection.find(section => section.id === userGuideSection) || guideSection[0];

    return React.createElement('div', { className: 'space-y-6', dir: 'rtl' },
      React.createElement('h2', { className: 'text-xl font-bold' }, '📖 מדריך למשתמש'),
      
      // Section Navigation
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-medium mb-3' }, 'בחר נושא:'),
        React.createElement('div', { className: 'grid grid-cols-1 gap-2' },
          guideSection.map(section =>
            React.createElement('button', {
              key: section.id,
              onClick: () => setUserGuideSection(section.id),
              className: 'p-2 text-sm rounded-lg border transition-colors ' + (
                userGuideSection === section.id
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              )
            }, section.title)
          )
        )
      ),

      // Current Section Content
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-6' },
        React.createElement('h3', { className: 'text-lg font-bold mb-4 text-blue-800' }, currentSection.title),
        
        React.createElement('div', { className: 'prose prose-sm max-w-none' },
          currentSection.content.trim().split('\n').map((line, index) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return React.createElement('h4', { key: index, className: 'font-semibold text-gray-800 mt-4 mb-2' },
                line.replace(/\*\*/g, '')
              );
            } else if (line.startsWith('• ')) {
              return React.createElement('li', { key: index, className: 'text-gray-700 mb-1 mr-4' },
                line.substring(2)
              );
            } else if (line.trim() === '') {
              return React.createElement('br', { key: index });
            } else {
              return React.createElement('p', { key: index, className: 'text-gray-700 mb-2' }, line);
            }
          })
        )
      ),

      // Quick Access
      React.createElement('div', { className: 'bg-green-50 border border-green-200 rounded-lg p-4' },
        React.createElement('h3', { className: 'font-medium text-green-800 mb-2' }, '🚀 גישה מהירה'),
        React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
          React.createElement('button', {
            onClick: () => setCurrentView('family-home'),
            className: 'p-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200'
          }, 'לך לבית'),
          React.createElement('button', {
            onClick: () => setCurrentView('waiting-room'),
            className: 'p-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200'
          }, 'חדר המתנה'),
          React.createElement('button', {
            onClick: () => setCurrentView('settings'),
            className: 'p-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200'
          }, 'לך להגדרות'),
          React.createElement('button', {
            onClick: () => setCurrentView('chatbot'),
            className: 'p-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200'
          }, 'לך לעוזר')
        )
      )
    );
  };

  // Main render - RADICAL MOBILE FIX v1.0.9 - COMPLETE RESTRUCTURE
  return React.createElement('div', { 
    className: 'radical-mobile-container',
    style: { 
      maxWidth: '448px',
      margin: '0 auto',
      backgroundColor: '#f9fafb',
      paddingBottom: '140px',
      // Production ready - no debug borders
    }
  },
    React.createElement('div', { className: 'p-4' },
      currentView === 'family-home' && React.createElement(FamilyHomePage),
      currentView === 'class-home' && React.createElement(ClassHomePage),
      currentView === 'availability' && React.createElement(AvailabilityPage),
      currentView === 'class-families' && React.createElement(ClassFamiliesPage),
      currentView === 'waiting-room' && React.createElement(WaitingRoomPage),
      currentView === 'create-group' && React.createElement(CreateGroupPage),
      currentView === 'settings' && React.createElement(SettingsPage),
      currentView === 'chatbot' && React.createElement(ChatBotPage),
      currentView === 'user-guide' && React.createElement(UserGuidePage),
      currentView === 'class-add-edit' && React.createElement(ClassAddEditPage),
      currentView === 'add-child' && React.createElement(AddChildPage),
      showAdminLogin && React.createElement(AdminLogin),
      currentView === 'admin-dashboard' && React.createElement(AdminDashboard),
      currentView === 'admin-families' && React.createElement(AdminFamiliesPage),
      currentView === 'admin-classes' && React.createElement(AdminClassesPage),
      currentView === 'admin-reports' && React.createElement(AdminReportsPage)
    ),
    
    React.createElement(Navigation)
  );
};

// Render the app
const root = ReactDOM.createRoot ? ReactDOM.createRoot(document.getElementById('root')) : null;
if (root) {
  root.render(React.createElement(App));
} else {
  ReactDOM.render(React.createElement(App), document.getElementById('root'));
}