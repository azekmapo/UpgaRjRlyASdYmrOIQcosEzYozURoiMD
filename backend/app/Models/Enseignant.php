<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Pfe;

class Enseignant extends Model
{
    // Configure UUID settings
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'grade',
        'date_recrutement',
        'is_responsable',
    ];

    

    /**
     * Boot function from Laravel.
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (!$model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id');  // 'id' est la clé étrangère
    }

    public function pfeAsEncadrant()
    {
        return $this->hasMany(Pfe::class, 'id_encadrant', 'id');
    }

    public function pfeAsCoEncadrant()
    {
        return $this->hasMany(Pfe::class, 'id_co_encadrant', 'id');
    }
}
