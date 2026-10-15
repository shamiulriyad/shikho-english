namespace Backend.Services
{
    public static class EmailNormalization
    {
        // Emails are compared case-insensitively; the database enforces this with a unique index on lower(btrim("Email"))
        public static string Normalize(string email) => email.Trim().ToLowerInvariant();
    }
}
