<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::created(fn (Model $model) => AuditLog::record($model, AuditLog::ACTION_INCLUSAO));
        static::updated(fn (Model $model) => AuditLog::record($model, AuditLog::ACTION_EDICAO));
        static::deleted(fn (Model $model) => AuditLog::record($model, AuditLog::ACTION_EXCLUSAO));
    }

    public function recordAuditRelationChange(array $beforeIds, array $afterIds, string $field = 'responsaveis'): void
    {
        if (! config('audit.enabled', true)) {
            return;
        }

        $before = self::normalizeAuditIds($beforeIds);
        $after = self::normalizeAuditIds($afterIds);

        if ($before === $after) {
            return;
        }

        $beforeNames = User::whereIn('id', $before)->orderBy('name')->pluck('name')->implode(', ');
        $afterNames = User::whereIn('id', $after)->orderBy('name')->pluck('name')->implode(', ');

        AuditLog::recordContentChange($this, [
            $field => $beforeNames,
        ], [
            $field => $afterNames,
        ], [
            $field => ['old' => $beforeNames, 'new' => $afterNames],
        ]);
    }

    private static function normalizeAuditIds(array $ids): array
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));
        sort($ids);

        return $ids;
    }
}
