<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bareme extends Model
{
    use HasFactory;

    // Define the name of the table if it's not the plural form by default
    protected $table = 'baremes';

    // Disable automatic timestamps
    public $timestamps = false;

    // Define the fields that are mass assignable
    protected $fillable = [
        'type_bareme',
        'note_application',
        'note_expose_oral',
        'note_reponses_questions',
        'note_assiduite',
        'note_manucrit',
    ];

    /**
     * Add additional validation rules for the "type_bareme" field.
     */
    public static function boot()
    {
        parent::boot();

        static::creating(function ($bareme) {
            // Ensure the type_bareme is either 'encadrant' or 'jury'
            if (!in_array($bareme->type_bareme, ['encadrant', 'jury'])) {
                throw new \Exception("Invalid type_bareme value.");
            }
        });
    }
}