<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Action;
use App\Models\Axis;
use App\Models\Company;
use App\Models\Initiative;
use App\Models\Objective;
use App\Models\Year;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use EnforcesCompanyAccess;

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'company_id' => 'required|integer|exists:companies,id',
            'year' => 'required|integer|between:2000,2100',
            'axis_id' => 'nullable|integer|exists:axes,id',
            'objective_id' => 'nullable|integer|exists:objectives,id',
            'action_id' => 'nullable|integer|exists:actions,id',
            'mine' => 'nullable|boolean',
        ]);

        $companyId = $request->integer('company_id');
        $year = $request->integer('year');
        $this->assertCompanyAccess($request, $companyId);

        $mine = $request->boolean('mine');
        $user = $request->user();

        $axes = Axis::with('objectives.actions.initiatives:id,action_id,name,completed', 'objectives.actions.users:id,name', 'objectives.actions.initiatives.users:id,name', 'objectives.actions.attachments:id,attachable_type,attachable_id,name,mime_type,size', 'objectives.actions.initiatives.attachments:id,attachable_type,attachable_id,name,mime_type,size')
            ->where('company_id', $companyId)
            ->where('year', $year)
            ->when($request->filled('axis_id'), fn ($q) => $q->where('id', $request->integer('axis_id')))
            ->orderBy('name')
            ->get();

        $tree = [];
        $mappedActions = [];
        $mappedInitiatives = [];

        foreach ($axes as $axis) {
            $node = ['id' => $axis->id, 'name' => $axis->name, 'objectives' => []];

            foreach ($axis->objectives as $objective) {
                if ($request->filled('objective_id') && $objective->id != $request->integer('objective_id')) {
                    continue;
                }

                $objNode = ['id' => $objective->id, 'name' => $objective->name, 'actions' => []];

                foreach ($objective->actions as $action) {
                    if ($request->filled('action_id') && $action->id != $request->integer('action_id')) {
                        continue;
                    }

                    $mappedActions[] = $action;

                    $actionNode = $this->actionData($action, $user);
                    $actionNode['initiatives'] = $action->initiatives
                        ->map(fn (Initiative $i) => $this->initiativeData($i, $user))
                        ->all();

                    $objNode['actions'][] = $actionNode;
                    foreach ($action->initiatives as $initiative) {
                        $mappedInitiatives[] = $initiative;
                    }
                }

                $node['objectives'][] = $objNode;
            }

            $tree[] = $node;
        }

        if ($mine) {
            $tree = $this->applyMineFilter($tree, $user);
        }

        if ($request->filled('action_id')) {
            foreach ($tree as &$axis) {
                $axis['objectives'] = array_values(array_filter(
                    $axis['objectives'],
                    fn (array $obj) => $obj['actions'] !== []
                ));
            }
            unset($axis);
        }

        if ($request->filled('objective_id') || $request->filled('action_id')) {
            $tree = array_values(array_filter(
                $tree,
                fn (array $axis) => $axis['objectives'] !== []
            ));
        }

        $objectiveNodes = $this->collectObjectives($axes);
        $initiativeCount = count($mappedInitiatives);

        return response()->json([
            'status' => 'ok',
            'data' => [
                'axes' => $tree,
                'stats' => [
                    'axes_count' => count($axes),
                    'objectives_count' => count($objectiveNodes),
                    'objectives_risk' => collect($objectiveNodes)->filter(fn ($o) => $o['progress'] < 50)->count(),
                    'actions_total' => count($mappedActions),
                    'actions_done' => collect($mappedActions)->filter(fn (Action $a) => $a->progress() === 100)->count(),
                    'actions_completion' => $this->pct(
                        collect($mappedActions)->sum(fn (Action $a) => $a->progress()),
                        max(1, count($mappedActions))
                    ),
                    'progress_general' => $this->pct(
                        collect($mappedActions)->sum(fn (Action $a) => $a->progress()),
                        max(1, count($mappedActions))
                    ),
                    'initiatives_total' => $initiativeCount,
                    'initiatives_done' => collect($mappedInitiatives)->filter(fn (Initiative $i) => $i->completed)->count(),
                ],
            ],
        ]);
    }

    public function filters(Request $request): JsonResponse
    {
        $request->validate([
            'company_id' => 'required|integer|exists:companies,id',
            'year' => 'required|integer|between:2000,2100',
        ]);
        $companyId = $request->integer('company_id');
        $year = $request->integer('year');
        $this->assertCompanyAccess($request, $companyId);

        $axes = Axis::where('company_id', $companyId)->where('year', $year)->orderBy('name')->get(['id', 'name']);
        $axisIds = $axes->pluck('id');
        $objectives = Objective::whereIn('axis_id', $axisIds)->orderBy('name')->get(['id', 'axis_id', 'name']);
        $objectiveIds = $objectives->pluck('id');
        $actions = Action::whereIn('objective_id', $objectiveIds)->orderBy('name')->get(['id', 'objective_id', 'name']);

        return response()->json([
            'status' => 'ok',
            'data' => compact('axes', 'objectives', 'actions'),
        ]);
    }

    public function years(Request $request): JsonResponse
    {
        Year::firstOrCreate(['year' => (int) date('Y')]);
        $years = Year::orderByDesc('year')->pluck('year');

        return response()->json(['status' => 'ok', 'data' => ['years' => $years]]);
    }

    public function storeYear(Request $request): JsonResponse
    {
        $request->validate([
            'year' => 'required|integer|between:2000,2100|unique:years,year',
        ]);

        $year = Year::create(['year' => $request->integer('year')]);

        return response()->json([
            'status' => 'ok',
            'data' => [
                'year' => $year,
                'years' => Year::orderByDesc('year')->pluck('year'),
            ],
        ]);
    }

    public function linkableUsers(Request $request): JsonResponse
    {
        $request->validate(['company_id' => 'required|integer|exists:companies,id']);
        $companyId = $request->integer('company_id');
        $this->assertCompanyAccess($request, $companyId);

        $users = Company::findOrFail($companyId)
            ->users()
            ->orderBy('name')
            ->get(['users.id', 'users.name', 'users.email']);

        return response()->json(['status' => 'ok', 'data' => ['users' => $users]]);
    }

    private function applyMineFilter(array $tree, $user): array
    {
        $out = [];

        foreach ($tree as $axis) {
            $objectives = [];

            foreach ($axis['objectives'] as $objective) {
                $actions = [];

                foreach ($objective['actions'] as $action) {
                    if ($action['mine']) {
                        $actions[] = $action;

                        continue;
                    }

                    $initiatives = array_values(array_filter(
                        $action['initiatives'] ?? [],
                        fn (array $i) => $i['mine']
                    ));

                    if ($initiatives !== []) {
                        $action['initiatives'] = $initiatives;
                        $actions[] = $action;
                    }
                }

                if ($actions !== []) {
                    $objective['actions'] = $actions;
                    $objectives[] = $objective;
                }
            }

            if ($objectives !== []) {
                $axis['objectives'] = $objectives;
                $out[] = $axis;
            }
        }

        return $out;
    }

    private function collectObjectives($axes): array
    {
        $out = [];
        foreach ($axes as $axis) {
            foreach ($axis->objectives as $objective) {
                $progress = $this->pct(
                    collect($objective->actions)->sum(fn (Action $a) => $a->progress()),
                    max(1, $objective->actions->count())
                );
                $out[] = ['id' => $objective->id, 'name' => $objective->name, 'progress' => $progress];
            }
        }

        return $out;
    }

    private function pct(int $sum, int $total): int
    {
        return (int) round($sum / $total);
    }
}
