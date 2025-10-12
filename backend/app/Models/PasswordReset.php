<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PasswordReset extends Model
{
    use HasFactory;

    // Spécifiez la table associée si ce n'est pas la table par défaut
    protected $table = 'password_resets';

    // Liste des colonnes qui peuvent être assignées en masse

    protected $fillable = [
        'email',
        'code',
        'expires_at_code',
        'token',
        'expires_at_token',
    ];

    // Indiquez les colonnes à traiter comme des dates
    protected $dates = [
        'expires_at_code',
        'expires_at_token',
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
}
