<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    
    // Configure UUID settings
    protected $keyType = 'string';
    public $incrementing = false;
    
    //Add [password] to fillable property to allow mass assignment on [App\Models\User].
    protected $fillable = ['name', 'email', 'password', 'role'];

    /**
     * Get the profile picture URL.
     * This accessor overrides the profile_picture attribute to return the URL.
     */
    public function getProfilePictureAttribute($value)
    {
        if (!$this->id) {
            return null;
        }

        $extensions = ['webp', 'jpg', 'jpeg', 'png'];
        $basePath = storage_path('app/private/profile-pictures');
        
        foreach ($extensions as $ext) {
            $filePath = $basePath . '/' . $this->id . '.' . $ext;
            if (file_exists($filePath)) {
                // Use current timestamp to bust cache on every request
                // This ensures updated images are always fetched
                $timestamp = time();
                
                // Generate signed URL that expires in 1 hour
                $params = [
                    'user_id' => $this->id,
                    't' => $timestamp,
                    'expires' => $timestamp + 3600,
                ];
                
                // Create signature
                $signature = hash_hmac('sha256', 
                    http_build_query($params), 
                    config('app.key')
                );
                
                $params['signature'] = $signature;
                
                return url('/api/profile/picture?' . http_build_query($params));
            }
        }
        
        return null;
    }

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

    public function etudiant()
    {
        return $this->hasOne(Etudiant::class, 'id'); // 'id' correspond à la clé étrangère dans la table 'etudiants'
    }

    public function enseignant()
    {
        return $this->hasOne(Enseignant::class, 'id'); // 'id' correspond à la clé étrangère dans la table 'etudiants'
    }

    public function entreprise()
    {
        return $this->hasOne(Entreprise::class, 'id'); // 'id' correspond à la clé étrangère dans la table 'entreprises'
    }

    public function groups()
    {
        return $this->hasMany(Group::class, 'id_etd1')
            ->orWhere('id_etd2', $this->id);
    }
}