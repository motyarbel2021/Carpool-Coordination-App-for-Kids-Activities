const { useState, useEffect } = React;

// Icon Components (using Font Awesome classes instead of Lucide)
const Icon = ({ name, className = "w-5 h-5" }) => (
  React.createElement('i', { 
    className: name + ' ' + className,
    'aria-hidden': 'true' 
  })
);

const App = () => {
  const [currentView, setCurrentView] = useState('family-home');

  // נתוני המשפחה והילדים עם החוגים שלהם
  const familyData = {
    familyName: 'משפחת כהן',
    parents: {
      parent1: { name: 'יוסי', phone: '050-123-4567', email: 'yossi@gmail.com' },
      parent2: { name: 'רחל', phone: '052-987-6543', email: 'rachel@gmail.com' }
    },
    children: [
      {
        id: 1,
        name: 'דני כהן',
        birthDate: '2012-08-15',
        phone: '050-111-2222',
        address: 'רח׳ הרצל 123, תל אביב',
        classes: [
          {
            id: 1,
            name: 'כדורסל',
            location: 'בית ספר רמת אביב',
            address: 'רח׳ הרצל 45, תל אביב',
            schedule: 'ראשון, שלישי, חמישי 16:00-17:30',
            coach: 'דוד כהן - 052-987-6543'
          }
        ]
      }
    ]
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

  // Family Home Page Component
  const FamilyHomePage = () => {
    return React.createElement('div', { className: 'space-y-6 p-4', dir: 'rtl' },
      // Header
      React.createElement('div', { className: 'bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white' },
        React.createElement('h1', { className: 'text-2xl font-bold mb-2' }, 'שלום, ' + familyData.familyName + '!'),
        React.createElement('p', { className: 'text-blue-100' }, 'ניהול חוגים וקואורדינציה')
      ),

      // בדיקת גלילה - קוביות צבעוניות
      React.createElement('div', { className: 'space-y-4' },
        React.createElement('h2', { className: 'text-xl font-bold' }, '🧪 בדיקת גלילה - גירסה 1.0.9'),
        
        // 20 קוביות צבעוניות לבדיקת גלילה
        Array.from({length: 20}, (_, i) => 
          React.createElement('div', { 
            key: i,
            className: `p-6 rounded-lg text-white font-bold text-center text-xl`,
            style: { 
              backgroundColor: `hsl(${i * 18}, 70%, 50%)`,
              minHeight: '100px'
            }
          },
            `קוביה מספר ${i + 1}`,
            React.createElement('div', { className: 'text-sm mt-2' }, 
              `אם אתה רואה את זה - הגלילה עובדת!`
            )
          )
        )
      ),

      // הודעת הצלחה
      React.createElement('div', { className: 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded' },
        React.createElement('strong', { className: 'font-bold' }, '✅ מצוין! '),
        React.createElement('span', { className: 'block sm:inline' }, 
          'אם אתה רואה את ההודעה הזו - הגלילה פועלת כמו שצריך! 🎉'
        )
      ),

      // פרטי המשפחה
      React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-4' },
        React.createElement('h3', { className: 'font-semibold mb-4 flex items-center' },
          React.createElement(Icon, { name: 'fas fa-users', className: 'w-5 h-5 ml-2 text-blue-500' }),
          'הילדים והחוגים שלהם'
        ),
        
        familyData.children.map(child => {
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
                  className: 'bg-gray-50 border border-gray-200 rounded-lg p-4'
                },
                  React.createElement('div', { className: 'font-medium text-blue-600' }, classItem.name),
                  React.createElement('div', { className: 'text-sm text-gray-600 mt-1' }, classItem.location),
                  React.createElement('div', { className: 'text-sm text-gray-500' }, classItem.schedule)
                )
              )
            )
          );
        })
      )
    );
  };

  // Navigation Component  
  const Navigation = () => {
    return React.createElement('div', { 
      className: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2', 
      dir: 'rtl' 
    },
      React.createElement('div', { className: 'flex justify-center' },
        React.createElement('button', {
          className: 'flex flex-col items-center py-2 px-3 rounded-lg text-blue-600 bg-blue-50'
        },
          React.createElement(Icon, { name: 'fas fa-home', className: 'w-5 h-5 mb-1' }),
          React.createElement('span', { className: 'text-xs' }, 'בית')
        )
      )
    );
  };

  // Main render - SUPER SIMPLE MOBILE SCROLL TEST v1.0.9
  return React.createElement('div', { 
    style: { 
      maxWidth: '448px',
      margin: '0 auto',
      backgroundColor: '#f9fafb',
      minHeight: '100vh',
      border: '4px solid lime', // ירוק בהיר - סימן שהגירסה החדשה נטענה
      paddingBottom: '80px'
    }
  },
    React.createElement(FamilyHomePage),
    React.createElement(Navigation)
  );
};

// Initialize App
console.log('🧪 MOBILE SCROLL TEST v1.0.9 - Simple approach');
ReactDOM.render(React.createElement(App), document.getElementById('app'));
