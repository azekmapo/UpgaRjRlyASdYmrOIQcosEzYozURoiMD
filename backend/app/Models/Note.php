<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Note extends Model
{
    use HasFactory;

    protected $fillable = [
        'id_pfe',
        'note_application',
        'note_expose_orale',
        'note_reponses_questions',
        'note_assiduite',
        'note_manuscrit',
        'note_encadrant',
        'note_president',
        'note_examinateur',
        'note_generale'
    ];

    protected $casts = [
        'note_application' => 'array',
        'note_expose_orale' => 'array',
        'note_reponses_questions' => 'array',
        'note_assiduite' => 'array',
        'note_manuscrit' => 'array',
        'note_encadrant' => 'decimal:2',
        'note_president' => 'decimal:2',
        'note_examinateur' => 'decimal:2',
        'note_generale' => 'decimal:2'
    ];

    // Laravel will automatically generate UUIDs for the primary key
    public $incrementing = false;
    protected $keyType = 'string';

    // Boot method to generate UUID on creation
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid()->toString();
            }
        });
    }

    // Relationships
    public function pfe()
    {
        return $this->belongsTo(Pfe::class, 'id_pfe');
    }
}