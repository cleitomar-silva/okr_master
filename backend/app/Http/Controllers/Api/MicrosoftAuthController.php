<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;

class MicrosoftAuthController extends Controller
{
    private const SCOPES = 'https://graph.microsoft.com/.default';

    public function redirect(Request $request): RedirectResponse
    {
        $clientId = config('services.microsoft.client_id');
        $tenantId = config('services.microsoft.tenant_id');
        $redirectUri = $this->redirectUri();

        $state = Crypt::encryptString(json_encode([
            'nonce' => bin2hex(random_bytes(16)),
            'iat' => now()->timestamp,
        ]));

        $params = http_build_query([
            'client_id' => $clientId,
            'response_type' => 'code',
            'redirect_uri' => $redirectUri,
            'scope' => self::SCOPES,
            'response_mode' => 'query',
            'state' => $state,
        ]);

        return redirect("https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/authorize?{$params}");
    }

    public function callback(Request $request): RedirectResponse
    {
        $frontendUrl = rtrim(config('services.microsoft.frontend_url', 'http://localhost:5176'), '/');

        if ($request->has('error')) {
            $error = $request->query('error_description', $request->query('error', 'Erro desconhecido'));

            return redirect("{$frontendUrl}/login?error=".urlencode($error));
        }

        $code = $request->query('code');
        $state = $request->query('state');

        if (! $code || ! $state) {
            return redirect("{$frontendUrl}/login?error=".urlencode('Parâmetros inválidos.'));
        }

        try {
            $stateData = json_decode(Crypt::decryptString($state), true);
            $age = now()->timestamp - ($stateData['iat'] ?? 0);
            if ($age > 600) {
                return redirect("{$frontendUrl}/login?error=".urlencode('Sessão expirada. Tente novamente.'));
            }
        } catch (\Exception $e) {
            return redirect("{$frontendUrl}/login?error=".urlencode('Estado inválido. Tente novamente.'));
        }

        $tokenResponse = $this->exchangeCode($code);

        if ($tokenResponse === null) {
            return redirect("{$frontendUrl}/login?error=".urlencode('Falha ao autenticar com Microsoft.'));
        }

        $accessToken = $tokenResponse['access_token'] ?? null;

        if (! $accessToken) {
            return redirect("{$frontendUrl}/login?error=".urlencode('Token não recebido da Microsoft.'));
        }

        $claims = $this->decodeJwtPayload($accessToken);

        if (! $claims) {
            return redirect("{$frontendUrl}/login?error=".urlencode('Falha ao decodificar token da Microsoft.'));
        }

        $email = $claims['unique_name']
            ?? $claims['email']
            ?? $claims['preferred_username']
            ?? $claims['upn']
            ?? null;

        if (! $email) {
            return redirect("{$frontendUrl}/login?error=".urlencode('E-mail não encontrado no token da Microsoft.'));
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            return redirect("{$frontendUrl}/login?error=".urlencode("E-mail {$email} não cadastrado no sistema."));
        }

        if (! $user->isActive()) {
            return redirect("{$frontendUrl}/login?error=".urlencode('Usuário desativado. Contate o administrador.'));
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return redirect("{$frontendUrl}/login?token={$token}");
    }

    private function exchangeCode(string $code): ?array
    {
        $tenantId = config('services.microsoft.tenant_id');
        $response = Http::asForm()->post("https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/token", [
            'client_id' => config('services.microsoft.client_id'),
            'client_secret' => config('services.microsoft.client_secret'),
            'code' => $code,
            'redirect_uri' => $this->redirectUri(),
            'grant_type' => 'authorization_code',
            'scope' => self::SCOPES,
        ]);

        if (! $response->successful()) {
            return null;
        }

        return $response->json();
    }

    private function redirectUri(): string
    {
        return config('services.microsoft.redirect')
            ?: rtrim(config('app.url'), '/').'/api/v1/auth/microsoft/callback';
    }

    private function decodeJwtPayload(string $jwt): ?array
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return null;
        }

        $payload = $parts[1];
        $payload = strtr($payload, '-_', '+/');

        if (strlen($payload) % 4 !== 0) {
            $payload .= str_repeat('=', 4 - (strlen($payload) % 4));
        }

        $decoded = base64_decode($payload, true);

        if ($decoded === false) {
            return null;
        }

        return json_decode($decoded, true);
    }
}
