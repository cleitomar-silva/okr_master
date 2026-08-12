<?php

namespace Database\Seeders;

use App\Models\Action;
use App\Models\Axis;
use App\Models\Company;
use App\Models\Initiative;
use App\Models\Objective;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $saude = Company::firstOrCreate(
            ['cnpj' => '63.367.700/0001-39'],
            ['name' => 'Cafaz Saúde', 'color' => '#0f639d']
        );

        $corretora = Company::firstOrCreate(
            ['cnpj' => '69.371.417/0001-67'],
            ['name' => 'Cafaz Corretora', 'color' => '#00a859']
        );

        $admin = User::firstOrCreate(
            ['email' => 'admin@cafaz.com'],
            ['name' => 'Administrador', 'password' => 'password', 'permission' => 'admin']
        );
        $admin->companies()->syncWithoutDetaching([$saude->id, $corretora->id]);

        $gestor = User::firstOrCreate(
            ['email' => 'gestor@cafaz.com'],
            ['name' => 'Gestor Saúde', 'password' => 'password', 'permission' => 'gestor']
        );
        $gestor->companies()->syncWithoutDetaching([$saude->id]);

        $colaborador = User::firstOrCreate(
            ['email' => 'colaborador@cafaz.com'],
            ['name' => 'Colaborador Saúde', 'password' => 'password', 'permission' => 'colaborador']
        );
        $colaborador->companies()->syncWithoutDetaching([$saude->id]);

        $this->seedDemoData($saude, $gestor, $colaborador);
        $this->seedDemoData($corretora, $admin, $admin);
    }

    private function seedDemoData(Company $company, User $gestor, User $colaborador): void
    {
        if ($company->axes()->exists()) {
            return;
        }

        $axis = Axis::create(['company_id' => $company->id, 'name' => 'Crescimento']);

        $obj = Objective::create(['axis_id' => $axis->id, 'name' => 'Aumentar carteira de clientes']);

        $action = Action::create(['objective_id' => $obj->id, 'name' => 'Criar campanha comercial']);
        $action->users()->sync([$gestor->id, $colaborador->id]);

        $init1 = Initiative::create(['action_id' => $action->id, 'name' => 'Definir público-alvo', 'completed' => true]);
        $init1->users()->sync([$colaborador->id]);

        $init2 = Initiative::create(['action_id' => $action->id, 'name' => 'Criar material', 'completed' => true]);
        $init2->users()->sync([$colaborador->id]);

        Initiative::create(['action_id' => $action->id, 'name' => 'Publicar campanha']);

        $action2 = Action::create(['objective_id' => $obj->id, 'name' => 'Melhorar conversão']);
        $action2->users()->sync([$gestor->id]);

        $init3 = Initiative::create(['action_id' => $action2->id, 'name' => 'Revisar processo']);
        $init3->users()->sync([$colaborador->id]);

        Initiative::create(['action_id' => $action2->id, 'name' => 'Treinar equipe']);

        $axis2 = Axis::create(['company_id' => $company->id, 'name' => 'Eficiência']);

        $obj2 = Objective::create(['axis_id' => $axis2->id, 'name' => 'Reduzir custos']);

        $action3 = Action::create(['objective_id' => $obj2->id, 'name' => 'Renegociar contratos de fornecedores']);
        $action3->users()->sync([$gestor->id]);

        $init4 = Initiative::create(['action_id' => $action3->id, 'name' => 'Levantar contratos vigentes', 'completed' => true]);
        $init4->users()->sync([$colaborador->id]);

        Initiative::create(['action_id' => $action3->id, 'name' => 'Enviar propostas de renegociação']);
    }
}