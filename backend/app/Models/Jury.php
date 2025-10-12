<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Jury extends Model
{
    use HasFactory;

    // Définir le nom de la table si elle n'est pas au pluriel par défaut
    protected $table = 'jurys';

    // Définir le type de clé primaire comme string pour UUID
    protected $keyType = 'string';

    // Désactiver l'auto-incrémentation pour UUID
    public $incrementing = false;

    // Définir les champs pouvant être mass-assigned
    protected $fillable = [
        'id_president',
        'id_examinateur',
    ];

    // Définir les champs UUID comme string dans la base de données
    protected $casts = [
        'id' => 'string',
        'id_president' => 'string',
        'id_examinateur' => 'string',
    ];

    /**
     * Boot method pour générer automatiquement un UUID lors de la création
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    /**
     * Relation avec le modèle Enseignant pour le président du jury
     */
    public function president()
    {
        return $this->belongsTo(Enseignant::class, 'id_president');
    }

    /**
     * Relation avec le modèle Enseignant pour l'examinateur
     */
    public function examinateur()
    {
        return $this->belongsTo(Enseignant::class, 'id_examinateur');
    }

    public function presidentUser()
    {
        return $this->belongsTo(User::class, 'id_president');
    }

    public function examinateurUser()
    {
        return $this->belongsTo(User::class, 'id_examinateur');
    }
}