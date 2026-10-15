using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionAnalysis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GrammarTopics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NameBn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GrammarTopics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QuestionAnalyses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    TopicId = table.Column<int>(type: "integer", nullable: false),
                    QuestionText = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    StudentAnswer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CorrectAnswer = table.Column<string>(type: "text", nullable: false),
                    StepsJson = table.Column<string>(type: "text", nullable: false),
                    RuleEn = table.Column<string>(type: "text", nullable: false),
                    RuleBn = table.Column<string>(type: "text", nullable: false),
                    CommonMistakesJson = table.Column<string>(type: "text", nullable: false),
                    StudentAnswerIsCorrect = table.Column<bool>(type: "boolean", nullable: true),
                    StudentAnswerFeedbackEn = table.Column<string>(type: "text", nullable: true),
                    StudentAnswerFeedbackBn = table.Column<string>(type: "text", nullable: true),
                    AiProvider = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AiModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PromptVersion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionAnalyses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionAnalyses_GrammarTopics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "GrammarTopics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuestionAnalyses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "GrammarTopics",
                columns: new[] { "Id", "Code", "NameBn", "NameEn", "SortOrder" },
                values: new object[,]
                {
                    { 1, "articles", "আর্টিকেল", "Articles", 1 },
                    { 2, "prepositions", "প্রিপজিশন", "Prepositions", 2 },
                    { 3, "right-form-of-verbs", "ক্রিয়ার সঠিক রূপ", "Right Form of Verbs", 3 },
                    { 4, "tag-questions", "ট্যাগ প্রশ্ন", "Tag Questions", 4 },
                    { 5, "narration", "উক্তি পরিবর্তন", "Narration (Direct and Indirect Speech)", 5 },
                    { 6, "transformation", "বাক্য রূপান্তর", "Transformation of Sentences", 6 },
                    { 7, "completing-sentences", "বাক্য সম্পূর্ণকরণ", "Completing Sentences", 7 },
                    { 8, "connectors", "সংযোজক শব্দ", "Connectors", 8 },
                    { 9, "suffix-prefix", "সাফিক্স ও প্রিফিক্স", "Suffixes and Prefixes", 9 },
                    { 10, "punctuation", "বিরামচিহ্ন ও বড় হাতের অক্ষর", "Punctuation and Capitalization", 10 },
                    { 11, "other", "অন্যান্য", "Other", 99 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_GrammarTopics_Code",
                table: "GrammarTopics",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionAnalyses_TopicId",
                table: "QuestionAnalyses",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionAnalyses_UserId_CreatedAt",
                table: "QuestionAnalyses",
                columns: new[] { "UserId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuestionAnalyses");

            migrationBuilder.DropTable(
                name: "GrammarTopics");
        }
    }
}
