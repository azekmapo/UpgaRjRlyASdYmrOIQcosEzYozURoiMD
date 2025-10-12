<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropositionEnseignant extends Model
{
    protected $table = 'propositions_enseignant';

    protected $fillable = [
        'encadrant_id',
        'co_encadrant_id',
        'option',
        'type_sujet',
        'status',
        'intitule',
        'resume',
        'technologies_utilisees',
        'besoins_materiels',
        'created_at',
        'updated_at',
    ];
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (!isset($model->status)) {
                $model->status = 'pending';
            }
        });
    }
    
    public function encadrant()
    {
        return $this->belongsTo(User::class, 'encadrant_id');
    }

    public function coEncadrant()
    {
        return $this->belongsTo(User::class, 'co_encadrant_id');
    }
}
