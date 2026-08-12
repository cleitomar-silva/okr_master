<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $users = User::with('companies:id,name')->orderBy('name')->get()
            ->map(fn (User $u) => $this->serialize($u));

        return response()->json(['status' => 'ok', 'data' => ['users' => $users]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'permission' => 'required|in:admin,gestor,colaborador',
            'password' => 'required|string|min:6',
            'company_ids' => 'array',
            'company_ids.*' => 'integer|exists:companies,id',
        ]);

        $user = User::create($validated);
        $user->companies()->sync($validated['company_ids'] ?? []);

        return response()->json(['status' => 'ok', 'data' => ['user' => $this->serialize($user->fresh())]]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'permission' => 'sometimes|in:admin,gestor,colaborador',
            'password' => 'sometimes|nullable|string|min:6',
            'company_ids' => 'array',
            'company_ids.*' => 'integer|exists:companies,id',
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $user->update($validated);

        if (array_key_exists('company_ids', $validated)) {
            $user->companies()->sync($validated['company_ids']);
        }

        return response()->json(['status' => 'ok', 'data' => ['user' => $this->serialize($user->fresh('companies:id,name'))]]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Você não pode excluir o próprio usuário.',
            ], 422);
        }

        $user->delete();

        return response()->json(['status' => 'ok']);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $user = $request->user();

        if (! app('hash')->check($validated['current_password'], $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'A senha atual está incorreta.',
            ], 422);
        }

        $user->update(['password' => $validated['password']]);

        return response()->json(['status' => 'ok']);
    }

    private function serialize(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'permission' => $user->permission,
            'companies' => $user->companies,
        ];
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->isAdmin(), 403, 'Acesso restrito a Administradores.');
    }
}