<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AutomationEmail extends Model
{

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'periode',
        'date_debut',
        'date_fin',
        'template',
        'email_objet',
        'email_contenu',
        'frequence',
        'description',
        'status'
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (!$model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function planifications()
    {
        return $this->hasMany(PlanificationEmail::class, 'automation_id');
    }
}
