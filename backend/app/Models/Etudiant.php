<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Etudiant extends Model
{
    // Configure UUID settings
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = ['id', 'option', 'moyenne'];

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
        return $this->belongsTo(User::class, 'id');
    }

    public function groupsAsStudent1()
    {
        return $this->hasMany(Group::class, 'id_etd1', 'id');
    }

    public function groupsAsStudent2()
    {
        return $this->hasMany(Group::class, 'id_etd2', 'id');
    }

    public function group()
    {
        return $this->hasOne(Group::class, 'id_etd1', 'id')
            ->orWhere('id_etd2', $this->id)
            ->whereNotNull('id_etd2');
    }

    public function groups()
    {
        return Group::where(function($query) {
                $query->where('id_etd1', $this->id)
                      ->orWhere('id_etd2', $this->id);
            })
            ->whereNotNull('id_etd2');
    }

    public function getStudentName()
    {
        return $this->user ? $this->user->name : null;
    }
}