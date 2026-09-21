<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    use EnforcesCompanyAccess;

    public function index(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'user_id' => 'nullable|integer|exists:users,id',
            'action_type' => 'nullable|in:inclusao,edicao,exclusao',
            'company_id' => 'nullable|integer',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = AuditLog::query()->with('user:id,name');

        if (! empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (! empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        if (! empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (! empty($validated['action_type'])) {
            $query->where('action_type', $validated['action_type']);
        }

        if (! empty($validated['company_id'])) {
            $query->where('company_id', $validated['company_id']);
        }

        $paginator = $query->orderByDesc('id')
            ->paginate((int) ($validated['per_page'] ?? config('audit.per_page', 25)))
            ->withQueryString();

        $companies = Company::withTrashed()->pluck('name', 'id');

        return response()->json([
            'status' => 'ok',
            'data' => [
                'audit_logs' => collect($paginator->items())
                    ->map(fn (AuditLog $log) => $this->serialize($log, $companies))
                    ->values(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
            ],
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        $valid = true;
        $checked = 0;
        $previous = null;
        $secret = (string) config('audit.secret');

        AuditLog::query()->orderBy('id')->each(function (AuditLog $log) use (&$valid, &$checked, &$previous, $secret): void {
            if ($log->previous_hash !== $previous) {
                $valid = false;
            }

            if (AuditLog::recomputeHash($log, $previous, $secret) !== $log->hash) {
                $valid = false;
            }

            $previous = $log->hash;
            $checked++;
        });

        return response()->json([
            'status' => 'ok',
            'data' => [
                'valid' => $valid,
                'checked' => $checked,
            ],
        ]);
    }

    private function serialize(AuditLog $log, $companies): array
    {
        return [
            'id' => $log->id,
            'action_type' => $log->action_type,
            'created_at' => $log->created_at?->toIso8601String(),
            'user_id' => $log->user_id,
            'user_name' => $log->user_name,
            'entity_name' => $log->entity_name,
            'record_label' => $log->record_label,
            'company_id' => $log->company_id,
            'company_name' => $companies[$log->company_id] ?? null,
            'old_content' => $log->old_content ?? (object) [],
            'new_content' => $log->new_content ?? (object) [],
            'changes' => $log->changes ?? (object) [],
        ];
    }
}
