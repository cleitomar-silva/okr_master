<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Initiative;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InitiativeController extends Controller
{
    use EnforcesCompanyAccess;

    public function index(Request $request): JsonResponse
    {
        $request->validate(['action_id' => 'required|integer|exists:actions,id']);
        $this->assertCompanyAccess($request, $this->companyOfAction($request->integer('action_id')));

        $initiatives = Initiative::with('users:id,name')
            ->where('action_id', $request->integer('action_id'))
            ->orderBy('name')
            ->get();

        return response()->json(['status' => 'ok', 'data' => ['initiatives' => $initiatives]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->assertCanEditOkr($request);

        $validated = $request->validate([
            'action_id' => 'required|integer|exists:actions,id',
            'name' => 'required|string|max:255',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $this->assertCompanyAccess($request, $this->companyOfAction($validated['action_id']));

        $initiative = Initiative::create($validated);
        $initiative->users()->sync($validated['user_ids'] ?? []);

        return response()->json(['status' => 'ok', 'data' => ['initiative' => $initiative->fresh('users:id,name')]]);
    }

    public function update(Request $request, Initiative $initiative): JsonResponse
    {
        $this->assertCanEditOkr($request);
        $this->assertCompanyAccess($request, $this->companyOfInitiative($initiative->id));

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'completed' => 'sometimes|boolean',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $initiative->update($validated);

        if (array_key_exists('user_ids', $validated)) {
            $initiative->users()->sync($validated['user_ids']);
        }

        return response()->json(['status' => 'ok', 'data' => ['initiative' => $initiative->fresh('users:id,name')]]);
    }

    public function toggle(Request $request, Initiative $initiative): JsonResponse
    {
        $user = $request->user();
        $this->assertCompanyAccess($request, $this->companyOfInitiative($initiative->id));

        $linked = $initiative->users->contains('id', $user->id)
            || $initiative->action->users->contains('id', $user->id);

        if (! $user->canManageOkr() && ! $linked) {
            abort(403, 'Você só pode marcar iniciativas às quais está vinculado.');
        }

        $initiative->update(['completed' => ! $initiative->completed]);

        return response()->json(['status' => 'ok', 'data' => ['initiative' => $initiative->fresh()]]);
    }

    public function destroy(Request $request, Initiative $initiative): JsonResponse
    {
        $this->assertCanDeleteOkr($request);
        $this->assertCompanyAccess($request, $this->companyOfInitiative($initiative->id));

        $initiative->delete();

        return response()->json(['status' => 'ok']);
    }
}
