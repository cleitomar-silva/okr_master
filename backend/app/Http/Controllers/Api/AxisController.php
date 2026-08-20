<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Action;
use App\Models\Axis;
use App\Models\Objective;
use App\Models\Year;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AxisController extends Controller
{
    use EnforcesCompanyAccess;

    public function index(Request $request): JsonResponse
    {
        $request->validate(['company_id' => 'required|integer|exists:companies,id']);
        $this->assertCompanyAccess($request, $request->integer('company_id'));

        $axes = Axis::withCount('objectives')
            ->where('company_id', $request->integer('company_id'))
            ->orderBy('name')
            ->get();

        return response()->json(['status' => 'ok', 'data' => ['axes' => $axes]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->assertCanEditOkr($request);

        $validated = $request->validate([
            'company_id' => 'required|integer|exists:companies,id',
            'year' => 'required|integer|between:2000,2100',
            'name' => 'required|string|max:255',
        ]);

        $this->assertCompanyAccess($request, $validated['company_id']);

        Year::firstOrCreate(['year' => $validated['year']]);

        $axis = Axis::create($validated);

        return response()->json(['status' => 'ok', 'data' => ['axis' => $axis->fresh()]]);
    }

    public function update(Request $request, Axis $axis): JsonResponse
    {
        $this->assertCanEditOkr($request);
        $this->assertCompanyAccess($request, $this->companyOfAxis($axis->id));

        $validated = $request->validate(['name' => 'required|string|max:255']);
        $axis->update($validated);

        return response()->json(['status' => 'ok', 'data' => ['axis' => $axis->fresh()]]);
    }

    public function destroy(Request $request, Axis $axis): JsonResponse
    {
        $this->assertCanDeleteOkr($request);
        $this->assertCompanyAccess($request, $this->companyOfAxis($axis->id));

        $objectives = Objective::whereIn('id', $axis->objectives()->pluck('objectives.id'));
        $objectiveCount = $objectives->count();
        $actionCount = Action::whereIn('objective_id', $axis->objectives()->pluck('objectives.id'))->count();
        $initiativeCount = Action::whereIn('objective_id', $axis->objectives()->pluck('objectives.id'))
            ->get()->sum(fn (Action $a) => $a->initiatives()->count());

        $axis->delete();

        return response()->json([
            'status' => 'ok',
            'data' => [
                'impact' => [
                    'message' => "Eixo excluído. {$objectiveCount} Objetivo(s), {$actionCount} Ação(ões) e {$initiativeCount} Iniciativa(s) foram preservados (exclusão lógica).",
                ],
            ],
        ]);
    }
}
