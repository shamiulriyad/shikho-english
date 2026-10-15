# AI-Powered English Grammar Learning Platform

## 📚 Project Overview

A complete full-stack application for learning English grammar with a focus on articles (a, an, the). The platform uses AI (Google Gemini by default, OpenAI optional) to provide intelligent grammar correction, detailed feedback, and interactive quizzes.

**Live Demo Features:**
- ✅ AI-powered grammar checking
- ✅ Detailed error explanations
- ✅ Interactive quizzes
- ✅ Progress tracking
- ✅ User authentication (JWT)
- ✅ Practice history

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│                    Tailwind CSS, Context API                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │   REST API Calls    │
                    │  (JWT Authorization)│
                    └─────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                Backend (ASP.NET Core 10)                    │
│          Controllers → Services → Repositories              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         Data Layer (Entity Framework Core)                  │
│                    PostgreSQL Database                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │ Gemini / OpenAI API │
                    │   (GPT-3.5-turbo)   │
                    └─────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Framework**: ASP.NET Core 10.0
- **Database**: PostgreSQL
- **ORM**: Entity Framework Core
- **Authentication**: JWT Tokens
- **AI Integration**: Google Gemini (default) or OpenAI, chosen by `Ai:Provider`; all calls go through the backend
- **Architecture**: Repository Pattern, Clean Architecture

### Frontend
- **Library**: React 19 + TypeScript (strict)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Testing**: Vitest + React Testing Library
- **State Management**: React Context API
- **HTTP Client**: Fetch API

### DevOps
- **Backend Server**: Port 5000 (HTTP), 7000 (HTTPS)
- **Frontend Server**: Port 3000
- **Database**: PostgreSQL on port 5432

---

## 📁 Directory Structure

```
learnEnglish/
├── Backend/                          # ASP.NET Core API
│   ├── Controllers/                  # HTTP handlers
│   ├── Services/                     # Business logic
│   ├── Repositories/                 # Data access
│   ├── Models/                       # Domain entities
│   ├── DTOs/                         # Data transfer objects
│   ├── Data/                         # DbContext configuration
│   ├── appsettings.json              # Configuration
│   └── Program.cs                    # Application entry
│
├── frontend/                         # React application
│   ├── src/
│   │   ├── components/               # UI components
│   │   ├── pages/                    # Page components
│   │   ├── context/                  # context API providers
│   │   ├── services/                 # API calls
│   │   ├── utils/                    # Helper utilities
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── App.js                    # Main App component
│   │   └── index.js                  # Entry point
│   └── package.json
│
├── SETUP_GUIDE.md                    # Complete setup guide
├── INSTALLATION_GUIDE.md             # Step-by-step installation
├── API_DOCUMENTATION.md              # API endpoints documentation
├── BACKEND_GUIDE.md                  # Backend architecture
├── FRONTEND_GUIDE.md                 # Frontend architecture
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Prerequisites
- .NET SDK 10.0+
- Node.js 16+ with npm
- PostgreSQL 12+
- Gemini API key (Google AI Studio), or an OpenAI API key

### Installation

**1. Clone and Setup Database**
```bash
# Create PostgreSQL databases
createdb learnEnglish
createdb learnEnglish_dev
```

**2. Backend Setup**
```bash
cd Backend
dotnet restore

# Secrets are never stored in appsettings*.json. Keep local ones in user-secrets:
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=learnEnglish_dev;Username=postgres;Password=<password>"
dotnet user-secrets set "Jwt:Secret" "<random value, at least 32 bytes>"
dotnet user-secrets set "Ai:Gemini:ApiKey" "<key>"   # optional in Development; AI endpoints return 503 without it

# Start backend (Development applies pending migrations on startup)
dotnet run
```

The app refuses to start if the JWT secret is missing, shorter than 32 bytes or a published placeholder.
Outside Development it also requires the selected provider's key (`Ai:Gemini:ApiKey` by default), and refuses `Database:MigrateOnStartup`.
To use OpenAI instead, set `Ai:Provider` to `OpenAI` and `Ai:OpenAI:ApiKey`.
See `Backend/.env.example` for the environment variables used in other environments.

**Run backend tests** (integration tests need Docker running; they start a throwaway PostgreSQL container)
```bash
dotnet test learnEnglish.sln
```

**3. Frontend Setup**
```bash
cd ../frontend
npm install
cp .env.example .env   # optional: VITE_API_BASE_URL defaults to http://localhost:5000/api
npm run dev            # http://localhost:3000

