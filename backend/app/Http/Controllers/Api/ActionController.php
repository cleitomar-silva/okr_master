<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Action;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActionController extends Controller
{
    use EnforcesCompanyAccess;

    public function index(Request $request): JsonResponse
    {
        $request->validate(['objective_id' => 'required|integer|exists:objectives,id']);
        $this->assertCompanyAccess($request, $this->companyOfObjective($request->integer('objective_id')));

        $actions = Action::with('users:id,name', 'initiatives:id,action_id,name,completed')
            ->where('objective_id', $request->integer('objective_id'))
            ->orderBy('name')
            ->get()
            ->map(fn (Action $a) => $this->serialize($a));

        return response()->json(['status' => 'ok', 'data' => ['actions' => $actions]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->assertCanEditOkr($request);

        $validated = $request->validate([
            'objective_id' => 'required|integer|exists:objectives,id',
            'name' => 'required|string|max:255',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $this->assertCompanyAccess($request, $this->companyOfObjective($validated['objective_id']));

        $action = Action::create($validated);
        $action->users()->sync($validated['user_ids'] ?? []);

        return response()->json(['status' => 'ok', 'data' => ['action' => $this->serialize($action->fresh('users:id,name', 'initiatives'))]]);
    }

    public function update(Request $request, Action $action): JsonResponse
    {
        $this->assertCanEditOkr($request);
        $this->assertCompanyAccess($request, $this->companyOfAction($action->id));

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $action->update($validated);
        $action->users()->sync($validated['user_ids']);

        return response()->json(['status' => 'ok', 'data' => ['action' => $this->serialize($action->fresh('users:id,name', 'initiatives'))]]);
    }

    public function destroy(Request $request, Action $action): JsonResponse
    {
        $this->assertCanDeleteOkr($request);
        $this->assertCompanyAccess($request, $this->companyOfAction($action->id));

        $initiativeCount = $action->initiatives()->count();
        $action->delete();

        return response()->json([
            'status' => 'ok',
            'data' => [
                'impact' => [
                    'message' => "Ação excluída. {$initiativeCount} Iniciativa(s) foram preservadas (exclusão lógica).",
                ],
            ],
        ]);
    }

    private function serialize(Action $action): array
    {
        return [
            'id' => $action->id,
            'name' => $action->name,
            'progress' => $action->progress(),
            'users' => $action->users,
            'initiatives' => $action->initiatives->map(fn ($i) => [
                'id' => $i->id,
                'name' => $i->name,
                'completed' => (bool) $i->completed,
            ]),
        ];
    }
}
