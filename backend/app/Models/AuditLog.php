<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Throwable;

#[Fillable([
    'user_id',
    'user_name',
    'action_type',
    'auditable_type',
    'auditable_id',
    'entity_name',
    'record_label',
    'company_id',
    'old_content',
    'new_content',
    'changes',
    'ip_address',
    'user_agent',
    'previous_hash',
    'hash',
    'created_at',
])]
class AuditLog extends Model
{
    public const ACTION_INCLUSAO = 'inclusao';

    public const ACTION_EDICAO = 'edicao';

    public const ACTION_EXCLUSAO = 'exclusao';

    public const ACTION_TYPES = [self::ACTION_INCLUSAO, self::ACTION_EDICAO, self::ACTION_EXCLUSAO];

    private const EXCLUDED_COLUMNS = ['created_at', 'updated_at', 'deleted_at', 'password', 'remember_token', 'data'];

    private const JSON_FLAGS = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION;

    protected function casts(): array
    {
        return [
            'old_content' => 'array',
            'new_content' => 'array',
            'changes' => 'array',
            'company_id' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class)->withTrashed();
    }

    public static function record(Model $model, string $action): void
    {
        if (self::shouldSkip($action)) {
            return;
        }

        $old = null;
        $new = null;
        $changes = null;

        if ($action === self::ACTION_INCLUSAO) {
            $new = self::contentFrom($model, $model->getAttributes());
        } elseif ($action === self::ACTION_EDICAO) {
            $old = self::contentFrom($model, $model->getOriginal());
            $new = self::contentFrom($model, $model->getAttributes());
            $changes = self::diff($old, $new, $model->getChanges());

            if ($changes === []) {
                return;
            }
        } elseif ($action === self::ACTION_EXCLUSAO) {
            $old = self::contentFrom($model, $model->getAttributes());
        }

        self::persist(self::buildPayload($model, $action, $old, $new, $changes));
    }

    public static function recordContentChange(Model $model, array $oldContent, array $newContent, array $changes): void
    {
        if (! config('audit.enabled', true) || $changes === []) {
            return;
        }

        self::persist(self::buildPayload($model, self::ACTION_EDICAO, $oldContent, $newContent, $changes));
    }

    private static function shouldSkip(string $action): bool
    {
        return ! config('audit.enabled', true) || ! in_array($action, self::ACTION_TYPES, true);
    }

    private static function buildPayload(Model $model, string $action, ?array $old, ?array $new, ?array $changes): array
    {
        $user = auth('sanctum')->user() ?? auth()->user();

        return [
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'action_type' => $action,
            'auditable_type' => $model->getMorphClass(),
            'auditable_id' => $model->getKey(),
            'entity_name' => self::entityName($model),
            'record_label' => self::recordLabel($model),
            'company_id' => self::companyIdOf($model),
            'old_content' => $old,
            'new_content' => $new,
            'changes' => $changes,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
            'created_at' => Carbon::now()->format('Y-m-d H:i:s'),
        ];
    }

    private static function persist(array $payload): void
    {
        try {
            DB::transaction(function () use ($payload): void {
                $previous = self::query()->latest('id')->lockForUpdate()->value('hash');
                $payload['previous_hash'] = $previous;
                $payload['hash'] = self::computeHash($payload, $previous);

                self::create($payload);
            });
        } catch (Throwable $e) {
            report($e);
        }
    }

    public static function computeHash(array $payload, ?string $previous, ?string $secret = null): string
    {
        $secret ??= (string) config('audit.secret');

        $canonical = $payload;
        unset($canonical['previous_hash'], $canonical['hash']);
        ksort($canonical);

        $json = self::canonicalJson($canonical);
        $anchor = $previous ?? str_repeat('0', 64);

        return hash('sha256', $anchor.'|'.$json.'|'.$secret);
    }

    public static function recomputeHash(AuditLog $log, ?string $previous, string $secret): string
    {
        $payload = [
            'action_type' => $log->action_type,
            'auditable_id' => $log->auditable_id,
            'auditable_type' => $log->auditable_type,
            'changes' => self::normalizeContent($log->getAttribute('changes')),
            'company_id' => $log->company_id,
            'created_at' => $log->created_at?->format('Y-m-d H:i:s'),
            'entity_name' => $log->entity_name,
            'ip_address' => $log->ip_address,
            'new_content' => self::normalizeContent($log->new_content),
            'old_content' => self::normalizeContent($log->old_content),
            'record_label' => $log->record_label,
            'user_agent' => $log->user_agent,
            'user_id' => $log->user_id,
            'user_name' => $log->user_name,
        ];

        return self::computeHash($payload, $previous, $secret);
    }

    private static function normalizeContent(mixed $content): ?array
    {
        if ($content === null || $content === []) {
            return null;
        }

        return $content;
    }

    private static function canonicalJson(array $payload): string
    {
        ksort($payload);

        foreach ($payload as $key => $value) {
            if (is_array($value)) {
                $payload[$key] = self::sortRecursive($value);
            }
        }

        return json_encode($payload, self::JSON_FLAGS | JSON_THROW_ON_ERROR);
    }

