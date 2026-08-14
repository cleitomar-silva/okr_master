<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Action;
use App\Models\Attachment;
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
            'attachable_type' => 'required|string|in:action,initiative',
            'attachable_id' => 'required|integer',
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|max:51200|mimes:pdf,png,jpg,jpeg,gif,webp,bmp,xls,xlsx,csv',
        ]);

        $isAction = $validated['attachable_type'] === 'action';
        $modelClass = $isAction ? Action::class : Initiative::class;

        $attachable = $modelClass::withTrashed()->findOrFail($validated['attachable_id']);
        $companyId = $isAction
            ? $this->companyOfAction($attachable->id)
            : $this->companyOfInitiative($attachable->id);

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
        $this->assertAccess($request, $attachment);

        $attachment->delete();

        return response()->json(['status' => 'ok']);
    }

    private function assertAccess(Request $request, Attachment $attachment): void
    {
        $companyId = $attachment->attachable_type === Action::class
            ? $this->companyOfAction($attachment->attachable_id)
            : $this->companyOfInitiative($attachment->attachable_id);

        $this->assertCompanyAccess($request, $companyId);
    }
}
