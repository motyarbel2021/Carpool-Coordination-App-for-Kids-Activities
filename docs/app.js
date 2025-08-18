const { useState, useEffect } = React;

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [families, setFamilies] = useState([]);
  const [classes, setClasses] = useState([]);
  
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

  // Home Page
  const HomePage = () => (
    React.createElement('div', { className: 'p-6 space-y-6', dir: 'rtl' },
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
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
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
          className: 'bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700'
        },
          React.createElement('div', { className: 'text-center' },
            React.createElement('div', { className: 'text-2xl mb-2' }, '👨‍👩‍👧‍👦'),
            React.createElement('div', { className: 'font-medium' }, 'הוסף משפחה')
          )
        ),
        React.createElement('button', {
          onClick: () => setCurrentView('create-class'),
          className: 'bg-green-600 text-white p-4 rounded-lg hover:bg-green-700'
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
    React.createElement('div', { className: 'p-6 space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-2xl font-bold' }, '👨‍👩‍👧‍👦 יצירת פרופיל משפחה'),
        React.createElement('button', {
          onClick: () => setCurrentView('home'),
          className: 'text-gray-600 hover:text-gray-800 px-3 py-1 rounded'
        }, '← חזור')
      ),

      React.createElement('div', { className: 'bg-white rounded-lg border-2 border-gray-200 p-6 space-y-4' },
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'שם המשפחה *'),
          React.createElement('input', {
            type: 'text',
            value: newFamily.name,
            onChange: (e) => setNewFamily(prev => ({...prev, name: e.target.value})),
            className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
            placeholder: 'לדוגמה: משפחת כהן'
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'שם הורה ראשי *'),
          React.createElement('input', {
            type: 'text',
            value: newFamily.parent,
            onChange: (e) => setNewFamily(prev => ({...prev, parent: e.target.value})),
            className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
            placeholder: 'שם מלא'
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'טלפון'),
          React.createElement('input', {
            type: 'tel',
            value: newFamily.phone,
            onChange: (e) => setNewFamily(prev => ({...prev, phone: e.target.value})),
            className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
            placeholder: '050-1234567'
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'אימייל'),
          React.createElement('input', {
            type: 'email',
            value: newFamily.email,
            onChange: (e) => setNewFamily(prev => ({...prev, email: e.target.value})),
            className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
            placeholder: 'email@example.com'
          })
        )
      ),

      React.createElement('button', {
        onClick: createFamily,
        className: 'w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700'
      }, '✅ צור פרופיל משפחה')
    )
  );

  // Create Class Page
  const CreateClassPage = () => (
    React.createElement('div', { className: 'p-6 space-y-6', dir: 'rtl' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('h2', { className: 'text-2xl font-bold' }, '⚽ יצירת חוג חדש'),
        React.createElement('button', {
          onClick: () => setCurrentView('home'),
          className: 'text-gray-600 hover:text-gray-800 px-3 py-1 rounded'
        }, '← חזור')
      ),

      families.length === 0 && React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' },
        React.createElement('p', { className: 'text-yellow-700' }, '⚠️ כדי ליצור חוג, תחילה צור פרופיל משפחה'),
        React.createElement('button', {
          onClick: () => setCurrentView('create-family'),
          className: 'mt-2 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700'
        }, 'צור פרופיל משפחה')
      ),

      React.createElement('div', { className: 'bg-white rounded-lg border-2 border-gray-200 p-6 space-y-4' },
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'שם החוג *'),
          React.createElement('input', {
            type: 'text',
            value: newClass.name,
            onChange: (e) => setNewClass(prev => ({...prev, name: e.target.value})),
            className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
            placeholder: 'לדוגמה: כדורגל מכבי'
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'מיקום החוג *'),
          React.createElement('input', {
            type: 'text',
            value: newClass.location,
            onChange: (e) => setNewClass(prev => ({...prev, location: e.target.value})),
            className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
            placeholder: 'לדוגמה: מגרש בפארק הירוק'
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'מספר משפחות מקסימלי'),
          React.createElement('input', {
            type: 'number',
            value: newClass.maxMembers,
            onChange: (e) => setNewClass(prev => ({...prev, maxMembers: parseInt(e.target.value) || 8})),
            className: 'w-full p-3 border border-gray-300 rounded-lg text-right',
            min: '2',
            max: '20'
          })
        )
      ),

      React.createElement('button', {
        onClick: createClass,
        disabled: families.length === 0,
        className: 'w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400'
      }, '🚀 צור חוג חדש')
    )
  );

  // Navigation
  const Navigation = () => (
    React.createElement('div', { className: 'fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-2' },
      React.createElement('div', { className: 'flex justify-around max-w-md mx-auto', dir: 'rtl' },
        React.createElement('button', {
          onClick: () => setCurrentView('home'),
          className: `flex flex-col items-center py-2 px-4 rounded-lg ${currentView === 'home' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`
        },
          React.createElement('div', { className: 'text-xl mb-1' }, '🏠'),
          React.createElement('span', { className: 'text-xs' }, 'בית')
        ),
        React.createElement('button', {
          onClick: () => setCurrentView('create-family'),
          className: `flex flex-col items-center py-2 px-4 rounded-lg ${currentView === 'create-family' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`
        },
          React.createElement('div', { className: 'text-xl mb-1' }, '👨‍👩‍👧‍👦'),
          React.createElement('span', { className: 'text-xs' }, 'משפחה')
        ),
        React.createElement('button', {
          onClick: () => setCurrentView('create-class'),
          className: `flex flex-col items-center py-2 px-4 rounded-lg ${currentView === 'create-class' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`
        },
          React.createElement('div', { className: 'text-xl mb-1' }, '⚽'),
          React.createElement('span', { className: 'text-xs' }, 'חוג')
        )
      )
    )
  );

  return React.createElement('div', { className: 'min-h-screen bg-gray-100 pb-16', dir: 'rtl' },
    React.createElement('div', { className: 'max-w-4xl mx-auto' },
      currentView === 'home' && React.createElement(HomePage),
      currentView === 'create-family' && React.createElement(CreateFamilyPage),
      currentView === 'create-class' && React.createElement(CreateClassPage)
    ),
    React.createElement(Navigation)
  );
};

// App startup
console.log('🚀 Hebrew Transport App v2.1 - Final Clean Version Starting...');

const root = ReactDOM.createRoot ? ReactDOM.createRoot(document.getElementById('root')) : null;
if (root) {
  root.render(React.createElement(App));
} else {
  ReactDOM.render(React.createElement(App), document.getElementById('root'));
}