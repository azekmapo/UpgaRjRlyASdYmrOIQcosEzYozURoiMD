<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanificationEmail extends Model
{
    protected $fillable = [
        'automation_id',
        'date_envoi_planifie',
        'status'
    ];

    public function automation()
    {
        return $this->belongsTo(AutomationEmail::class);
    }
}
