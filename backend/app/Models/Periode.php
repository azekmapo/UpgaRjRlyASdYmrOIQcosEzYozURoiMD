<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Periode extends Model
{


    protected $table = 'periodes';

    protected $fillable = ['titre', 'description', 'date_debut', 'date_fin', 'dashboard_title', 'dashboard_description', 'dashboard_button'];
}
