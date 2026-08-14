<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->morphs('attachable');
            $table->string('name');
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->binary('data');
            $table->timestamps();
        });

        DB::statement('ALTER TABLE attachments MODIFY data LONGBLOB');
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
