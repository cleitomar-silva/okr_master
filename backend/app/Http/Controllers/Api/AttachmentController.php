<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Action;
use App\Models\Attachment;
use App\Models\FollowUp;
use App\Models\Initiative;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    use EnforcesCompanyAccess;

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'attachable_type' => 'required|string|in:action,initiative,follow_up',
            'attachable_id' => 'required|integer',
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|max:51200|extensions:pdf,png,jpg,jpeg,gif,webp,bmp,xls,xlsx,csv',
        ]);

        $attachable = $this->resolveAttachable($validated['attachable_type'], $validated['attachable_id']);
        $companyId = $this->companyOfAttachable($attachable);

        $this->assertCompanyAccess($request, $companyId);

        $attachments = [];

        foreach ($validated['files'] as $file) {
            $attachments[] = $attachable->attachments()->create([
                'name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'data' => file_get_contents($file->getRealPath()),
            ]);
        }

        return response()->json([
            'status' => 'ok',
            'data' => [
                'attachments' => collect($attachments)
                    ->map(fn (Attachment $a) => $this->attachmentData($a))
                    ->values(),
            ],
        ]);
    }

    public function download(Request $request, Attachment $attachment): StreamedResponse
    {
        $this->assertAccess($request, $attachment);

        return response()->streamDownload(
            function () use ($attachment) {
                echo $attachment->data;
            },
            $attachment->name,
            ['Content-Type' => $attachment->mime_type]
        );
    }

    public function destroy(Request $request, Attachment $attachment): JsonResponse
    {
        $this->assertCanDeleteOkr($request);
        $this->assertAccess($request, $attachment);

        $attachment->delete();

        return response()->json(['status' => 'ok']);
    }

    private function assertAccess(Request $request, Attachment $attachment): void
    {
        $attachable = $this->resolveByClass($attachment->attachable_type, $attachment->attachable_id);

        $this->assertCompanyAccess($request, $this->companyOfAttachable($attachable));
    }

    private function resolveAttachable(string $type, int $id): Action|FollowUp|Initiative
    {
        return match ($type) {
            'action' => Action::withTrashed()->findOrFail($id),
            'initiative' => Initiative::withTrashed()->findOrFail($id),
            'follow_up' => FollowUp::findOrFail($id),
        };
    }

    private function resolveByClass(string $class, int $id): Action|FollowUp|Initiative
    {
        return $class === FollowUp::class
            ? FollowUp::findOrFail($id)
            : $class::withTrashed()->findOrFail($id);
    }

    private function companyOfAttachable(Action|FollowUp|Initiative $attachable): int
    {
        if ($attachable instanceof FollowUp) {
            return $this->companyOfFollowUp($attachable->id);
        }

        return $attachable instanceof Action
            ? $this->companyOfAction($attachable->id)
            : $this->companyOfInitiative($attachable->id);
    }
}
