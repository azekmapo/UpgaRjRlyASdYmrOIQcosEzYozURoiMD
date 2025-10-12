<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
 
class VoeuxJury extends Model
{
    use HasFactory;
 
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'voeux_jury';
 
    /**
     * Indicates if the model's ID is auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;
 
    /**
     * The data type of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';
 
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id_enseignant',
        'ranked_themes',
    ];
    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = Str::uuid()->toString();
            }
        });
    }
 
    /**
     * Get the enseignant associated with the voeux jury.
     */
    public function enseignant()
    {
        return $this->belongsTo(Enseignant::class, 'id_enseignant');
    }
}