const { useState, useEffect } = React;

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [families, setFamilies] = useState([]);
  const [classes, setClasses] = useState([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const [newFamily, setNewFamily] = useState({
    name: '',
    parent: '',
    phone: '',
    email: ''
  });

  const [newClass, setNewClass] = useState({
    name: '',
    location: '',
    maxMembers: 8
  });

  // Handle keyboard visibility
  useEffect(() => {
    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.clientHeight;
      
      // If window is significantly smaller than normal, keyboard is probably open
      setKeyboardVisible(windowHeight < documentHeight * 0.75);
    };

    const handleFocusIn = () => {
      setKeyboardVisible(true);
      // Scroll to focused element after a short delay
      setTimeout(() => {
        const focused = document.activeElement;
        if (focused && focused.scrollIntoView) {
          focused.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 300);
    };

    const handleFocusOut = () => {
      setKeyboardVisible(false);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Create family
  const createFamily = () => {
    if (!newFamily.name || !newFamily.parent) {
      alert('אנא מלא שם משפחה ושם הורה');
      return;
    }
    
    const family = {
      id: Date.now(),
      name: newFamily.name,
      parent: newFamily.parent,
      phone: newFamily.phone,
      email: newFamily.email,
      createdAt: new Date().toLocaleDateString('he-IL')
    };
    
    setFamilies(prev => [...prev, family]);
    setNewFamily({ name: '', parent: '', phone: '', email: '' });
    alert(`✅ משפחת ${family.name} נוצרה בהצלחה!`);
    setCurrentView('home');
  };

  // Create class
  const createClass = () => {
    if (!newClass.name || !newClass.location) {
      alert('אנא מלא שם חוג ומיקום');
      return;
    }

    if (families.length === 0) {
      alert('צור קודם פרופיל משפחה');
      setCurrentView('create-family');
      return;
    }
    
    const classObj = {
      id: Date.now(),
      name: newClass.name,
      location: newClass.location,
      maxMembers: newClass.maxMembers,
      currentMembers: 1,
      manager: families[0].name,
      createdAt: new Date().toLocaleDateString('he-IL')
    };
    
    setClasses(prev => [...prev, classObj]);
    setNewClass({ name: '', location: '', maxMembers: 8 });
    alert(`✅ חוג "${classObj.name}" נוצר בהצלחה! אתה המנהל.`);
    setCurrentView('home');
  };

  // Enhanced Input Component with mobile keyboard support
  const MobileInput = ({ label, type = 'text', value, onChange, placeholder, required = false }) => (
    React.createElement('div', { className: 'mb-4' },
      React.createElement('label', { 
        className: 'block text-sm font-medium mb-2 text-gray-700' 
      }, 
        label,
        required && React.createElement('span', { className: 'text-red-500 mr-1' }, '*')
      ),
      React.createElement('input', {
        type: type,
        value: value,
        onChange: onChange,
        className: 'w-full p-4 border-2 border-gray-300 rounded-lg text-right bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-base',
        placeholder: placeholder,
        style: {
          fontSize: '16px', // Prevents zoom on iOS
          minHeight: '48px', // Good touch target
          WebkitAppearance: 'none', // Remove iOS styling
          borderRadius: '8px'
        }
      })
    )
  );

  // Home Page
  const HomePage = () => (
    React.createElement('div', { 
      className: `p-4 space-y-6 transition-all duration-300 ${keyboardVisible ? 'pb-4' : 'pb-20'}`,
      dir: 'rtl' 
    },
      // Header
      React.createElement('div', { className: 'text-center bg-blue-600 text-white p-6 rounded-lg' },
        React.createElement('h1', { className: 'text-3xl font-bold mb-2' }, '🚌 ניהול הסעות החוג'),
        React.createElement('p', { className: 'text-blue-100' }, 'מערכת דינמית לניהול חוגים ומשפחות')
      ),

      // Welcome message for new users
      families.length === 0 ? (
        React.createElement('div', { className: 'bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center' },
          React.createElement('h2', { className: 'text-xl font-bold text-yellow-800 mb-3' }, '👋 ברוכים הבאים!'),
          React.createElement('p', { className: 'text-yellow-700 mb-4' }, 'זוהי האפליקציה החדשה לניהול הסעות. כדי להתחיל:'),
          React.createElement('div', { className: 'space-y-2 mb-4 text-yellow-600' },
            React.createElement('div', null, '1️⃣ צור פרופיל משפחה'),
            React.createElement('div', null, '2️⃣ צור חוג חדש'),
            React.createElement('div', null, '3️⃣ נהל הסעות')
          ),
          React.createElement('button', {
            onClick: () => setCurrentView('create-family'),
            className: 'bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium'
          }, '🚀 התחל עכשיו')
        )
      ) : (
        // Family & Classes Summary
        React.createElement('div', { className: 'grid grid-cols-1 gap-6' },
          // Family Info
          React.createElement('div', { className: 'bg-white rounded-lg border-2 border-gray-200 p-4' },
            React.createElement('h2', { className: 'font-bold text-lg mb-3' }, '👨‍👩‍👧‍👦 המשפחה שלי'),
            families.map(family => 
              React.createElement('div', { key: family.id, className: 'bg-gray-50 p-3 rounded mb-2' },
                React.createElement('div', { className: 'font-medium' }, family.name),
                React.createElement('div', { className: 'text-sm text-gray-600' }, `הורה: ${family.parent}`),
                React.createElement('div', { className: 'text-sm text-gray-600' }, `טלפון: ${family.phone}`),
                React.createElement('div', { className: 'text-sm text-gray-500' }, `נוצר: ${family.createdAt}`)
              )
            )
          ),

          // Classes Info  
          React.createElement('div', { className: 'bg-white rounded-lg border-2 border-gray-200 p-4' },
            React.createElement('h2', { className: 'font-bold text-lg mb-3' }, '⚽ החוגים שלי'),
            classes.length === 0 ? (
              React.createElement('div', { className: 'text-center text-gray-500 py-4' },
                React.createElement('div', { className: 'text-3xl mb-2' }, '📚'),
                React.createElement('p', null, 'עדיין אין חוגים'),
                React.createElement('button', {
                  onClick: () => setCurrentView('create-class'),
                  className: 'mt-2 text-blue-600 hover:text-blue-700 font-medium'
                }, 'צור חוג ראשון')
              )
            ) : (
              classes.map(classObj => 
                React.createElement('div', { key: classObj.id, className: 'bg-green-50 p-3 rounded mb-2 border border-green-200' },
                  React.createElement('div', { className: 'font-medium' }, classObj.name),
                  React.createElement('div', { className: 'text-sm text-gray-600' }, `📍 ${classObj.location}`),
                  React.createElement('div', { className: 'text-sm text-gray-600' }, `👥 ${classObj.currentMembers}/${classObj.maxMembers} משפחות`),
                  React.createElement('div', { className: 'text-sm text-green-700' }, `👑 מנהל: ${classObj.manager}`)
                )
              )
            )
          )
        )
      ),

      // Quick Actions
      React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
        React.createElement('button', {
          onClick: () => setCurrentView('create-family'),
          className: 'bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 touch-manipulation'
        },
          React.createElement('div', { className: 'text-center' },
            React.createElement('div', { className: 'text-2xl mb-2' }, '👨‍👩‍👧‍👦'),
            React.createElement('div', { className: 'font-medium' }, 'הוסף משפחה')
          )
        ),
        React.createElement('button', {
          onClick: () => setCurrentView('create-class'),
          className: 'bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 touch-manipulation'
        },
          React.createElement('div', { className: 'text-center' },
            React.createElement('div', { className: 'text-2xl mb-2' }, '⚽'),
            React.createElement('div', { className: 'font-medium' }, 'צור חוג חדש')
          )
        )
      ),

      // Stats
      React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
        React.createElement('h3', { className: 'font-medium mb-3' }, '📊 סטטיסטיקות'),
        React.createElement('div', { className: 'grid grid-cols-3 gap-4 text-center' },
          React.createElement('div', null,
            React.createElement('div', { className: 'text-2xl font-bold text-blue-600' }, families.length),
            React.createElement('div', { className: 'text-sm text-gray-600' }, 'משפחות')
          ),
          React.createElement('div', null,
            React.createElement('div', { className: 'text-2xl font-bold text-green-600' }, classes.length),
            React.createElement('div', { className: 'text-sm text-gray-600' }, 'חוגים')
          ),
          React.createElement('div', null,
            React.createElement('div', { className: 'text-2xl font-bold text-purple-600' }, '🎯'),
            React.createElement('div', { className: 'text-sm text-gray-600' }, 'מערכת דינמית')
          )
        )
      )
    )
  );

  // Create Family Page
  const CreateFamilyPage = () => (
    React.createElement('div', { 
      className: `p-4 space-y-6 transition-all duration-300 ${keyboardVisible ? 'pb-4' : 'pb-20'}`,
      dir: 'rtl' 
    },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-2xl font-bold' }, '👨‍👩‍👧‍👦 יצירת פרופיל משפחה'),
        React.createElement('button', {
          onClick: () => setCurrentView('home'),
          className: 'text-gray-600 hover:text-gray-800 px-3 py-2 rounded touch-manipulation'
        }, '← חזור')
      ),

      React.createElement('div', { className: 'bg-white rounded-lg border-2 border-gray-200 p-6' },
        React.createElement(MobileInput, {
          label: 'שם המשפחה',
          value: newFamily.name,
          onChange: (e) => setNewFamily(prev => ({...prev, name: e.target.value})),
          placeholder: 'לדוגמה: משפחת כהן',
          required: true
        }),
        React.createElement(MobileInput, {
          label: 'שם הורה ראשי',
          value: newFamily.parent,
          onChange: (e) => setNewFamily(prev => ({...prev, parent: e.target.value})),
          placeholder: 'שם מלא',
          required: true
        }),
        React.createElement(MobileInput, {
          label: 'טלפון',
          type: 'tel',
          value: newFamily.phone,
          onChange: (e) => setNewFamily(prev => ({...prev, phone: e.target.value})),
          placeholder: '050-1234567'
        }),
        React.createElement(MobileInput, {
          label: 'אימייל',
          type: 'email',
          value: newFamily.email,
          onChange: (e) => setNewFamily(prev => ({...prev, email: e.target.value})),
          placeholder: 'email@example.com'
        })
      ),

      React.createElement('button', {
        onClick: createFamily,
        className: 'w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 touch-manipulation',
        style: { minHeight: '48px', fontSize: '16px' }
      }, '✅ צור פרופיל משפחה')
    )
  );

  // Create Class Page
  const CreateClassPage = () => (
    React.createElement('div', { 
      className: `p-4 space-y-6 transition-all duration-300 ${keyboardVisible ? 'pb-4' : 'pb-20'}`,
      dir: 'rtl' 
    },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-2xl font-bold' }, '⚽ יצירת חוג חדש'),
        React.createElement('button', {
          onClick: () => setCurrentView('home'),
          className: 'text-gray-600 hover:text-gray-800 px-3 py-2 rounded touch-manipulation'
        }, '← חזור')
      ),

      families.length === 0 && React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' },
        React.createElement('p', { className: 'text-yellow-700' }, '⚠️ כדי ליצור חוג, תחילה צור פרופיל משפחה'),
        React.createElement('button', {
          onClick: () => setCurrentView('create-family'),
          className: 'mt-2 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 touch-manipulation'
        }, 'צור פרופיל משפחה')
      ),

      React.createElement('div', { className: 'bg-white rounded-lg border-2 border-gray-200 p-6' },
        React.createElement(MobileInput, {
          label: 'שם החוג',
          value: newClass.name,
          onChange: (e) => setNewClass(prev => ({...prev, name: e.target.value})),
          placeholder: 'לדוגמה: כדורגל מכבי',
          required: true
        }),
        React.createElement(MobileInput, {
          label: 'מיקום החוג',
          value: newClass.location,
          onChange: (e) => setNewClass(prev => ({...prev, location: e.target.value})),
          placeholder: 'לדוגמה: מגרש בפארק הירוק',
          required: true
        }),
        React.createElement(MobileInput, {
          label: 'מספר משפחות מקסימלי',
          type: 'number',
          value: newClass.maxMembers,
          onChange: (e) => setNewClass(prev => ({...prev, maxMembers: parseInt(e.target.value) || 8})),
          placeholder: '8'
        })
      ),

      React.createElement('button', {
        onClick: createClass,
        disabled: families.length === 0,
        className: 'w-full bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 touch-manipulation',
        style: { minHeight: '48px', fontSize: '16px' }
      }, '🚀 צור חוג חדש')
    )
  );

  // Navigation with keyboard awareness
  const Navigation = () => (
    React.createElement('div', { 
      className: `fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-2 transition-all duration-300 ${keyboardVisible ? 'transform translate-y-full opacity-0' : 'transform translate-y-0 opacity-100'}`
    },
      React.createElement('div', { className: 'flex justify-around max-w-md mx-auto', dir: 'rtl' },
        React.createElement('button', {
          onClick: () => setCurrentView('home'),
          className: `flex flex-col items-center py-2 px-4 rounded-lg touch-manipulation ${currentView === 'home' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`,
          style: { minHeight: '48px' }
        },
          React.createElement('div', { className: 'text-xl mb-1' }, '🏠'),
          React.createElement('span', { className: 'text-xs' }, 'בית')
        ),
        React.createElement('button', {
          onClick: () => setCurrentView('create-family'),
          className: `flex flex-col items-center py-2 px-4 rounded-lg touch-manipulation ${currentView === 'create-family' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`,
          style: { minHeight: '48px' }
        },
          React.createElement('div', { className: 'text-xl mb-1' }, '👨‍👩‍👧‍👦'),
          React.createElement('span', { className: 'text-xs' }, 'משפחה')
        ),
        React.createElement('button', {
          onClick: () => setCurrentView('create-class'),
          className: `flex flex-col items-center py-2 px-4 rounded-lg touch-manipulation ${currentView === 'create-class' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`,
          style: { minHeight: '48px' }
        },
          React.createElement('div', { className: 'text-xl mb-1' }, '⚽'),
          React.createElement('span', { className: 'text-xs' }, 'חוג')
        )
      )
    )
  );

  return React.createElement('div', { 
    className: 'min-h-screen bg-gray-100',
    dir: 'rtl',
    style: { 
      minHeight: keyboardVisible ? 'auto' : '100vh'
    }
  },
    React.createElement('div', { className: 'max-w-4xl mx-auto' },
      currentView === 'home' && React.createElement(HomePage),
      currentView === 'create-family' && React.createElement(CreateFamilyPage),
      currentView === 'create-class' && React.createElement(CreateClassPage)
    ),
    React.createElement(Navigation)
  );
};

// App startup
console.log('🚀 Hebrew Transport App v2.1 - Mobile Keyboard Fix');

const root = ReactDOM.createRoot ? ReactDOM.createRoot(document.getElementById('root')) : null;
if (root) {
  root.render(React.createElement(App));
} else {
  ReactDOM.render(React.createElement(App), document.getElementById('root'));
}