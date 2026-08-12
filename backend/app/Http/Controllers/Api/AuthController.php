<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'status' => 'ok',
            'data' => [
                'token' => $token,
                'user' => $this->serializeUser($user),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['status' => 'ok']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'data' => ['user' => $this->serializeUser($request->user())],
        ]);
    }

    public function companies(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Company::query();
        if (! $user->isAdmin()) {
            $query->whereIn('id', $user->companies()->pluck('companies.id'));
        }

        return response()->json([
            'status' => 'ok',
            'data' => ['companies' => $query->orderBy('name')->get()],
        ]);
    }

    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'permission' => $user->permission,
            'companies' => $user->companies()->orderBy('name')->get(),
        ];
    }
}