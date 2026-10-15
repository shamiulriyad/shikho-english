using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class CaseInsensitiveUniqueEmail : Migration
    {
        public const string IndexName = "IX_Users_NormalizedEmail";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing rows are never modified. If two accounts differ only by email case or surrounding
            // whitespace the migration aborts (rolling back) so they can be resolved manually first.
            migrationBuilder.Sql("""
                DO $$
                DECLARE
                    duplicates text;
                BEGIN
                    SELECT string_agg(normalized || ' (' || matches || ' accounts)', ', ')
                    INTO duplicates
                    FROM (
                        SELECT lower(btrim("Email")) AS normalized, count(*) AS matches
                        FROM "Users"
                        GROUP BY lower(btrim("Email"))
                        HAVING count(*) > 1
                    ) AS conflicts;

                    IF duplicates IS NOT NULL THEN
                        RAISE EXCEPTION 'Cannot create IX_Users_NormalizedEmail: these emails belong to more than one account when compared case-insensitively: %. Resolve them manually, then re-run the migration.', duplicates;
                    END IF;
                END $$;
                """);

            // Expression index: EF Core cannot model it, so it lives only in this migration.
            // UserRepository.GetByEmail queries the same expression so lookups use the index.
            migrationBuilder.Sql($"""CREATE UNIQUE INDEX "{IndexName}" ON "Users" (lower(btrim("Email")));""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($"""DROP INDEX IF EXISTS "{IndexName}";""");
        }
    }
}
