<?php

return [
    'enabled' => env('AUDIT_ENABLED', true),

    'secret' => env('AUDIT_SECRET', env('APP_KEY')),

    'per_page' => 25,
];
