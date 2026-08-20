<?php

namespace App\Http\Controllers\Api;

use App\Models\Action;
use App\Models\Attachment;
use App\Models\Axis;
use App\Models\FollowUp;
use App\Models\Initiative;
use App\Models\User;
use Illuminate\Http\Request;

trait EnforcesCompanyAccess
{
    protected function isAdmin(Request $request): bool
    {
        return $request->user()->isAdmin();
    }

    protected function userCanAccessCompany(User $user, int $companyId): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->companies()->where('companies.id', $companyId)->exists();
    }

    protected function assertCompanyAccess(Request $request, int $companyId): void
    {
        abort_unless(
            $this->userCanAccessCompany($request->user(), $companyId),
            403,
            'Você não possui acesso a esta empresa.'
        );
    }

    protected function companyOfAxis(int $axisId): int
    {
        return (int) Axis::whereKey($axisId)->value('company_id');
    }

    protected function companyOfObjective(int $objectiveId): int
    {
        return (int) Axis::join('objectives', 'objectives.axis_id', '=', 'axes.id')
            ->where('objectives.id', $objectiveId)->value('axes.company_id');
    }

    protected function companyOfAction(int $actionId): int
    {
        return (int) Axis::join('objectives', 'objectives.axis_id', '=', 'axes.id')
            ->join('actions', 'actions.objective_id', '=', 'objectives.id')
            ->where('actions.id', $actionId)->value('axes.company_id');
    }

    protected function companyOfInitiative(int $initiativeId): int
    {
        return (int) Axis::join('objectives', 'objectives.axis_id', '=', 'axes.id')
            ->join('actions', 'actions.objective_id', '=', 'objectives.id')
            ->join('initiatives', 'initiatives.action_id', '=', 'actions.id')
            ->where('initiatives.id', $initiativeId)->value('axes.company_id');
    }

    protected function companyOfFollowUp(int $followUpId): int
    {
        $followUp = FollowUp::whereKey($followUpId)->firstOrFail();

        return $followUp->followupable_type === Action::class
            ? $this->companyOfAction($followUp->followupable_id)
            : $this->companyOfInitiative($followUp->followupable_id);
    }

    protected function assertAdmin(Request $request): void
    {
        abort_unless($this->isAdmin($request), 403, 'Acesso restrito a Administradores.');
    }

    protected function assertCanEditOkr(Request $request): void
    {
        abort_unless($request->user()->canManageOkr(), 403, 'Apenas Gestores e Administradores podem editar OKRs.');
    }

    protected function assertCanDeleteOkr(Request $request): void
    {
        abort_unless($request->user()->canDeleteOkr(), 403, 'Apenas Administradores podem excluir OKRs.');
    }

    protected function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];
    }

    protected function attachmentData(Attachment $attachment): array
    {
        return [
            'id' => $attachment->id,
            'name' => $attachment->name,
            'mime_type' => $attachment->mime_type,
            'size' => $attachment->size,
            'download_url' => '/api/v1/attachments/'.$attachment->id.'/download',
        ];
    }

    protected function actionData(Action $action, User $user): array
    {
        return [
            'id' => $action->id,
            'name' => $action->name,
            'completed' => (bool) $action->completed,
            'progress' => $action->progress(),
            'users' => $action->users->map(fn (User $u) => $this->serializeUser($u)),
            'attachments' => $action->attachments->map(fn (Attachment $a) => $this->attachmentData($a))->values(),
            'mine' => $action->users->contains('id', $user->id),
        ];
    }

    protected function initiativeData(Initiative $initiative, User $user): array
    {
        return [
            'id' => $initiative->id,
            'name' => $initiative->name,
            'completed' => $initiative->completed,
            'users' => $initiative->users->map(fn (User $u) => $this->serializeUser($u)),
            'attachments' => $initiative->attachments->map(fn (Attachment $a) => $this->attachmentData($a))->values(),
            'mine' => $initiative->users->contains('id', $user->id),
        ];
    }

    protected function followUpData(FollowUp $followUp): array
    {
        return [
            'id' => $followUp->id,
            'meeting_at' => $followUp->meeting_at?->toIso8601String(),
            'minutes' => $followUp->minutes,
            'users' => $followUp->users->map(fn (User $u) => $this->serializeUser($u))->values(),
            'attachments' => $followUp->attachments->map(fn (Attachment $a) => $this->attachmentData($a))->values(),
        ];
    }
}
