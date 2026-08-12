<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Axis;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $user = $request->user();
        $withCount = ['axes'];

        if ($user->isAdmin()) {
            $withCount[] = 'users';
        }

        $companies = Company::withCount($withCount)
            ->orderBy('name')
            ->get()
            ->map(fn (Company $c) => $this->serialize($c, $user));

        return response()->json(['status' => 'ok', 'data' => ['companies' => $companies]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'cnpj' => 'required|string|max:20|unique:companies,cnpj',
            'color' => 'required|string|max:9',
        ]);

        $company = Company::create($validated);

        return response()->json(['status' => 'ok', 'data' => ['company' => $this->serialize($company, $request->user())]]);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'cnpj' => 'sometimes|string|max:20|unique:companies,cnpj,' . $company->id,
            'color' => 'sometimes|string|max:9',
        ]);

        $company->update($validated);

        return response()->json(['status' => 'ok', 'data' => ['company' => $this->serialize($company, $request->user())]]);
    }

    public function destroy(Request $request, Company $company): JsonResponse
    {
        $this->authorizeAdmin($request);

        $impact = $this->impact($company);
        $company->delete();

        return response()->json(['status' => 'ok', 'data' => ['impact' => $impact]]);
    }

    private function serialize(Company $company, $user): array
    {
        $data = [
            'id' => $company->id,
            'name' => $company->name,
            'cnpj' => $company->cnpj,
            'color' => $company->color,
            'axes_count' => $company->axes_count,
        ];

        if ($user->isAdmin()) {
            $data['users_count'] = $company->users_count;
        }

        return $data;
    }

    private function impact(Company $company): array
    {
        $axisIds = $company->axes()->pluck('axes.id');
        $objectives = Axis::whereIn('id', $axisIds)->withCount('objectives')->get()->sum('objectives_count');

        return [
            'message' => 'Esta empresa será excluída logicamente. Os dados de OKR vinculados serão preservados e permanecerão ocultos.',
        ];
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->isAdmin(), 403, 'Acesso restrito a Administradores.');
    }
}