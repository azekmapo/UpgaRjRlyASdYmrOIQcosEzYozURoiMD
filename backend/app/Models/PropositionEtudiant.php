<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropositionEtudiant extends Model
{
    protected $table = 'propositions_etudiant';

    protected $fillable = [
        'id_group',
        'option',
        'intitule',
        'type_sujet',  
        'resume',
        'technologies_utilisees',
        'besoins_materiels',
        'created_at',
        'updated_at',
        'status',
    ];
    public function group()
    {
        return $this->belongsTo(Group::class, 'id_group', 'id');
    }
    
}
