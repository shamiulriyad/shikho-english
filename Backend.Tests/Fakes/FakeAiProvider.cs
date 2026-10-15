using Backend.Ai;

namespace Backend.Tests.Fakes;

/// <summary>
/// Scripted AI provider: replies are returned in order, the last one repeats. Never calls a real API.
/// </summary>
public class FakeAiProvider : IAiProvider
{
    private readonly Queue<Func<AiRequest, string>> _replies = new();
    private Func<AiRequest, string> _last = _ => "{}";

    public string Name => "Fake";
    public string Model => "fake-model-1";
    public List<AiRequest> Requests { get; } = new();

    public FakeAiProvider Reply(params string[] replies)
    {
        foreach (var reply in replies)
            _replies.Enqueue(_ => reply);
        return this;
    }

    public FakeAiProvider Throw(Exception exception)
    {
        _replies.Enqueue(_ => throw exception);
        return this;
    }

    public Task<string> GenerateAsync(AiRequest request, CancellationToken cancellationToken = default)
    {
        Requests.Add(request);
        if (_replies.Count > 0)
            _last = _replies.Dequeue();
        return Task.FromResult(_last(request));
    }
}