# Checks
npm run typecheck
npm test
npm run build          # type-checks, then writes the production bundle to dist/
```

Only `VITE_*` variables reach the browser bundle, so never put secrets in the frontend `.env`.

**4. Access Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/swagger

---

## 📋 Features

### SSC Question Analysis (core feature)
Paste an SSC English 2nd Paper grammar question (optionally with your own answer). The AI teacher returns:
- the correct answer and step-by-step reasoning
- the grammar rule and common mistakes
- feedback on your answer, if you gave one

Every explanation is stored in both English and Bangla; the page has an English / বাংলা toggle that is remembered.
AI replies are validated before they are saved (known topic, required fields, Bangla written in Bangla script, length limits);
an invalid reply is retried once with the problems listed, then the student gets a "try again" message.
Analyses are saved to the student's history, which only they can see.

### Practice Sets
From any analysed question the student can generate similar practice questions (1 to 5) and type their answers.
An answer that matches an accepted answer (ignoring case, spacing, curly quotes and a final full stop) is marked correct
straight away; any other answer is marked by the AI, which may accept an equally correct answer and explains why in English and Bangla.
If the AI is unavailable nothing is recorded, so the student can simply try again. A database concurrency check
(PostgreSQL `xmin`) stops the same question from being scored twice by parallel requests.

### 1. User Authentication
```
✓ User Registration
✓ Secure Login
✓ JWT Token Management
✓ Password Hashing
✓ Session Persistence
```

### 2. Grammar Practice
```
✓ Submit sentences for correction
✓ AI-powered analysis
✓ Identify mistakes
✓ Receive explanations
✓ Practice history tracking
```

### 3. AI Integration
```
✓ Gemini integration (OpenAI available as an alternative provider)
✓ Real-time sentence correction
✓ Grammar rule explanations
✓ Article-focused analysis
✓ Contextual suggestions
```

### 4. Interactive Quizzes
```
✓ AI-generated questions
✓ Multiple-choice format
✓ Real-time feedback
✓ Score calculation
✓ Quiz history
```

### 5. Progress Tracking
```
✓ Total practices completed
✓ Accuracy percentage
✓ Quiz performance metrics
✓ Learning statistics
✓ Historical data
```

---

## 🔐 Security Features

- **Password Hashing**: Salted PBKDF2 via ASP.NET Core `PasswordHasher`
- **JWT Authentication**: Secure token-based authentication
- **Authorization**: Role-based access control
- **CORS**: Configured for secure cross-origin requests
- **Environment Variables**: Sensitive data protected

---

## 📊 Database Schema

### Key Tables
```
Users
├── id (PK)
├── email (UNIQUE)
├── username (UNIQUE)
├── passwordHash
└── ...

GrammarPractices
├── id (PK)
├── userId (FK)
├── originalSentence
├── correctedSentence
├── mistakes (JSON)
└── ...

Quizzes
├── id (PK)
├── userId (FK)
├── title
├── score
└── ...

QuizQuestions
├── id (PK)
├── quizId (FK)
├── question
├── correctAnswer
└── ...

UserProgress
├── id (PK)
├── userId (FK, UNIQUE)
├── totalPractices
├── correctPractices
└── ...
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
```

### Practice
```
POST   /api/practice/submit
GET    /api/practice/history
GET    /api/practice/progress
```

### Quiz
```
POST   /api/quiz/create
POST   /api/quiz/{id}/answer
GET    /api/quiz/{id}
GET    /api/quiz/user/all
```

### Question Analysis
```
GET    /api/topics                                   (no login needed)
POST   /api/questions/analyze                        { questionText, topicCode?, studentAnswer? }
GET    /api/questions/history?page=&pageSize=&topic=
GET    /api/questions/{id}
POST   /api/questions/{id}/practice-set              { count }  (1-5, default 3) → quiz; answer it with POST /api/quiz/{id}/answer
```

### Progress and health
```
GET    /api/progress/topics                          per-topic analyses, practice answers, accuracy and "needs practice"
GET    /health                                       "Healthy" (200) or "Unhealthy" (503); no login needed
```

AI endpoints (analyze, practice set, practice/submit, quiz create and answer) are limited per student
(default 20 per minute) and login/registration per IP address (default 30 per minute); over the limit
the API answers 429 with a ProblemDetails message and a `Retry-After` header.

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed endpoint information.

---

## 🎯 Usage Workflow

```
1. User Registration
   └─> Create account with email & password

