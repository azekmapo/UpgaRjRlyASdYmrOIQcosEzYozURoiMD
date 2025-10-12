<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Soutenance extends Model
{
    use HasFactory;

    protected $table = 'soutenances';

    // Ajoutez 'session' à $fillable pour permettre son remplissage
    protected $fillable = [
        'id_pfe',
        'id_salle',
        'date',
        'heure_debut',
        'heure_fin',
        'session',  // Ajoutez 'session' ici
    ];

    // Définir le type de session (si vous voulez le forcer à utiliser les valeurs valides 'session 1' et 'session 2')
    protected $casts = [
        'session' => 'string',  // Vous pouvez également le définir en tant que chaîne
    ];

    public function pfe()
    {
        return $this->belongsTo(Pfe::class, 'id_pfe');
    }

    public function salle()
    {
        return $this->belongsTo(Salle::class, 'id_salle');
    }
}
