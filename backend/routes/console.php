<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;
use App\Http\Controllers\PFEDistributionController;
use App\Http\Controllers\EmailFicheVoeux;
use App\Http\Controllers\DistributionJuryController;
use App\Models\Pfe;
use App\Models\Periode;
use App\Models\DistributionStatus;
use App\Jobs\SendScheduledEmails;
use App\Jobs\SendImportedCsvEmails;
use App\Jobs\SendValidationsProposalsEmails;
use App\Http\Controllers\NotationController;

/*Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    $period = Periode::find(4);
    $status = DistributionStatus::orderBy('id')->first();
    Log::info((string)$status?->is_distributed, $period ? ['period_end' => $period->date_fin] : ['period' => 'not found']);

    if (!$status?->is_distributed && $period && now()->greaterThan($period->date_fin)) {
        Log::info('PFE distribution started');
        $controller = new PFEDistributionController();
        $controller->distributeThemes();
        
        DistributionStatus::updateOrCreate(
            ['id' => 1],
            ['is_distributed' => true, 'distributed_at' => now()]
        );

        logger()->info('PFE distribution executed and completed');
    }
})->name('check-pfe-distribution')->everyMinute()->withoutOverlapping();

Schedule::call(function () {
    $period = Periode::find(5);
    $status = DistributionStatus::find(2);

    if (!$status?->is_distributed && $period && now()->greaterThan($period->date_fin)) {
        $controller = new EmailFicheVoeux();
        $controller->sendPfeEmails();

        DistributionStatus::updateOrCreate(
            ['id' => 2],
            ['is_distributed' => true, 'distributed_at' => now()]
        );

        logger()->info('PFE email sending completed');
    }
})->name('send-pfe-emails')->everyMinute()->withoutOverlapping();
*/
Schedule::call(function () {
    (new SendScheduledEmails())->handle();
})->name('templates-emails')
    ->everyMinute()
    ->withoutOverlapping(60);

Schedule::call(function () {
    (new SendImportedCsvEmails())->handle();
})->name('imported-csv-emails')
    ->everyMinute()
    ->withoutOverlapping(60);

Schedule::call(function () {
    $period = Periode::find(3);
    $status = DistributionStatus::find(7);

    if (!$status?->is_distributed && $period && now()->greaterThan($period->date_fin)) {
        $socketService = app(\App\Services\SocketService::class);
        (new SendValidationsProposalsEmails($socketService))->handle();
        DistributionStatus::updateOrCreate(
            ['id' => 7],
            ['is_distributed' => true, 'distributed_at' => now()]
        );
    }
})->name('validations-proposals-emails')
    ->everyMinute()
    ->withoutOverlapping(60);
/*
Schedule::call(function () {
    $period = Periode::find(8);
    $status = DistributionStatus::find(4);
    Log::info("Periode date fin and status: ", [
        'period_end' => $period ? $period->date_fin : 'not found',
        'is_distributed' => $status?->is_distributed
    ]);
    if (!$status?->is_distributed && $period && now()->greaterThan($period->date_fin)) {
        $controller = new DistributionJuryController();
        $controller->distributeJury();

        DistributionStatus::updateOrCreate(
            ['id' => 4],
            ['is_distributed' => true, 'distributed_at' => now()]
        );

        logger()->info('Jury distribution completed');
    }
})->name('jury-distribution')->everyMinute()->withoutOverlapping();*/


// Schedule pour envoyer les notes finales
Schedule::call(function () {
    Log::info('SALAM - Starting scheduled task for final grades');
    $controller = new NotationController();
    $controller->sendFinalGrades();
})->name('send:final-grades')->everyMinute()->withoutOverlapping();

// Schedule pour générer et envoyer les PVs
Schedule::call(function () {
    Log::info('Starting scheduled task for PVs generation');
    $controller = new NotationController();
    $controller->sendPvsReadyNotification();
})->name('generate:pvs')->everyMinute()->withoutOverlapping();

