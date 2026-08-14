<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Action;
use App\Models\Objective;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ObjectiveController extends Controller
{
    use EnforcesCompanyAccess;

    public function index(Request $request): JsonResponse
    {
        $request->validate(['axis_id' => 'required|integer|exists:axes,id']);
        $this->assertCompanyAccess($request, $this->companyOfAxis($request->integer('axis_id')));

        $objectives = Objective::withCount('actions')
            ->where('axis_id', $request->integer('axis_id'))
            ->orderBy('name')
            ->get();

        return response()->json(['status' => 'ok', 'data' => ['objectives' => $objectives]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->assertCanEditOkr($request);

        $validated = $request->validate([
            'axis_id' => 'required|integer|exists:axes,id',
            'name' => 'required|string|max:255',
        ]);

        $this->assertCompanyAccess($request, $this->companyOfAxis($validated['axis_id']));

        $objective = Objective::create($validated);

        return response()->json(['status' => 'ok', 'data' => ['objective' => $objective->fresh()]]);
    }

    public function update(Request $request, Objective $objective): JsonResponse
    {
        $this->assertCanEditOkr($request);
        $this->assertCompanyAccess($request, $this->companyOfObjective($objective->id));

        $validated = $request->validate(['name' => 'required|string|max:255']);
        $objective->update($validated);

        return response()->json(['status' => 'ok', 'data' => ['objective' => $objective->fresh()]]);
    }

    public function destroy(Request $request, Objective $objective): JsonResponse
    {
        $this->assertCanDeleteOkr($request);
        $this->assertCompanyAccess($request, $this->companyOfObjective($objective->id));

        $actionCount = Action::where('objective_id', $objective->id)->count();
        $initiativeCount = Action::where('objective_id', $objective->id)
            ->get()->sum(fn (Action $a) => $a->initiatives()->count());

        $objective->delete();

        return response()->json([
            'status' => 'ok',
            'data' => [
                'impact' => [
                    'message' => "Objetivo excluído. {$actionCount} Ação(ões) e {$initiativeCount} Iniciativa(s) foram preservados (exclusão lógica).",
                ],
            ],
        ]);
    }
}
