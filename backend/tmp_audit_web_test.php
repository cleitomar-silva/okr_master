<?php

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\AuditLogController;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

try {
    DB::transaction(function (): void {
        $sn = (string) 'WEB-'.rand(10000000, 99999999);

        $admin = User::where('permission', 'admin')->inRandomOrder()->first()
            ?? User::create(['name' => 'Audit Teste', 'email' => 'audit_'.$sn.'@test.dev', 'password' => 'senha-invalida-x', 'permission' => 'admin']);

        Auth::login($admin);

        $c1 = Company::create(['name' => 'Audit Web T1', 'cnpj' => $sn, 'color' => '#0f639d']);
        $c1->update(['name' => 'Audit Web T1 editada']);

        $auditRows = DB::table('audit_logs')->orderByDesc('id')->limit(2)->get()->all();
        echo "audit rows created: ".count($auditRows)."\n";
        foreach ($auditRows as $r) {
            echo "  id={$r->id} action={$r->action_type} user_id={$r->user_id}\n";
        }

        $request = Request::create('/api/v1/audit-logs', 'GET', ['per_page' => 5]);
        $request->setUserResolver(fn () => $admin);

        $controller = app(AuditLogController::class);
        $indexResponse = json_decode($controller->index($request)->getContent(), true);
        echo "index status={$indexResponse['status']} total={$indexResponse['data']['pagination']['total']}\n";
        $first = $indexResponse['data']['audit_logs'][0] ?? null;
        if ($first) {
            echo "  first row: {$first['action_type']} company={$first['company_name']} user={$first['user_name']} changes=".json_encode($first['changes'])."\n";
        }

        $verifyResponse = json_decode($controller->verify($request)->getContent(), true);
        $validLabel = $verifyResponse['data']['valid'] ? 'true' : 'false';
        echo "verify valid={$validLabel} checked={$verifyResponse['data']['checked']}\n";

        throw new RuntimeException('AUDIT_WEB_ROLLBACK');
    });
} catch (RuntimeException $e) {
    if ($e->getMessage() !== 'AUDIT_WEB_ROLLBACK') {
        throw $e;
    }
}

echo "OK\n";