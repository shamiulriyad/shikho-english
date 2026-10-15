# AI-Powered English Grammar Learning Platform

## Project Overview

A comprehensive full-stack application for learning English grammar, specifically focusing on articles (a, an, the). The platform leverages AI (OpenAI GPT-3.5) to provide intelligent grammar correction and feedback.

## Architecture

### Clean Architecture Principles

```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation Layer                    │
│                    (React Components & Pages)                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│              (Services, Context, Hooks, Utils)               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        API Layer (REST)                      │
│                HTTP Communication (JSON)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Controllers                         │
│                 (ASP.NET Core Controllers)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│                    (Services, Repositories)                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│                 (Entity Framework Core DbContext)            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        Database Layer                        │
│                    (PostgreSQL Database)                     │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **Framework**: ASP.NET Core 10.0
- **Database**: PostgreSQL
- **ORM**: Entity Framework Core
- **Authentication**: JWT (JSON Web Tokens)
- **AI**: OpenAI API (GPT-3.5-turbo)
- **HTTP**: REST API

### Frontend
- **Library**: React 18
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Fetch API

### DevOps
- **Backend**: Running on port 5000 (HTTP) / 7000 (HTTPS)
- **Frontend**: Running on port 3000

## Project Structure

### Backend Structure

```
Backend/
├── Controllers/           # HTTP request handlers
│   ├── AuthController.cs
│   ├── PracticeController.cs
│   └── QuizController.cs
├── Services/             # Business logic layer
│   ├── AuthService.cs
│   ├── JwtTokenService.cs
│   ├── GrammarPracticeService.cs
│   ├── OpenAIService.cs
│   └── QuizService.cs
├── Repositories/         # Data access layer
│   ├── IBaseRepository.cs
│   ├── BaseRepository.cs
│   ├── UserRepository.cs
│   ├── GrammarPracticeRepository.cs
│   └── QuizRepository.cs
├── Models/              # Domain entities
│   ├── User.cs
│   ├── GrammarPractice.cs
│   ├── Quiz.cs
│   ├── QuizQuestion.cs
│   └── UserProgress.cs
├── DTOs/                # Data transfer objects
│   ├── UserRegisterDto.cs
│   ├── UserLoginDto.cs
│   ├── AuthResponseDto.cs
│   ├── PracticeRequestDto.cs
│   ├── PracticeResponseDto.cs
│   ├── QuizDto.cs
│   └── UserProgressDto.cs
├── Data/                # Database context
│   └── AppDbContext.cs
├── Config/              # Configuration
├── Middlewares/         # Custom middleware
├── Utilities/           # Helper utilities
├── appsettings.json     # Configuration file
└── Program.cs           # Application entry point
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Navbar.js
│   │   ├── LoginForm.js
│   │   ├── RegisterForm.js
│   │   ├── PracticeSentenceInput.js
│   │   ├── PracticeHistory.js
│   │   ├── QuizComponent.js
│   │   └── ProgressDashboard.js
│   ├── pages/           # Page components
│   │   ├── HomePage.js
│   │   ├── LoginPage.js
│   │   ├── RegisterPage.js
│   │   ├── PracticePage.js
│   │   ├── QuizPage.js
│   │   └── ProgressPage.js
│   ├── context/         # Global state (Context API)
│   │   ├── AuthContext.js
│   │   └── PracticeContext.js
│   ├── services/        # API service calls
│   ├── utils/           # Helper functions
│   │   ├── api.js
│   │   └── helpers.js
│   ├── hooks/           # Custom React hooks
│   │   └── useRequireAuth.js
│   ├── styles/          # Global styles
│   ├── App.js
│   └── index.js
└── package.json
```

## Core Features

### 1. User Authentication
- User registration with email, username, password, and full name
- Secure login with JWT token generation
- Token stored in localStorage for persistence
- Password hashing using SHA256

### 2. Grammar Practice System
- Submit sentences for AI-based grammar checking
- Focuses on article usage (a, an, the)
- Receive detailed feedback including:
  - Corrected sentence
  - List of mistakes with explanations
  - Grammar rules
- Practice history tracking

### 3. AI-Powered Correction
- Integration with OpenAI GPT-3.5-turbo
- Natural language processing for sentence analysis
- Context-aware corrections specific to articles
- Detailed explanations of grammar rules

### 4. Interactive Quiz System
- AI-generated quiz questions
- Multiple-choice format (a, an, the)
- Real-time feedback on answers
- Score tracking and performance metrics
- Quiz history

### 5. User Progress Tracking
- Total practices completed
- Accuracy percentage
- Quiz performance metrics
- Learning statistics dashboard
- Historical data for analysis

### 6. User Profile Management
- User registration and login
- Profile information storage
- Last login tracking
- Account activation/deactivation

## API Endpoints

### Authentication
```
POST   /api/auth/register   - Register new user
POST   /api/auth/login      - Login user
```

### Grammar Practice
```
POST   /api/practice/submit    - Submit sentence for correction
GET    /api/practice/history   - Get user's practice history
GET    /api/practice/progress  - Get user's progress stats
```

### Quiz
```
POST   /api/quiz/create           - Create new quiz
POST   /api/quiz/{id}/answer      - Submit quiz answer
GET    /api/quiz/{id}             - Get quiz details
GET    /api/quiz/user/all         - Get all user's quizzes
```

## Database Schema

### Users Table
- id (PK)
- email (UNIQUE)
- username (UNIQUE)
- passwordHash
- fullName
- createdAt
- updatedAt
- lastLoginAt
- isActive

### GrammarPractices Table
- id (PK)
- userId (FK)
- originalSentence
- correctedSentence
- mistakes (JSON)
- explanation
- isCorrect
- createdAt

### Quizzes Table
- id (PK)
- userId (FK)
- title
- score
- totalQuestions
- isCompleted
- createdAt
- completedAt

### QuizQuestions Table
- id (PK)
- quizId (FK)
- question
- incorrectSentence
- correctAnswer
- userAnswer
- isAnsweredCorrectly
- explanation

### UserProgress Table
- id (PK)
- userId (FK, UNIQUE)
- totalPractices
- correctPractices
- totalQuizzes
- averageQuizScore
- correctArticleCount
- totalArticleCount
- lastPracticeDate
- updatedAt

## Setup Instructions

### Prerequisites
- .NET SDK 10.0 or higher
- Node.js 16+ and npm
- PostgreSQL 12+
- OpenAI API Key

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd Backend
   dotnet restore
   ```

