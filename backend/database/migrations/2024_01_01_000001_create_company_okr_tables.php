<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('cnpj', 20)->unique();
            $table->string('color', 9)->default('#0f639d');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('user_companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->unique(['user_id', 'company_id']);
            $table->timestamps();
        });

        Schema::create('axes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('objectives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('axis_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('objective_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('action_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('action_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unique(['action_id', 'user_id']);
            $table->timestamps();
        });

        Schema::create('initiatives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('action_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->boolean('completed')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('initiative_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('initiative_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unique(['initiative_id', 'user_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('initiative_users');
        Schema::dropIfExists('initiatives');
        Schema::dropIfExists('action_users');
        Schema::dropIfExists('actions');
        Schema::dropIfExists('objectives');
        Schema::dropIfExists('axes');
        Schema::dropIfExists('user_companies');
        Schema::dropIfExists('companies');
    }
};