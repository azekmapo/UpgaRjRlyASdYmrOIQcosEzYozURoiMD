<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailValidationProposition extends Model
{
    protected $table = 'emails_validations_propositions';

    protected $fillable = [
        'role',
        'name',
        'email',
        'name2',
        'email2',
        'denomination',
        'intitule',
        'status',
        'remarques',
        'option',
        'type',
        'resumer',
        'technologies',
        'besoins_materiels',
    ];
}