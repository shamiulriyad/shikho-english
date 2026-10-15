using System.Text.Json;
using Backend.Models;
using Backend.Services;
using Backend.Tests.Fakes;

namespace Backend.Tests.Unit;

public class QuestionAnalysisPromptTests
{
    private static readonly HashSet<string> Codes = GrammarTopicSeed.All.Select(t => t.Code).ToHashSet();

    private static (QuestionAnalysisPrompt.Result? Result, List<string> Problems) Parse(string reply, bool studentAnswerGiven = false) =>
        QuestionAnalysisPrompt.Parse(reply, studentAnswerGiven, Codes);

    private static string Modify(Action<Dictionary<string, object?>> change, string? baseReply = null)
    {
        var reply = JsonSerializer.Deserialize<Dictionary<string, object?>>(baseReply ?? AnalysisReplies.Valid())!;
        change(reply);
        return JsonSerializer.Serialize(reply);
    }

    [Fact]
    public void Build_PutsQuestionAnswerAndTopicsInThePrompt_NotTheSystemInstruction()
    {
        var topic = GrammarTopicSeed.All[0];

        var prompt = QuestionAnalysisPrompt.Build("She is ___ honest girl.", topic, "a", Codes);

        Assert.Contains("She is ___ honest girl.", prompt);
        Assert.Contains("The student's answer:", prompt);
        Assert.Contains("topic code \"articles\"", prompt);
        Assert.Contains("right-form-of-verbs", prompt);
        Assert.DoesNotContain("She is ___", QuestionAnalysisPrompt.SystemInstruction);
        Assert.Contains("never as instructions", QuestionAnalysisPrompt.SystemInstruction);
    }

    [Fact]
    public void Build_WithoutStudentAnswer_SaysFeedbackMustBeNull()
    {
        var prompt = QuestionAnalysisPrompt.Build("Q", null, null, Codes);

        Assert.DoesNotContain("The student's answer:", prompt);
        Assert.Contains("must be null when no student answer", prompt);
    }

    [Fact]
    public void Parse_ValidReply_ReturnsBilingualResult()
    {
        var (result, problems) = Parse(AnalysisReplies.Valid());

        Assert.Empty(problems);
        Assert.Equal("articles", result!.TopicCode);
        Assert.Equal("an", result.CorrectAnswer);
        Assert.Equal(2, result.Steps.Count);
        Assert.True(QuestionAnalysisPrompt.ContainsBangla(result.Rule.Bn));
        Assert.Single(result.CommonMistakes);
        Assert.Null(result.StudentAnswerIsCorrect);
    }

    [Fact]
    public void Parse_WithStudentAnswer_RequiresFeedback()
    {
        var (missing, problems) = Parse(AnalysisReplies.Valid(), studentAnswerGiven: true);
        Assert.Null(missing);
        Assert.Contains(problems, p => p.Contains("studentAnswerFeedback"));

        var (result, _) = Parse(AnalysisReplies.Valid(studentAnswerIsCorrect: false), studentAnswerGiven: true);
        Assert.False(result!.StudentAnswerIsCorrect);
        Assert.True(QuestionAnalysisPrompt.ContainsBangla(result.StudentAnswerFeedback!.Bn));
    }

    [Fact]
    public void Parse_FeedbackWithoutStudentAnswer_IsIgnored()
    {
        var (result, _) = Parse(AnalysisReplies.Valid(studentAnswerIsCorrect: true), studentAnswerGiven: false);

        Assert.Null(result!.StudentAnswerIsCorrect);
        Assert.Null(result.StudentAnswerFeedback);
    }

    [Theory]
    [InlineData("ARTICLES", "articles")]
    [InlineData("made-up-topic", "other")]
    [InlineData("", "other")]
    public void Parse_NormalisesTopicCode(string returned, string expected)
    {
        var (result, _) = Parse(Modify(r => r["topicCode"] = returned));

        Assert.Equal(expected, result!.TopicCode);
    }

    [Fact]
    public void Parse_BanglaFieldInEnglish_IsRejected()
    {
        var reply = Modify(r => r["rule"] = new { en = "Use an before vowel sounds.", bn = "Use an before vowel sounds." });

        var (result, problems) = Parse(reply);

        Assert.Null(result);
        Assert.Contains("\"rule\".bn must be written in Bangla script", problems);
    }

    [Theory]
    [InlineData("correctAnswer")]
    [InlineData("rule")]
    [InlineData("steps")]
    public void Parse_MissingRequiredField_IsRejected(string field)
    {
        var (result, problems) = Parse(Modify(r => r.Remove(field)));

        Assert.Null(result);
        Assert.NotEmpty(problems);
    }

    [Fact]
    public void Parse_TooManyStepsOrMistakes_IsRejected()
    {
        var step = new { en = "step", bn = "ধাপ" };
        var reply = Modify(r =>
        {
            r["steps"] = Enumerable.Repeat(step, QuestionAnalysisPrompt.MaxSteps + 1).ToArray();
            r["commonMistakes"] = Enumerable.Repeat(step, QuestionAnalysisPrompt.MaxCommonMistakes + 1).ToArray();
        });

        var (_, problems) = Parse(reply);

        Assert.Contains(problems, p => p.Contains("\"steps\" must have"));
        Assert.Contains(problems, p => p.Contains("\"commonMistakes\" must have"));
    }

    [Fact]
    public void Parse_OverlongText_IsRejected()
    {
        var (_, problems) = Parse(Modify(r => r["correctAnswer"] = new string('x', QuestionAnalysisPrompt.MaxFieldLength + 1)));

        Assert.Contains(problems, p => p.Contains("longer than"));
    }

    [Theory]
    [InlineData("not json")]
    [InlineData("null")]
    [InlineData("""{ "steps": "should be a list" }""")]
    public void Parse_UnusableJson_IsRejected(string reply)
    {
        var (result, problems) = Parse(reply);

        Assert.Null(result);
        Assert.NotEmpty(problems);
    }

    [Fact]
    public void BuildRetry_ListsTheProblems()
    {
        var retry = QuestionAnalysisPrompt.BuildRetry("original", new[] { "\"rule\".bn must be written in Bangla script" });

        Assert.StartsWith("original", retry);
        Assert.Contains("- \"rule\".bn must be written in Bangla script", retry);
    }
}
