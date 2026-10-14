# AI-Powered English Grammar Learning Platform

## 📚 Project Overview

A complete full-stack application for learning English grammar with a focus on articles (a, an, the). The platform leverages AI (OpenAI GPT-3.5) to provide intelligent grammar correction, detailed feedback, and interactive quizzes.

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
                    │   OpenAI API        │
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
- **AI Integration**: OpenAI API
- **Architecture**: Repository Pattern, Clean Architecture

### Frontend
- **Library**: React 18
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
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
- OpenAI API Key

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

# Update appsettings.json with your configuration
# Then run migrations
dotnet ef database update

# Start backend
dotnet run
```

**3. Frontend Setup**
```bash
cd ../frontend
npm install
npm install react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm start
```

**4. Access Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/swagger

---

## 📋 Features

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
✓ OpenAI GPT-3.5-turbo integration
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
2. Check connection string in appsettings.json
3. Verify database exists: psql -l
```

### OpenAI API Errors
```
Error: 401 Unauthorized
Solution:
1. Get API key from https://platform.openai.com
2. Add sufficient credits
3. Update appsettings.json
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
# Update appsettings.Production.json with production values
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel, Netlify, or static hosting
# Update API_BASE_URL to production backend
```

---

## 📈 Performance Optimizations

- **Frontend**: Lazy loading, Context API instead of Redux
- **Backend**: Async/await, Entity Framework indexing
- **Database**: Indexed frequently queried columns
- **Caching**: Consider Redis for OpenAI responses

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
