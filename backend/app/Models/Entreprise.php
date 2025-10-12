<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Entreprise extends Model
{

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'denomination',
        'email',
        'password',
    ];

    // Relationship with Pfe model
    public function pfes()
    {
        return $this->hasMany(Pfe::class, 'id_entreprise');
    }

    // Use the 'hidden' property to avoid exposing the password when retrieving models
    protected $hidden = [
        'password',
    ];

    // Mutator to hash password before saving it
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = bcrypt($value);
    }

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
}