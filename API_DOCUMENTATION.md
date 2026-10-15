# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except `/auth/*` require JWT token in Authorization header:
```
Authorization: Bearer {token}
```

---

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "securePassword123",
  "fullName": "John Doe"
}

Response (200):
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "fullName": "John Doe",
    "createdAt": "2024-03-24T10:30:00Z"
  }
}

Response (400):
{
  "success": false,
  "message": "Email already exists"
}
```

### Login User
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "fullName": "John Doe",
    "createdAt": "2024-03-24T10:30:00Z"
  }
}

Response (401):
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## Practice Endpoints

### Submit Sentence for Correction
```
POST /practice/submit
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "sentence": "She are a good student."
}

Response (200):
{
  "id": 5,
  "originalSentence": "She are a good student.",
  "correctedSentence": "She is a good student.",
  "mistakes": [
    {
      "type": "verb_agreement",
      "original": "are",
      "correction": "is",
      "reason": "Third-person singular requires 'is' not 'are'"
    }
  ],
  "explanation": "The subject 'She' is singular, so the verb should be 'is' not 'are'. This is a basic subject-verb agreement rule.",
  "isCorrect": false,
  "createdAt": "2024-03-24T10:35:22Z"
}
```

### Get Practice History
```
GET /practice/history
Authorization: Bearer {token}

Response (200):
[
  {
    "id": 5,
    "originalSentence": "She are a good student.",
    "correctedSentence": "She is a good student.",
    "mistakes": [
      {
        "type": "verb_agreement",
        "original": "are",
        "correction": "is",
        "reason": "Third-person singular requires 'is' not 'are'"
      }
    ],
    "explanation": "The subject 'She' is singular...",
    "isCorrect": false,
    "createdAt": "2024-03-24T10:35:22Z"
  },
  {
    "id": 4,
    "originalSentence": "I am a student.",
    "correctedSentence": "I am a student.",
    "mistakes": [],
    "explanation": "Your sentence is correct!",
    "isCorrect": true,
    "createdAt": "2024-03-24T10:30:00Z"
  }
]
```

### Get User Progress
```
GET /practice/progress
Authorization: Bearer {token}

Response (200):
{
  "totalPractices": 12,
  "correctPractices": 8,
  "correctPercentage": 66.7,
  "totalQuizzes": 3,
  "averageQuizScore": 75.5,
  "correctArticleCount": 8,
  "totalArticleCount": 12
}
```

---

## Quiz Endpoints

### Create New Quiz
```
POST /quiz/create?numberOfQuestions=5
Authorization: Bearer {token}

Response (200):
{
  "id": 2,
  "title": "Grammar Quiz - 2024-03-24 10:40",
  "score": 0,
  "totalQuestions": 5,
  "isCompleted": false,
  "createdAt": "2024-03-24T10:40:00Z",
  "completedAt": null,
  "questions": [
    {
      "id": 1,
      "question": "Choose the correct article for: '____ apple is red.'",
      "incorrectSentence": "I eat ____ apple.",
      "correctAnswer": null,
      "userAnswer": null,
      "isAnsweredCorrectly": null,
      "explanation": null
    },
    {
      "id": 2,
      "question": "Choose the correct article for: '____ university student.'",
      "incorrectSentence": "He is ____ university student.",
      "correctAnswer": null,
      "userAnswer": null,
      "isAnsweredCorrectly": null,
      "explanation": null
    },
    ...
  ]
}
```

### Submit Quiz Answer
```
POST /quiz/{quizId}/answer
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "questionId": 1,
  "answer": "a"
}

Response (200):
{
  "id": 2,
  "title": "Grammar Quiz - 2024-03-24 10:40",
  "score": 1,
  "totalQuestions": 5,
  "isCompleted": false,
  "createdAt": "2024-03-24T10:40:00Z",
  "completedAt": null,
  "questions": [
    {
      "id": 1,
      "question": "Choose the correct article for: '____ apple is red.'",
      "incorrectSentence": "I eat ____ apple.",
      "correctAnswer": "a",
      "userAnswer": "a",
      "isAnsweredCorrectly": true,
      "explanation": "Use 'a' before consonant sounds. 'Apple' starts with a vowel sound /æ/, so use 'an'."
    },
    ...
  ]
}
```

### Get Specific Quiz
```
GET /quiz/{quizId}
Authorization: Bearer {token}

Response (200):
{
  "id": 2,
  "title": "Grammar Quiz - 2024-03-24 10:40",
  "score": 5,
  "totalQuestions": 5,
  "isCompleted": true,
  "createdAt": "2024-03-24T10:40:00Z",
  "completedAt": "2024-03-24T10:45:00Z",
  "questions": [...]
}
```

### Get All User Quizzes
```
GET /quiz/user/all
Authorization: Bearer {token}

Response (200):
[
  {
    "id": 2,
    "title": "Grammar Quiz - 2024-03-24 10:40",
    "score": 5,
    "totalQuestions": 5,
    "isCompleted": true,
    "createdAt": "2024-03-24T10:40:00Z",
    "completedAt": "2024-03-24T10:45:00Z",
    "questions": []
  },
  {
    "id": 1,
    "title": "Grammar Quiz - 2024-03-23 15:20",
    "score": 3,
    "totalQuestions": 5,
    "isCompleted": true,
    "createdAt": "2024-03-23T15:20:00Z",
    "completedAt": "2024-03-23T15:25:00Z",
    "questions": []
  }
]
```

---

## Error Responses

### 400 Bad Request
```
{
  "errors": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 6 characters"]
  }
}
```

### 401 Unauthorized
```
{
  "message": "Unauthorized"
}
```

### 404 Not Found
```
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```
{
  "message": "An error occurred while processing your request"
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Password123",
    "fullName": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

### Submit Practice (with token)
```bash
curl -X POST http://localhost:5000/api/practice/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "sentence": "She are a good student."
  }'
```

### Get Progress (with token)
```bash
curl -X GET http://localhost:5000/api/practice/progress \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Rate Limiting

Currently no rate limiting is enforced. Consider implementing for production:
- 100 requests per minute for anonymous endpoints
- 1000 requests per minute for authenticated endpoints

---

## CORS Headers

All responses include:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Data Types

### User
```javascript
{
  id: number,
  email: string,
  username: string,
  fullName: string,
  createdAt: ISO8601 datetime,
  updatedAt: ISO8601 datetime,
  lastLoginAt: ISO8601 datetime | null,
  isActive: boolean
}
```

### GrammarPractice
```javascript
{
  id: number,
  originalSentence: string,
  correctedSentence: string,
  mistakes: MistakeDto[] (JSON),
  explanation: string,
  isCorrect: boolean,
  createdAt: ISO8601 datetime
}
```

### Quiz
```javascript
{
  id: number,
  title: string,
  score: number,
  totalQuestions: number,
  isCompleted: boolean,
  createdAt: ISO8601 datetime,
  completedAt: ISO8601 datetime | null,
  questions: QuizQuestion[]
}
```

---

## Authentication Flow

```
1. User Registration/Login
   POST /auth/register or /auth/login
   ↓
2. Backend validates credentials
   ↓
3. Backend generates JWT token
   ↓
4. Frontend stores token in localStorage
   ↓
5. Frontend includes token in every request header
   Authorization: Bearer {token}
   ↓
6. Backend validates token and processes request
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Successful request |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Server error |