2. User Login
   └─> Authenticate and receive JWT token

3. Practice Grammar
   └─> Submit sentence → AI analysis → Get feedback

4. Take Quiz
   └─> Answer questions → Submit → View results

5. Check Progress
   └─> View statistics & learning metrics
```

---

## 🧪 Testing

### Manual Testing
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"Pass123","fullName":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123"}'

# Practice (with token)
curl -X POST http://localhost:5000/api/practice/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sentence":"She are a good student."}'
```

---

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Architecture & complete guide
- [Installation Guide](INSTALLATION_GUIDE.md) - Step-by-step setup
- [API Documentation](API_DOCUMENTATION.md) - All endpoints & examples
- [Backend Guide](BACKEND_GUIDE.md) - Backend architecture details
- [Frontend Guide](FRONTEND_GUIDE.md) - Frontend code organization

---

## 🐛 Troubleshooting

### Database Issues
```
Error: Cannot connect to PostgreSQL
Solution:
1. Ensure PostgreSQL is running
2. Check the connection string (`dotnet user-secrets list` in Backend/)
3. Verify database exists: psql -l
```

### AI Errors
```
Error: 401 Unauthorized
Solution:
1. Get a Gemini key from https://aistudio.google.com (or an OpenAI key if `Ai:Provider` is `OpenAI`)
2. Add sufficient credits
3. Set it with `dotnet user-secrets set "Ai:Gemini:ApiKey" "<key>"` (or the Ai__Gemini__ApiKey environment variable)
```

### CORS Issues
```
Error: Blocked by CORS policy
Solution:
1. Verify CORS enabled in Program.cs
2. Check AllowedOrigins includes localhost:3000
3. Check browser console for specific errors
```

### Port Already in Use
```
Error: Address already in use :::5000
Solution:
Windows: netstat -ano | findstr :5000 → taskkill /PID <PID>
Linux/Mac: lsof -i :5000 → kill -9 <PID>
```

---

## 🚀 Deployment

### Backend Deployment
```bash
# Build for production
dotnet publish -c Release

# Deploy to Azure, AWS, or on-premises server
# Configure secrets as environment variables (see Backend/.env.example)

# Migrations are not applied on startup outside Development. Generate the SQL, review it, then apply it:
./scripts/New-MigrationScript.ps1   # writes artifacts/migrate.sql and artifacts/supabase-lockdown.sql
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full Supabase setup, including locking the
tables away from Supabase's public Data API, the health check (`GET /health`) and rate limits.

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy dist/ to Vercel, Netlify, or static hosting
# Set VITE_API_BASE_URL to the production backend before building
```

---

## 📈 Performance Optimizations

- **Frontend**: Lazy loading, Context API instead of Redux
- **Backend**: Async/await, Entity Framework indexing
- **Database**: Indexed frequently queried columns
- **Caching**: Consider Redis for AI responses

---

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Social features (leaderboards)
- [ ] PDF report generation
- [ ] Multiple language support
- [ ] Offline mode
- [ ] Machine learning recommendations

---

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

This project is open source and available under the MIT License.

---

## 📧 Support

For issues, questions, or suggestions:
1. Check existing documentation
2. Review troubleshooting guide
3. Create an issue in the repository
4. Contact the development team

---

## 🎓 Learning Resources

- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)
- [Gemini API Reference](https://ai.google.dev/api/generate-content)
- [OpenAI API Guide](https://platform.openai.com/docs/api-reference)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)
- [PostgreSQL Guide](https://www.postgresql.org/docs/)

---

## 🎉 Getting Started Checklist

- [ ] Install prerequisites (.NET SDK, Node.js, PostgreSQL)
- [ ] Clone repository
- [ ] Create PostgreSQL databases
- [ ] Configure backend settings
- [ ] Run database migrations
- [ ] Start backend server
- [ ] Install frontend dependencies
- [ ] Configure Tailwind CSS
- [ ] Start frontend server
- [ ] Create test account
- [ ] Test practice feature
- [ ] Test quiz feature
- [ ] Verify progress tracking

---

## Project Status

✅ **Current Version**: 1.0.0
✅ **Status**: Ready for deployment
✅ **Last Updated**: March 24, 2024

---

## 📞 Contact

For questions or support, please reach out through the project repository.

Good luck with your English grammar learning journey! 🌟
