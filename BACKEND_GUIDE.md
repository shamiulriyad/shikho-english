# Backend Code Organization Guide

## Repository Pattern

The project uses the Repository Pattern for data access, which provides an abstraction layer between the service layer and the database.

### Base Repository (Generic)

All repositories inherit from `BaseRepository<T>` which provides common CRUD operations:
- `GetById(id)` - Get a single entity
- `GetAll()` - Get all entities
- `Find(predicate)` - Query with conditions
- `Add(entity)` - Add new entity
- `Update(entity)` - Update existing entity
- `Delete(id)` - Delete entity
- `SaveChanges()` - Persist changes to database

## Service Layer Architecture

### AuthService
Handles user authentication and registration:
- Register new users with validation
- Login with email and password
- Password hashing and verification

### JwtTokenService
Generates JWT tokens for authenticated users:
- Creates tokens with user claims
- Configurable expiration
- Signs with secret key

### GrammarPracticeService
Manages grammar practice sessions:
- Submits sentences to OpenAI for correction
- Saves corrections to database
- Retrieves practice history
- Calculates user progress

### OpenAIService
Integrates with OpenAI API:
- Calls GPT-3.5-turbo model
- Processes responses
- Handles errors gracefully

### QuizService
Manages quiz creation and scoring:
- Generates quizzes with AI
- Tracks user answers
- Calculates scores

## Dependency Injection

All services are registered in `Program.cs`:
```csharp
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IGrammarPracticeService, GrammarPracticeService>();
builder.Services.AddScoped<IQuizService, QuizService>();
```

## DTO Pattern

Data Transfer Objects separate API contracts from domain models:
- `UserRegisterDto` - Registration input validation
- `UserLoginDto` - Login credentials
- `PracticeRequestDto` - Practice submission
- `PracticeResponseDto` - Formatted practice result
- `QuizDto` - Quiz data transfer

## Database Context

`AppDbContext` configures Entity Framework relationships:
- Defines DbSets for all entities
- Configures foreign keys
- Sets cascade delete rules
- Creates database indexes

## Error Handling

All services use try-catch to handle exceptions gracefully and return appropriate responses.

## Security

- Passwords are hashed before storage
- JWT tokens validate user identity
- Sensitive data excluded from responses
- Environment variables protect secrets
