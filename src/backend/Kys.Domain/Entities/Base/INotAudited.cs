namespace Kys.Domain.Entities.Base;

/// <summary>
/// Audit log'a yazılmayan varlıklar için işaret arayüzü (ör. periyodik izleme verisi).
/// Kullanıcının yaptığı Create/Update/Delete işlemleri olan varlıklarda kullanılmaz.
/// </summary>
public interface INotAudited;
