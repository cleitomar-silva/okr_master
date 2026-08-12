<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'permission'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    public const PERMISSIONS = ['admin', 'gestor', 'colaborador'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'user_companies')->withTimestamps();
    }

    public function actions(): BelongsToMany
    {
        return $this->belongsToMany(Action::class, 'action_users')->withTimestamps();
    }

    public function initiatives(): BelongsToMany
    {
        return $this->belongsToMany(Initiative::class, 'initiative_users')->withTimestamps();
    }

    public function isAdmin(): bool
    {
        return $this->permission === 'admin';
    }

    public function isGestor(): bool
    {
        return $this->permission === 'gestor';
    }

    public function canManageOkr(): bool
    {
        return in_array($this->permission, ['admin', 'gestor']);
    }

    public function canDeleteOkr(): bool
    {
        return $this->permission === 'admin';
    }
}