<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Action;
use App\Models\Attachment;
use App\Models\FollowUp;
use App\Models\Initiative;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowUpController extends Controller
{
    use EnforcesCompanyAccess;

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'followupable_type' => 'required|string|in:action,initiative',
            'followupable_id' => 'required|integer',
        ]);

        $followupable = $this->resolveFollowupable($validated);
        $this->assertCompanyAccess($request, $this->companyOfFollowupable($followupable));

        $followUps = $followupable->followUps()
            ->with('users:id,name', 'attachments')
            ->orderByDesc('id')
            ->get()
            ->map(fn (FollowUp $f) => $this->followUpData($f));

        return response()->json(['status' => 'ok', 'data' => ['follow_ups' => $followUps]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->assertCanEditOkr($request);

        $validated = $request->validate([
            'followupable_type' => 'required|string|in:action,initiative',
            'followupable_id' => 'required|integer',
            'meeting_at' => 'required|date',
            'minutes' => 'required|string',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
            'files' => 'sometimes|array',
            'files.*' => 'file|max:51200|extensions:pdf,png,jpg,jpeg,gif,webp,bmp,xls,xlsx,csv',
        ]);

        $followupable = $this->resolveFollowupable($validated);
        $this->assertCompanyAccess($request, $this->companyOfFollowupable($followupable));

        $followUp = $followupable->followUps()->create([
            'meeting_at' => $validated['meeting_at'],
            'minutes' => $validated['minutes'],
        ]);

        $followUp->users()->sync($validated['user_ids']);

        foreach ($request->file('files', []) as $file) {
            $followUp->attachments()->create([
                'name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'data' => file_get_contents($file->getRealPath()),
            ]);
        }

        return response()->json([
            'status' => 'ok',
            'data' => ['follow_up' => $this->followUpData($followUp->fresh('users:id,name', 'attachments'))],
        ]);
    }

    private function resolveFollowupable(array $validated): Action|Initiative
    {
        $modelClass = $validated['followupable_type'] === 'action' ? Action::class : Initiative::class;

        return $modelClass::withTrashed()->findOrFail($validated['followupable_id']);
    }

    private function companyOfFollowupable(Action|Initiative $followupable): int
    {
        return $followupable instanceof Action
            ? $this->companyOfAction($followupable->id)
            : $this->companyOfInitiative($followupable->id);
    }
}