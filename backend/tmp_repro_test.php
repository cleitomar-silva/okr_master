<?php

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Action;
use App\Models\Axis;
use App\Models\Company;
use App\Models\Objective;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

try {
    DB::transaction(function (): void {
        $sn = (string) 'REPRO-'.rand(10000000, 99999999);

        $admin = User::where('permission', 'admin')->inRandomOrder()->first()
            ?? User::create(['name' => 'Audit Teste', 'email' => 'repro_'.$sn.'@test.dev', 'password' => 'senha-invalida-x', 'permission' => 'admin']);
        $u1 = User::create(['name' => 'Resp Um', 'email' => 'ru_'.$sn.'@test.dev', 'password' => 'senha-invalida-x', 'permission' => 'colaborador']);
        $u2 = User::create(['name' => 'Resp Dois', 'email' => 'rd_'.$sn.'@test.dev', 'password' => 'senha-invalida-x', 'permission' => 'colaborador']);
        Auth::login($admin);

        $company = Company::create(['name' => 'Repro Cia', 'cnpj' => $sn, 'color' => '#0f639d']);
        $axis = Axis::create(['company_id' => $company->id, 'name' => 'Eixo Repro']);
        $objective = Objective::create(['axis_id' => $axis->id, 'name' => 'Objetivo Repro', 'category' => 'resultado']);
        $action = Action::create(['objective_id' => $objective->id, 'name' => 'KR REPRO']);
        $action->users()->sync([$u1->id]);
        $action->fresh();

        echo "--- 1) update com mesmo name + novos responsaveis ---\n";
        $action->update(['name' => 'KR REPRO']);
        $action->users()->sync([$u2->id]);

        DB::table('audit_logs')->orderBy('id')->get()->each(function ($r) {
            echo "id={$r->id} action={$r->action_type} user_id={$r->user_id} user_name={$r->user_name} created_at={$r->created_at}\n";
            echo "  company_id={$r->company_id} entity={$r->entity_name} label={$r->record_label}\n";
            echo "  old_content=".json_encode($r->old_content)."\n";
            echo "  new_content=".json_encode($r->new_content)."\n";
            echo "  changes=".json_encode($r->changes)."\n";
        });

        throw new RuntimeException('REPRO_ROLLBACK');
    });
} catch (RuntimeException $e) {
    if ($e->getMessage() !== 'REPRO_ROLLBACK') {
        throw $e;
    }
}

echo "OK\n";