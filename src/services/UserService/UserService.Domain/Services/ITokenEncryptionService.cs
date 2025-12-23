namespace UserService.Domain.Services;

/// <summary>
/// Service for encrypting and decrypting OAuth tokens
/// </summary>
public interface ITokenEncryptionService
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
}
