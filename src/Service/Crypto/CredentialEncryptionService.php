<?php

namespace App\Service\Crypto;

/**
 * Symmetric encryption for third-party API secrets at rest (e.g. CrCoinbaseCredential::privateKeyEncrypted),
 * using libsodium (bundled with PHP 8.1) with a random nonce per value — unlike the legacy
 * App\Entity\DataEntity::crypt() helper (fixed all-zero IV, hardcoded passphrase, unused elsewhere in the
 * app), which is too weak to protect a real credential.
 */
class CredentialEncryptionService
{
    private string $key;

    public function __construct(string $cryptoCredentialSecret)
    {
        $this->key = sodium_crypto_generichash($cryptoCredentialSecret, '', SODIUM_CRYPTO_SECRETBOX_KEYBYTES);
    }

    public function encrypt(string $plaintext): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = sodium_crypto_secretbox($plaintext, $nonce, $this->key);

        return base64_encode($nonce . $cipher);
    }

    public function decrypt(string $encoded): string
    {
        $decoded = base64_decode($encoded);
        $nonce = substr($decoded, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = substr($decoded, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);

        $plaintext = sodium_crypto_secretbox_open($cipher, $nonce, $this->key);
        if ($plaintext === false) {
            throw new \RuntimeException('Impossible de déchiffrer la valeur : clé ou données invalides.');
        }

        return $plaintext;
    }
}
