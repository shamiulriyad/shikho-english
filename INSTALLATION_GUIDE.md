# Installation & Setup Instructions

## Quick Start

### Prerequisites
- .NET 10.0 SDK or higher
- Node.js 16+ and npm
- PostgreSQL 12+
- OpenAI API Key (from https://platform.openai.com)

### Step 1: Database Setup

1. **Install PostgreSQL**
   - Download from https://www.postgresql.org/download/
   - Create a new database: `learnEnglish`

2. **Create Database**
   ```sql
   CREATE DATABASE "learnEnglish";
   CREATE DATABASE "learnEnglish_dev";
   ```

### Step 2: Backend Setup

1. **Navigate to Backend**
   ```bash
   cd Backend
   ```

2. **Restore Dependencies**
   ```bash
   dotnet restore
   ```

3. **Configure Connection String**
   - Edit `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=learnEnglish;Username=postgres;Password=your_password"
     },
     "Jwt": {
       "Secret": "your-super-secret-jwt-key-min-32-characters-long!!!",
       "Issuer": "GrammarLearner",
       "Audience": "GrammarLearnerUsers",
       "ExpiryMinutes": 60
     },
     "OpenAI": {
       "ApiKey": "your-openai-api-key-here"
     }
   }
   ```

4. **Run Migrations**
   ```bash
   dotnet ef database update
   ```

5. **Start Backend**
   ```bash
   dotnet run
   ```
   Server runs on: `http://localhost:5000`

### Step 3: Frontend Setup

1. **Navigate to Frontend**
   ```bash
   cd ../frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   npm install react-router-dom
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. **Configure Tailwind CSS**
   - Update `tailwind.config.js`:
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

   - Update `postcss.config.js`:
   ```js
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```

4. **Create `.env` file**
   ```
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   ```

5. **Start Frontend**
   ```bash
   npm start
   ```
   Application opens at: `http://localhost:3000`

## Verification Steps

1. **Backend Health**
   - Open: http://localhost:5000/swagger
   - Should show API documentation

2. **Frontend Home**
   - Open: http://localhost:3000
   - Should show Grammar Learner home page

3. **Test Registration**
   - Click "Register Now"
   - Create test account
   - Should redirect to practice page

## Configuration

### Backend Configuration Files

**appsettings.json** (Production)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=prod-db;Port=5432;Database=learnEnglish;Username=postgres;Password=secure_password"
  },
  "Jwt": {
    "Secret": "long-secure-secret-key",
    "ExpiryMinutes": 60
  },
  "OpenAI": {
    "ApiKey": "your-production-key"
  }
}
```

**appsettings.Development.json** (Development)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=learnEnglish_dev;Username=postgres;Password=dev_password"
  },
  "Jwt": {
    "Secret": "dev-secret-key-for-testing",
    "ExpiryMinutes": 120
  },
  "OpenAI": {
    "ApiKey": "your-dev-key"
  }
}
```

### Frontend Environment Variables

Create `.env.local` for local development:
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## Troubleshooting

### PostgreSQL Connection Failed
```
Error: FATAL: password authentication failed for user "postgres"

Solution:
- Verify PostgreSQL is running
- Check username and password in appsettings.json
- Ensure port 5432 is not blocked
```

### OpenAI API Error
```
Error: 401 Unauthorized
Solution:
- Get API key from https://platform.openai.com/account/api-keys
- Add sufficient credits to account
- Update appsettings.json with correct key
```

### Port Already in Use
```
Error: Address already in use :::5000
Solution:
- Find process: netstat -ano | findstr :5000
- Kill process: taskkill /PID <PID> /F
- Or change port in launchSettings.json
```

### Module Not Found
```
Error: Cannot find module 'react-router-dom'
Solution:
- Run: npm install react-router-dom
- Run: npm install --save-dev tailwindcss postcss autoprefixer
```

## Environment Variables Checklist

### Backend
- [ ] DATABASE_URL configured
- [ ] JWT_SECRET is long enough (32+ chars)
- [ ] OPENAI_API_KEY set
- [ ] ASPNETCORE_ENVIRONMENT set to Development

### Frontend
- [ ] REACT_APP_API_BASE_URL points to backend
- [ ] Backend is running and accessible
- [ ] No CORS errors in browser console

## Next Steps

1. **Create Test Account**
   - Go to http://localhost:3000/register
   - Fill in test credentials

2. **Try Practice Feature**
   - Navigate to Practice section
   - Submit: "She are a good student"
   - Verify AI correction works

3. **Try Quiz Feature**
   - Navigate to Quiz section
   - Start quiz
   - Answer questions

4. **Check Progress**
   - Navigate to Progress section
   - Verify statistics displayed

## Additional Resources

- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)
