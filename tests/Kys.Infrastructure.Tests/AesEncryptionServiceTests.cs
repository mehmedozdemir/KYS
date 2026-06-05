using FluentAssertions;
using Kys.Infrastructure.Services;
using Microsoft.Extensions.Configuration;

namespace Kys.Infrastructure.Tests;

public sealed class AesEncryptionServiceTests
{
    private readonly AesEncryptionService _sut;

    public AesEncryptionServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = Convert.ToBase64String(new byte[32]),
                ["Encryption:IV"] = Convert.ToBase64String(new byte[16])
            })
            .Build();

        _sut = new AesEncryptionService(config);
    }

    [Fact]
    public void Encrypt_ThenDecrypt_ReturnsOriginal()
    {
        var plainText = "secret-password-123";
        var encrypted = _sut.Encrypt(plainText);
        var decrypted = _sut.Decrypt(encrypted);
        decrypted.Should().Be(plainText);
    }

    [Fact]
    public void Encrypt_ProducesDifferentOutputThanInput()
    {
        var plainText = "secret";
        var encrypted = _sut.Encrypt(plainText);
        encrypted.Should().NotBe(plainText);
    }

    [Fact]
    public void EncryptWithRandomIv_ThenDecryptWithIv_ReturnsOriginal()
    {
        var plainText = "credential-value-xyz";
        var (encryptedValue, iv) = _sut.EncryptWithRandomIv(plainText);
        var decrypted = _sut.DecryptWithIv(encryptedValue, iv);
        decrypted.Should().Be(plainText);
    }

    [Fact]
    public void EncryptWithRandomIv_TwoCalls_ProduceDifferentIvs()
    {
        var plainText = "same-value";
        var (_, iv1) = _sut.EncryptWithRandomIv(plainText);
        var (_, iv2) = _sut.EncryptWithRandomIv(plainText);
        iv1.Should().NotBe(iv2);
    }

    [Fact]
    public void EncryptWithRandomIv_TwoCalls_ProduceDifferentCiphertexts()
    {
        var plainText = "same-value";
        var (cipher1, _) = _sut.EncryptWithRandomIv(plainText);
        var (cipher2, _) = _sut.EncryptWithRandomIv(plainText);
        cipher1.Should().NotBe(cipher2);
    }

    [Fact]
    public void DecryptWithIv_WrongIv_ThrowsCryptographicException()
    {
        var plainText = "sensitive";
        var (encryptedValue, _) = _sut.EncryptWithRandomIv(plainText);
        var wrongIv = Convert.ToBase64String(new byte[16]); // all zeros IV

        var act = () => _sut.DecryptWithIv(encryptedValue, wrongIv);
        act.Should().Throw<System.Security.Cryptography.CryptographicException>();
    }
}
