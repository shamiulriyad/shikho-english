using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> Register(UserRegisterDto registerDto);
        Task<AuthResponseDto> Login(UserLoginDto loginDto);
    }

    public class AuthService : IAuthService
    {
        private const string UsernameIndexName = "IX_Users_Username";

        private readonly IUserRepository _userRepository;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IPasswordHasher<User> _passwordHasher;

        public AuthService(IUserRepository userRepository, IJwtTokenService jwtTokenService, IPasswordHasher<User> passwordHasher)
        {
            _userRepository = userRepository;
            _jwtTokenService = jwtTokenService;
            _passwordHasher = passwordHasher;
        }

        public async Task<AuthResponseDto> Register(UserRegisterDto registerDto)
        {
            var email = EmailNormalization.Normalize(registerDto.Email);

            if (await _userRepository.GetByEmail(email) != null)
            {
                return new AuthResponseDto { Success = false, Message = "Email already exists" };
            }

            if (await _userRepository.GetByUsername(registerDto.Username) != null)
            {
                return new AuthResponseDto { Success = false, Message = "Username already exists" };
            }

            var user = new User
            {
                Email = email,
                Username = registerDto.Username,
                FullName = registerDto.FullName
            };
            user.PasswordHash = _passwordHasher.HashPassword(user, registerDto.Password);

            await _userRepository.Add(user);

            bool saved;
            try
            {
                saved = await _userRepository.SaveChanges();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } unique)
            {
                // Another request registered the same email or username between the checks above and this insert
                var message = unique.ConstraintName == UsernameIndexName ? "Username already exists" : "Email already exists";
                return new AuthResponseDto { Success = false, Message = message };
            }

            if (!saved)
            {
                return new AuthResponseDto { Success = false, Message = "Failed to register user" };
            }

            return CreateSuccessResponse(user, "Registration successful");
        }

        public async Task<AuthResponseDto> Login(UserLoginDto loginDto)
        {
            var user = await _userRepository.GetByEmail(loginDto.Email);

            if (user == null ||
                _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, loginDto.Password) == PasswordVerificationResult.Failed)
            {
                return new AuthResponseDto { Success = false, Message = "Invalid email or password" };
            }

            if (!user.IsActive)
            {
                return new AuthResponseDto { Success = false, Message = "User account is inactive" };
            }

            user.LastLoginAt = DateTime.UtcNow;
            await _userRepository.Update(user);
            await _userRepository.SaveChanges();

            return CreateSuccessResponse(user, "Login successful");
        }

        private AuthResponseDto CreateSuccessResponse(User user, string message)
        {
            return new AuthResponseDto
            {
                Success = true,
                Message = message,
                Token = _jwtTokenService.GenerateToken(user),
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    Username = user.Username,
                    FullName = user.FullName,
                    CreatedAt = user.CreatedAt
                }
            };
        }
    }
}
