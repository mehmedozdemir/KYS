using System.Threading.Channels;
using Kys.Domain.Interfaces.Services;

namespace Kys.Infrastructure.Services;

/// <summary>In-process e-posta kuyruğu (Channel tabanlı, singleton).</summary>
public sealed class EmailQueue : IEmailQueue
{
    private readonly Channel<EmailMessage> _channel =
        Channel.CreateUnbounded<EmailMessage>(new UnboundedChannelOptions { SingleReader = true });

    public ChannelReader<EmailMessage> Reader => _channel.Reader;

    public void Enqueue(EmailMessage message) => _channel.Writer.TryWrite(message);
}