    private static function sortRecursive(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        $sorted = [];

        foreach ($value as $key => $item) {
            $sorted[$key] = self::sortRecursive($item);
        }

        ksort($sorted);

        return $sorted;
    }

    private static function contentFrom(Model $model, array $attributes): array
    {
        $content = [];

        foreach ($attributes as $key => $value) {
            if (in_array($key, self::EXCLUDED_COLUMNS, true)) {
                continue;
            }

            $content[$key] = self::normalizeValue($value, $model->getCasts()[$key] ?? null);
        }

        return $content;
    }

    private static function normalizeValue(mixed $value, ?string $cast): mixed
    {
        if (is_null($value)) {
            return null;
        }

        if (is_array($value)) {
            return $value;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->toIso8601String();
        }

        if ($cast) {
            $cast = strtolower(ltrim((string) $cast, '?'));

            if (str_starts_with($cast, 'bool')) {
                return (bool) $value;
            }

            if (str_starts_with($cast, 'array') || str_starts_with($cast, 'json')) {
                $decoded = json_decode((string) $value, true);

                return is_array($decoded) ? $decoded : $value;
            }

            if (str_starts_with($cast, 'datetime') || str_starts_with($cast, 'date') || str_starts_with($cast, 'timestamp')) {
                try {
                    return Carbon::parse((string) $value)->toIso8601String();
                } catch (Throwable) {
                    return $value;
                }
            }
        }

        return $value;
    }

    private static function diff(array $old, array $new, array $rawChanges): array
    {
        $keys = array_unique([...array_keys($old), ...array_keys($new)]);
        $changes = [];

        foreach ($keys as $key) {
            $a = $old[$key] ?? null;
            $b = $new[$key] ?? null;

            if ($a !== $b) {
                $changes[$key] = ['old' => $a, 'new' => $b];
            }
        }

        foreach (array_keys($rawChanges) as $key) {
            if (array_key_exists($key, $changes) || in_array($key, self::EXCLUDED_COLUMNS, true) === false) {
                continue;
            }

            if (in_array($key, ['created_at', 'updated_at', 'deleted_at'], true)) {
                continue;
            }

            $changes[$key] = ['old' => null, 'new' => null, 'hidden' => true];
        }

        return $changes;
    }

    private static function entityName(Model $model): string
    {
        return match (true) {
            $model instanceof User => 'Usuário',
            $model instanceof Company => 'Empresa',
            $model instanceof Axis => 'Eixo',
            $model instanceof Objective => 'Objetivo',
            $model instanceof Action => 'Ação',
            $model instanceof Initiative => 'Iniciativa',
            $model instanceof FollowUp => 'Acompanhamento',
            $model instanceof Attachment => 'Anexo',
            default => ucfirst(class_basename($model)),
        };
    }

    private static function recordLabel(Model $model): ?string
    {
        if (is_string($model->name ?? null) && $model->name !== '') {
            return $model->name;
        }

        if ($model instanceof FollowUp && $model->meeting_at) {
            $meetingAt = $model->meeting_at instanceof \DateTimeInterface
                ? $model->meeting_at->format('d/m/Y H:i')
                : (string) $model->meeting_at;

            return 'Reunião de '.$meetingAt;
        }

        return '#'.$model->getKey();
    }

    private static function companyIdOf(Model $model): ?int
    {
        if ($model instanceof Company) {
            return (int) $model->getKey();
        }

        if ($model instanceof Axis) {
            return self::intOrNull($model->company_id);
        }

        if ($model instanceof Objective) {
            return self::intOrNull(Axis::withTrashed()->whereKey($model->axis_id)->value('company_id'));
        }

        if ($model instanceof Action) {
            $axisId = self::intOrNull(Objective::withTrashed()->whereKey($model->objective_id)->value('axis_id'));

            return $axisId ? self::intOrNull(Axis::withTrashed()->whereKey($axisId)->value('company_id')) : null;
        }

        if ($model instanceof Initiative) {
            $objectiveId = self::intOrNull(Action::withTrashed()->whereKey($model->action_id)->value('objective_id'));

            if (! $objectiveId) {
                return null;
            }

            $axisId = self::intOrNull(Objective::withTrashed()->whereKey($objectiveId)->value('axis_id'));

            return $axisId ? self::intOrNull(Axis::withTrashed()->whereKey($axisId)->value('company_id')) : null;
        }

        if ($model instanceof Attachment || $model instanceof FollowUp) {
            $parent = $model instanceof Attachment
                ? $model->attachable()->withTrashed()->first()
                : $model->followupable()->withTrashed()->first();

            return $parent instanceof Model ? self::companyIdOf($parent) : null;
        }

        return null;
    }

    private static function intOrNull(mixed $value): ?int
    {
        $value = (int) $value;

        return $value > 0 ? $value : null;
    }
}
