using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPracticeSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SourceAnalysisId",
                table: "Quizzes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TopicId",
                table: "Quizzes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AcceptedAnswersJson",
                table: "QuizQuestions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExplanationBn",
                table: "QuizQuestions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FeedbackBn",
                table: "QuizQuestions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FeedbackEn",
                table: "QuizQuestions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "QuizQuestions",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_SourceAnalysisId",
                table: "Quizzes",
                column: "SourceAnalysisId");

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_TopicId",
                table: "Quizzes",
                column: "TopicId");

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_GrammarTopics_TopicId",
                table: "Quizzes",
                column: "TopicId",
                principalTable: "GrammarTopics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_QuestionAnalyses_SourceAnalysisId",
                table: "Quizzes",
                column: "SourceAnalysisId",
                principalTable: "QuestionAnalyses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_GrammarTopics_TopicId",
                table: "Quizzes");

            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_QuestionAnalyses_SourceAnalysisId",
                table: "Quizzes");

            migrationBuilder.DropIndex(
                name: "IX_Quizzes_SourceAnalysisId",
                table: "Quizzes");

            migrationBuilder.DropIndex(
                name: "IX_Quizzes_TopicId",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "SourceAnalysisId",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "TopicId",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "AcceptedAnswersJson",
                table: "QuizQuestions");

            migrationBuilder.DropColumn(
                name: "ExplanationBn",
                table: "QuizQuestions");

            migrationBuilder.DropColumn(
                name: "FeedbackBn",
                table: "QuizQuestions");

            migrationBuilder.DropColumn(
                name: "FeedbackEn",
                table: "QuizQuestions");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "QuizQuestions");
        }
    }
}
