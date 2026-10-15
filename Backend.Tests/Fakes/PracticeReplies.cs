using System.Text.Json;

namespace Backend.Tests.Fakes;

/// <summary>Sample AI replies for practice-set generation and answer evaluation.</summary>
public static class PracticeReplies
{
    private static readonly (string Question, string[] Answers)[] Bank =
    {
        ("He is ___ honour to his family.", new[] { "an" }),
        ("I saw ___ one-eyed man.", new[] { "a" }),
        ("___ sun rises in the east.", new[] { "The", "the" }),
        ("She bought ___ umbrella.", new[] { "an" }),
        ("It was ___ unique idea.", new[] { "a" })
    };

    public static string Set(int count, string? explanationBn = null) => JsonSerializer.Serialize(new
    {
        questions = Bank.Take(count).Select(item => new
        {
            instruction = "Fill in the blank with a suitable article.",
            question = item.Question,
            acceptedAnswers = item.Answers,
            explanation = new { en = "Choose by the sound, not the spelling.", bn = explanationBn ?? "বানান নয়, উচ্চারণ দেখে বেছে নাও।" }
        })
    });

    public static string Evaluation(bool isCorrect, string? bn = null) => JsonSerializer.Serialize(new
    {
        isCorrect,
        en = isCorrect ? "Yes, that works here." : "Not quite: listen to the first sound.",
        bn = bn ?? (isCorrect ? "হ্যাঁ, এটি এখানে ঠিক।" : "পুরোপুরি ঠিক নয়: প্রথম ধ্বনিটি খেয়াল করো।")
    });
}
