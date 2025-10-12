<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Option extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'id_responsable',
    ];

    public function responsable()
    {
        return $this->belongsTo(User::class, 'id_responsable');
    }
}