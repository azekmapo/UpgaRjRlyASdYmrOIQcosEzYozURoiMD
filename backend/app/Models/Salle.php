<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Salle extends Model
{
    use HasFactory;

    // Définir le nom de la table si elle n'est pas au pluriel par défaut
    protected $table = 'salles';

    // Définir les champs pouvant être mass-assigned
    protected $fillable = [
        'nom_salle',
    ];

    /**
     * Relation avec le modèle Soutenance
     * Une salle peut avoir plusieurs soutenances
     */
    public function soutenances()
    {
        return $this->hasMany(Soutenance::class, 'id_salle');
    }
}
