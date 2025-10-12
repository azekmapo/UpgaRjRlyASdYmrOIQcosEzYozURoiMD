<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropositionEntreprise extends Model
{
    protected $table = 'propositions_entreprise';

    protected $fillable = [
        'option',
        'intitule',
        'entreprise_id',
        'resume',
        'technologies_utilisees',
        'created_at',
        'updated_at',
        'status',
    ];

    public function entreprise()
    {
        return $this->belongsTo(User::class, 'entreprise_id');
    }
}
