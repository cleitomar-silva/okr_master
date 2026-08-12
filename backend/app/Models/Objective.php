<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['axis_id', 'name'])]
class Objective extends Model
{
    use SoftDeletes;

    public function axis(): BelongsTo
    {
        return $this->belongsTo(Axis::class);
    }

    public function actions(): HasMany
    {
        return $this->hasMany(Action::class);
    }
}