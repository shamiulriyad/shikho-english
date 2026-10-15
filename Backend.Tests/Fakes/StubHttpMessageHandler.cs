using System.Net;
using System.Text;
using Microsoft.Extensions.Logging;

namespace Backend.Tests.Fakes;

/// <summary>
/// Answers HTTP requests in-process and records what was sent. No request ever leaves the machine.
/// </summary>
public class StubHttpMessageHandler : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, HttpResponseMessage> _respond;

    public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> respond)
    {
        _respond = respond;
    }

    public HttpRequestMessage? LastRequest { get; private set; }
    public string? LastRequestBody { get; private set; }
    public int Calls { get; private set; }

    public static StubHttpMessageHandler Json(string body, HttpStatusCode status = HttpStatusCode.OK) =>
        new(_ => new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") });

    public static StubHttpMessageHandler Throws(Exception exception) => new(_ => throw exception);

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Calls++;
        LastRequest = request;
        LastRequestBody = request.Content == null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
        return _respond(request);
    }
}

/// <summary>Collects formatted log messages so tests can check what would be written.</summary>
public class ListLogger<T> : ILogger<T>
{
    public List<string> Messages { get; } = new();

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) => true;

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
        Messages.Add($"{logLevel}: {formatter(state, exception)}");
}
