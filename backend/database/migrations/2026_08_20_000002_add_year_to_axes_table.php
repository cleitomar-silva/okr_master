<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('axes', function (Blueprint $table) {
            $table->unsignedSmallInteger('year')->default((int) date('Y'))->after('company_id');
        });
    }

    public function down(): void
    {
        Schema::table('axes', function (Blueprint $table) {
            $table->dropColumn('year');
        });
    }
};