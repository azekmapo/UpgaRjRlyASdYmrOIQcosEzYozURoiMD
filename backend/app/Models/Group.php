<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


class Group extends Model
{
    // Configure UUID settings
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $table = 'groups';
    protected $fillable = [
        'id_etd1',
        'id_etd2',
        'moyenne',
        'option'
    ];

    /**
     * Boot function from Laravel.
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (!$model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // Corriger les relations pour correspondre aux noms des colonnes
    public function student1()
    {
        return $this->belongsTo(Etudiant::class, 'id_etd1');
    }

    public function student2()
    {
        return $this->belongsTo(Etudiant::class, 'id_etd2');
    }

    // Relations corrigées avec User
    public function student1User()
    {
        return $this->belongsTo(User::class, 'id_etd1');
    }

    public function student2User()
    {
        return $this->belongsTo(User::class, 'id_etd2');
    }

    public function choixPFE()
    {
        return $this->hasOne(ChoixPFE::class, 'id_group');
    }

    public function propositions()
    {
        return $this->hasMany(PropositionEtudiant::class, 'id_group', 'id');
    }

    public function pfe()
    {
        return $this->hasOne(PFE::class, 'id_group');
    }

    public function proposition_etudiant()
    {
        return $this->hasOne(PropositionEtudiant::class, 'id_group');
    }
}