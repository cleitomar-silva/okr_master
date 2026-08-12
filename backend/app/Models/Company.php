<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'cnpj', 'color'])]
class Company extends Model
{
    use SoftDeletes;

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_companies')->withTimestamps();
    }

    public function axes(): HasMany
    {
        return $this->hasMany(Axis::class);
    }
}