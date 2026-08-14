<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->isActive()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Usuário desativado. Contate o administrador.',
            ], 403);
        }

        return $next($request);
    }
}
