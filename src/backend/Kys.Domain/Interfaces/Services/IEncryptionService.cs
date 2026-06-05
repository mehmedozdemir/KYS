namespace Kys.Domain.Interfaces.Services;

public interface IEncryptionService
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);

    // Per-credential random IV (for ResourceCredential)
    (string EncryptedValue, string Iv) EncryptWithRandomIv(string plainText);
    string DecryptWithIv(string encryptedValue, string iv);
}