2. **Configure Database**
   - Update appsettings.json with PostgreSQL connection string
   - Update appsettings.Development.json for development environment

3. **Set Environment Variables**
   ```bash
   # Create .env file or use appsettings.json
   DATABASE_URL=postgresql://postgres:password@localhost:5432/learnEnglish
   JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long!!!
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Run Migrations**
   ```bash
   dotnet ef database update
   ```

5. **Run Backend**
   ```bash
   dotnet run
   ```
   Backend will be available at: http://localhost:5000

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   npm install react-router-dom
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

2. **Configure Tailwind CSS**
   - Content in `tailwind.config.js`:
     ```js
     module.exports = {
       content: [
         "./src/**/*.{js,jsx,ts,tsx}",
       ],
       theme: {
         extend: {},
       },
       plugins: [],
     }
     ```

3. **Set Environment Variables**
   ```bash
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   ```

4. **Run Frontend**
   ```bash
   npm start
   ```
   Frontend will be available at: http://localhost:3000

## Full Setup Steps Complete Example

```bash
# Clone the repository
cd learnEnglish

# Backend Setup
cd Backend
dotnet restore
# Update appsettings.json and appsettings.Development.json
# Update .env with your configuration
dotnet ef database update
dotnet run

# In another terminal - Frontend Setup
cd frontend
npm install
npm install react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm start
```

## Usage Flow

1. **User Registration**
   - Navigate to /register
   - Fill in registration form
   - System creates user and stores in database
   - JWT token generated and stored

2. **User Login**
   - Navigate to /login
   - Enter credentials
   - System validates and generates JWT

3. **Practice Grammar**
   - Navigate to /practice
   - Input sentence
   - System calls OpenAI API for correction
   - Display feedback with mistakes and explanations
   - Save practice to database

4. **Take Quiz**
   - Navigate to /quiz
   - Click "Start Quiz"
   - Answer 5 AI-generated questions
   - View results and performance

5. **View Progress**
   - Navigate to /progress
   - See statistics and learning metrics
   - Track improvement over time

## Security Considerations

### Frontend
- JWT token stored in localStorage
- Token included in Authorization header
- Protected routes using useRequireAuth hook
- CORS enabled for trusted origins

### Backend
- Password hashing with SHA256
- JWT authentication middleware
- Authorization checks on protected endpoints
- CORS policy configured
- Environment variables for sensitive data

## Performance Optimizations

### Frontend
- React Context for state management (avoids prop drilling)
- Custom hooks for reusable logic
- Lazy loading of pages if needed
- Tailwind CSS for optimized styling

### Backend
- Async/await for non-blocking operations
- Entity Framework lazy loading configuration
- Database indexes on frequently queried columns
- Caching strategies for OpenAI responses (future enhancement)

## Future Enhancements

1. **Advanced Features**
   - PDF export of progress reports
   - Email notifications for achievements
   - Mobile app using React Native
   - Real-time chat with AI tutor

2. **Improvements**
   - Caching OpenAI responses
   - Machine learning for personalized learning paths
   - Social features (friend leaderboards)
   - Advanced analytics dashboard

3. **Scalability**
   - Redis caching layer
   - Database query optimization
   - Load balancing for multiple servers
   - CDN for static assets

## Troubleshooting

### Database Connection Issues
```
Error: Unable to connect to PostgreSQL
Solution: 
1. Ensure PostgreSQL is running
2. Check connection string in appsettings.json
3. Verify database exists
```

### OpenAI API Errors
```
Error: 401 Unauthorized
Solution: 
1. Verify OpenAI API key in appsettings.json
2. Check API key has valid credits
3. Confirm API key permissions
```

### CORS Issues
```
Error: Access to XMLHttpRequest... blocked by CORS
Solution:
1. Ensure CORS is configured in Program.cs
2. Check AllowedOrigins includes http://localhost:3000
3. Verify frontend URL matches CORS settings
```

## Dependencies

### Backend
- Microsoft.EntityFrameworkCore.PostgreSQL
- Microsoft.AspNetCore.Authentication.JwtBearer
- System.IdentityModel.Tokens.Jwt

### Frontend
- react-router-dom
- tailwindcss
- postcss
- autoprefixer

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and questions, please create an issue in the repository.
