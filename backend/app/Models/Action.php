<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['objective_id', 'name', 'completed'])]
class Action extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
        ];
    }

    public function objective(): BelongsTo
    {
        return $this->belongsTo(Objective::class);
    }

    public function initiatives(): HasMany
    {
        return $this->hasMany(Initiative::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'action_users')->withTimestamps();
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }

    public function progress(): int
    {
        $initiatives = $this->relationLoaded('initiatives') ? $this->initiatives : $this->initiatives()->get();

        $total = $initiatives->count();
        if ($total === 0) {
            return $this->completed ? 100 : 0;
        }

        $done = $initiatives->where('completed', true)->count();

        return (int) round($done / $total * 100);
    }
}
