<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['action_id', 'name', 'completed'])]
class Initiative extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
        ];
    }

    public function action(): BelongsTo
    {
        return $this->belongsTo(Action::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'initiative_users')->withTimestamps();
    }
}