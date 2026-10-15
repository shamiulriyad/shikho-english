# Frontend Code Organization Guide

## Context API Setup

The frontend uses React Context API for state management instead of Redux for simplicity.

### AuthContext
Global authentication state:
- `user` - Current logged-in user
- `token` - JWT token for API requests
- `login()` - Authenticate user
- `register()` - Create new account
- `logout()` - Clear authentication

### PracticeContext
Practice session state:
- `practices` - List of practice attempts
- `progress` - User statistics
- `submitSentence()` - Submit for correction
- `getHistory()` - Fetch practice sessions
- `getProgress()` - Get statistics

## Component Structure

### Page Components (in `/pages`)
Top-level page components that represent full pages:
- `HomePage.js` - Landing page
- `PracticePage.js` - Practice interface
- `QuizPage.js` - Quiz interface
- `ProgressPage.js` - Statistics dashboard
- `LoginPage.js` - Login form page
- `RegisterPage.js` - Registration form page

### UI Components (in `/components`)
Reusable UI components:
- `Navbar.js` - Navigation header
- `LoginForm.js` - Login form
- `RegisterForm.js` - Registration form
- `PracticeSentenceInput.js` - Practice input component
- `PracticeHistory.js` - Practice history list
- `QuizComponent.js` - Quiz interface
- `ProgressDashboard.js` - Progress statistics

## Custom Hooks

### useRequireAuth
Protects routes that require authentication:
- Redirects unauthenticated users to login
- Provides user and token to components

Pattern:
```javascript
const { user, token } = useRequireAuth();
// If not authenticated, automatically redirects to /login
```

## Utilities

### api.js
Centralized API call utility:
- Handles authorization headers
- Sets base URL
- Manages token injection

Usage:
```javascript
const data = await apiCall('/practice/submit', {
  method: 'POST',
  body: JSON.stringify({ sentence: 'text' })
});
```

### helpers.js
Common helper functions:
- `formatDate()` - Format dates consistently
- `calculateAccuracy()` - Calculate percentages
- `highlightDifferences()` - Compare original and corrected text

## Styling with Tailwind CSS

The project uses Tailwind CSS for styling:
- Responsive design with breakpoints (sm, md, lg)
- Utility classes for quick styling
- Custom color schemes for different sections
- Gradient backgrounds for visual appeal

## API Integration

Frontend communicates with backend via REST APIs:
```
http://localhost:5000/api/
├── auth/
│   ├── register (POST)
│   └── login (POST)
├── practice/
│   ├── submit (POST)
│   ├── history (GET)
│   └── progress (GET)
└── quiz/
    ├── create (POST)
    ├── {id}/answer (POST)
    ├── {id} (GET)
    └── user/all (GET)
```

All requests include JWT token in Authorization header.

## State Management Flow

```
1. User logs in via LoginForm
2. AuthContext validates credentials with backend
3. JWT token stored in localStorage
4. Token automatically included in all API requests
5. Protected pages check token via useRequireAuth
6. Context provides data to all child components
```

## Protected Routes Pattern

```javascript
function ProtectedPage() {
  const { user, token } = useRequireAuth();
  
  if (!token) {
    // User already redirected by hook
    return null;
  }
  
  return <PageContent />;
}
```

## Best Practices

1. **Use Context for Global State** - Avoid prop drilling
2. **Keep Components Focused** - Single responsibility
3. **Extract Utilities** - Reusable functions in utils folder
4. **Error Boundaries** - Handle errors gracefully
5. **Loading States** - Show feedback to users
6. **Responsive Design** - Mobile-first approach

## Performance Tips

1. **Lazy Load Pages** - Use React.lazy() if needed
2. **Memoize Components** - Use React.memo for pure components
3. **Optimize Re-renders** - Use useCallback for event handlers
4. **Lazy Load Images** - Use native lazy loading attribute
5. **Code Splitting** - Split at route level
