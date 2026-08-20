<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('follow_ups', function (Blueprint $table) {
            $table->id();
            $table->morphs('followupable');
            $table->dateTime('meeting_at');
            $table->text('minutes');
            $table->timestamps();
        });

        Schema::create('follow_up_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('follow_up_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unique(['follow_up_id', 'user_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('follow_up_users');
        Schema::dropIfExists('follow_ups');
    }
};