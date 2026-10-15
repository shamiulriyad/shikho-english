using System.Text.Json;

namespace Backend.Tests.Fakes;

/// <summary>Sample AI replies for the question-analysis prompt.</summary>
public static class AnalysisReplies
{
    private const string BanglaRule = "স্বরধ্বনির আগে \"an\" বসে।";

    public static string Valid(string topicCode = "articles", bool? studentAnswerIsCorrect = null, string ruleBn = BanglaRule) => JsonSerializer.Serialize(new
    {
        topicCode,
        correctAnswer = "an",
        steps = new[]
        {
            new { en = "Look at the word after the blank: \"honest\".", bn = "শূন্যস্থানের পরের শব্দটি দেখো: \"honest\"।" },
            new { en = "The \"h\" is silent, so it starts with a vowel sound.", bn = "\"h\" উচ্চারিত হয় না, তাই এটি স্বরধ্বনি দিয়ে শুরু।" }
        },
        rule = new { en = "Use \"an\" before a vowel sound.", bn = ruleBn },
        commonMistakes = new[]
        {
            new { en = "Choosing \"a\" because \"honest\" is spelt with a consonant.", bn = "বানানে ব্যঞ্জনবর্ণ দেখে \"a\" বসানো।" }
        },
        studentAnswerFeedback = studentAnswerIsCorrect == null
            ? null
            : new
            {
                isCorrect = studentAnswerIsCorrect.Value,
                en = studentAnswerIsCorrect.Value ? "Correct." : "\"a\" is wrong because of the vowel sound.",
                bn = studentAnswerIsCorrect.Value ? "সঠিক।" : "স্বরধ্বনির কারণে \"a\" ভুল।"
            }
    });

    /// <summary>A reply whose Bangla rule is actually written in English.</summary>
    public static string WithoutBangla() => Valid(ruleBn: "Use an before vowels.");
}
