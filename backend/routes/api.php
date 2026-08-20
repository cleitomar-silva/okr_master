<?php

use App\Http\Controllers\Api\ActionController;
use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AxisController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FollowUpController;
use App\Http\Controllers\Api\InitiativeController;
use App\Http\Controllers\Api\ObjectiveController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->name('api.login');

    Route::middleware(['auth:sanctum', 'user.active'])->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::get('my-companies', [AuthController::class, 'companies']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::put('change-password', [UserController::class, 'updatePassword']);

        Route::get('dashboard', [DashboardController::class, 'index']);
        Route::get('filters', [DashboardController::class, 'filters']);
        Route::get('years', [DashboardController::class, 'years']);
        Route::post('years', [DashboardController::class, 'storeYear']);
        Route::get('linkable-users', [DashboardController::class, 'linkableUsers']);

        Route::apiResource('users', UserController::class);
        Route::apiResource('companies', CompanyController::class);

        Route::apiResource('axes', AxisController::class)->except(['show'])->parameters(['axes' => 'axis']);
        Route::apiResource('objectives', ObjectiveController::class)->except(['show']);
        Route::apiResource('actions', ActionController::class)->except(['show']);
        Route::patch('actions/{action}/toggle', [ActionController::class, 'toggle']);
        Route::apiResource('initiatives', InitiativeController::class)->except(['show']);
        Route::patch('initiatives/{initiative}/toggle', [InitiativeController::class, 'toggle']);

        Route::post('attachments', [AttachmentController::class, 'store']);
        Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download']);
        Route::delete('attachments/{attachment}', [AttachmentController::class, 'destroy']);

        Route::get('follow-ups', [FollowUpController::class, 'index']);
        Route::post('follow-ups', [FollowUpController::class, 'store']);
    });
});
