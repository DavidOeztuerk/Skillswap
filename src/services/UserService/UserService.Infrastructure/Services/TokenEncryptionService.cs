using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using UserService.Domain.Services;

namespace UserService.Infrastructure.Services;

public class TokenEncryptionService : ITokenEncryptionService
{
    private readonly byte[] _key;
    private readonly byte[] _iv;

    public TokenEncryptionService(IConfiguration configuration)
    {
        // Get encryption key from configuration
        var keyString = configuration["Calendar:EncryptionKey"]
            ?? configuration["JwtSettings:Secret"]
            ?? throw new InvalidOperationException("Encryption key not configured");

        // Derive a 256-bit key from the secret using SHA256
        using var sha256 = SHA256.Create();
        _key = sha256.ComputeHash(Encoding.UTF8.GetBytes(keyString));

        // Use first 16 bytes as IV (or derive from key)
        _iv = new byte[16];
        Array.Copy(_key, _iv, 16);
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return string.Empty;

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;

        var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var msEncrypt = new MemoryStream();
        using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
        using (var swEncrypt = new StreamWriter(csEncrypt))
        {
            swEncrypt.Write(plainText);
        }

        return Convert.ToBase64String(msEncrypt.ToArray());
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
            return string.Empty;

        var buffer = Convert.FromBase64String(cipherText);

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;

        var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var msDecrypt = new MemoryStream(buffer);
        using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
        using var srDecrypt = new StreamReader(csDecrypt);

        return srDecrypt.ReadToEnd();
    }
}
