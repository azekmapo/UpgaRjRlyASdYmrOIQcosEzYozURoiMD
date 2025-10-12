<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Pfe extends Model
{
    protected $table = 'pfes';

    // Indicate that the primary key is not auto-incrementing and is a string
    protected $keyType = 'string';
    public $incrementing = false;

    // Automatically fill UUID when creating a model
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'id',  // Include 'id' since it's now a UUID
        'option',
        'intitule',
        'resume',
        'technologies_utilisees',
        'besoins_materiels',
        'type_sujet',
        'id_encadrant',
        'id_co_encadrant',
        'id_group',
        'id_entreprise',
        'id_jury',
        'session',
        'origine_proposition',
    ];

    // Relationships
    public function encadrant()
    {
        return $this->belongsTo(Enseignant::class, 'id_encadrant');
    }

    public function coEncadrant()
    {
        return $this->belongsTo(Enseignant::class, 'id_co_encadrant');
    }

    public function encadrantUser()
    {
        return $this->belongsTo(User::class, 'id_encadrant');
    }

    public function coEncadrantUser()
    {
        return $this->belongsTo(User::class, 'id_co_encadrant');
    }

    public function group()
    {
        return $this->belongsTo(Group::class, 'id_group');
    }

    public function entreprise()
    {
        return $this->belongsTo(User::class, 'id_entreprise');
    }

    public function jury()
    {
        return $this->belongsTo(Jury::class, 'id_jury');
    }

    public function entreprise_user()
    {
        return $this->belongsTo(User::class, 'id_entreprise');
    }
}
