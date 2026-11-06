# Nompaw

Application Symfony 6.4 + React (voir `CLAUDE.md` pour l'architecture et le lancement via `make`).

## Serveur MCP « running » (connecteur claude.ai)

Le module running est exposé en **lecture seule** à claude.ai via un serveur MCP protégé par OAuth 2.1
(`league/oauth2-server-bundle`).

| Élément | Emplacement |
|---|---|
| Endpoint MCP (JSON-RPC) | `POST /mcp/running` — `src/Controller/Mcp/RunningMcpController.php` |
| Découverte OAuth (RFC 8414 / 9728) | `/.well-known/oauth-authorization-server`, `/.well-known/oauth-protected-resource/mcp/running` |
| Autorisation / token | `/authorize` (ROLE_RUNNING, écran de consentement), `/token` |
| Consentement | `src/EventListener/OAuthConsentListener.php`, `templates/mcp/consent.html.twig` |
| Sécurité | firewall `mcp` + `access_control` dans `config/packages/security.yaml` |
| Outils exposés | `get_training_context`, `get_logs`, `get_activities`, `get_weights`, `get_notes` (scope `running:read`) |

claude.ai doit joindre le serveur en HTTPS public : `nompaw.local` ne suffit pas. Pour un test **durable**, on utilise
un tunnel Cloudflare **nommé** (URL fixe) plutôt qu'un tunnel rapide `trycloudflare.com` dont l'URL change à chaque lancement.

### 1. Mise en place (une seule fois)

Toutes les commandes `php bin/console` se lancent **dans le conteneur** (`docker-compose exec php ...`), pas sur l'hôte.

1. Clés OAuth dédiées (distinctes de celles de Lexik), à générer une fois :
   ```
   PASS=$(openssl rand -hex 16)
   openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -aes256 -pass pass:$PASS -out config/jwt/oauth_private.pem
   openssl pkey -in config/jwt/oauth_private.pem -passin pass:$PASS -pubout -out config/jwt/oauth_public.pem
   ```
2. Dans `.env.local` (jamais commité) :
   ```
   OAUTH_PASSPHRASE=<$PASS>
   OAUTH_ENCRYPTION_KEY=<openssl rand -hex 16>
   MCP_PUBLIC_URL=https://mcp.exemple.fr
   ```
   `MCP_PUBLIC_URL` est l'URL publique, sans slash final. Les métadonnées OAuth et l'en-tête `WWW-Authenticate` la reprennent.
3. Tables OAuth : `make db-migrate` (migration `Version20261106114833`).
4. Client OAuth pour claude.ai — **le secret n'est affiché qu'une fois** :
   ```
   docker-compose exec php php bin/console league:oauth2-server:create-client "claude.ai" \
     --redirect-uri="https://claude.ai/api/mcp/auth_callback" \
     --scope=running:read --grant-type=authorization_code --grant-type=refresh_token
   ```
5. Compte utilisateur : il doit avoir `ROLE_RUNNING`.

### 2. Tunnel Cloudflare nommé (URL fixe)

Prérequis : un domaine géré par Cloudflare et `cloudflared` installé.

```
cloudflared tunnel login
cloudflared tunnel create nompaw-mcp
cloudflared tunnel route dns nompaw-mcp mcp.exemple.fr
```

`~/.cloudflared/config.yml` :

```yaml
tunnel: nompaw-mcp
credentials-file: /home/<user>/.cloudflared/<id-du-tunnel>.json
ingress:
  - hostname: mcp.exemple.fr
    service: https://127.0.0.1:443
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

Ne **pas** forcer l'en-tête `Host` (pas de `httpHostHeader` / `--http-host-header`) : Symfony doit voir le vrai nom d'hôte, sinon la
redirection vers `/connexion` repart sur un autre domaine, la session est perdue et l'écran de consentement n'apparaît jamais.

Traefik route via un **fichier** (provider `file`), pas via les labels Docker : ajouter le nom d'hôte dans le routeur `nompaw` de
`infra/traefik/dynamic/routes.yml` (rechargé à chaud, aucun redémarrage) :

```yaml
nompaw:
  rule: "Host(`nompaw.local`) || Host(`mcp.exemple.fr`)"
```

Lancer le tunnel (ou l'installer en service avec `cloudflared service install`) :

```
cloudflared tunnel run nompaw-mcp
```

Puis vider le cache après avoir modifié `MCP_PUBLIC_URL` : `docker-compose exec php php bin/console cache:clear`.

### 3. Connexion dans claude.ai

1. **Paramètres → Connecteurs → Ajouter un connecteur personnalisé** (selon l'offre).
2. URL : `https://mcp.exemple.fr/mcp/running` ; dans les paramètres avancés, renseigner le **client ID** et le **secret** du client créé.
3. **Connecter** : connexion Nompaw, puis écran « Autoriser « claude.ai » ? » → **Autoriser**.
4. Tester dans une conversation : « Lis mon contexte d'entraînement, puis mes séances des 4 dernières semaines ».

### 4. Vérifications rapides

```
curl -s https://mcp.exemple.fr/.well-known/oauth-protected-resource/mcp/running     # 200, "resource" = URL publique
curl -si -X POST https://mcp.exemple.fr/mcp/running -d '{}' | grep -i -E "^HTTP|www-authenticate"   # 401 + resource_metadata
```

### Dépannage

| Symptôme | Cause probable |
|---|---|
| « Introuvable » dans claude.ai, 404 texte brut | Traefik ne connaît pas le nom d'hôte (`routes.yml`). |
| Redirigé vers `nompaw.local/espace-membre/` après Connecter | L'en-tête `Host` est forcé à `nompaw.local` dans le tunnel. |
| « n'a pas été connecté », `error=access_denied` immédiat | Le listener de consentement n'est pas appelé : il doit écouter `OAuth2Events::AUTHORIZATION_REQUEST_RESOLVE` (nom en chaîne, pas la classe). Voir le profiler : `Location` de la réponse `/authorize`. |
| Métadonnées avec une mauvaise URL | `MCP_PUBLIC_URL` absent/obsolète dans `.env.local`, ou cache non vidé. |
| `getaddrinfo for db_default failed` | Commande lancée sur l'hôte au lieu du conteneur. |
| `Unknown column 'ccsa.FULL_COLLATION_NAME'` | `serverVersion` de `DATABASE_URL` ne correspond pas à la vraie MariaDB (10.3.39 en dev). |

### Sécurité

- Le tunnel expose **tout** Nompaw, pas seulement le MCP. En usage durable, restreindre l'`ingress` aux chemins nécessaires
  (`/mcp`, `/authorize`, `/token`, `/.well-known`, `/connexion` et les assets du formulaire de connexion) ou protéger le reste par Cloudflare Access.
- Accès strictement en lecture ; les identifiants des exchanges crypto (`Cr*Credential`) ne sont jamais exposés.
- Pas encore en place : limitation de débit et journal des appels sur `/mcp/running`.
- Ne pas commiter `config/jwt/*.pem` ni `.env.local`.
